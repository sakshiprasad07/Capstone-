import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const API_URL = 'http://localhost:5000';

function PoliceDashboard() {
  const [activeTab, setActiveTab] = useState('sos');
  const [username, setUsername] = useState('Officer');
  const [errorMessage, setErrorMessage] = useState('');
  
  const [sosAlerts, setSosAlerts] = useState([]);

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
      return;
    }

    if (storedUsername) {
      setUsername(storedUsername);
    }

    const fetchSosAlerts = async () => {
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
    };

    fetchSosAlerts();
    const intervalId = setInterval(fetchSosAlerts, 5000);
    return () => clearInterval(intervalId);
  }, [navigate]);

  const handleLogout = (e) => {
    e.preventDefault();
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('role');
    navigate('/');
  };

  const updateAlertStatus = (alerts, setAlerts, id, newStatus) => {
    setAlerts(alerts.map(alert => {
      const alertId = alert._id || alert.id;
      return alertId === id ? { ...alert, status: newStatus } : alert;
    }));
  };

  const handleStatusUpdate = async (alert, newStatus) => {
    if (alert.type === 'sos') {
      const token = localStorage.getItem('token');
      try {
        const response = await fetch(`${API_URL}/sos/${alert._id || alert.id}/status`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ status: newStatus })
        });
        const data = await response.json();
        if (response.ok) {
          updateAlertStatus(sosAlerts, setSosAlerts, alert._id || alert.id, newStatus);
        } else {
          setErrorMessage(data.message || 'Unable to update SOS status');
        }
      } catch (error) {
        console.error('Update SOS error:', error);
        setErrorMessage('Connection error while updating SOS status');
      }
      return;
    }

    updateAlertStatus(reportAlerts, setReportAlerts, alert.id, newStatus);
  };

  const renderAlerts = (alerts, setAlerts) => {
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
            <h4>{alert.type === 'sos' ? `SOS from ${alert.username}` : alert.title}</h4>
            <p>{alert.type === 'sos' ? alert.message : alert.desc}</p>
            {alert.type === 'sos' && alert.status !== 'pending' && (
              <div className="alert-location">
                <strong>Location:</strong>{' '}
                {alert.latitude != null && alert.longitude != null
                  ? `${alert.latitude.toFixed(5)}, ${alert.longitude.toFixed(5)}`
                  : 'Unavailable'}
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
              <span style={{ fontSize: '0.8rem', color: 'var(--success)' }}>Case Closed</span>
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
