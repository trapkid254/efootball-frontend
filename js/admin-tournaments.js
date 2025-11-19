class AdminTournamentsPage {
    constructor() {
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadTournaments();
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

        // Create tournament button
        const createBtn = document.getElementById('createTournamentBtn');
        if (createBtn) {
            createBtn.addEventListener('click', () => {
                this.showCreateTournamentModal();
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

    async loadTournaments() {
        const container = document.getElementById('tournamentsContainer');
        if (!container) {
            console.error('Tournaments container not found');
            return;
        }

        // Show loading state
        container.innerHTML = `
            <div class="loading">
                <i class="fas fa-spinner fa-spin"></i>
                <span>Loading tournaments...</span>
            </div>`;

        try {
            const apiBase = window.API_BASE_URL || 'https://efootball-backend-f8ws.onrender.com';
            const response = await fetch(`${apiBase}/api/admin/tournaments?limit=50`, {
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            const tournaments = Array.isArray(data) ? data : (data.tournaments || []);

            console.log(`Loaded ${tournaments.length} tournaments for admin`);

            if (tournaments.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-trophy"></i>
                        <h3>No Tournaments Found</h3>
                        <p>You haven't created any tournaments yet. Get started by creating your first tournament!</p>
                        <button class="btn btn-primary" onclick="window.adminTournamentsPage.showCreateTournamentModal()">
                            <i class="fas fa-plus"></i> Create Tournament
                        </button>
                    </div>`;
                return;
            }

            container.innerHTML = `
                <div class="section-header">
                    <h2>Tournaments Management</h2>
                    <button class="btn btn-primary" onclick="window.adminTournamentsPage.showCreateTournamentModal()">
                        <i class="fas fa-plus"></i> New Tournament
                    </button>
                </div>
                <div class="tournaments-grid">
                    ${tournaments.map(tournament => `
                        <div class="tournament-card card">
                            <div class="card-header">
                                <h3>${tournament.name || 'Unnamed Tournament'}</h3>
                                <span class="badge badge-${tournament.status || 'secondary'}">
                                    ${(tournament.status || 'draft').charAt(0).toUpperCase() + (tournament.status || 'draft').slice(1)}
                                </span>
                            </div>
                            <div class="card-body">
                                <div class="tournament-info">
                                    <p><i class="fas fa-chess-king"></i> <span>Format:</span> ${tournament.format || 'N/A'}</p>
                                    <p><i class="fas fa-users"></i> <span>Participants:</span> ${tournament.participants?.length || 0}/${tournament.capacity || tournament.settings?.capacity || 0}</p>
                                    <p><i class="fas fa-trophy"></i> <span>Prize Pool:</span> KSh ${(tournament.prizePool || tournament.settings?.prizePool || 0).toLocaleString()}</p>
                                    <p><i class="fas fa-ticket-alt"></i> <span>Entry Fee:</span> KSh ${(tournament.entryFee || tournament.settings?.entryFee || 0).toLocaleString()}</p>
                                    ${(tournament.schedule?.tournamentStart || tournament.startDate) ?
                                        `<p><i class="far fa-calendar-alt"></i> <span>Starts:</span> ${new Date(tournament.schedule?.tournamentStart || tournament.startDate).toLocaleDateString()} at ${new Date(tournament.schedule?.tournamentStart || tournament.startDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>`
                                        : ''}
                                </div>
                            </div>
                            <div class="card-footer">
                                <button class="btn btn-sm btn-outline-secondary" onclick="window.adminTournamentsPage.manageTournament('${tournament._id}')">
                                    <i class="fas fa-cogs"></i> Manage
                                </button>
                                <button class="btn btn-sm btn-outline-primary" onclick="window.adminTournamentsPage.editTournament('${tournament._id}')">
                                    <i class="fas fa-edit"></i> Edit
                                </button>
                                <button class="btn btn-sm btn-outline-danger"
                                        onclick="if(confirm('Are you sure you want to delete this tournament? This action cannot be undone.')) { window.adminTournamentsPage.deleteTournament('${tournament._id}') }">
                                    <i class="fas fa-trash"></i> Delete
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>
                <style>
                    .tournaments-grid {
                        display: grid;
                        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                        gap: 1.5rem;
                        margin-top: 1.5rem;
                    }
                    .tournament-card {
                        display: flex;
                        flex-direction: column;
                        height: 100%;
                        transition: transform 0.2s, box-shadow 0.2s;
                    }
                    .tournament-card:hover {
                        transform: translateY(-5px);
                        box-shadow: 0 4px 15px rgba(0,0,0,0.1);
                    }
                    .card-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: flex-start;
                        padding: 1.25rem 1.25rem 0.75rem;
                    }
                    .card-header h3 {
                        margin: 0;
                        font-size: 1.25rem;
                        font-weight: 600;
                        color: var(--text-primary);
                    }
                    .card-body {
                        padding: 0 1.25rem 1.25rem;
                        flex-grow: 1;
                    }
                    .tournament-info p {
                        margin: 0.5rem 0;
                        display: flex;
                        align-items: center;
                        gap: 0.5rem;
                    }
                    .tournament-info i {
                        width: 1.25rem;
                        text-align: center;
                        color: var(--primary-color);
                    }
                    .tournament-info span {
                        font-weight: 500;
                        color: var(--text-secondary);
                        min-width: 90px;
                        display: inline-block;
                    }
                    .card-footer {
                        display: flex;
                        gap: 0.5rem;
                        padding: 0.75rem 1.25rem;
                        background-color: var(--bg-secondary);
                        border-top: 1px solid var(--border-color);
                        border-bottom-left-radius: 0.5rem;
                        border-bottom-right-radius: 0.5rem;
                    }
                    .badge {
                        padding: 0.25rem 0.6rem;
                        border-radius: 20px;
                        font-size: 0.75rem;
                        font-weight: 600;
                        text-transform: capitalize;
                    }
                    .badge-draft { background-color: #6c757d; color: white; }
                    .badge-upcoming { background-color: #17a2b8; color: white; }
                    .badge-active { background-color: #28a745; color: white; }
                    .badge-completed { background-color: #6f42c1; color: white; }
                    .badge-cancelled { background-color: #dc3545; color: white; }
                </style>`;

        } catch (error) {
            console.error('Error loading tournaments:', error);
            container.innerHTML = `
                <div class="error-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Failed to Load Tournaments</h3>
                    <p>${error.message || 'An error occurred while loading tournaments.'}</p>
                    <div class="d-flex gap-2 mt-3">
                        <button class="btn btn-outline-secondary" onclick="window.adminTournamentsPage.loadTournaments()">
                            <i class="fas fa-sync"></i> Try Again
                        </button>
                        <button class="btn btn-primary" onclick="window.adminTournamentsPage.showCreateTournamentModal()">
                            <i class="fas fa-plus"></i> Create New
                        </button>
                    </div>
                </div>`;
        }
    }

    showCreateTournamentModal() {
        // For now, redirect to admin.html for creating tournaments
        // This can be enhanced later with a modal
        window.location.href = 'admin.html';
    }

    manageTournament(tournamentId) {
        // Redirect to a manage page or show modal
        // For now, we'll redirect to a manage URL
        window.location.href = `admin-manage-tournament.html?id=${tournamentId}`;
    }

    editTournament(tournamentId) {
        // Redirect to edit page
        window.location.href = `admin-edit-tournament.html?id=${tournamentId}`;
    }

    async deleteTournament(tournamentId) {
        if (!confirm('Are you sure you want to delete this tournament? This action cannot be undone.')) {
            return;
        }

        try {
            const apiBase = window.API_BASE_URL || 'https://efootball-backend-f8ws.onrender.com';
            const token = localStorage.getItem('token');

            const response = await fetch(`${apiBase}/api/tournaments/${tournamentId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `Failed to delete tournament (${response.status})`);
            }

            this.showNotification('Tournament deleted successfully!', 'success');
            // Reload tournaments list
            this.loadTournaments();

        } catch (error) {
            console.error('Error deleting tournament:', error);
            this.showNotification(error.message || 'Failed to delete tournament', 'error');
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
    window.adminTournamentsPage = new AdminTournamentsPage();
});