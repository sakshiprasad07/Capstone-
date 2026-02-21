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
