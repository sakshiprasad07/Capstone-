const API_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? `http://${window.location.hostname}:3000`
    : 'http://127.0.0.1:3000';

// Helper to show messages
function showMessage(msg, type) {
    console.log(`Message (${type}): ${msg}`);
    const messageDiv = document.getElementById('message');
    if (!messageDiv) return;
    messageDiv.textContent = msg;
    messageDiv.className = `message ${type}`;
    messageDiv.style.display = 'block';
}

// Handle Signup
const signupForm = document.getElementById('signupForm');
if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        if (password !== confirmPassword) {
            showMessage('Passwords do not match', 'error');
            return;
        }

        try {
            const response = await fetch(`${API_URL}/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (response.ok) {
                showMessage('Account created! Redirecting to login...', 'success');
                setTimeout(() => window.location.href = 'user-login.html', 2000);
            } else {
                showMessage(data.message || 'Signup failed', 'error');
            }
        } catch (error) {
            showMessage('Connection error to server', 'error');
        }
    });
}

// Handle Login (Generic for both Police and User)
const loginForms = ['userLoginForm', 'policeLoginForm'];
loginForms.forEach(formId => {
    const form = document.getElementById(formId);
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = e.target.querySelector('#username').value;
            const password = e.target.querySelector('#password').value;

            try {
                // Determine endpoint based on form ID
                const endpoint = formId === 'policeLoginForm' ? '/police/login' : '/user/login';

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

                    // Specific logic based on role if needed
                    setTimeout(() => {
                        window.location.href = 'dashboard.html';
                    }, 1500);
                } else {
                    showMessage(data.message || 'Invalid credentials', 'error');
                }
            } catch (error) {
                showMessage('Connection error to server', 'error');
            }
        });
    }
});

// Google Authentication Handling
async function handleGoogleResponse(response) {
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
                window.location.href = 'dashboard.html';
            }, 1500);
        } else {
            showMessage(data.message || 'Google authentication failed', 'error');
        }
    } catch (error) {
        showMessage('Connection error during Google login', 'error');
    }
}

// Initialize Google Identity Services
window.onload = function () {
    const googleBtn = document.getElementById('googleBtn');
    if (googleBtn && typeof google !== 'undefined') {
        google.accounts.id.initialize({
            client_id: "772786124174-83go9s21icd8m5lrqeu28brgfhaiupa1.apps.googleusercontent.com", // User must replace this
            callback: handleGoogleResponse
        });
        google.accounts.id.renderButton(
            googleBtn,
            { theme: "outline", size: "large", width: "100%", text: "signin_with" }
        );
    }
};
