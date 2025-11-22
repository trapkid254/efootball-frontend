class AdminMatchesPage {
    constructor() {
        this.currentMatches = [];
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadTournaments();
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

        // Filters
        const applyFiltersBtn = document.getElementById('applyFilters');
        if (applyFiltersBtn) {
            applyFiltersBtn.addEventListener('click', () => {
                this.loadMatches();
            });
        }

        const statusFilter = document.getElementById('statusFilter');
        if (statusFilter) {
            statusFilter.addEventListener('change', () => {
                this.loadMatches();
            });
        }

        const tournamentFilter = document.getElementById('tournamentFilter');
        if (tournamentFilter) {
            tournamentFilter.addEventListener('change', () => {
                this.loadMatches();
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

            // Get filter values
            const statusFilter = document.getElementById('statusFilter');
            const tournamentFilter = document.getElementById('tournamentFilter');

            const params = new URLSearchParams();
            if (statusFilter && statusFilter.value !== 'all') {
                params.append('status', statusFilter.value);
            }
            if (tournamentFilter && tournamentFilter.value !== 'all') {
                params.append('tournament', tournamentFilter.value);
            }

            const response = await fetch(`${apiBase}/api/matches/admin/all?${params.toString()}`, {
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

            // Store matches for modal access
            this.currentMatches = matches;

            console.log(`Loaded ${matches.length} matches for admin`);

            if (matches.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-gamepad"></i>
                        <h3>No Matches Found</h3>
                        <p>No matches match your current filters. Try adjusting the filters or check back later.</p>
                        <button class="btn btn-primary" onclick="window.adminMatchesPage.loadMatches()">
                            <i class="fas fa-sync"></i> Refresh
                        </button>
                    </div>`;
                return;
            }

            // Add filters section
            container.innerHTML = `
                <div class="filters-section">
                    <div class="filters">
                        <div class="filter-group">
                            <label for="statusFilter">Status:</label>
                            <select id="statusFilter">
                                <option value="all">All Matches</option>
                                <option value="scheduled">Scheduled</option>
                                <option value="in_progress">In Progress</option>
                                <option value="completed">Completed</option>
                                <option value="disputed">Disputed</option>
                                <option value="cancelled">Cancelled</option>
                            </select>
                        </div>
                        <div class="filter-group">
                            <label for="tournamentFilter">Tournament:</label>
                            <select id="tournamentFilter">
                                <option value="all">All Tournaments</option>
                            </select>
                        </div>
                        <button class="btn btn-primary" id="applyFilters">Apply Filters</button>
                    </div>
                </div>
                <div class="section-header">
                    <h2>All Matches (${data.pagination ? data.pagination.total : matches.length})</h2>
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
                                <button class="btn btn-sm btn-warning update-scores" onclick="window.adminMatchesPage.showUpdateScoresModal('${match._id}')">
                                    <i class="fas fa-edit"></i> Update Scores
                                </button>
                                <button class="btn btn-sm btn-primary verify-match" onclick="window.adminMatchesPage.verifyMatch('${match._id}')" ${(!match.player1?.score && !match.player2?.score) ? 'disabled' : ''}>
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

    async loadTournaments() {
        try {
            const apiBase = window.API_BASE_URL || 'https://efootball-backend-f8ws.onrender.com';
            const token = localStorage.getItem('token');

            const response = await fetch(`${apiBase}/api/tournaments?limit=1000`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                console.warn('Failed to load tournaments for filter');
                return;
            }

            const data = await response.json();
            const tournaments = data.tournaments || [];

            const tournamentFilter = document.getElementById('tournamentFilter');
            if (tournamentFilter) {
                // Clear existing options except "All Tournaments"
                tournamentFilter.innerHTML = '<option value="all">All Tournaments</option>';

                // Add tournament options
                tournaments.forEach(tournament => {
                    const option = document.createElement('option');
                    option.value = tournament._id;
                    option.textContent = tournament.name;
                    tournamentFilter.appendChild(option);
                });
            }

        } catch (error) {
            console.error('Error loading tournaments:', error);
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

    showUpdateScoresModal(matchId) {
        // Find the match data
        const match = this.currentMatches?.find(m => m._id === matchId);
        if (!match) {
            this.showNotification('Match not found', 'error');
            return;
        }

        // Create modal HTML
        const modalHtml = `
            <div id="updateScoresModal" class="modal">
                <div class="modal-content">
                    <span class="close" onclick="this.closest('.modal').style.display='none'">&times;</span>
                    <h2>Update Match Scores</h2>
                    <div class="match-info">
                        <h3>${match.tournament?.name || 'Tournament'}</h3>
                        <div class="players-info">
                            <div class="player">
                                <strong>${match.player1?.user?.efootballId || 'Player 1'}</strong>
                                <input type="number" id="player1Score" min="0" max="20" value="${match.player1?.score ?? ''}" placeholder="Score">
                            </div>
                            <div class="vs">VS</div>
                            <div class="player">
                                <strong>${match.player2?.user?.efootballId || 'Player 2'}</strong>
                                <input type="number" id="player2Score" min="0" max="20" value="${match.player2?.score ?? ''}" placeholder="Score">
                            </div>
                        </div>
                    </div>
                    <div class="form-actions">
                        <button class="btn btn-secondary" onclick="this.closest('.modal').style.display='none'">Cancel</button>
                        <button class="btn btn-primary" onclick="window.adminMatchesPage.updateMatchScores('${matchId}')">Update & Verify</button>
                    </div>
                </div>
            </div>
        `;

        // Remove existing modal if present
        const existingModal = document.getElementById('updateScoresModal');
        if (existingModal) {
            existingModal.remove();
        }

        // Add modal to body
        document.body.insertAdjacentHTML('beforeend', modalHtml);

        // Show modal
        const modal = document.getElementById('updateScoresModal');
        modal.style.display = 'flex';
        modal.style.justifyContent = 'center';
        modal.style.alignItems = 'center';

        // Add modal styles if not already present
        if (!document.getElementById('update-scores-styles')) {
            const styles = document.createElement('style');
            styles.id = 'update-scores-styles';
            styles.textContent = `
                .players-info {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin: 2rem 0;
                    padding: 1rem;
                    background: var(--bg-primary);
                    border-radius: 8px;
                }
                .players-info .player {
                    text-align: center;
                    flex: 1;
                }
                .players-info .player input {
                    margin-top: 0.5rem;
                    padding: 0.5rem;
                    border: 1px solid var(--border-color);
                    border-radius: 4px;
                    background: var(--bg-secondary);
                    color: var(--text-primary);
                    width: 80px;
                    text-align: center;
                }
                .players-info .vs {
                    font-weight: bold;
                    color: var(--accent-color);
                    margin: 0 1rem;
                }
            `;
            document.head.appendChild(styles);
        }
    }

    async updateMatchScores(matchId) {
        const player1Score = parseInt(document.getElementById('player1Score').value);
        const player2Score = parseInt(document.getElementById('player2Score').value);

        if (isNaN(player1Score) || isNaN(player2Score)) {
            this.showNotification('Please enter valid scores for both players', 'error');
            return;
        }

        if (player1Score < 0 || player2Score < 0) {
            this.showNotification('Scores cannot be negative', 'error');
            return;
        }

        try {
            const apiBase = window.API_BASE_URL || 'https://efootball-backend-f8ws.onrender.com';
            const token = localStorage.getItem('token');

            const response = await fetch(`${apiBase}/api/matches/${matchId}/admin-update`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    player1Score: player1Score,
                    player2Score: player2Score
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `Failed to update scores (${response.status})`);
            }

            // Close modal
            const modal = document.getElementById('updateScoresModal');
            if (modal) {
                modal.style.display = 'none';
            }

            this.showNotification('Match scores updated and verified successfully!', 'success');
            // Reload matches list
            this.loadMatches();

        } catch (error) {
            console.error('Error updating match scores:', error);
            this.showNotification(error.message || 'Failed to update match scores', 'error');
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