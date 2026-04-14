import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import CrimeMap from './CrimeMap';

const API_URL = 'http://localhost:5000';

function PoliceDashboard() {
  const [activeTab, setActiveTab] = useState('sos');
  const [username, setUsername] = useState('Officer');
  const [errorMessage, setErrorMessage] = useState('');
  const [dangerInfo, setDangerInfo] = useState(null);

  const [sosAlerts, setSosAlerts] = useState([]);

  // Report alerts are local-only (no backend endpoint yet)
  const [reportAlerts, setReportAlerts] = useState([
    { id: 'report-1', type: 'report', title: 'Downtown Mall', desc: 'Public report: Shoplifting incident in progress. Subject fled towards Metro.', status: 'pending' }
  ]);

  const navigate = useNavigate();

  const fetchSosAlerts = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const response = await fetch(`${API_URL}/sos`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        setSosAlerts(data.sos || []);
      } else {
        setErrorMessage(data.message || 'Unable to load SOS alerts');
      }
    } catch (error) {
      console.error('Fetch SOS error:', error);
      setErrorMessage('Connection error while loading SOS alerts');
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    const storedUsername = localStorage.getItem('username');

    if (!token || role !== 'police') {
      navigate('/');
      return;
    }

    if (storedUsername) {
      setUsername(storedUsername);
    }

    fetchSosAlerts();
    const intervalId = setInterval(fetchSosAlerts, 5000);
    return () => clearInterval(intervalId);
  }, [navigate, fetchSosAlerts]);

  const handleLogout = (e) => {
    e.preventDefault();
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('role');
    navigate('/');
  };

  const handleDangerZone = useCallback((info) => {
    setDangerInfo(info);
  }, []);

  // FIX: handleStatusUpdate now uses functional updater so it's never stale,
  // and correctly uses alert._id (MongoDB) for SOS alerts
  const handleStatusUpdate = async (alert, newStatus) => {
    const alertId = alert._id || alert.id;

    if (alert.type === 'sos') {
      const token = localStorage.getItem('token');
      try {
        const response = await fetch(`${API_URL}/sos/${alertId}/status`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ status: newStatus })
        });
        const data = await response.json();
        if (response.ok) {
          // Use functional updater to guarantee we use the latest state
          setSosAlerts(prev =>
            prev.map(a => (a._id || a.id) === alertId ? { ...a, status: newStatus } : a)
          );
          setErrorMessage('');
        } else {
          setErrorMessage(data.message || 'Unable to update SOS status');
        }
      } catch (error) {
        console.error('Update SOS error:', error);
        setErrorMessage('Connection error while updating SOS status');
      }
      return;
    }

    // Local update for report alerts
    setReportAlerts(prev =>
      prev.map(a => (a._id || a.id) === alertId ? { ...a, status: newStatus } : a)
    );
  };

  // FIX: renderAlerts now only takes `alerts` — setSosAlerts/setReportAlerts are
  // captured from component scope, not passed as params (was the root cause of broken buttons)
  const renderAlerts = (alerts) => {
    if (alerts.length === 0) {
      return (
        <div style={{
          textAlign: 'center', color: 'var(--text-gray)',
          padding: '2rem', fontSize: '0.9rem'
        }}>
          No alerts at this time.
        </div>
      );
    }

    return alerts.map((alert) => {
      const alertId = alert._id || alert.id;
      return (
        <div
          key={alertId}
          className="alert-card"
          style={{ opacity: alert.status === 'resolved' ? 0.6 : 1 }}
        >
          <div className="alert-header">
            <span className={`alert-type ${alert.type === 'sos' ? 'type-sos' : 'type-report'}`}>
              {alert.type === 'sos' ? 'Emergency SOS' : 'Crime Report'}
            </span>
            <span className={`status-badge status-${alert.status}`}>
              {alert.status.toUpperCase()}
            </span>
          </div>
          <div className="alert-info">
            <h4>{alert.type === 'sos' ? `SOS from ${alert.username || 'Citizen'}` : alert.title}</h4>
            <p>{alert.type === 'sos' ? alert.message : alert.desc}</p>
            {alert.type === 'sos' && (
              <div className="alert-location">
                <strong>Location:</strong>{' '}
                {alert.latitude != null && alert.longitude != null
                  ? `${Number(alert.latitude).toFixed(5)}, ${Number(alert.longitude).toFixed(5)}`
                  : 'Unavailable'}
              </div>
            )}
            {alert.createdAt && (
              <div style={{ fontSize: '0.78rem', color: 'var(--text-gray)', marginTop: 4 }}>
                {new Date(alert.createdAt).toLocaleString()}
              </div>
            )}
          </div>
          <div className="alert-actions">
            {alert.status !== 'resolved' ? (
              <>
                {alert.status === 'pending' && (
                  <button
                    className="action-btn acknowledge"
                    onClick={() => handleStatusUpdate(alert, 'acknowledged')}
                  >
                    {alert.type === 'sos' ? 'Acknowledge' : 'Assign Unit'}
                  </button>
                )}
                <button
                  className="action-btn resolve"
                  onClick={() => handleStatusUpdate(alert, 'resolved')}
                >
                  {alert.type === 'sos' ? 'Resolve' : 'Close Case'}
                </button>
              </>
            ) : (
              <span className="resolved-text" style={{ fontSize: '0.8rem', color: 'var(--success)' }}>
                ✅ Incident Resolved
              </span>
            )}
          </div>
        </div>
      );
    });
  };

  return (
    <div className="police-dashboard" style={{ background: 'var(--bg-dark)' }}>
      {/* Main Map View */}
      <main className="map-view">
        <div className="dashboard-nav" style={{ position: 'absolute', top: 0, left: 0, right: 0, width: '100%', height: 'auto', zIndex: 500 }}>
          <div className="logo">
            <h2 style={{ fontWeight: 800, letterSpacing: '-1px' }}>
              CRIME<span style={{ color: 'var(--police-blue)' }}>CONTROL</span>
            </h2>
          </div>
          <div className="nav-links">
            <span id="badgeInfo" style={{ color: 'var(--text-gray)', fontSize: '0.9rem', marginRight: '20px' }}>
              Officer ID: {username}
            </span>
            <a href="/" id="logoutBtn" onClick={handleLogout} style={{ color: 'var(--text-gray)', textDecoration: 'none', alignSelf: 'center', fontWeight: 600 }}>
              Logout
            </a>
          </div>
        </div>

        {/* FIX: Police dashboard now shows the real CrimeMap instead of a placeholder */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
          <CrimeMap onDangerZone={handleDangerZone} />
        </div>
      </main>

      {/* Sidebar Alert Panel */}
      <aside className="alert-panel">
        <div style={{ padding: '20px 20px 0', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-gray)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>
            Live Dispatch Center
          </div>
          {errorMessage && (
            <div style={{
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: 8, padding: '8px 12px', fontSize: '0.82rem',
              color: 'var(--error)', marginBottom: 12
            }}>
              {errorMessage}
            </div>
          )}
        </div>

        <div className="panel-tabs">
          <button
            className={`tab-btn ${activeTab === 'sos' ? 'active' : ''}`}
            onClick={() => setActiveTab('sos')}
          >
            Emergency SOS {sosAlerts.filter(a => a.status === 'pending').length > 0 && (
              <span style={{
                background: 'var(--emergency)', color: '#fff',
                borderRadius: '50%', padding: '1px 6px', fontSize: '0.7rem',
                marginLeft: 6, fontWeight: 700
              }}>
                {sosAlerts.filter(a => a.status === 'pending').length}
              </span>
            )}
          </button>
          <button
            className={`tab-btn ${activeTab === 'reports' ? 'active' : ''}`}
            onClick={() => setActiveTab('reports')}
          >
            Crime Reports
          </button>
        </div>

        <div className="alert-feed">
          {activeTab === 'sos' ? renderAlerts(sosAlerts) : renderAlerts(reportAlerts)}
        </div>
      </aside>
    </div>
  );
}

export default PoliceDashboard;
