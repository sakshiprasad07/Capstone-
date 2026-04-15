/* eslint-disable no-console */
const { getPool, initStationsSchema } = require('../db/postgres');

const OVERPASS_URL =
  process.env.OVERPASS_URL ||
  'https://overpass-api.de/api/interpreter?data=[out:json];node["amenity"="police"](8,68,37,97);out;';

function buildAddress(tags) {
  if (!tags) return null;

  const parts = [];
  const house = tags['addr:housenumber'];
  const street = tags['addr:street'];
  const suburb = tags['addr:suburb'];
  const city = tags['addr:city'] || tags['addr:town'] || tags['addr:village'];
  const district = tags['addr:district'];
  const state = tags['addr:state'];
  const postcode = tags['addr:postcode'];

  const line1 = [house, street].filter(Boolean).join(' ').trim();
  if (line1) parts.push(line1);
  [suburb, city, district, state, postcode].filter(Boolean).forEach(p => parts.push(String(p).trim()));

  const joined = parts.filter(Boolean).join(', ');
  return joined || null;
}

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

async function main() {
  const init = await initStationsSchema();
  if (!init.ok) {
    console.error(init.reason);
    process.exit(1);
  }

  const pool = getPool();
  console.log('Fetching Overpass data…');
  const res = await fetch(OVERPASS_URL);
  if (!res.ok) {
    throw new Error(`Overpass request failed: ${res.status} ${res.statusText}`);
  }
  const json = await res.json();
  const elements = Array.isArray(json.elements) ? json.elements : [];
  const nodes = elements.filter(e => e && e.type === 'node' && typeof e.id === 'number' && typeof e.lat === 'number' && typeof e.lon === 'number');

  console.log(`Received ${nodes.length.toLocaleString()} stations. Upserting…`);

  const rows = nodes.map(n => {
    const tags = n.tags || {};
    const name = tags.name || tags['name:en'] || null;
    const phone = tags.phone || tags['contact:phone'] || null;
    const address = buildAddress(tags);
    return {
      osm_id: n.id,
      name,
      phone,
      address,
      tags,
      lat: n.lat,
      lon: n.lon,
    };
  });

  const client = await pool.connect();
  try {
    await client.query('BEGIN;');

    let upserted = 0;
    for (const batch of chunk(rows, 750)) {
      const values = [];
      const params = [];
      let p = 1;

      for (const r of batch) {
        values.push(
          `($${p++}, $${p++}, $${p++}, $${p++}, $${p++}::jsonb, ST_SetSRID(ST_MakePoint($${p++}, $${p++}), 4326)::geography)`
        );
        params.push(r.osm_id, r.name, r.address, r.phone, JSON.stringify(r.tags || {}), r.lon, r.lat);
      }

      const q = `
        INSERT INTO police_stations (osm_id, name, address, phone, tags, geom)
        VALUES ${values.join(',')}
        ON CONFLICT (osm_id) DO UPDATE SET
          name = EXCLUDED.name,
          address = EXCLUDED.address,
          phone = EXCLUDED.phone,
          tags = EXCLUDED.tags,
          geom = EXCLUDED.geom,
          updated_at = now();
      `;

      await client.query(q, params);
      upserted += batch.length;
      if (upserted % 3000 === 0) console.log(`Upserted ${upserted.toLocaleString()}…`);
    }

    await client.query('COMMIT;');
    console.log(`Done. Upserted ${upserted.toLocaleString()} stations.`);
  } catch (e) {
    await client.query('ROLLBACK;');
    throw e;
  } finally {
    client.release();
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

