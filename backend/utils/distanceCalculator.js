/**
 * Calculate distance between two geographic coordinates using Haversine formula
 * @param {number} lat1 - Latitude of first point
 * @param {number} lon1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lon2 - Longitude of second point
 * @returns {number} Distance in kilometers
 */
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Get fallback police stations (used when database is not configured)
 * @returns {Array} Array of police station objects with lat/lon
 */
function getFallbackStations() {
  return [
    { osm_id: 1, name: 'New Delhi Police Station', lat: 28.6139, lon: 77.2090 },
    { osm_id: 11, name: 'Karol Bagh Police Station', lat: 28.6515, lon: 77.1887 },
    { osm_id: 12, name: 'Rajender Nagar Police Station', lat: 28.6444, lon: 77.1627 },
    { osm_id: 13, name: 'Gurugram Police Station', lat: 28.4595, lon: 77.0266 },
    { osm_id: 14, name: 'Noida Police Station', lat: 28.5709, lon: 77.3251 },
    { osm_id: 15, name: 'Ghaziabad Police Station', lat: 28.6692, lon: 77.4538 },
    { osm_id: 16, name: 'Faridabad Police Station', lat: 28.4111, lon: 77.3178 },
    { osm_id: 17, name: 'Greater Noida Police Station', lat: 28.4744, lon: 77.5033 },
    { osm_id: 18, name: 'Haryana Police Station', lat: 28.4530, lon: 77.0567 },
    { osm_id: 19, name: 'Faridabad City Police Station', lat: 28.4078, lon: 77.3090 },
    { osm_id: 2, name: 'Mumbai Police Station', lat: 18.9388, lon: 72.8355 },
    { osm_id: 3, name: 'Bengaluru Police Station', lat: 12.9716, lon: 77.5946 },
    { osm_id: 4, name: 'Kolkata Police Station', lat: 22.5726, lon: 88.3639 },
    { osm_id: 5, name: 'Chennai Police Station', lat: 13.0827, lon: 80.2707 },
    { osm_id: 6, name: 'Hyderabad Police Station', lat: 17.3850, lon: 78.4867 },
    { osm_id: 7, name: 'Ahmedabad Police Station', lat: 23.0225, lon: 72.5714 },
    { osm_id: 8, name: 'Pune Police Station', lat: 18.5204, lon: 73.8567 },
    { osm_id: 9, name: 'Jaipur Police Station', lat: 26.9124, lon: 75.7873 },
    { osm_id: 10, name: 'Lucknow Police Station', lat: 26.8467, lon: 80.9462 },
    { osm_id: 1001, name: 'Tughlak Road Police Station', lat: 28.6075, lon: 77.2300 },
    { osm_id: 1002, name: 'Lodhi Colony Police Station', lat: 28.5860, lon: 77.2220 },
    { osm_id: 1003, name: 'Saket Police Station', lat: 28.5140, lon: 77.2050 },
  ];
}

/**
 * Find the nearest police station to the given coordinates
 * @param {number} sosLat - SOS latitude
 * @param {number} sosLng - SOS longitude
 * @param {Array} stations - Array of police station objects (optional, uses fallback if not provided)
 * @returns {Object} Nearest station with distance, or null if no stations available
 */
function findNearestPoliceStation(sosLat, sosLng, stations = null) {
  if (sosLat == null || sosLng == null) {
    return null;
  }

  const stationsToUse = stations || getFallbackStations();
  
  if (!Array.isArray(stationsToUse) || stationsToUse.length === 0) {
    return null;
  }

  let nearestStation = null;
  let minDistance = Infinity;

  stationsToUse.forEach(station => {
    if (station.lat == null || station.lon == null) {
      return; // Skip stations without coordinates
    }

    const distance = haversineDistance(sosLat, sosLng, station.lat, station.lon);
    
    if (distance < minDistance) {
      minDistance = distance;
      nearestStation = {
        stationId: station.osm_id ? station.osm_id.toString() : station.id?.toString(),
        name: station.name || 'Unknown Station',
        lat: station.lat,
        lon: station.lon,
        distance: parseFloat(distance.toFixed(2)) // Distance in km
      };
    }
  });

  return nearestStation;
}

module.exports = {
  haversineDistance,
  findNearestPoliceStation,
  getFallbackStations
};
