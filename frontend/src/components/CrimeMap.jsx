import { useEffect, useRef, useState, useCallback } from 'react';
import { MapContainer, TileLayer, useMap, Popup, CircleMarker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// We must assign L to window before loading leaflet.heat
window.L = L;

// Haversine distance in meters
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Simple grid-based clustering
function computeHotspotCentroids(crimes, gridSize = 0.002) {
  const grid = {};
  crimes.forEach(c => {
    const key = `${Math.round(c.latitude / gridSize) * gridSize}_${Math.round(c.longitude / gridSize) * gridSize}`;
    if (!grid[key]) grid[key] = { lat: 0, lng: 0, count: 0, crimes: [] };
    grid[key].lat += c.latitude;
    grid[key].lng += c.longitude;
    grid[key].count++;
    grid[key].crimes.push(c);
  });

  return Object.values(grid).map(g => ({
    lat: g.lat / g.count,
    lng: g.lng / g.count,
    count: g.count,
    crimes: g.crimes
  }));
}

// Client-side Geofencing Engine
function LocationGeofence({ userPos, clusters, onDangerZone }) {
  const lastAlertRef = useRef(0);
  
  useEffect(() => {
    if (!userPos || clusters.length === 0) return;

    // Search for clusters with > 8 incidents within 500 meters
    let highestThreat = null;
    let minDistance = 501;

    for (const cluster of clusters) {
      if (cluster.count < 8) continue;
      const dist = getDistance(userPos.lat, userPos.lng, cluster.lat, cluster.lng);
      
      if (dist < 500 && dist < minDistance) {
        minDistance = dist;
        highestThreat = cluster;
      }
    }

    if (highestThreat) {
      const now = Date.now();
      // Cooldown of 30 minutes between alerts
      if (now - lastAlertRef.current > 30 * 60 * 1000) {
        lastAlertRef.current = now;
        onDangerZone?.({
          distance: Math.round(minDistance),
          crimeCount: highestThreat.count,
          area: highestThreat.crimes[0]?.city || ''
        });
      }
    }
  }, [userPos, clusters, onDangerZone]);

  return null;
}

// Heatmap layer component
function HeatmapLayer({ points }) {
  const map = useMap();
  const heatLayerRef = useRef(null);
  const [heatReady, setHeatReady] = useState(false);

  useEffect(() => {
    import('leaflet.heat').then(() => {
      setHeatReady(true);
    }).catch(err => console.error("Failed to load leaflet.heat", err));
  }, []);

  useEffect(() => {
    if (!map || points.length === 0 || !heatReady) return;

    if (heatLayerRef.current) {
      map.removeLayer(heatLayerRef.current);
    }

    const heatData = points.map(p => [p[0], p[1], p[2] || 1]);
    heatLayerRef.current = L.heatLayer(heatData, {
      radius: 12,
      blur: 12,
      maxZoom: 13,
      max: 1.0,
      gradient: {
        0.4: '#3b82f6', // Blue
        0.6: '#10b981', // Green
        0.8: '#eab308', // Yellow
        1.0: '#ef4444'  // Red
      }
    }).addTo(map);

    return () => {
      if (heatLayerRef.current) {
        map.removeLayer(heatLayerRef.current);
      }
    };
  }, [map, points, heatReady]);

  return null;
}

// User location marker with pulsing effect
function UserLocationMarker({ position }) {
  if (!position) return null;
  // position is currently an array [lat, lng]
  return (
    <>
      <CircleMarker
        center={position}
        radius={12}
        pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.2, weight: 2 }}
        className="user-pulse-ring"
      />
      <CircleMarker
        center={position}
        radius={5}
        pathOptions={{ color: '#fff', fillColor: '#3b82f6', fillOpacity: 1, weight: 2 }}
      >
        <Popup>
          <div style={{ color: '#1e293b', fontWeight: 600 }}>📍 Your Location</div>
        </Popup>
      </CircleMarker>
    </>
  );
}

// Auto-center map on user location
function AutoCenter({ position, done }) {
  const map = useMap();
  useEffect(() => {
    if (position && !done.current) {
      map.flyTo(position, 13, { duration: 1.5 });
      done.current = true;
    }
  }, [position, map, done]);
  return null;
}

// Intercept map clicks for Teleport mode
function MapClickInterceptor({ demoMode, onMapClick }) {
  useMapEvents({
    click(e) {
      if (demoMode) {
        onMapClick({ lat: e.latlng.lat, lng: e.latlng.lng });
      }
    }
  });
  return null;
}

import { Marker } from 'react-leaflet';

