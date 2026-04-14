import { useEffect, useRef, useState, useCallback } from 'react';
import { MapContainer, TileLayer, useMap, Popup, CircleMarker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Assign L globally so leaflet.heat can attach itself
window.L = L;
import 'leaflet.heat';

// ─── Haversine distance (meters) ──────────────────────────────────────────────
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── Grid-based clustering (for geofencing only, not markers) ─────────────────
// gridSize = 0.05° ≈ 5 km — large enough to beat the 1.6 km server-side jitter
function computeClusters(crimes, gridSize = 0.05) {
  const grid = {};
  crimes.forEach(c => {
    const key = `${Math.round(c.latitude / gridSize)}_${Math.round(c.longitude / gridSize)}`;
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
    crimes: g.crimes,
  }));
}

// ─── Heatmap layer ─────────────────────────────────────────────────────────────
function HeatmapLayer({ points }) {
  const map = useMap();
  const heatLayerRef = useRef(null);

  useEffect(() => {
    if (!map || points.length === 0) return;
    if (typeof L.heatLayer !== 'function') {
      console.warn('leaflet.heat not loaded — heatmap unavailable');
      return;
    }

    if (heatLayerRef.current) {
      map.removeLayer(heatLayerRef.current);
      heatLayerRef.current = null;
    }

    // radius 25 + minOpacity 0.35 keeps the heatmap visible at national zoom (5)
    heatLayerRef.current = L.heatLayer(points, {
      radius: 25,
      blur: 20,
      maxZoom: 18,
      minOpacity: 0.35,
      max: 1.0,
      gradient: {
        0.2: '#3b82f6',
        0.5: '#10b981',
        0.75: '#eab308',
        1.0: '#ef4444',
      },
    }).addTo(map);

    return () => {
      if (heatLayerRef.current) {
        map.removeLayer(heatLayerRef.current);
        heatLayerRef.current = null;
      }
    };
  }, [map, points]);

  return null;
}

// ─── User location marker ──────────────────────────────────────────────────────
function UserLocationMarker({ position }) {
  if (!position) return null;
  return (
    <>
      <CircleMarker
        center={position}
        radius={12}
        pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.2, weight: 2 }}
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

// ─── Auto-center ──────────────────────────────────────────────────────────────
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

// ─── Map click interceptor (admin teleport) ────────────────────────────────────
function MapClickInterceptor({ demoMode, onMapClick }) {
  useMapEvents({
    click(e) {
      if (demoMode) onMapClick({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

// ─── Main CrimeMap component ───────────────────────────────────────────────────
export default function CrimeMap({ onDangerZone }) {
  const [crimes, setCrimes]               = useState([]);
  const [clusters, setClusters]           = useState([]);
  const [userPos, setUserPos]             = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [loading, setLoading]             = useState(true);
  const autoCentered                      = useRef(false);
  const cooldowns                         = useRef({});

  const isAdmin = localStorage.getItem('role') === 'admin';

  // Fetch crime data once
  useEffect(() => {
    fetch('/api/crimes')
      .then(res => res.json())
      .then(data => {
        const list = data.crimes || [];
        setCrimes(list);
        setClusters(computeClusters(list));
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch crimes:', err);
        setLoading(false);
      });
  }, []);

  // Watch user geolocation
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation not supported');
      return;
    }

    if (isAdmin) setUserPos([28.6139, 77.209]); // Default: New Delhi

    const watchId = navigator.geolocation.watchPosition(
      pos => {
        if (!isAdmin) {
          setUserPos([pos.coords.latitude, pos.coords.longitude]);
          setLocationError(null);
        }
      },
      err => { if (!isAdmin) setLocationError(err.message); },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 30000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  // Geofencing — triggers danger banner if user is near a crime cluster
  const checkGeofence = useCallback(() => {
    if (!userPos || clusters.length === 0 || !onDangerZone) return;
    const DANGER_RADIUS = 500; // metres
    const COOLDOWN_MS   = isAdmin ? 0 : 30 * 60 * 1000;
    const THRESHOLD     = 3;
    const now           = Date.now();

    for (const cluster of clusters) {
      if (cluster.count < THRESHOLD) continue;
      const dist = getDistance(userPos[0], userPos[1], cluster.lat, cluster.lng);
      const key  = `${cluster.lat.toFixed(3)}_${cluster.lng.toFixed(3)}`;
      if (dist < DANGER_RADIUS) {
        if (!cooldowns.current[key] || now - cooldowns.current[key] > COOLDOWN_MS) {
          cooldowns.current[key] = now;
          onDangerZone({
            distance:   Math.round(dist),
            crimeCount: cluster.count,
            area:       cluster.crimes[0]?.city || 'Unknown Area',
          });
          break;
        }
      }
    }
  }, [userPos, clusters, onDangerZone, isAdmin]);

  useEffect(() => { checkGeofence(); }, [checkGeofence]);

  // Build heatmap points weighted by crime domain
  const heatPoints = crimes.map(c => [
    c.latitude,
    c.longitude,
    c.crimeDomain === 'Violent Crime' ? 1.0 :
    c.crimeDomain === 'Fire Accident' ? 0.7 : 0.5,
  ]);

  const INDIA_CENTER = [22.9074, 79.1469];

  return (
    <div className="crime-map-wrapper">
      {loading && (
        <div className="map-loading-overlay">
          <div className="map-loading-spinner" />
          <p>Loading crime data…</p>
        </div>
      )}

      {isAdmin && (
        <div style={{
          position: 'absolute', top: 20, right: 20, zIndex: 1000,
          background: 'rgba(255,0,85,0.95)', padding: '8px 16px', borderRadius: 20,
          border: '2px solid rgba(255,255,255,0.5)', color: 'white',
          boxShadow: '0 4px 20px rgba(255,0,85,0.5)', backdropFilter: 'blur(10px)',
          fontFamily: "'Outfit',sans-serif", fontSize: 12, fontWeight: 'bold',
          pointerEvents: 'none',
        }}>
          🚨 ADMIN TELEPORTER ACTIVE — CLICK MAP TO MOVE
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
        <MapClickInterceptor
          demoMode={isAdmin}
          onMapClick={pos => setUserPos([pos.lat, pos.lng])}
        />
      </MapContainer>

      {/* Legend */}
      <div className="map-legend">
        <div className="legend-title">Crime Density</div>
        <div className="legend-item"><span className="legend-dot" style={{ background: '#ef4444' }} /> High Risk</div>
        <div className="legend-item"><span className="legend-dot" style={{ background: '#eab308' }} /> Moderate</div>
        <div className="legend-item"><span className="legend-dot" style={{ background: '#10b981' }} /> Low</div>
        <div className="legend-item"><span className="legend-dot" style={{ background: '#3b82f6' }} /> Safe Zone</div>
        {!loading && crimes.length > 0 && (
          <div className="legend-count">{crimes.length.toLocaleString()} records</div>
        )}
      </div>

      {/* Re-center button */}
      {userPos && (
        <button
          className="recenter-btn"
          title="Re-center on your location"
          onClick={() => {
            if (!isAdmin) {
              autoCentered.current = false;
              navigator.geolocation.getCurrentPosition(
                pos => setUserPos([pos.coords.latitude, pos.coords.longitude]),
                () => alert('Please allow location access.')
              );
            } else {
              alert('Admin Teleport Mode: click anywhere on the map to move.');
            }
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
          </svg>
        </button>
      )}

      {locationError && !isAdmin && (
        <div className="location-error">
          📍 Location unavailable — showing India map
        </div>
      )}
    </div>
  );
}
