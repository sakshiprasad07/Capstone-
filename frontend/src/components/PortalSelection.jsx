import { Link } from 'react-router-dom';

function PortalSelection() {
  return (
    <div className="landing-container">
      <header className="landing-header">
        <h1>Crime Hotspot Portal</h1>
        <p>Welcome to the analytics dashboard. Please select your access point.</p>
      </header>

      <div className="selection-grid">
        <Link to="/police-login" className="selection-card police">
          <div className="icon-box">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <h2>Police Personnel</h2>
          <p>Secure login for law enforcement officers and administrators.</p>
          <span className="action-text">Access Portal &rarr;</span>
        </Link>

        <Link to="/user-login" className="selection-card public">
          <div className="icon-box">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <h2>Public User</h2>
          <p>Login to view hotspots, reports, and community insights.</p>
          <span className="action-text">Citizen Portal &rarr;</span>
        </Link>
      </div>
    </div>
  );
}

export default PortalSelection;
