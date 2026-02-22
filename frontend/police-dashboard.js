document.addEventListener('DOMContentLoaded', () => {
    // Check if user is logged in as police
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    const username = localStorage.getItem('username');

    if (!token || role !== 'police') {
        window.location.href = 'index.html';
    }

    if (username) {
        document.getElementById('badgeInfo').textContent = `Officer ID: ${username}`;
    }

    // Tab Switching Logic
    const sosTab = document.getElementById('sosTab');
    const reportsTab = document.getElementById('reportsTab');
    const sosContainer = document.getElementById('sosContainer');
    const reportsContainer = document.getElementById('reportsContainer');

    sosTab.addEventListener('click', () => {
        sosTab.classList.add('active');
        reportsTab.classList.remove('active');
        sosContainer.style.display = 'block';
        reportsContainer.style.display = 'none';
    });

    reportsTab.addEventListener('click', () => {
        reportsTab.classList.add('active');
        sosTab.classList.remove('active');
        reportsContainer.style.display = 'block';
        sosContainer.style.display = 'none';
    });

    // Alert Action Logic (Acknowledge / Resolve)
    document.getElementById('alertFeed').addEventListener('click', (e) => {
        const btn = e.target;
        if (!btn.classList.contains('action-btn')) return;

        const card = btn.closest('.alert-card');
        const badge = card.querySelector('.status-badge');

        if (btn.classList.contains('acknowledge')) {
            badge.textContent = 'ACKNOWLEDGED';
            badge.className = 'status-badge status-acknowledged';
            btn.remove(); // Remove acknowledge button after use
        } else if (btn.classList.contains('resolve')) {
            badge.textContent = 'RESOLVED';
            badge.className = 'status-badge status-resolved';
            card.style.opacity = '0.6';
            card.querySelector('.alert-actions').innerHTML = '<span style="font-size: 0.8rem; color: var(--success);">Case Closed</span>';
        }
    });

    // Logout Logic
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('token');
            localStorage.removeItem('username');
            localStorage.removeItem('role');
            window.location.href = 'index.html';
        });
    }
});
