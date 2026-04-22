import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import CrimeMap from './CrimeMap';
import DangerBanner from './DangerBanner';

const API_URL = 'http://localhost:5000';

function UserLanding() {
  const [showSosModal, setShowSosModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [sosStatus, setSosStatus] = useState('sos'); // 'sos', 'sent'
  const [reportType, setReportType] = useState('Theft');
  const [reportLocation, setReportLocation] = useState('');
  const [reportTime, setReportTime] = useState('');
  const [reportDetails, setReportDetails] = useState('');
  const [feedback, setFeedback] = useState('');
  const [dangerInfo, setDangerInfo] = useState(null);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [showAdminAuth, setShowAdminAuth] = useState(false);
  const [adminId, setAdminId] = useState('');
  const [adminPass, setAdminPass] = useState('');
  const [adminError, setAdminError] = useState('');
  const [cursorLocation, setCursorLocation] = useState(null); // Track cursor position from map
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/');
    }
  }, [navigate]);

  const handleLogout = (e) => {
    e.preventDefault();
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('role');
    navigate('/');
  };

  const sendSos = async (latitude = null, longitude = null) => {
    const username = localStorage.getItem('username') || 'Anonymous';

    try {
      const response = await fetch(`${API_URL}/sos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          message: 'Emergency SOS request submitted from public dashboard.',
          latitude,
          longitude
        })
      });

      const data = await response.json();
      if (response.ok) {
        setFeedback('Emergency SOS sent to police. Help is on the way.');
        setSosStatus('sent');
        setTimeout(() => {
          setSosStatus('sos');
          setFeedback('');
        }, 5000);
      } else {
        setFeedback(data.message || 'Unable to send SOS.');
      }
    } catch (error) {
      setFeedback('Connection error while sending SOS.');
      console.error('SOS send error:', error);
    }
  };

  const handleConfirmSos = () => {
    setShowSosModal(false);
    // Use cursor location from map instead of geolocation
    if (cursorLocation) {
      sendSos(cursorLocation[0], cursorLocation[1]);
    } else {
      setFeedback('Location marker not available. Please move your cursor over the map.');
    }
  };

  const sendReport = async () => {
    const username = localStorage.getItem('username') || 'Anonymous';
    const title = `${reportType} at ${reportLocation || 'Unknown location'}`;
    const desc = `Seen at: ${reportTime || 'Unknown time'}\nDetails: ${reportDetails || 'No additional information provided.'}`;

    try {
      const response = await fetch(`${API_URL}/reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          title,
          desc,
          reportType,
          location: reportLocation,
          incidentTime: reportTime,
          details: reportDetails
        })
      });

      const data = await response.json();
      if (response.ok) {
        setFeedback('Crime report sent to police. Thank you for reporting.');
        setShowReportModal(false);
        setReportType('Theft');
        setReportLocation('');
        setReportTime('');
        setReportDetails('');
        setTimeout(() => setFeedback(''), 5000);
      } else {
        setFeedback(data.message || 'Unable to send crime report.');
      }
    } catch (error) {
      setFeedback('Connection error while sending crime report.');
      console.error('Report send error:', error);
    }
  };

  const handleSubmitReport = (e) => {
    e.preventDefault();
    sendReport();
  };

  const handleDangerZone = useCallback((info) => {
    setDangerInfo(info);
  }, []);

  const handleDismissDanger = useCallback(() => {
    setDangerInfo(null);
  }, []);

  return (
    <div className="dashboard-container">
      <nav className="dashboard-nav">
        <div className="logo">
          <h2 style={{ fontWeight: 800, letterSpacing: '-1px' }}>
            CRIME<span style={{ color: 'var(--primary)' }}>HOTSPOT</span>
          </h2>
        </div>
        <div className="nav-links">
          <button
            type="button"
            className="report-btn"
            onClick={() => isAdminMode ? setIsAdminMode(false) : setShowAdminAuth(true)}
            style={{
              background: isAdminMode ? 'rgba(249, 115, 22, 0.2)' : 'rgba(255,255,255,0.05)',
              color: isAdminMode ? '#fb923c' : 'var(--text-gray)',
              border: isAdminMode ? '1px solid #fb923c' : '1px solid rgba(255,255,255,0.1)',
              marginRight: '10px'
            }}
          >
            {isAdminMode ? 'Disable Simulator' : 'Admin Simulator'}
          </button>
          <button type="button" className="report-btn" onClick={() => setShowReportModal(true)}>
            Report a Crime
          </button>
          <a href="/" onClick={handleLogout} style={{ color: 'var(--text-gray)', textDecoration: 'none', alignSelf: 'center' }}>
            Logout
          </a>
        </div>
      </nav>

      {/* Danger Zone Banner */}
      <DangerBanner danger={dangerInfo} onDismiss={handleDismissDanger} />

      {/* Interactive Crime Map */}
      <main className="map-area">
        <CrimeMap onDangerZone={handleDangerZone} isAdminMode={isAdminMode} onCursorLocationChange={setCursorLocation} />
      </main>

      {/* SOS Button - Hidden in Admin Simulator Mode */}
      {!isAdminMode && (
        <button
          className="sos-btn"
          onClick={() => setShowSosModal(true)}
          style={{
            background: sosStatus === 'sent' ? '#059669' : '',
            animation: sosStatus === 'sent' ? 'none' : ''
          }}
        >
          {sosStatus === 'sent' ? 'SENT' : 'SOS'}
        </button>
      )}

      {feedback && <div className="feedback-message">{feedback}</div>}

      {/* SOS Confirmation Modal */}
      {showSosModal && (
        <div className="modal-overlay" style={{ display: 'flex' }} onClick={(e) => {
          if (e.target === e.currentTarget) setShowSosModal(false);
        }}>
          <div className="modal-content">
            <div style={{ color: 'var(--emergency)', marginBottom: '1.5rem' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                <line x1="12" y1="9" x2="12" y2="13"></line>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
              </svg>
            </div>
            <h3>Send Emergency SOS?</h3>
            <p>This will send your current location and an emergency request to nearby police personnel. Are you sure?</p>
            <div className="modal-actions">
              <button className="modal-btn cancel-sos" onClick={() => setShowSosModal(false)}>Cancel</button>
              <button className="modal-btn confirm-sos" onClick={handleConfirmSos}>Confirm SOS</button>
            </div>
          </div>
        </div>
      )}

      {/* Report Crime Modal */}
      {showReportModal && (
        <div className="modal-overlay" style={{ display: 'flex' }} onClick={(e) => {
          if (e.target === e.currentTarget) setShowReportModal(false);
        }}>
          <form className="modal-content" onSubmit={handleSubmitReport}>
            <h3>Report a Crime</h3>
            <div className="input-group">
              <label htmlFor="crimeType">Type of Crime</label>
              <select
                id="crimeType"
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                style={{ width: '100%', padding: '16px 20px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(15, 23, 42, 0.5)', color: 'white' }}
              >
                <option>Theft</option>
                <option>Assault</option>
                <option>Vandalism</option>
                <option>Robbery</option>
                <option>Suspicious Activity</option>
                <option>Other</option>
              </select>
            </div>
            <div className="input-group">
              <label htmlFor="crimeLocation">Where did it happen?</label>
              <input
                id="crimeLocation"
                type="text"
                value={reportLocation}
                onChange={(e) => setReportLocation(e.target.value)}
                placeholder="Street, landmark, or neighborhood"
                required
              />
            </div>
            <div className="input-group">
              <label htmlFor="crimeTime">When did you see it?</label>
              <input
                id="crimeTime"
                type="text"
                value={reportTime}
                onChange={(e) => setReportTime(e.target.value)}
                placeholder="e.g. 10:30 PM, today"
                required
              />
            </div>
            <div className="input-group">
              <label htmlFor="crimeDetails">Any other useful information</label>
              <textarea
                id="crimeDetails"
                value={reportDetails}
                onChange={(e) => setReportDetails(e.target.value)}
                placeholder="Describe suspects, vehicles, or what happened"
                rows={4}
                style={{ width: '100%', padding: '16px 20px', background: 'rgba(15, 23, 42, 0.5)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', color: 'white', resize: 'vertical' }}
              />
            </div>
            <div className="modal-actions">
              <button className="modal-btn cancel-sos" type="button" onClick={() => setShowReportModal(false)}>Cancel</button>
              <button className="modal-btn confirm-sos" type="submit">Submit Report</button>
            </div>
          </form>
        </div>
      )}

      {/* Admin Auth Modal (Simulator Access) */}
      {showAdminAuth && (
        <div className="modal-overlay" style={{ display: 'flex', zIndex: 2000 }}>
          <div className="modal-content" style={{ maxWidth: '400px' }}>
            <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ color: '#fb923c' }}>🔒</span> Admin Access Required
            </h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-gray)', marginBottom: '1.5rem' }}>
              Please enter your administrator bypass credentials to enable simulation tools on the public portal.
            </p>
            <form onSubmit={(e) => {
              e.preventDefault();
              if (adminId.toLowerCase() === 'police_admin' && adminPass === 'ADMIN777') {
                setIsAdminMode(true);
                setShowAdminAuth(false);
                setAdminError('');
                setAdminPass('');
              } else {
                setAdminError('Invalid Admin ID or Password');
              }
            }}>
              <div className="input-group" style={{ marginBottom: '1rem' }}>
                <label>Admin ID</label>
                <input
                  type="text"
                  value={adminId}
                  onChange={(e) => setAdminId(e.target.value)}
                  placeholder="Enter Admin ID"
                  required
                  style={{ width: '100%', padding: '12px', background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white' }}
                />
              </div>
              <div className="input-group" style={{ marginBottom: '1.5rem' }}>
                <label>Bypass Password</label>
                <input
                  type="password"
                  value={adminPass}
                  onChange={(e) => setAdminPass(e.target.value)}
                  placeholder="Enter Password"
                  required
                  style={{ width: '100%', padding: '12px', background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white' }}
                />
              </div>
              {adminError && (
                <div style={{ color: '#ef4444', fontSize: '0.85rem', marginBottom: '1rem' }}>
                  {adminError}
                </div>
              )}
              <div className="modal-actions" style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="button"
                  className="modal-btn cancel-sos"
                  onClick={() => {
                    setShowAdminAuth(false);
                    setAdminError('');
                    setAdminPass('');
                  }}
                  style={{ flex: 1, padding: '12px', borderRadius: '8px', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="modal-btn confirm-sos"
                  style={{ flex: 2, background: '#fb923c', color: 'white', padding: '12px', borderRadius: '8px', border: 'none', fontWeight: 700, cursor: 'pointer' }}
                >
                  Verify Access
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserLanding;