// Cooler, animated high-tech hexagon markers
function HotspotMarkers({ clusters, threshold }) {
  return clusters
    .filter(c => c.count >= threshold)
    .map((cluster, idx) => {
      const severity = cluster.count >= 20 ? 'high' : cluster.count >= 10 ? 'medium' : 'low';
      
      const themeColor = severity === 'high' ? '#ff0055' : severity === 'medium' ? '#ff8c00' : '#ffd700';
      const size = severity === 'high' ? 38 : severity === 'medium' ? 30 : 25;
      const spinSpeed = severity === 'high' ? '4s' : '8s';

      const html = `
        <div style="position: relative; width: ${size}px; height: ${size}px; transform: translate(-50%, -50%); pointer-events: auto; cursor: pointer;">
          <svg viewBox="0 0 100 100" style="width: 100%; height: 100%; overflow: visible; filter: drop-shadow(0 0 6px ${themeColor});">
            <polygon points="50,5 89,27 89,72 50,95 11,72 11,27" fill="${themeColor}" fill-opacity="0.15" stroke="${themeColor}" stroke-width="3"/>
            <g style="transform-origin: 50px 50px; animation: spin ${spinSpeed} linear infinite;">
               <circle cx="50" cy="50" r="36" fill="none" stroke="${themeColor}" stroke-width="4" stroke-dasharray="20 15" opacity="0.9"/>
            </g>
            <circle cx="50" cy="50" r="15" fill="${themeColor}" />
          </svg>
          <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: #fff; font-size: ${size * 0.35}px; font-weight: 800; font-family: 'Outfit', sans-serif;">
            ${cluster.count}
          </div>
        </div>
      `;

      const coolIcon = L.divIcon({
        html,
        className: 'cyber-map-icon', // no default leaflet styles
        iconSize: [0, 0]
      });

      const topCrimes = cluster.crimes.slice(0, 6);
      const crimeTypeCounts = {};
      cluster.crimes.forEach(c => {
        crimeTypeCounts[c.crimeType] = (crimeTypeCounts[c.crimeType] || 0) + 1;
      });
      const sortedTypes = Object.entries(crimeTypeCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);

      return (
        <Marker
          key={idx}
          position={[cluster.lat, cluster.lng]}
          icon={coolIcon}
        >
          <Popup maxWidth={320}>
            <div style={{ fontFamily: 'Outfit, sans-serif', color: '#1e293b', minWidth: 250 }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10,
                padding: '8px 12px', borderRadius: 10,
                background: severity === 'high' ? '#fef2f2' : severity === 'medium' ? '#fffbeb' : '#f0fdf4'
              }}>
                <span style={{ fontSize: 20 }}>
                  {severity === 'high' ? '🔴' : severity === 'medium' ? '🟠' : '🟡'}
                </span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>
                    {severity.toUpperCase()} RISK ZONE
                  </div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>
                    {cluster.count} actual incidents in radius
                  </div>
                </div>
              </div>

              <div style={{ fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 6 }}>
                Top Hotspot Crimes:
              </div>
              {sortedTypes.map(([type, count], i) => (
                <div key={i} style={{
                  display: 'flex', justifyContent: 'space-between',
                  padding: '5px 0', borderBottom: '1px solid #f1f5f9',
                  fontSize: 12
                }}>
                  <span style={{ color: '#334155', fontWeight: 500 }}>{type}</span>
                  <span style={{
                    background: severity === 'high' ? '#fecaca' : '#e2e8f0',
                    color: severity === 'high' ? '#991b1b' : '#334155',
                    padding: '2px 8px', borderRadius: 10,
                    fontWeight: 700, fontSize: 11
                  }}>{count}</span>
                </div>
              ))}
            </div>
          </Popup>
        </Marker>
      );
    });
}

