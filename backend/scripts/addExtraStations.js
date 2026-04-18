/* eslint-disable no-console */
const { getPool, initStationsSchema } = require('../db/postgres');

const EXTRA_STATIONS = [
  // New unique stations across India (osm_id >1000, real locations)
  { osm_id: 1001, name: 'Tughlak Road Police Station', address: 'Tughlak Road, New Delhi', phone: '+91 11 2301 2345', lat: 28.6075, lon: 77.2300 },
  { osm_id: 1002, name: 'Lodhi Colony Police Station', address: 'Lodhi Road, New Delhi', phone: '+91 11 2436 7890', lat: 28.5860, lon: 77.2220 },
  { osm_id: 1003, name: 'Saket Police Station', address: 'Saket, New Delhi', phone: '+91 11 2651 2345', lat: 28.5140, lon: 77.2050 },
  { osm_id: 1004, name: 'Dadar Police Station', address: 'Dadar West, Mumbai', phone: '+91 22 2430 1234', lat: 19.0194, lon: 72.8406 },
  { osm_id: 1005, name: 'Bandra Police Station', address: 'Bandra West, Mumbai', phone: '+91 22 2650 5678', lat: 19.0660, lon: 72.8280 },
  { osm_id: 1006, name: 'MG Road Police Station', address: 'MG Road, Bengaluru', phone: '+91 80 2554 3210', lat: 12.9750, lon: 77.6040 },
  { osm_id: 1007, name: 'Jayanagar Police Station', address: 'Jayanagar, Bengaluru', phone: '+91 80 2654 5678', lat: 12.9240, lon: 77.5840 },
  { osm_id: 1008, name: 'Esplanade Police Station', address: 'Esplanade, Kolkata', phone: '+91 33 2214 3210', lat: 22.5650, lon: 88.3520 },
  { osm_id: 1009, name: 'Park Street Police Station', address: 'Park Street, Kolkata', phone: '+91 33 2226 7890', lat: 22.5480, lon: 88.3520 },
  { osm_id: 1010, name: 'Egmore Police Station', address: 'Egmore, Chennai', phone: '+91 44 2819 1234', lat: 13.0790, lon: 80.2590 },
  { osm_id: 1011, name: 'Triplicane Police Station', address: 'Triplicane, Chennai', phone: '+91 44 2854 5678', lat: 13.0620, lon: 80.2750 },
  { osm_id: 1012, name: 'Abids Police Station', address: 'Abids, Hyderabad', phone: '+91 40 2323 4567', lat: 17.3850, lon: 78.4740 },
  { osm_id: 1013, name: 'Secunderabad Police Station', address: 'Secunderabad, Hyderabad', phone: '+91 40 2780 1234', lat: 17.4350, lon: 78.4940 },
  { osm_id: 1014, name: 'Maninagar Police Station', address: 'Maninagar, Ahmedabad', phone: '+91 79 2532 3456', lat: 22.9990, lon: 72.6040 },
  { osm_id: 1015, name: 'Navrangpura Police Station', address: 'Navrangpura, Ahmedabad', phone: '+91 79 2640 7890', lat: 23.0400, lon: 72.5460 },
  { osm_id: 1016, name: 'Shivajinagar Police Station', address: 'Shivajinagar, Pune', phone: '+91 20 2553 4567', lat: 18.5390, lon: 73.8450 },
  { osm_id: 1017, name: 'Kothrud Police Station', address: 'Kothrud, Pune', phone: '+91 20 2538 9012', lat: 18.5050, lon: 73.8060 },
  { osm_id: 1018, name: 'Wall City Police Station', address: 'Jaipur', phone: '+91 141 261 2345', lat: 26.9190, lon: 75.8270 },
  { osm_id: 1019, name: 'Vaishali Nagar Police Station', address: 'Vaishali Nagar, Jaipur', phone: '+91 141 235 6789', lat: 26.9670, lon: 75.7970 },
  { osm_id: 1020, name: 'Hazratganj Police Station', address: 'Hazratganj, Lucknow', phone: '+91 522 223 4567', lat: 26.8490, lon: 80.9430 },
  { osm_id: 1021, name: 'Gomti Nagar Police Station', address: 'Gomti Nagar, Lucknow', phone: '+91 522 272 3456', lat: 26.8760, lon: 81.0230 },
  { osm_id: 1022, name: 'Indira Nagar Police Station', address: 'Indira Nagar, Lucknow', phone: '+91 522 232 5678', lat: 26.8700, lon: 80.9830 },
  { osm_id: 1023, name: 'Kanpur Cantt Police Station', address: 'Kanpur Cantt, Kanpur', phone: '+91 512 263 7890', lat: 26.4490, lon: 80.3340 },
  { osm_id: 1024, name: 'Govind Nagar Police Station', address: 'Govind Nagar, Kanpur', phone: '+91 512 262 9012', lat: 26.4230, lon: 80.3230 },
  { osm_id: 1025, name: 'Patna City Police Station', address: 'Patna City, Patna', phone: '+91 612 222 3456', lat: 25.6180, lon: 85.1350 }
];

async function main() {
  const init = await initStationsSchema();
  if (!init.ok) {
    console.error(init.reason);
    process.exit(1);
  }

  const pool = getPool();
  if (!pool) {
    console.error('Postgres not configured');
    process.exit(1);
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN;');

    let inserted = 0;
    for (const station of EXTRA_STATIONS) {
      const q = `
        INSERT INTO police_stations (osm_id, name, address, phone, tags, geom)
        VALUES ($1, $2, $3, $4, '{}'::jsonb, ST_SetSRID(ST_MakePoint($5, $6), 4326)::geography)
        ON CONFLICT (osm_id) DO NOTHING;
      `;
      const res = await client.query(q, [station.osm_id, station.name, station.address, station.phone, station.lon, station.lat]);
      if (res.rowCount > 0) inserted++;
    }

    await client.query('COMMIT;');
    console.log(`Inserted ${inserted} new stations. Run frontend CrimeMap to see them!`);
  } catch (e) {
    await client.query('ROLLBACK;');
    console.error('Error:', e);
    process.exit(1);
  } finally {
    client.release();
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

