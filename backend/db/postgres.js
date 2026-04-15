const { Pool } = require('pg');

let pool = null;
let initPromise = null;

function getPool() {
  if (pool) return pool;

  const connectionString = process.env.PG_URI || process.env.DATABASE_URL;
  const hasDiscrete =
    process.env.PGHOST || process.env.PGUSER || process.env.PGPASSWORD || process.env.PGDATABASE;

  if (!connectionString && !hasDiscrete) {
    return null;
  }

  pool = new Pool(
    connectionString
      ? { connectionString }
      : {
          host: process.env.PGHOST,
          port: process.env.PGPORT ? Number(process.env.PGPORT) : 5432,
          user: process.env.PGUSER,
          password: process.env.PGPASSWORD,
          database: process.env.PGDATABASE,
        }
  );

  return pool;
}

async function initStationsSchema() {
  const p = getPool();
  if (!p) return { ok: false, reason: 'Postgres not configured. Set PG_URI (or PGHOST/PGUSER/PGPASSWORD/PGDATABASE).' };

  if (!initPromise) {
    initPromise = (async () => {
      const client = await p.connect();
      try {
        await client.query('CREATE EXTENSION IF NOT EXISTS postgis;');
        await client.query(`
          CREATE TABLE IF NOT EXISTS police_stations (
            osm_id        BIGINT PRIMARY KEY,
            name          TEXT,
            address       TEXT,
            phone         TEXT,
            tags          JSONB,
            geom          geography(Point, 4326) NOT NULL,
            created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
          );
        `);
        await client.query(`
          CREATE INDEX IF NOT EXISTS police_stations_geom_gist
          ON police_stations
          USING GIST (geom);
        `);
      } finally {
        client.release();
      }
      return { ok: true };
    })();
  }

  return initPromise;
}

module.exports = {
  getPool,
  initStationsSchema,
};

