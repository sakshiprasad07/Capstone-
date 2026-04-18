import { useEffect, useRef, useCallback, useState } from 'react';
import { MapContainer, TileLayer, useMap, Marker, Popup, CircleMarker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

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
          <div style={{ color: '#1e293b', fontWeight: 600 }}>📍 Your Current Location</div>
        </Popup>
      </CircleMarker>
    </>
  );
}

// ─── SOS markers ──────────────────────────────────────────────────────────────
function SosMarkers({ sosAlerts }) {
  return (
    <>
      {sosAlerts.map((alert) => {
        const id = alert._id || alert.id;
        if (!alert.latitude || !alert.longitude) return null;
        
        const statusColor = alert.status === 'pending' ? '#ef4444' :
                           alert.status === 'acknowledged' ? '#eab308' : '#10b981';
                           
        return (
          <CircleMarker
            key={id}
            center={[alert.latitude, alert.longitude]}
            radius={10}
            pathOptions={{ color: statusColor, fillColor: statusColor, fillOpacity: 0.8, weight: 3 }}
          >
            <Popup>
              <div style={{ color: '#0f172a', minWidth: '180px' }}>
                <div style={{ fontWeight: 800, color: '#ef4444', marginBottom: 4 }}>🆘 EMERGENCY SOS</div>
                <div style={{ fontSize: '13px', marginBottom: 4 }}><b>Victim:</b> {alert.username}</div>
                <div style={{ fontSize: '13px', marginBottom: 4 }}><b>Message:</b> {alert.message}</div>
                <div style={{ fontSize: '13px', borderTop: '1px solid #eee', paddingTop: 4, marginTop: 4 }}>
                  <b>Status:</b> <span style={{ color: statusColor, fontWeight: 700 }}>{alert.status?.toUpperCase()}</span>
                </div>
              </div>
            </Popup>
          </CircleMarker>
        );
      })}
    </>
  );
}

// ─── Draggable Victim Marker (Admin Simulator) ───────────────────────────────────
function SimulatedSosMarker({ position, onMove }) {
  if (!position) return null;

  const icon = L.divIcon({
    className: 'victim-simulator-icon',
    html: `<div style="width:30px;height:30px;border-radius:50%;background:#fb923c;display:flex;align-items:center;justify-content:center;color:white;font-weight:900;border:3px solid white;box-shadow:0 0 20px rgba(251,146,60,0.6);">V</div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15]
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
        <div style={{ fontWeight: 600 }}>🛠️ Simulation Victim Unit</div>
        <div style={{ fontSize: '12px', marginTop: 4 }}>Drag me to set dynamic location</div>
      </Popup>
    </Marker>
  );
}


// ─── Police stations layer ──────────────────────────────────────────────────
function PoliceStationsLayer({ enabled }) {
  const map = useMap();
  const markersRef = useRef([]);
  const pendingFetch = useRef(null);

  const policeIcon = L.divIcon({
    className: 'police-pin',
    html: `<div style="width:12px;height:12px;background:#38bdf8;border:3px solid white;border-radius:50%;box-shadow:0 0 12px rgba(56,189,248,0.5);"></div>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6]
  });

  const clearMarkers = useCallback(() => {
    markersRef.current.forEach(m => map.removeLayer(m));
    markersRef.current = [];
  }, [map]);

  const fetchStations = useCallback(async () => {
    if (!enabled) return;
    clearMarkers();
    const b = map.getBounds();
    try {
      const res = await fetch(`/api/stations?bbox=${b.getSouth()},${b.getWest()},${b.getNorth()},${b.getEast()}&limit=50`);
      const data = await res.json();
      const stations = Array.isArray(data.stations) ? data.stations : [];
      stations.forEach(s => {
        const m = L.marker([s.lat, s.lon], { icon: policeIcon }).bindPopup(`👮 ${s.name || 'Station'}`);
        m.addTo(map);
        markersRef.current.push(m);
      });
    } catch (err) { console.warn('Failed to load stations', err); }
  }, [enabled, map, clearMarkers]);

  useEffect(() => {
    fetchStations();
  }, [enabled, fetchStations]);

  useMapEvents({ moveend: enabled ? fetchStations : undefined });
  return null;
}

