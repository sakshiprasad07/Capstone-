import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import CrimeMap from './CrimeMap';
import DangerBanner from './DangerBanner';

function UserLanding() {
  const [showSosModal, setShowSosModal] = useState(false);
  const [sosStatus, setSosStatus] = useState('sos'); // 'sos', 'sent'
  const [dangerInfo, setDangerInfo] = useState(null);
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

  const handleConfirmSos = () => {
    // In a real app, this would get geolocation and send a request to the backend
    alert('EMERGENCY SOS SENT! Your location has been shared with authorities.');
    setShowSosModal(false);
    setSosStatus('sent');

    setTimeout(() => {
      setSosStatus('sos');
    }, 5000);
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
          <a href="#" className="report-btn">Report a Crime</a>
          <a href="/" onClick={handleLogout} style={{ color: 'var(--text-gray)', textDecoration: 'none', alignSelf: 'center' }}>
            Logout
          </a>
        </div>
      </nav>

      {/* Danger Zone Banner */}
      <DangerBanner danger={dangerInfo} onDismiss={handleDismissDanger} />

      {/* Interactive Crime Map */}
      <main className="map-area">
        <CrimeMap onDangerZone={handleDangerZone} />
      </main>

      {/* SOS Button */}
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

      {/* SOS Confirmation Modal */}
      {showSosModal && (
        <div className="modal-overlay" style={{ display: 'flex' }} onClick={(e) => {
          if (e.target.className === 'modal-overlay') setShowSosModal(false);
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
    </div>
  );
}

export default UserLanding;
