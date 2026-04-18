import { useEffect, useRef, useState, useCallback } from 'react';
import { MapContainer, TileLayer, useMap, Popup, CircleMarker, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Assign L globally so leaflet.heat can attach itself
window.L = L;
import 'leaflet.heat';



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

// ─── SOS markers ──────────────────────────────────────────────────────────────
function SosMarkers({ sosAlerts, excludeIds = [] }) {
  return (
    <>
      {sosAlerts.map((alert) => {
        const alertId = alert._id || alert.id;
        if (excludeIds.includes(alertId) || !alert.latitude || !alert.longitude) return null;
        const statusColor = alert.status === 'pending' ? '#ef4444' :
                           alert.status === 'acknowledged' ? '#eab308' : '#10b981';
        return (
          <CircleMarker
            key={alertId}
            center={[alert.latitude, alert.longitude]}
            radius={10}
            pathOptions={{ color: statusColor, fillColor: statusColor, fillOpacity: 0.9, weight: 3 }}
          >
            <Popup>
              <div style={{ color: '#1e293b', fontWeight: 600 }}>
                🚨 EMERGENCY SOS
              </div>
              <div style={{ fontSize: '0.8rem', marginTop: 4 }}>
                <div><strong>Victim:</strong> {alert.username || 'Unknown'}</div>
                <div><strong>Message:</strong> {alert.message}</div>
                <div><strong>Status:</strong> {alert.status.toUpperCase()}</div>
                <div><strong>Location:</strong> {Number(alert.latitude).toFixed(5)}, {Number(alert.longitude).toFixed(5)}</div>
                {alert.createdAt && (
                  <div><strong>Time:</strong> {new Date(alert.createdAt).toLocaleString()}</div>
                )}
              </div>
            </Popup>
          </CircleMarker>
        );
      })}
    </>
  );
}

function SimulatedSosMarker({ position, alert, onMove }) {
  if (!position) return null;

  const icon = L.divIcon({
    className: 'victim-simulator-icon',
    html: `<div style="width:30px;height:30px;border-radius:50%;background:#f97316;display:flex;align-items:center;justify-content:center;color:#ffffff;font-weight:700;border:2px solid rgba(255,255,255,0.9);box-shadow:0 0 0 6px rgba(249,115,22,0.35);">V</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -14]
  });

  return (
    <Marker
      position={position}
      icon={icon}
      draggable={true}
      eventHandlers={{
        dragend: (e) => {
          const latlng = e.target.getLatLng();
          onMove([latlng.lat, latlng.lng]);
        }
      }}
    >
      <Popup>
        <div style={{ fontWeight: 600, marginBottom: 6 }}>🚨 Simulated SOS</div>
        <div style={{ marginBottom: 4 }}><strong>Victim:</strong> {alert?.username || 'Simulated Incident'}</div>
        <div style={{ marginBottom: 4 }}><strong>Status:</strong> {alert?.status?.toUpperCase() || 'PENDING'}</div>
        <div style={{ marginBottom: 4 }}><strong>Location:</strong> {position[0].toFixed(5)}, {position[1].toFixed(5)}</div>
        {alert?.createdAt && (
          <div><strong>Time:</strong> {new Date(alert.createdAt).toLocaleString()}</div>
        )}
      </Popup>
    </Marker>
  );
}

function MapClickHandler({ onClick }) {
  useMapEvents({
    click(e) {
      onClick([e.latlng.lat, e.latlng.lng]);
    }
  });
  return null;
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

// ─── Main CrimeMap component ───────────────────────────────────────────────────
// Removed duplicate export - fixed syntax error

export default function CrimeMap({ onDangerZone, sosAlerts = [], showVictimSimulator = false }) {
  const [crimes, setCrimes]               = useState([]);
  const [userPos, setUserPos]             = useState(null);
  const [victimPos, setVictimPos]         = useState(null);
  const [simulatedSosAlert, setSimulatedSosAlert] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [loading, setLoading]             = useState(true);
  const autoCentered                      = useRef(false);

  const isLoggedIn = !!localStorage.getItem('token');

  // Fetch crime data once
  useEffect(() => {
    fetch('/api/crimes')
      .then(res => res.json())
      .then(data => {
        const list = data.crimes || [];
        setCrimes(list);
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

    const watchId = navigator.geolocation.watchPosition(
      pos => {
        const current = [pos.coords.latitude, pos.coords.longitude];
        setUserPos(current);
        setLocationError(null);
      },
      err => { setLocationError(err.message); },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 30000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!showVictimSimulator) return;

    const primarySos = sosAlerts.length > 0 ? sosAlerts[0] : null;
    if (primarySos) {
      setSimulatedSosAlert(primarySos);
      if (!victimPos) {
        setVictimPos([primarySos.latitude, primarySos.longitude]);
      }
    } else if (userPos && !victimPos) {
      setVictimPos(userPos);
      setSimulatedSosAlert(null);
    }
  }, [showVictimSimulator, sosAlerts, userPos, victimPos]);

  useEffect(() => {
    if (!showVictimSimulator || !victimPos) return;
    setSimulatedSosAlert(prev => prev ? {
      ...prev,
      latitude: victimPos[0],
      longitude: victimPos[1]
    } : prev);
  }, [showVictimSimulator, victimPos]);


  // Geofencing — triggers danger banner if user is near a crime cluster
  const checkGeofence = useCallback(() => {
    if (!userPos || clusters.length === 0 || !onDangerZone) return;
    const DANGER_RADIUS = 500; // metres
    const COOLDOWN_MS   = 30 * 60 * 1000;
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
  }, [userPos, clusters, onDangerZone]);

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

        {!showVictimSimulator && <HeatmapLayer points={heatPoints} />}
        {userPos && <UserLocationMarker position={userPos} />}
        {showVictimSimulator && (
          <>
            <MapClickHandler onClick={setVictimPos} />
            <SimulatedSosMarker position={victimPos} alert={simulatedSosAlert} onMove={setVictimPos} />
          </>
        )}
        {!showVictimSimulator && (
          <SosMarkers
            sosAlerts={sosAlerts}
          />
        )}
        <AutoCenter position={userPos} done={autoCentered} />
      </MapContainer>

      {/* Legend */}
      <div className="map-legend">
        <div className="legend-title">Crime Density & SOS Alerts</div>
        <div className="legend-item"><span className="legend-dot" style={{ background: '#ef4444' }} /> High Risk / Emergency SOS</div>
        <div className="legend-item"><span className="legend-dot" style={{ background: '#eab308' }} /> Moderate / Acknowledged</div>
        <div className="legend-item"><span className="legend-dot" style={{ background: '#10b981' }} /> Low / Resolved</div>
        <div className="legend-item"><span className="legend-dot" style={{ background: '#3b82f6' }} /> Safe Zone</div>
        {!loading && crimes.length > 0 && (
          <div className="legend-count">{crimes.length.toLocaleString()} historical records</div>
        )}
        {sosAlerts.length > 0 && (
          <div className="legend-count">{sosAlerts.length} active SOS alerts</div>
        )}
      </div>

      {/* Re-center button */}
      {showVictimSimulator && (
        <div className="simulator-control" style={{
          position: 'absolute', bottom: 100, left: 16, zIndex: 850,
          background: 'rgba(7, 12, 20, 0.9)', color: '#fff', padding: '10px 14px',
          borderRadius: 12, boxShadow: '0 12px 30px rgba(0,0,0,0.25)',
          maxWidth: 280, fontSize: '0.88rem', lineHeight: 1.4,
          pointerEvents: 'auto'
        }}>
          <strong style={{ display: 'block', marginBottom: 6 }}>Victim Simulator</strong>
          Click the map to place the SOS marker, or drag the orange marker to move it.
          {userPos && (
            <button
              type="button"
              style={{
                marginTop: 10, display: 'inline-flex', alignItems: 'center',
                background: '#f97316', color: '#fff', border: 'none', borderRadius: 8,
                padding: '6px 10px', cursor: 'pointer', fontSize: '0.82rem'
              }}
              onClick={() => setVictimPos(userPos)}
            >
              Reset to current location
            </button>
          )}
        </div>
      )}
      {userPos && (
        <button
          type="button"
          className="recenter-btn"
          title="Re-center on your location"
          style={{ pointerEvents: 'auto' }}
          onClick={() => {
            autoCentered.current = false;
            navigator.geolocation.getCurrentPosition(
              pos => setUserPos([pos.coords.latitude, pos.coords.longitude]),
              () => alert('Please allow location access.')
            );
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
          </svg>
        </button>
      )}

      {locationError && (
        <div className="location-error">
          📍 Location unavailable — showing India map
        </div>
      )}
    </div>
  );
}
