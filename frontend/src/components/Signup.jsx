import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const API_URL = 'http://localhost:5000';

function Signup() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState({ text: '', type: '' });
  const navigate = useNavigate();

  const showMessage = (msg, type) => {
    setMessage({ text: msg, type });
  };

  const handleSignup = async (e) => {
    e.preventDefault();

    // Input validation
    if (!username || username.trim().length < 3) {
      showMessage('Username must be at least 3 characters long', 'error');
      return;
    }

    if (!password || password.length < 6) {
      showMessage('Password must be at least 6 characters long', 'error');
      return;
    }

    if (password !== confirmPassword) {
      showMessage('Passwords do not match', 'error');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password })
      });

      const data = await response.json();

      if (response.ok) {
        showMessage('Account created! Redirecting to login...', 'success');
        setTimeout(() => navigate('/user-login'), 2000);
      } else {
        showMessage(data.message || 'Signup failed', 'error');
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
      if (window.google && document.getElementById('googleBtnSignup')) {
        if (checkInterval) clearInterval(checkInterval);
        window.google.accounts.id.initialize({
          client_id: "772786124174-83go9s21icd8m5lrqeu28brgfhaiupa1.apps.googleusercontent.com",
          callback: handleGoogleResponse
        });
        window.google.accounts.id.renderButton(
          document.getElementById('googleBtnSignup'),
          { theme: "outline", size: "large", width: "100%", text: "signup_with" }
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
        <Link to="/user-login">&larr; Back to Login</Link>
      </div>

      <div className="form-box">
        <h1>Create Account</h1>
        <p>Sign up to access community features</p>

        <form onSubmit={handleSignup}>
          <div className="input-group">
            <label htmlFor="username">Username</label>
            <input 
              type="text" 
              id="username" 
              required 
              placeholder="Choose a username" 
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
              placeholder="Create password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="input-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input 
              type="password" 
              id="confirmPassword" 
              required 
              placeholder="Confirm password" 
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
          <button type="submit" className="btn">Sign Up</button>
        </form>

        <div className="divider">OR</div>
        <div className="google-btn-container" id="googleBtnSignup"></div>

        <div className="switch-form">
          Already have an account? <Link to="/user-login">Login here</Link>
        </div>

        {message.text && (
          <div className={`message ${message.type}`} style={{ display: 'block' }}>
            {message.text}
          </div>
        )}
      </div>
    </div>
  );
}

export default Signup;
