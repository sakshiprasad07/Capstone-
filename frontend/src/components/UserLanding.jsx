import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const API_URL = 'http://localhost:5000';

function UserLanding() {
  const [showSosModal, setShowSosModal] = useState(false);
  const [sosStatus, setSosStatus] = useState('sos'); // 'sos', 'sent'
  const [feedback, setFeedback] = useState('');
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
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          sendSos(position.coords.latitude, position.coords.longitude);
        },
        () => {
          sendSos();
        }
      );
    } else {
      sendSos();
    }
  };

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

      <main className="map-placeholder" id="map">
        <div className="map-overlay-text">
          <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"
            style={{ display: 'block', margin: '0 auto 20px', opacity: 0.3 }}>
            <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon>
            <line x1="8" y1="2" x2="8" y2="18"></line>
            <line x1="16" y1="6" x2="16" y2="22"></line>
          </svg>
          Interactive Map Loading...
        </div>
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

      {feedback && <div className="feedback-message">{feedback}</div>}

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
