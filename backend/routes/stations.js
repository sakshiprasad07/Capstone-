const express = require('express');
const { getPool, initStationsSchema } = require('../db/postgres');

const router = express.Router();

function parseNumber(value) {
  if (value == null) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

const fallbackStations = [
  // Existing stations
  { osm_id: 1, name: 'New Delhi Police Station', address: 'Connaught Place, New Delhi', phone: '+91 11 2345 6789', lat: 28.6139, lon: 77.2090 },
  { osm_id: 11, name: 'Karol Bagh Police Station', address: 'Karol Bagh, New Delhi', phone: '+91 11 2345 6790', lat: 28.6515, lon: 77.1887 },
  { osm_id: 12, name: 'Rajender Nagar Police Station', address: 'Rajender Nagar, New Delhi', phone: '+91 11 2345 6791', lat: 28.6444, lon: 77.1627 },
  { osm_id: 13, name: 'Gurugram Police Station', address: 'Sector 14, Gurugram', phone: '+91 124 2345 6792', lat: 28.4595, lon: 77.0266 },
  { osm_id: 14, name: 'Noida Police Station', address: 'Sector 15, Noida', phone: '+91 120 2345 6793', lat: 28.5709, lon: 77.3251 },
  { osm_id: 15, name: 'Ghaziabad Police Station', address: 'Raj Nagar, Ghaziabad', phone: '+91 120 2345 6794', lat: 28.6692, lon: 77.4538 },
  { osm_id: 16, name: 'Faridabad Police Station', address: 'Sector 15, Faridabad', phone: '+91 129 2345 6795', lat: 28.4111, lon: 77.3178 },
  { osm_id: 17, name: 'Greater Noida Police Station', address: 'Alpha 2, Greater Noida', phone: '+91 120 2345 6796', lat: 28.4744, lon: 77.5033 },
  { osm_id: 18, name: 'Haryana Police Station', address: 'Sohna Road, Gurugram', phone: '+91 124 2345 6797', lat: 28.4530, lon: 77.0567 },
  { osm_id: 19, name: 'Faridabad City Police Station', address: 'Old Faridabad', phone: '+91 129 2345 6798', lat: 28.4078, lon: 77.3090 },
  { osm_id: 2, name: 'Mumbai Police Station', address: 'Fort, Mumbai', phone: '+91 22 2345 6789', lat: 18.9388, lon: 72.8355 },
  { osm_id: 3, name: 'Bengaluru Police Station', address: 'MG Road, Bengaluru', phone: '+91 80 2345 6789', lat: 12.9716, lon: 77.5946 },
  { osm_id: 4, name: 'Kolkata Police Station', address: 'Esplanade, Kolkata', phone: '+91 33 2345 6789', lat: 22.5726, lon: 88.3639 },
  { osm_id: 5, name: 'Chennai Police Station', address: 'Royapettah, Chennai', phone: '+91 44 2345 6789', lat: 13.0827, lon: 80.2707 },
  { osm_id: 6, name: 'Hyderabad Police Station', address: 'Charminar, Hyderabad', phone: '+91 40 2345 6789', lat: 17.3850, lon: 78.4867 },
  { osm_id: 7, name: 'Ahmedabad Police Station', address: 'Paldi, Ahmedabad', phone: '+91 79 2345 6789', lat: 23.0225, lon: 72.5714 },
  { osm_id: 8, name: 'Pune Police Station', address: 'Shivaji Nagar, Pune', phone: '+91 20 2345 6789', lat: 18.5204, lon: 73.8567 },
  { osm_id: 9, name: 'Jaipur Police Station', address: 'Bapu Bazaar, Jaipur', phone: '+91 141 2345 6789', lat: 26.9124, lon: 75.7873 },
  { osm_id: 10, name: 'Lucknow Police Station', address: 'Hazratganj, Lucknow', phone: '+91 52 2345 6789', lat: 26.8467, lon: 80.9462 },
  // 25 NEW stations added for better coverage
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


function filterByBBox(stations, south, west, north, east) {
  return stations.filter(s => s.lat >= south && s.lat <= north && s.lon >= west && s.lon <= east);
}

function filterByRadius(stations, lat, lon, radius) {
  const R = 6371000;
  return stations
    .map(s => {
      const dLat = (s.lat - lat) * Math.PI / 180;
      const dLon = (s.lon - lon) * Math.PI / 180;
      const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat * Math.PI / 180) * Math.cos(s.lat * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
      const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return { ...s, distance_m: dist };
    })
    .filter(s => s.distance_m <= radius)
    .sort((a, b) => a.distance_m - b.distance_m);
}

router.get('/stations', async (req, res) => {
  try {
    const pool = getPool();
    const dbConfigured = !!pool;

    if (dbConfigured) {
      const init = await initStationsSchema();
      if (!init.ok) {
        console.warn('Stations DB init failed:', init.reason);
      }
    }

    const lat = parseNumber(req.query.lat);
    const lng = parseNumber(req.query.lng);
    const radius = parseNumber(req.query.radius) ?? 5000; // meters

    const bbox = typeof req.query.bbox === 'string' ? req.query.bbox : null; // south,west,north,east
    const limitRaw = parseNumber(req.query.limit);
    const limit = Math.max(1, Math.min(limitRaw ?? 20000, 20000));

    if (!dbConfigured) {
      const fallback = bbox
        ? (() => {
            const parts = bbox.split(',').map(s => parseNumber(s.trim()));
            if (parts.length !== 4 || parts.some(v => v == null)) {
              return null;
            }
            const [south, west, north, east] = parts;
            return filterByBBox(fallbackStations, south, west, north, east).slice(0, limit);
          })()
        : lat != null && lng != null
          ? filterByRadius(fallbackStations, lat, lng, radius).slice(0, limit)
          : fallbackStations.slice(0, limit);

      if (fallback === null) {
        return res.status(400).json({ message: 'Invalid bbox. Use bbox=south,west,north,east' });
      }

      return res.json({ count: fallback.length, stations: fallback });
    }

    if (bbox) {
      const parts = bbox.split(',').map(s => parseNumber(s.trim()));
      if (parts.length !== 4 || parts.some(v => v == null)) {
        return res.status(400).json({ message: 'Invalid bbox. Use bbox=south,west,north,east' });
      }
      const [south, west, north, east] = parts;

      const { rows } = await pool.query(
        `
          SELECT
            osm_id,
            name,
            address,
            phone,
            tags,
            ST_Y(geom::geometry) AS lat,
            ST_X(geom::geometry) AS lon
          FROM police_stations
          WHERE ST_Intersects(
            geom::geometry,
            ST_MakeEnvelope($1, $2, $3, $4, 4326)
          )
          LIMIT $5;
        `,
        [west, south, east, north, limit]
      );

      return res.json({ count: rows.length, stations: rows });
    }

    if (lat == null || lng == null) {
      return res.status(400).json({ message: 'Provide either bbox=south,west,north,east or lat=&lng=' });
    }

    const { rows } = await pool.query(
      `
        SELECT
          osm_id,
          name,
          address,
          phone,
          tags,
          ST_Y(geom::geometry) AS lat,
          ST_X(geom::geometry) AS lon,
          ST_Distance(
            geom,
            ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
          ) AS distance_m
        FROM police_stations
        WHERE ST_DWithin(
          geom,
          ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
          $3
        )
        ORDER BY distance_m ASC
        LIMIT $4;
      `,
      [lng, lat, radius, limit]
    );

    return res.json({
      count: rows.length,
      radius,
      stations: rows,
    });
  } catch (err) {
    console.error('Stations API error:', err);
    return res.status(500).json({ message: 'Stations API failed', error: err.message });
  }
});

module.exports = router;

