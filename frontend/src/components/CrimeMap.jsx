import { useEffect, useRef, useCallback, useState } from 'react';
import { MapContainer, TileLayer, useMap, Marker, Popup, CircleMarker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat';

<<<<<<< HEAD


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
    // ...existing code...
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
function PoliceStationsLayer({ enabled, sosAlerts = [] }) {
  const map = useMap();
  const markersRef = useRef([]);
  const pendingFetch = useRef(null);

  // Identify stations with active SOS alerts
  const assignedStationIds = sosAlerts
    .filter(alert => alert.type === 'sos' && alert.status !== 'resolved' && alert.assignedPoliceStationId)
    .map(alert => alert.assignedPoliceStationId);

  const getPoliceIcon = (stationId) => {
    const isAssigned = assignedStationIds.includes(stationId);
    const blinkStyle = isAssigned ? 'animation: blink 1s infinite;' : '';
    
    return L.divIcon({
      className: 'police-pin',
      html: `<div style="width:12px;height:12px;background:${isAssigned ? '#ef4444' : '#38bdf8'};border:3px solid white;border-radius:50%;box-shadow:0 0 12px rgba(${isAssigned ? '239,68,68' : '56,189,248'},0.5);${blinkStyle}"></div>`,
      iconSize: [12, 12],
      iconAnchor: [6, 6]
    });
  };

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
        const stationId = s.osm_id ? s.osm_id.toString() : s.id?.toString();
        const icon = getPoliceIcon(stationId);
        const m = L.marker([s.lat, s.lon], { icon }).bindPopup(`👮 ${s.name || 'Station'}`);
        m.addTo(map);
        markersRef.current.push(m);
      });
    } catch (err) { console.warn('Failed to load stations', err); }
  }, [enabled, map, clearMarkers, assignedStationIds]);

  useEffect(() => {
    fetchStations();
  }, [enabled, fetchStations]);

  useMapEvents({ moveend: enabled ? fetchStations : undefined });
  return null;
}

// ─── Heatmap Layer ───────────────────────────────────────────────────────────
function HeatmapLayer({ enabled }) {
  const map = useMap();
  const heatLayerRef = useRef(null);

  useEffect(() => {
    if (!enabled) {
      if (heatLayerRef.current) {
        map.removeLayer(heatLayerRef.current);
        heatLayerRef.current = null;
      }
      return;
    }

    const fetchCrimeData = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/crimes');
        const data = await response.json();
        const crimes = data.crimes || [];

        const points = crimes.map(c => [c.latitude, c.longitude, 0.5]); // lat, lng, intensity

        if (heatLayerRef.current) {
          map.removeLayer(heatLayerRef.current);
        }

        heatLayerRef.current = L.heatLayer(points, {
          radius: 25,
          blur: 15,
          maxZoom: 17,
          gradient: {
            0.4: 'rgba(56, 189, 248, 0.5)', // Blue
            0.6: 'rgba(16, 185, 129, 0.7)', // Green
            0.7: 'rgba(234, 179, 8, 0.8)',  // Yellow
            0.8: 'rgba(249, 115, 22, 0.9)', // Orange
            1.0: 'rgba(239, 68, 68, 1)'     // Red
          }
        }).addTo(map);
      } catch (error) {
        console.error('Failed to fetch crime data for heatmap:', error);
      }
    };

    fetchCrimeData();

    return () => {
      if (heatLayerRef.current) {
        map.removeLayer(heatLayerRef.current);
        heatLayerRef.current = null;
      }
    };
  }, [enabled, map]);

  return null;
}

