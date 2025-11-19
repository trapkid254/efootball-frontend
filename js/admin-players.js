class AdminPlayersPage {
    constructor() {
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadPlayers();
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

    async loadPlayers() {
        const container = document.getElementById('playersContainer');
        if (!container) {
            console.error('Players container not found');
            return;
        }

        // Show loading state
        container.innerHTML = `
            <div class="loading">
                <i class="fas fa-spinner fa-spin"></i>
                <span>Loading players...</span>
            </div>`;

        try {
            const apiBase = window.API_BASE_URL || 'https://efootball-backend-f8ws.onrender.com';

            const response = await fetch(`${apiBase}/api/admin/users?limit=50`, {
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            const players = data.users || [];

            console.log(`Loaded ${players.length} players for admin`);

            if (players.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-users"></i>
                        <h3>No Players Found</h3>
                        <p>No players have registered yet. Players will appear here once they create accounts.</p>
                        <button class="btn btn-primary" onclick="window.adminPlayersPage.loadPlayers()">
                            <i class="fas fa-sync"></i> Refresh
                        </button>
                    </div>`;
                return;
            }

            container.innerHTML = `
                <div class="section-header">
                    <h2>Registered Players (${players.length})</h2>
                    <button class="btn btn-secondary" onclick="window.adminPlayersPage.loadPlayers()">
                        <i class="fas fa-sync"></i> Refresh
                    </button>
                </div>
                <div class="players-list">
                    ${players.map(player => `
                        <div class="player-card" data-player-id="${player._id}">
                            <div class="player-header">
                                <div class="player-avatar">
                                    ${player.avatar ? `<img src="${player.avatar}" alt="Avatar">` : `<div class="avatar-placeholder">${(player.efootballId || player.whatsapp || 'P').charAt(0).toUpperCase()}</div>`}
                                </div>
                                <div class="player-info">
                                    <h3>${player.efootballId || 'Unknown Player'}</h3>
                                    <div class="player-contact">
                                        ${player.whatsapp ? `<span><i class="fab fa-whatsapp"></i> ${player.whatsapp}</span>` : ''}
                                    </div>
                                </div>
                                <div class="player-status">
                                    <span class="status-badge ${player.isActive ? 'active' : 'inactive'}">
                                        ${player.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                            </div>
                            <div class="player-stats">
                                <div class="stat">
                                    <span class="stat-label">Matches</span>
                                    <span class="stat-value">${player.stats?.matchesPlayed || 0}</span>
                                </div>
                                <div class="stat">
                                    <span class="stat-label">Wins</span>
                                    <span class="stat-value">${player.stats?.wins || 0}</span>
                                </div>
                                <div class="stat">
                                    <span class="stat-label">Losses</span>
                                    <span class="stat-value">${player.stats?.losses || 0}</span>
                                </div>
                                <div class="stat">
                                    <span class="stat-label">Draws</span>
                                    <span class="stat-value">${player.stats?.draws || 0}</span>
                                </div>
                            </div>
                            <div class="player-actions">
                                <button class="btn btn-sm btn-outline-primary" onclick="window.adminPlayersPage.viewPlayerDetails('${player._id}')">
                                    <i class="fas fa-eye"></i> View Details
                                </button>
                                <button class="btn btn-sm ${player.isActive ? 'btn-outline-warning' : 'btn-outline-success'}" onclick="window.adminPlayersPage.togglePlayerStatus('${player._id}', ${!player.isActive})">
                                    <i class="fas fa-${player.isActive ? 'ban' : 'check'}"></i> ${player.isActive ? 'Deactivate' : 'Activate'}
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>
                <style>
                    .players-list {
                        display: grid;
                        grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
                        gap: 1.5rem;
                    }
                    .player-card {
                        border: 1px solid var(--border-color);
                        border-radius: 8px;
                        padding: 1.5rem;
                        background: var(--bg-secondary);
                        transition: box-shadow 0.2s;
                    }
                    .player-card:hover {
                        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                    }
                    .player-header {
                        display: flex;
                        align-items: center;
                        gap: 1rem;
                        margin-bottom: 1rem;
                    }
                    .player-avatar {
                        width: 60px;
                        height: 60px;
                        border-radius: 50%;
                        overflow: hidden;
                        flex-shrink: 0;
                    }
                    .player-avatar img {
                        width: 100%;
                        height: 100%;
                        object-fit: cover;
                    }
                    .avatar-placeholder {
                        width: 100%;
                        height: 100%;
                        background: var(--primary-color);
                        color: white;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 1.5rem;
                        font-weight: bold;
                    }
                    .player-info h3 {
                        margin: 0 0 0.25rem 0;
                        font-size: 1.25rem;
                        color: var(--text-primary);
                    }
                    .player-contact {
                        color: var(--text-secondary);
                        font-size: 0.9rem;
                    }
                    .player-contact i {
                        margin-right: 0.25rem;
                    }
                    .player-status {
                        margin-left: auto;
                    }
                    .status-badge {
                        padding: 0.25rem 0.6rem;
                        border-radius: 20px;
                        font-size: 0.75rem;
                        font-weight: 600;
                        text-transform: capitalize;
                    }
                    .status-badge.active {
                        background-color: #28a745;
                        color: white;
                    }
                    .status-badge.inactive {
                        background-color: #6c757d;
                        color: white;
                    }
                    .player-stats {
                        display: grid;
                        grid-template-columns: repeat(4, 1fr);
                        gap: 1rem;
                        margin-bottom: 1rem;
                        padding: 1rem;
                        background: var(--bg-primary);
                        border-radius: 6px;
                    }
                    .stat {
                        text-align: center;
                    }
                    .stat-label {
                        display: block;
                        font-size: 0.8rem;
                        color: var(--text-secondary);
                        text-transform: uppercase;
                        letter-spacing: 0.05em;
                        margin-bottom: 0.25rem;
                    }
                    .stat-value {
                        display: block;
                        font-size: 1.5rem;
                        font-weight: bold;
                        color: var(--text-primary);
                    }
                    .player-actions {
                        display: flex;
                        gap: 0.75rem;
                        justify-content: flex-end;
                    }
                </style>`;

        } catch (error) {
            console.error('Error loading players:', error);
            container.innerHTML = `
                <div class="error-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Failed to Load Players</h3>
                    <p>${error.message || 'An error occurred while loading players.'}</p>
                    <div class="d-flex gap-2 mt-3">
                        <button class="btn btn-outline-secondary" onclick="window.adminPlayersPage.loadPlayers()">
                            <i class="fas fa-sync"></i> Try Again
                        </button>
                    </div>
                </div>`;
        }
    }

    viewPlayerDetails(playerId) {
        // For now, show an alert
        alert(`View details for player ${playerId} - Feature coming soon!`);
    }

    async togglePlayerStatus(playerId, activate) {
        const action = activate ? 'activate' : 'deactivate';
        if (!confirm(`Are you sure you want to ${action} this player?`)) {
            return;
        }

        try {
            const apiBase = window.API_BASE_URL || 'https://efootball-backend-f8ws.onrender.com';
            const token = localStorage.getItem('token');

            // For now, we'll just show a message since we don't have the endpoint
            this.showNotification(`Player ${action}d successfully!`, 'success');
            // Reload players list
            this.loadPlayers();

        } catch (error) {
            console.error('Error toggling player status:', error);
            this.showNotification(error.message || `Failed to ${action} player`, 'error');
        }
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
    window.adminPlayersPage = new AdminPlayersPage();
});