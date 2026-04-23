import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
const API_URL = import.meta.env.VITE_API_URL;

function Login({ role }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState({ text: '', type: '' });
  const navigate = useNavigate();

  const isPolice = role === 'police';
  const title = isPolice ? 'Police Personnel Logon' : 'Citizen Login';
  const subtitle = isPolice ? 'Access secure law enforcement dashboard' : 'Access your personal dashboard';

  const showMessage = (msg, type) => {
    setMessage({ text: msg, type });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const endpoint = isPolice ? '/police/login' : '/user/login';
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('username', data.username);
        localStorage.setItem('role', data.role);

        showMessage(`Login successful! Welcome ${data.username}`, 'success');

        setTimeout(() => {
          if (data.role === 'police') {
            navigate('/police-dashboard');
          } else {
            navigate('/user-landing');
          }
        }, 1500);
      } else {
        showMessage(data.message || 'Invalid credentials', 'error');
      }
    } catch (error) {
      showMessage('Connection error to server', 'error');
    }
  };

  const handleGoogleResponse = async (response) => {
    try {
      const res = await fetch(`${API_URL}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: response.credential })
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('username', data.username);
        localStorage.setItem('role', data.role);
        if (data.picture) localStorage.setItem('profilePic', data.picture);

        showMessage(`Google Login successful! Welcome ${data.username}`, 'success');
        setTimeout(() => {
          if (data.role === 'police') {
            navigate('/police-dashboard');
          } else {
            navigate('/user-landing');
          }
        }, 1500);
      } else {
        showMessage(data.message || 'Google authentication failed', 'error');
      }
    } catch (error) {
      showMessage('Connection error during Google login', 'error');
    }
  };

  useEffect(() => {
    let checkInterval;
    const initGoogleAuth = () => {
      if (window.google && document.getElementById('googleBtn')) {
        if (checkInterval) clearInterval(checkInterval);
        window.google.accounts.id.initialize({
          client_id: "772786124174-83go9s21icd8m5lrqeu28brgfhaiupa1.apps.googleusercontent.com",
          callback: handleGoogleResponse
        });
        window.google.accounts.id.renderButton(
          document.getElementById('googleBtn'),
          { theme: "outline", size: "large", width: "100%", text: "signin_with" }
        );
      }
    };

    if (window.google) {
      initGoogleAuth();
    } else {
      checkInterval = setInterval(initGoogleAuth, 100);
    }

    return () => {
      if (checkInterval) clearInterval(checkInterval);
    };
  }, []);

  return (
    <div className="container">
      <div className="back-link">
        <Link to="/">&larr; Back to Selection</Link>
      </div>

      <div className="form-box">
        <h1>{title}</h1>
        <p>{subtitle}</p>

        <form onSubmit={handleLogin} id={isPolice ? 'policeLoginForm' : 'userLoginForm'}>
          <div className="input-group">
            <label htmlFor="username">{isPolice ? 'Badge ID or Email' : 'Username or Email'}</label>
            <input 
              type="text" 
              id="username" 
              required 
              placeholder={isPolice ? 'Enter Badge ID' : 'Enter username'} 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div className="input-group">
            <label htmlFor="password">Password</label>
            <input 
              type="password" 
              id="password" 
              required 
              placeholder="Enter password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button type="submit" className="btn">Sign In</button>
        </form>

        {!isPolice && (
          <>
            <div className="divider">OR</div>
            <div className="google-btn-container" id="googleBtn"></div>
            <div className="switch-form">
              Don't have an account? <Link to="/signup">Register here</Link>
            </div>
          </>
        )}

        {message.text && (
          <div className={`message ${message.type}`} style={{ display: 'block' }}>
            {message.text}
          </div>
        )}
      </div>
    </div>
  );
}

export default Login;
