class AdminMatchesPage {
    constructor() {
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadMatches();
    }

    setupEventListeners() {
        // Theme toggle
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                this.toggleTheme();
            });
        }

        // Logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                this.logout();
            });
        }
    }

    toggleTheme() {
        const isDarkTheme = document.body.classList.contains('dark-theme');
        document.body.classList.toggle('light-theme', !isDarkTheme);
        document.body.classList.toggle('dark-theme', isDarkTheme);

        const icon = document.querySelector('#themeToggle i');
        icon.className = isDarkTheme ? 'fas fa-sun' : 'fas fa-moon';

        localStorage.setItem('theme', isDarkTheme ? 'light' : 'dark');
    }

    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = 'index.html';
    }

    async loadMatches() {
        const container = document.getElementById('matchesContainer');
        if (!container) {
            console.error('Matches container not found');
            return;
        }

        // Show loading state
        container.innerHTML = `
            <div class="loading">
                <i class="fas fa-spinner fa-spin"></i>
                <span>Loading matches...</span>
            </div>`;

        try {
            const apiBase = window.API_BASE_URL || 'https://efootball-backend-f8ws.onrender.com';
            const token = localStorage.getItem('token');

            const response = await fetch(`${apiBase}/api/matches/admin/pending`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            const matches = data.matches || [];

            console.log(`Loaded ${matches.length} pending matches for admin`);

            if (matches.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-gamepad"></i>
                        <h3>No Pending Matches</h3>
                        <p>There are no matches pending verification at the moment. All matches have been verified or no matches have been scheduled yet.</p>
                        <button class="btn btn-primary" onclick="window.adminMatchesPage.loadMatches()">
                            <i class="fas fa-sync"></i> Refresh
                        </button>
                    </div>`;
                return;
            }

            container.innerHTML = `
                <div class="section-header">
                    <h2>Pending Matches (${matches.length})</h2>
                    <button class="btn btn-secondary" onclick="window.adminMatchesPage.loadMatches()">
                        <i class="fas fa-sync"></i> Refresh
                    </button>
                </div>
                <div class="matches-list">
                    ${matches.map(match => `
                        <div class="match-card" data-match-id="${match._id}">
                            <div class="match-header">
                                <div class="match-info">
                                    <h3>${match.tournament?.name || 'Unknown Tournament'}</h3>
                                    <span class="match-status status-${match.status}">${match.status}</span>
                                </div>
                                <div class="match-time">
                                    ${new Date(match.createdAt).toLocaleDateString()} ${new Date(match.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </div>
                            </div>
                            <div class="match-players">
                                <div class="player">
                                    <div class="player-name">${match.player1?.user?.efootballId || 'Player 1'}</div>
                                    <div class="player-score">Score: ${match.player1?.score ?? 'N/A'}</div>
                                </div>
                                <div class="vs">VS</div>
                                <div class="player">
                                    <div class="player-name">${match.player2?.user?.efootballId || 'Player 2'}</div>
                                    <div class="player-score">Score: ${match.player2?.score ?? 'N/A'}</div>
                                </div>
                            </div>
                            <div class="match-result">
                                <div class="result-info">
                                    ${match.result?.winner ? `
                                        <div class="winner">Winner: ${match.result.winner.efootballId || 'Unknown'}</div>
                                        <div class="score">${match.result.winnerScore} - ${match.result.loserScore}</div>
                                    ` : 'Result pending verification'}
                                </div>
                            </div>
                            <div class="match-actions">
                                <button class="btn btn-sm btn-primary verify-match" onclick="window.adminMatchesPage.verifyMatch('${match._id}')">
                                    <i class="fas fa-check"></i> Verify Result
                                </button>
                                <button class="btn btn-sm btn-outline-secondary view-details" onclick="window.adminMatchesPage.viewMatchDetails('${match._id}')">
                                    <i class="fas fa-eye"></i> View Details
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>
                <style>
                    .matches-list {
                        display: flex;
                        flex-direction: column;
                        gap: 1.5rem;
                    }
                    .match-card {
                        border: 1px solid var(--border-color);
                        border-radius: 8px;
                        padding: 1.5rem;
                        background: var(--bg-secondary);
                        transition: box-shadow 0.2s;
                    }
                    .match-card:hover {
                        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                    }
                    .match-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: flex-start;
                        margin-bottom: 1rem;
                    }
                    .match-info h3 {
                        margin: 0 0 0.5rem 0;
                        font-size: 1.25rem;
                        color: var(--text-primary);
                    }
                    .match-status {
                        padding: 0.25rem 0.6rem;
                        border-radius: 20px;
                        font-size: 0.75rem;
                        font-weight: 600;
                        text-transform: capitalize;
                    }
                    .status-disputed { background-color: #ffc107; color: #1f1f1f; }
                    .status-completed { background-color: #17a2b8; color: white; }
                    .match-time {
                        color: var(--text-secondary);
                        font-size: 0.9rem;
                    }
                    .match-players {
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        margin-bottom: 1rem;
                        padding: 1rem;
                        background: var(--bg-primary);
                        border-radius: 6px;
                    }
                    .player {
                        text-align: center;
                        flex: 1;
                    }
                    .player-name {
                        font-weight: 600;
                        margin-bottom: 0.5rem;
                        color: var(--text-primary);
                    }
                    .player-score {
                        font-size: 0.9rem;
                        color: var(--text-secondary);
                    }
                    .vs {
                        font-weight: bold;
                        color: var(--accent-color);
                        margin: 0 1rem;
                    }
                    .match-result {
                        margin-bottom: 1rem;
                        padding: 0.75rem;
                        background: var(--bg-primary);
                        border-radius: 6px;
                    }
                    .winner {
                        font-weight: 600;
                        color: var(--success-color);
                        margin-bottom: 0.25rem;
                    }
                    .score {
                        font-size: 1.1rem;
                        font-weight: bold;
                        color: var(--text-primary);
                    }
                    .match-actions {
                        display: flex;
                        gap: 0.75rem;
                        justify-content: flex-end;
                    }
                </style>`;

        } catch (error) {
            console.error('Error loading matches:', error);
            container.innerHTML = `
                <div class="error-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Failed to Load Matches</h3>
                    <p>${error.message || 'An error occurred while loading matches.'}</p>
                    <div class="d-flex gap-2 mt-3">
                        <button class="btn btn-outline-secondary" onclick="window.adminMatchesPage.loadMatches()">
                            <i class="fas fa-sync"></i> Try Again
                        </button>
                    </div>
                </div>`;
        }
    }

    async verifyMatch(matchId) {
        if (!confirm('Are you sure you want to verify this match result?')) {
            return;
        }

        try {
            const apiBase = window.API_BASE_URL || 'https://efootball-backend-f8ws.onrender.com';
            const token = localStorage.getItem('token');

            const response = await fetch(`${apiBase}/api/matches/${matchId}/verify`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `Failed to verify match (${response.status})`);
            }

            this.showNotification('Match result verified successfully!', 'success');
            // Reload matches list
            this.loadMatches();

        } catch (error) {
            console.error('Error verifying match:', error);
            this.showNotification(error.message || 'Failed to verify match', 'error');
        }
    }

    viewMatchDetails(matchId) {
        // For now, show an alert with match ID
        alert(`View details for match ${matchId} - Feature coming soon!`);
    }

    showNotification(message, type = 'info') {
        // Remove existing notifications
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }

        // Add styles if not already added
        if (!document.querySelector('#notification-styles')) {
            const styles = document.createElement('style');
            styles.id = 'notification-styles';
            styles.textContent = `
                .notification {
                    position: fixed;
                    top: 100px;
                    right: 20px;
                    background: #fff;
                    border-left: 4px solid;
                    border-radius: 8px;
                    padding: 1rem 1.5rem;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                    z-index: 3000;
                    animation: slideInRight 0.3s ease;
                    max-width: 400px;
                    border-left-color: #007bff;
                }
                .notification-success { border-left-color: #28a745; }
                .notification-error { border-left-color: #dc3545; }
                .notification-warning { border-left-color: #ffc107; }
                .notification-info { border-left-color: #007bff; }
                .notification-content {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    color: #333;
                }
                @keyframes slideInRight {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOutRight {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
            `;
            document.head.appendChild(styles);
        }

        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${this.getNotificationIcon(type)}"></i>
                <span>${message}</span>
            </div>
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'slideOutRight 0.3s ease';
                setTimeout(() => notification.remove(), 300);
            }
        }, 5000);
    }

    getNotificationIcon(type) {
        const icons = {
            success: 'check-circle',
            error: 'exclamation-circle',
            warning: 'exclamation-triangle',
            info: 'info-circle'
        };
        return icons[type] || 'info-circle';
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.adminMatchesPage = new AdminMatchesPage();
});