// Main CrimeMap component
export default function CrimeMap({ onDangerZone }) {
  const [crimes, setCrimes] = useState([]);
  const [userPos, setUserPos] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [clusters, setClusters] = useState([]);
  const autoCentered = useRef(false);
  const cooldowns = useRef({});

  // Check if admin
  const isAdmin = localStorage.getItem('role') === 'admin';

  // Fetch crime data
  useEffect(() => {
    fetch('/api/crimes')
      .then(res => res.json())
      .then(data => {
        setCrimes(data.crimes || []);
        const computed = computeHotspotCentroids(data.crimes || []);
        setClusters(computed);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch crimes:', err);
        setLoading(false);
      });
  }, []);

  // Watch user location
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation not supported');
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        if (!isAdmin) {
          setUserPos([pos.coords.latitude, pos.coords.longitude]);
          setLocationError(null);
        }
      },
      (err) => {
        console.error('Geolocation error:', err);
        if (!isAdmin) setLocationError(err.message);
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 30000 }
    );

    // Initial dummy position for admin so map isn't empty
    if (isAdmin && !userPos) {
       setUserPos([28.6139, 77.2090]); // Start at New Delhi center
    }

    return () => navigator.geolocation.clearWatch(watchId);
  }, [isAdmin, userPos]);

  // Geofencing check
  const checkGeofence = useCallback(() => {
    if (!userPos || clusters.length === 0 || !onDangerZone) return;

    const DANGER_RADIUS = 200; // meters - Increased to 200m to make intersection easier
    const COOLDOWN_MS = isAdmin ? 0 : 30 * 60 * 1000; // instant for admins to test, 30 min for citizens
    const HIGH_CRIME_THRESHOLD = 8; // Reset threshold to match the new tight grid math
    const now = Date.now();

    for (const cluster of clusters) {
      if (cluster.count < HIGH_CRIME_THRESHOLD) continue;

      const dist = getDistance(userPos[0], userPos[1], cluster.lat, cluster.lng);
      const key = `${cluster.lat.toFixed(3)}_${cluster.lng.toFixed(3)}`;

      if (dist < DANGER_RADIUS) {
        if (!cooldowns.current[key] || (now - cooldowns.current[key]) > COOLDOWN_MS) {
          cooldowns.current[key] = now;
          onDangerZone({
            distance: Math.round(dist),
            crimeCount: cluster.count,
            area: cluster.crimes[0]?.city || 'Unknown Area'
          });
          break;
        }
      }
    }
  }, [userPos, clusters, onDangerZone, isAdmin]);

  useEffect(() => {
    checkGeofence();
  }, [checkGeofence]);

  // Build heatmap points with intensity weighting
  const heatPoints = crimes.map(c => {
    const weight = c.crimeDomain === 'Violent Crime' ? 1.0 :
      c.crimeDomain === 'Fire Accident' ? 0.7 : 0.5;
    return [c.latitude, c.longitude, weight];
  });

  const recenterMap = () => {
    if (navigator.geolocation && !isAdmin) {
      autoCentered.current = false;
      navigator.geolocation.getCurrentPosition(
        pos => setUserPos([pos.coords.latitude, pos.coords.longitude]),
        () => alert('Please allow location access to jump to your position.')
      );
    } else if (isAdmin) {
       alert("Admin Teleport Mode is active. Click anywhere on the map to set location.");
    }
  };

  const INDIA_CENTER = [22.9074, 79.1469]; // Center of India

  return (
    <div className="crime-map-wrapper">
      {loading && (
        <div className="map-loading-overlay">
          <div className="map-loading-spinner" />
          <p>Loading crime data...</p>
        </div>
      )}

      {isAdmin && (
        <div className="teleport-panel" style={{
           position: 'absolute', top: 20, right: 20, zIndex: 1000, 
           background: 'rgba(255, 0, 85, 0.95)', padding: '8px 16px', borderRadius: 20,
           border: '2px solid rgba(255, 255, 255, 0.5)', color: 'white',
           boxShadow: '0 4px 20px rgba(255,0,85,0.5)', backdropFilter: 'blur(10px)',
           fontFamily: "'Outfit', sans-serif", fontSize: '12px', fontWeight: 'bold',
           pointerEvents: 'none'
        }}>
           🚨 ADMIN TELEPORTER ACTIVE - CLICK MAP TO MOVE
        </div>
      )}

      <MapContainer
        center={INDIA_CENTER}
        zoom={5}
        style={{ width: '100%', height: '100%' }}
        zoomControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>'
        />

        <HeatmapLayer points={heatPoints} />
        <UserLocationMarker position={userPos} />
        <AutoCenter position={userPos} done={autoCentered} />
        <MapClickInterceptor demoMode={isAdmin} onMapClick={pos => { setUserPos([pos.lat, pos.lng]); }} />
      </MapContainer>

      {/* Map Legend */}
      <div className="map-legend">
        <div className="legend-title">Crime Density</div>
        <div className="legend-item">
          <span className="legend-dot" style={{ background: '#ef4444' }} /> High Risk
        </div>
        <div className="legend-item">
          <span className="legend-dot" style={{ background: '#eab308' }} /> Moderate
        </div>
        <div className="legend-item">
          <span className="legend-dot" style={{ background: '#10b981' }} /> Low
        </div>
        <div className="legend-item">
          <span className="legend-dot" style={{ background: '#3b82f6' }} /> Safe Zone
        </div>
        {crimes.length > 0 && (
          <div className="legend-count">{crimes.length} records in Delhi NCR</div>
        )}
      </div>

      {/* Re-center button */}
      {userPos && (
        <button className="recenter-btn" onClick={recenterMap} title="Re-center on your location">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
          </svg>
        </button>
      )}

      {/* Location error notice */}
      {locationError && !demoMode && (
        <div className="location-error">
          📍 Location unavailable — showing Delhi NCR map
        </div>
      )}
    </div>
  );
}
