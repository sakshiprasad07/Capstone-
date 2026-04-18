import { useEffect, useRef, useCallback, useState } from 'react';
import { MapContainer, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// ─── Police stations layer (INDIVIDUAL MARKERS, NO CLUSTERING) ──────────────────
function PoliceStationsLayer({ enabled }) {
  const map = useMap();
  const markersRef = useRef([]);
  const pendingFetch = useRef(null);

  const policeIcon = L.divIcon({
    className: 'police-pin',
    html: `<div style="
      width: 12px; height: 12px;
      background: #38bdf8;
      border: 3px solid rgba(255,255,255,0.95);
      border-radius: 50%;
      box-shadow: 0 0 12px rgba(56,189,248,0.4), 0 0 0 4px rgba(56,189,248,0.2);
      animation: pulse 2s infinite;
    "></div>
    <style>@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.7}}</style>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6],
    popupAnchor: [0, -10],
  });

  const clearMarkers = useCallback(() => {
    markersRef.current.forEach(m => map.removeLayer(m));
    markersRef.current = [];
  }, [map]);

  const fetchStationsForBounds = useCallback(async () => {
    if (!enabled) return;

    clearMarkers();

    const b = map.getBounds();
    const south = b.getSouth();
    const west = b.getWest();
    const north = b.getNorth();
    const east = b.getEast();

    const controller = new AbortController();
    if (pendingFetch.current) pendingFetch.current.abort();
    pendingFetch.current = controller;

    try {
      const url = `/api/stations?bbox=${south},${west},${north},${east}&limit=20000`;
      const res = await fetch(url, { signal: controller.signal });
      if (!res.ok) throw new Error(`Stations request failed: ${res.status}`);
      const data = await res.json();
      const stations = Array.isArray(data.stations) ? data.stations : [];

      stations.forEach(s => {
        if (typeof s.lat !== 'number' || typeof s.lon !== 'number') return;
        
        const name = s.name || 'Police Station';
        const address = s.address || s.tags?.['addr:full'] || 'Address unavailable';
        const phone = s.phone || s.tags?.['contact:phone'] || 'Contact unavailable';
        
        const popup = `
          <div style="min-width: 240px; color: #0f172a; font-family: 'Segoe UI', sans-serif; line-height: 1.4;">
            <div style="font-weight: 800; font-size: 16px; margin-bottom: 8px; color: #1e293b;">
              👮 ${name}
            </div>
            ${address ? `<div style="margin-bottom: 8px; opacity: 0.9; font-size: 14px;">📍 ${address}</div>` : ''}
            ${phone ? `<div style="font-weight: 600; color: #059669;"><b>📞</b> ${phone}</div>` : ''}
            <div style="font-size: 12px; color: #64748b; margin-top: 8px; border-top: 1px solid #e2e8f0; padding-top: 6px;">
              Click for directions
            </div>
          </div>
        `;
        
        const m = L.marker([s.lat, s.lon], { icon: policeIcon }).bindPopup(popup);
        m.addTo(map);
        markersRef.current.push(m);
      });
    } catch (err) {
      if (err.name !== 'AbortError') console.warn('Failed to load stations:', err);
    }
  }, [enabled, map, clearMarkers]);

  useEffect(() => {
    if (!enabled) {
      clearMarkers();
      return;
    }
    fetchStationsForBounds();

    return () => {
      pendingFetch.current?.abort();
      clearMarkers();
    };
  }, [enabled, fetchStationsForBounds, clearMarkers]);

  useMapEvents({
    moveend: enabled ? fetchStationsForBounds : undefined,
    zoomend: enabled ? fetchStationsForBounds : undefined,
  });

  return null;
}

// ─── Main CrimeMap (CLEAN POLICE MAP ONLY) ─────────────────────────────────────
export default function CrimeMap() {
  const [showStations, setShowStations] = useState(true);

  const INDIA_CENTER = [22.9074, 79.1469];

  return (
    <div className="crime-map-wrapper" style={{ position: 'relative', height: '100vh', width: '100%' }}>
      <MapContainer
        center={INDIA_CENTER}
        zoom={6}
        style={{ width: '100%', height: '100%' }}
        zoomControl={true}
      >
        {/* DARK THEME - PRESERVED */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>'
        />

        {/* POLICE STATIONS ONLY */}
        <PoliceStationsLayer enabled={showStations} />
      </MapContainer>

      {/* SINGLE TOGGLE - Police Stations Only */}
      <div style={{
        position: 'absolute',
        top: 20,
        left: 20,
        zIndex: 1000,
        background: 'rgba(2,6,23,0.9)',
        border: '1px solid rgba(148,163,184,0.3)',
        color: '#e2e8f0',
        padding: '12px 16px',
        borderRadius: 12,
        backdropFilter: 'blur(20px)',
        fontFamily: "'Outfit', -apple-system, sans-serif",
        fontSize: 14,
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      }}>
        <div style={{ fontWeight: 800, marginBottom: 8, fontSize: 15 }}>Police Stations</div>
        <label style={{ display: 'flex', gap: 10, alignItems: 'center', cursor: 'pointer' }}>
          <input 
            type="checkbox" 
            checked={showStations} 
            onChange={e => setShowStations(e.target.checked)}
            style={{ width: 18, height: 18, accentColor: '#38bdf8' }}
          />
          <span style={{ fontWeight: 500 }}>Show Stations</span>
        </label>
      </div>

      {/* MAP TITLE */}
      <div style={{
        position: 'absolute',
        top: 20,
        right: 20,
        zIndex: 1000,
        background: 'rgba(15,23,42,0.95)',
        color: '#38bdf8',
        padding: '12px 20px',
        borderRadius: 12,
        border: '2px solid rgba(56,189,248,0.3)',
        fontFamily: "'Outfit', sans-serif",
        fontSize: 16,
        fontWeight: 800,
        textAlign: 'center',
        boxShadow: '0 8px 32px rgba(56,189,248,0.2)',
      }}>
        👮 POLICE STATIONS
      </div>
    </div>
  );
}

