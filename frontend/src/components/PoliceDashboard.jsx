import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function PoliceDashboard() {
  const [activeTab, setActiveTab] = useState('sos');
  const [username, setUsername] = useState('Officer');

  const [sosAlerts, setSosAlerts] = useState([
    { id: 'sos-1', type: 'sos', title: 'High Street Junction', desc: 'Distress signal received 2 mins ago. Geolocation tagged within 50m radius.', status: 'pending' },
    { id: 'sos-2', type: 'sos', title: 'Central Park East', desc: 'Officer dispatched. Arrival estimated in 3 mins.', status: 'acknowledged' }
  ]);

  const [reportAlerts, setReportAlerts] = useState([
    { id: 'report-1', type: 'report', title: 'Downtown Mall', desc: 'Public report: Shoplifting incident in progress. Subject fled towards Metro.', status: 'pending' }
  ]);

  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    const storedUsername = localStorage.getItem('username');

    if (!token || role !== 'police') {
      navigate('/');
    }

    if (storedUsername) {
      setUsername(storedUsername);
    }
  }, [navigate]);

  const handleLogout = (e) => {
    e.preventDefault();
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('role');
    navigate('/');
  };

  const updateAlertStatus = (alerts, setAlerts, id, newStatus) => {
    setAlerts(alerts.map(alert =>
      alert.id === id ? { ...alert, status: newStatus } : alert
    ));
  };

  const renderAlerts = (alerts, setAlerts) => (
    alerts.map((alert) => (
      <div
        key={alert.id}
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
          <h4>{alert.title}</h4>
          <p>{alert.desc}</p>
        </div>
        <div className="alert-actions">
          {alert.status !== 'resolved' ? (
            <>
              {alert.status === 'pending' && (
                <button
                  className="action-btn acknowledge"
                  onClick={() => updateAlertStatus(alerts, setAlerts, alert.id, 'acknowledged')}
                >
                  {alert.type === 'sos' ? 'Acknowledge' : 'Assign Unit'}
                </button>
              )}
              <button
                className="action-btn resolve"
                onClick={() => updateAlertStatus(alerts, setAlerts, alert.id, 'resolved')}
              >
                {alert.type === 'sos' ? 'Resolve' : 'Close Case'}
              </button>
            </>
          ) : (
            <span style={{ fontSize: '0.8rem', color: 'var(--success)' }}>Case Closed</span>
          )}
        </div>
      </div>
    ))
  );

  return (
    <div className="police-dashboard" style={{ background: 'var(--bg-dark)' }}>
      {/* Main Map View */}
      <main className="map-view">
        <div className="dashboard-nav" style={{ position: 'absolute', top: 0, left: 0, right: 0, width: '100%', height: 'auto' }}>
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

        <div className="map-placeholder" style={{ height: '100%' }}>
          <div className="map-overlay-text">
            <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"
              style={{ display: 'block', margin: '0 auto 20px', opacity: 0.3 }}>
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="22" y1="12" x2="18" y2="12"></line>
              <line x1="6" y1="12" x2="2" y2="12"></line>
              <line x1="12" y1="6" x2="12" y2="2"></line>
              <line x1="12" y1="22" x2="12" y2="18"></line>
            </svg>
            Real-time Hotspot Map
          </div>
        </div>
      </main>

      {/* Sidebar Alert Panel */}
      <aside className="alert-panel">
        <div className="panel-tabs">
          <button
            className={`tab-btn ${activeTab === 'sos' ? 'active' : ''}`}
            onClick={() => setActiveTab('sos')}
          >
            Emergency SOS
          </button>
          <button
            className={`tab-btn ${activeTab === 'reports' ? 'active' : ''}`}
            onClick={() => setActiveTab('reports')}
          >
            Crime Reports
          </button>
        </div>

        <div className="alert-feed">
          {activeTab === 'sos' ? renderAlerts(sosAlerts, setSosAlerts) : renderAlerts(reportAlerts, setReportAlerts)}
        </div>
      </aside>
    </div>
  );
}

export default PoliceDashboard;
