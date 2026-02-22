document.addEventListener('DOMContentLoaded', () => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'index.html';
    }

    const sosBtn = document.getElementById('sosBtn');
    const sosModal = document.getElementById('sosModal');
    const cancelSos = document.getElementById('cancelSos');
    const confirmSos = document.getElementById('confirmSos');
    const logoutBtn = document.getElementById('logoutBtn');

    // Show SOS Confirmation Modal
    sosBtn.addEventListener('click', () => {
        sosModal.style.display = 'flex';
    });

    // Hide Modal on Cancel
    cancelSos.addEventListener('click', () => {
        sosModal.style.display = 'none';
    });

    // Handle SOS Confirmation
    confirmSos.addEventListener('click', () => {
        // In a real app, this would get geolocation and send a request to the backend
        alert('EMERGENCY SOS SENT! Your location has been shared with authorities.');
        sosModal.style.display = 'none';

        // Mocking the feedback of a sent request
        sosBtn.style.background = '#059669'; // Change to green success color
        sosBtn.textContent = 'SENT';
        sosBtn.style.animation = 'none';

        setTimeout(() => {
            sosBtn.style.background = '#ff4757';
            sosBtn.textContent = 'SOS';
            sosBtn.style.animation = 'pulse 2s infinite';
        }, 5000);
    });

    // Handle Logout
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('token');
            localStorage.removeItem('username');
            localStorage.removeItem('role');
            window.location.href = 'index.html';
        });
    }

    // Close modal if user clicks outside the content
    window.addEventListener('click', (event) => {
        if (event.target === sosModal) {
            sosModal.style.display = 'none';
        }
    });
});
