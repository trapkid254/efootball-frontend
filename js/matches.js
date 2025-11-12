class MatchesPage {
    constructor() {
        this.currentUser = null;
        this.matches = [];
        this.filters = {
            status: 'all'
        };
        this.init();
    }

    init() {
        this.checkAuth();
        this.setupEventListeners();
        this.loadMatches();
    }

    checkAuth() {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');
        
        if (!token || !userData) {
            window.location.href = 'index.html';
            return;
        }

        try {
            this.currentUser = JSON.parse(userData);
            this.updateUserInfo();
        } catch (error) {
            console.error('Error parsing user data:', error);
            this.logout();
        }
    }

    setupEventListeners() {
        // Theme toggle
        document.getElementById('themeToggle')?.addEventListener('click', () => {
            this.toggleTheme();
        });

        // Logout button
        document.getElementById('logoutBtn')?.addEventListener('click', () => {
            this.logout();
        });

        // Status filter
        document.getElementById('statusFilter')?.addEventListener('change', (e) => {
            this.filters.status = e.target.value;
            this.loadMatches();
        });
    }

    toggleTheme() {
        const isDarkTheme = document.body.classList.contains('dark-theme');
        document.body.classList.toggle('light-theme', !isDarkTheme);
        document.body.classList.toggle('dark-theme', isDarkTheme);
        
        const icon = document.querySelector('#themeToggle i');
        if (icon) {
            icon.className = isDarkTheme ? 'fas fa-sun' : 'fas fa-moon';
        }
        
        localStorage.setItem('theme', isDarkTheme ? 'light' : 'dark');
    }

    updateUserInfo() {
        const userNameElement = document.getElementById('userName');
        const userAvatarElement = document.getElementById('userAvatar');
        
        if (userNameElement) {
            userNameElement.textContent = this.currentUser.efootballId || 'Player';
        }
        
        if (userAvatarElement) {
            userAvatarElement.textContent = this.currentUser.efootballId ? this.currentUser.efootballId.charAt(0).toUpperCase() : 'U';
        }
    }

    async loadMatches() {
        try {
            this.showLoading(true);
            
            // First, check if the user is registered for any tournaments
            const tournamentsResponse = await this.fetchWithAuth('/api/user/my-tournaments');
            
            if (!tournamentsResponse.success || tournamentsResponse.tournaments.length === 0) {
                this.showNoTournamentsMessage();
                return;
            }
            
            // If user is registered in tournaments, fetch their matches
            const matchesResponse = await this.fetchWithAuth('/api/user/upcoming-matches');
            
            if (!matchesResponse.success) {
                throw new Error(matchesResponse.message || 'Failed to load matches');
            }
            
            this.matches = matchesResponse.matches || [];
            this.renderMatches();
            
        } catch (error) {
            console.error('Error loading matches:', error);
            this.showError('Failed to load matches. Please try again later.');
        } finally {
            this.showLoading(false);
        }
    }
    
    async fetchWithAuth(endpoint) {
        const token = localStorage.getItem('token');
        const apiBase = window.API_BASE_URL || 'http://localhost:5000';
        
        const response = await fetch(`${apiBase}${endpoint}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.message || 'Request failed');
        }
        
        return await response.json();
    }
    
    renderMatches() {
        const container = document.getElementById('matchesContainer');
        if (!container) return;
        
        if (this.matches.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-futbol"></i>
                    <h3>No Matches Scheduled</h3>
                    <p>You don't have any upcoming matches at the moment. Your matches will appear here once they are scheduled.</p>
                </div>
            `;
            return;
        }
        
        // Filter matches based on status
        const filteredMatches = this.matches.filter(match => {
            if (this.filters.status === 'all') return true;
            return match.status === this.filters.status;
        });
        
        if (filteredMatches.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-filter"></i>
                    <h3>No Matches Found</h3>
                    <p>No matches match your current filter criteria.</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = `
            <div class="matches-list">
                ${filteredMatches.map(match => this.renderMatchCard(match)).join('')}
            </div>
        `;
    }
    
    renderMatchCard(match) {
        // Format the match date
        const matchDate = new Date(match.schedule);
        const options = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        const formattedDate = matchDate.toLocaleDateString('en-US', options);
        
        return `
            <div class="match-card" data-match-id="${match._id}">
                <div class="match-header">
                    <span class="tournament-name">${match.tournament?.name || 'Tournament'}</span>
                    <span class="match-status ${match.status}">${this.formatStatus(match.status)}</span>
                </div>
                <div class="match-teams">
                    <div class="team">
                        <span class="team-name">${match.player1?.efootballId || 'TBD'}</span>
                        <span class="score">${match.player1?.score ?? '-'}</span>
                    </div>
                    <div class="vs">VS</div>
                    <div class="team">
                        <span class="team-name">${match.player2?.efootballId || 'TBD'}</span>
                        <span class="score">${match.player2?.score ?? '-'}</span>
                    </div>
                </div>
                <div class="match-footer">
                    <span class="match-time"><i class="far fa-clock"></i> ${formattedDate}</span>
                    <button class="btn btn-primary btn-sm" ${match.status !== 'scheduled' ? 'disabled' : ''}>
                        ${this.getActionButtonText(match.status)}
                    </button>
                </div>
            </div>
        `;
    }
    
    formatStatus(status) {
        const statusMap = {
            'scheduled': 'Upcoming',
            'in_progress': 'In Progress',
            'completed': 'Completed',
            'cancelled': 'Cancelled'
        };
        return statusMap[status] || status;
    }
    
    getActionButtonText(status) {
        const buttonText = {
            'scheduled': 'Submit Result',
            'in_progress': 'Match in Progress',
            'completed': 'View Details',
            'cancelled': 'Match Cancelled'
        };
        return buttonText[status] || 'View';
    }
    
    showNoTournamentsMessage() {
        const container = document.getElementById('matchesContainer') || document.body;
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-trophy"></i>
                <h3>No Tournaments Joined</h3>
                <p>You haven't registered for any tournaments yet. Join a tournament to start playing matches!</p>
                <a href="tournaments.html" class="btn btn-primary">Browse Tournaments</a>
            </div>
        `;
    }
    
    showLoading(show) {
        const container = document.getElementById('matchesContainer');
        if (!container) return;
        
        if (show) {
            container.innerHTML = `
                <div class="loading-state">
                    <div class="spinner"></div>
                    <p>Loading matches...</p>
                </div>
            `;
        }
    }
    
    showError(message) {
        const container = document.getElementById('matchesContainer');
        if (!container) return;
        
        container.innerHTML = `
            <div class="error-state">
                <i class="fas fa-exclamation-circle"></i>
                <h3>Something Went Wrong</h3>
                <p>${message}</p>
                <button class="btn btn-secondary" onclick="window.location.reload()">Try Again</button>
            </div>
        `;
    }
    
    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = 'index.html';
    }
}

// Initialize the matches page when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    window.matchesPage = new MatchesPage();
});