// ─── Main CrimeMap (SIMULATOR ENABLED) ──────────────────────────────────────────
export default function CrimeMap({ sosAlerts = [], isAdminMode = false, onCursorLocationChange = null, showHeatmap = false }) {
  const INDIA_CENTER = [22.9074, 79.1469];
  
  const [showStations, setShowStations] = useState(true);
  const [internalShowHeatmap, setInternalShowHeatmap] = useState(showHeatmap);
  const [userPos, setUserPos] = useState(null);
  const [victimPos, setVictimPos] = useState(INDIA_CENTER);
  const [sosLoading, setSosLoading] = useState(false);
  const [sosSuccess, setSosSuccess] = useState(false);
  const mapRef = useRef(null);

  // Sync internal state with prop
  useEffect(() => {
    setInternalShowHeatmap(showHeatmap);
  }, [showHeatmap]);

  // Recenter map on Admin toggle
  useEffect(() => {
    if (isAdminMode && victimPos && mapRef.current) {
      mapRef.current.setView(victimPos, 13);
    }
  }, [isAdminMode]);

// ─── Map interaction handler (Admin Only) ───────────────────────────────────
function MapClickHandler({ isAdminMode, onLocationSelect }) {
  useMapEvents({
    click: (e) => {
      if (isAdminMode) {
        onLocationSelect([e.latlng.lat, e.latlng.lng]);
      }
    }
  });
  return null;
}

<<<<<<< HEAD
// ─── Main CrimeMap component ───────────────────────────────────────────────────
export default function CrimeMap() {
  const [crimes, setCrimes]               = useState([]);
  const [userPos, setUserPos]             = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [loading, setLoading]             = useState(true);
  const autoCentered                      = useRef(false);

  const isAdmin = localStorage.getItem('role') === 'admin';

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
=======
  // Restore automatic user geolocation
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const newPos = [latitude, longitude];
          
          setUserPos(newPos);
          if (onCursorLocationChange) {
            onCursorLocationChange(newPos);
          }
>>>>>>> bugssss

          // Center map on user location
          if (mapRef.current) {
            mapRef.current.setView(newPos, 13);
          }
          console.log("Automatic geolocation sync successful:", newPos);
        },
        (error) => {
          console.warn("Geolocation access denied or failed. Falling back to default center.", error.message);
          // Only use India center if we don't have userPos yet
          if (!userPos) {
            setUserPos(INDIA_CENTER);
            if (onCursorLocationChange) onCursorLocationChange(INDIA_CENTER);
          }
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    } else {
      console.warn("Geolocation not supported by this browser.");
      if (!userPos) {
        setUserPos(INDIA_CENTER);
        if (onCursorLocationChange) onCursorLocationChange(INDIA_CENTER);
      }
    }
  }, []); // Run once on mount

  const triggerSimulatedSos = async () => {
    if (!victimPos || victimPos.length !== 2 || isNaN(victimPos[0]) || isNaN(victimPos[1])) {
      alert('Invalid victim position. Please set a valid location first.');
      return;
    }

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

<<<<<<< HEAD
    return () => navigator.geolocation.clearWatch(watchId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);



  // Build heatmap points weighted by crime domain
  const heatPoints = crimes.map(c => [
    c.latitude,
    c.longitude,
    c.crimeDomain === 'Violent Crime' ? 1.0 :
    c.crimeDomain === 'Fire Accident' ? 0.7 : 0.5,
  ]);

  const INDIA_CENTER = [22.9074, 79.1469];
=======
      if (response.ok) {
        setSosSuccess(true);
        setTimeout(() => setSosSuccess(false), 4000);
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(`Failed to trigger simulation: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('SOS simulation error:', error);
      alert(`Network error: ${error.message || 'Unable to connect to server'}`);
    } finally {
      setSosLoading(false);
    }
  };
>>>>>>> bugssss

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

        {userPos && <UserLocationMarker position={userPos} onPositionChange={setUserPos} />}
        <SosMarkers sosAlerts={sosAlerts} />
        <PoliceStationsLayer enabled={showStations} />
        <HeatmapLayer enabled={internalShowHeatmap} />
        <MapClickHandler isAdminMode={isAdminMode} onLocationSelect={setVictimPos} />
        
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
        border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontSize: '13px',
        display: 'flex', flexDirection: 'column', gap: '8px'
      }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
          <input type="checkbox" checked={showStations} onChange={e => setShowStations(e.target.checked)} />
          Police Stations
        </label>
        {showHeatmap && (
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input type="checkbox" checked={internalShowHeatmap} onChange={e => setInternalShowHeatmap(e.target.checked)} />
            Crime Heatmap
          </label>
        )}
      </div>
    </div>
  );
}