// ─── Main CrimeMap (SIMULATOR ENABLED) ──────────────────────────────────────────
export default function CrimeMap({ sosAlerts = [], isAdminMode = false }) {
  const INDIA_CENTER = [22.9074, 79.1469];
  
  const [showStations, setShowStations] = useState(true);
  const [userPos, setUserPos] = useState(null);
  const [victimPos, setVictimPos] = useState(INDIA_CENTER);
  const [sosLoading, setSosLoading] = useState(false);
  const [sosSuccess, setSosSuccess] = useState(false);
  const mapRef = useRef(null);

  // Recenter map on Admin toggle
  useEffect(() => {
    if (isAdminMode && victimPos && mapRef.current) {
      mapRef.current.setView(victimPos, 13);
    }
  }, [isAdminMode]);

  // Sync user location
  useEffect(() => {
    if (!navigator.geolocation) return;
    const watchId = navigator.geolocation.watchPosition(
      pos => {
        const current = [pos.coords.latitude, pos.coords.longitude];
        setUserPos(current);
        // If we still have the default center, update it to real location once
        if (victimPos === INDIA_CENTER) setVictimPos(current);
      },
      err => console.warn(err),
      { enableHighAccuracy: true }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  const triggerSimulatedSos = async () => {
    if (!victimPos) return;
    setSosLoading(true);
    setSosSuccess(false);

    try {
      const response = await fetch('http://localhost:5000/sos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'SIM_UNIT_ADMIN',
          message: 'LIVE SIMULATION: Emergency SOS triggered from Admin Console.',
          latitude: victimPos[0],
          longitude: victimPos[1]
        })
      });

      if (response.ok) {
        setSosSuccess(true);
        setTimeout(() => setSosSuccess(false), 4000);
      } else {
        alert('Failed to trigger simulation');
      }
    } catch (error) {
      console.error(error);
      alert('Network error');
    } finally {
      setSosLoading(true); // Artificial delay to feel "premium"
      setTimeout(() => setSosLoading(false), 800);
    }
  };

  return (
    <div className="crime-map-wrapper" style={{ position: 'relative', height: '100%', width: '100%', background: '#020617' }}>
      <MapContainer
        center={INDIA_CENTER}
        zoom={5}
        style={{ width: '100%', height: '100%' }}
        zoomControl={false}
        ref={mapRef}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; CARTO'
        />

        {userPos && <UserLocationMarker position={userPos} />}
        <SosMarkers sosAlerts={sosAlerts} />
        <PoliceStationsLayer enabled={showStations} />
        
        {isAdminMode && (
          <>
            <SimulatedSosMarker position={victimPos} onMove={setVictimPos} />
          </>
        )}
      </MapContainer>

      {/* Simulator Control Panel */}
      {isAdminMode && (
        <div style={{
          position: 'absolute', bottom: 30, left: 30, zIndex: 1000,
          background: 'rgba(15, 23, 42, 0.9)', padding: '20px', borderRadius: '16px',
          border: '1px solid rgba(251, 146, 60, 0.4)', color: 'white',
          width: '320px', backdropFilter: 'blur(10px)', boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
        }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#fb923c', letterSpacing: '0.5px' }}>🚨 LIVE SIMULATOR</h4>
          <p style={{ margin: '0 0 20px 0', fontSize: '13px', opacity: 0.8, lineHeight: 1.5 }}>
            Click the map or drag the orange marker to set the simulation origin. Triggering an SOS will alert all active dispatch units.
          </p>
          
          <div style={{ fontSize: '12px', marginBottom: '15px', color: '#94a3b8', fontStyle: 'italic' }}>
            Origin: {victimPos?.[0].toFixed(5)}, {victimPos?.[1].toFixed(5)}
          </div>

          <button
            onClick={triggerSimulatedSos}
            disabled={sosLoading}
            style={{
              width: '100%', padding: '14px', borderRadius: '12px', border: 'none',
              background: sosSuccess ? '#10b981' : '#ef4444', color: 'white',
              fontWeight: 800, cursor: 'pointer', transition: 'all 0.3s ease',
              boxShadow: sosSuccess ? '0 0 20px rgba(16,185,129,0.3)' : '0 10px 20px rgba(239,68,68,0.2)'
            }}
          >
            {sosLoading ? 'SYNCING...' : sosSuccess ? '✅ SOS BROADCASTED' : 'TRIGGER EMERGENCY SOS'}
          </button>
        </div>
      )}

      {/* Map Legend/Toggles (Simplified) */}
      <div style={{
        position: 'absolute', top: 20, left: 20, zIndex: 1000,
        background: 'rgba(15, 23, 42, 0.8)', padding: '12px 16px', borderRadius: '12px',
        border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontSize: '13px'
      }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
          <input type="checkbox" checked={showStations} onChange={e => setShowStations(e.target.checked)} />
          Police Stations
        </label>
      </div>
    </div>
  );
}

