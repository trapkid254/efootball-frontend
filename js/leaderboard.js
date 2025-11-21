class LeaderboardPage {
    constructor() {
        this.currentUser = null;
        this.leaderboardData = [];
        this.tournaments = [];
        this.currentTournamentId = 'global'; // Default to global leaderboard
        this.currentPage = 1;
        this.itemsPerPage = 20;
        this.filters = {
            type: 'global', // 'global', 'tournament', 'monthly', 'weekly'
            platform: 'all'
        };
        this.init();
    }

    async init() {
        this.checkAuth();
        this.setupEventListeners();
        await this.loadTournaments();
        await this.loadLeaderboard();
    }

    checkAuth() {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');
        
        if (token && userData) {
            try {
                this.currentUser = JSON.parse(userData);
                this.updateUserInfo();
            } catch (error) {
                console.error('Error parsing user data:', error);
            }
        }
        
        // Update auth button
        const authButton = document.getElementById('authButton');
        if (authButton) {
            authButton.textContent = token ? 'Logout' : 'Login';
            authButton.onclick = token ? () => this.logout() : () => window.location.href = 'index.html#login';
        }
    }

    setupEventListeners() {
        // Theme toggle
        document.getElementById('themeToggle')?.addEventListener('click', () => {
            this.toggleTheme();
        });

        // Logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.logout());
        }

        // Auth button
        const authButton = document.getElementById('authButton');
        if (authButton) {
            authButton.addEventListener('click', (e) => {
                if (this.currentUser) {
                    this.logout();
                } else {
                    window.location.href = 'index.html#login';
                }
            });
        }

        // Tournament selector
        const tournamentSelect = document.getElementById('tournamentSelect');
        if (tournamentSelect) {
            tournamentSelect.addEventListener('change', (e) => {
                this.currentTournamentId = e.target.value;
                this.loadLeaderboard();
            });
        }

        // Leaderboard type filter
        const leaderboardType = document.getElementById('leaderboardType');
        if (leaderboardType) {
            leaderboardType.addEventListener('change', (e) => {
                this.filters.type = e.target.value;
                this.loadLeaderboard();
            });
        }

        // Platform filter
        const platformFilter = document.getElementById('platformFilter');
        if (platformFilter) {
            platformFilter.addEventListener('change', (e) => {
                this.filters.platform = e.target.value;
                this.loadLeaderboard();
            });
        }
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
        
        if (userNameElement && this.currentUser) {
            userNameElement.textContent = this.currentUser.efootballId || 'Player';
        }
        
        if (userAvatarElement && this.currentUser?.efootballId) {
            userAvatarElement.textContent = this.currentUser.efootballId.charAt(0).toUpperCase();
        }
    }

    async loadTournaments() {
        try {
            // Load user's registered tournaments
            const response = await fetch(`${window.API_BASE_URL || ''}/api/users/tournaments`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                }
            });
            if (response.ok) {
                const data = await response.json();
                this.tournaments = data.tournaments || [];
                this.renderTournamentSelector();
            }
        } catch (error) {
            console.error('Error loading user tournaments:', error);
        }
    }

    renderTournamentSelector() {
        const container = document.getElementById('tournamentSelector');
        if (!container) return;

        container.innerHTML = `
            <div class="filter-group">
                <label for="tournamentSelect">Tournament:</label>
                <select id="tournamentSelect">
                    <option value="global">Global Leaderboard</option>
                    ${this.tournaments.map(t => 
                        `<option value="${t._id}">${t.name}</option>`
                    ).join('')}
                </select>
            </div>
        `;
    }

    async loadLeaderboard() {
        try {
            this.showLoading(true);
            
            let url = `${window.API_BASE_URL || ''}/api/leaderboard`;
            const params = new URLSearchParams();
            
            if (this.currentTournamentId !== 'global') {
                params.append('tournamentId', this.currentTournamentId);
            }
            
            if (this.filters.type !== 'global') {
                params.append('type', this.filters.type);
            }
            
            if (this.filters.platform !== 'all') {
                params.append('platform', this.filters.platform);
            }
            
            params.append('page', this.currentPage);
            params.append('limit', this.itemsPerPage);
            
            const response = await fetch(`${url}?${params.toString()}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.message || 'Failed to load leaderboard');
            }
            
            this.leaderboardData = data.leaderboard || [];
            this.renderLeaderboard();
            
        } catch (error) {
            console.error('Error loading leaderboard:', error);
            this.showError('Failed to load leaderboard. Please try again later.');
        } finally {
            this.showLoading(false);
        }
    }

    renderLeaderboard() {
        const topPlayersContainer = document.getElementById('topPlayers');
        const leaderboardList = document.getElementById('leaderboardList');
        const userPositionContainer = document.getElementById('userPosition');
        const titleElement = document.getElementById('leaderboardTitle');
        const descriptionElement = document.getElementById('leaderboardDescription');

        if (!topPlayersContainer || !leaderboardList) return;

        // Update title and description based on current selection
        if (this.currentTournamentId === 'global') {
            titleElement.textContent = 'Global Leaderboard';
            descriptionElement.textContent = 'See where you stand among all Efootball players across all tournaments';
        } else {
            const tournament = this.tournaments.find(t => t._id === this.currentTournamentId);
            if (tournament) {
                titleElement.textContent = `${tournament.name} Leaderboard`;
                descriptionElement.textContent = `See standings for the ${tournament.name} tournament`;
            }
        }

        // Clear existing content
        topPlayersContainer.innerHTML = '';
        leaderboardList.innerHTML = '';

        if (this.leaderboardData.length === 0) {
            leaderboardList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-trophy"></i>
                    <h3>No Leaderboard Data</h3>
                    <p>There is no leaderboard data available for the selected criteria.</p>
                </div>
            `;
            return;
        }

        // Get top 3 players for the podium
        const topPlayers = this.leaderboardData.slice(0, 3);

        // Render top players (podium)
        if (topPlayers.length > 0) {
            topPlayersContainer.innerHTML = `
                <div class="podium">
                    ${topPlayers.map((player, index) => `
                        <div class="podium-item ${index === 1 ? 'first' : index === 0 ? 'second' : 'third'}">
                            <div class="rank">${index + 1}</div>
                            <div class="avatar">${player.efootballId.charAt(0).toUpperCase()}</div>
                            <div class="name">${player.efootballId}</div>
                            <div class="points">${player.points || 0} pts</div>
                        </div>
                    `).join('')}
                </div>
            `;
        }

        // Render the rest of the leaderboard
        const remainingPlayers = this.leaderboardData.slice(3);

        leaderboardList.innerHTML = remainingPlayers.map((player, index) => {
            const rank = index + 4; // +4 because we already showed top 3
            const isCurrentUser = this.currentUser && player._id === this.currentUser._id;
            const goalDiff = (player.goalsFor || 0) - (player.goalsAgainst || 0);

            return `
                <div class="leaderboard-item ${isCurrentUser ? 'current-user' : ''}" data-rank="${rank}">
                    <span class="rank">${rank}</span>
                    <span class="player">
                        <span class="avatar">${player.efootballId.charAt(0).toUpperCase()}</span>
                        ${player.efootballId}
                        ${isCurrentUser ? '<span class="you-badge">You</span>' : ''}
                    </span>
                    <span class="points">${player.points || 0}</span>
                    <span class="wins">${player.wins || 0}</span>
                    <span class="goal-diff">${goalDiff >= 0 ? '+' : ''}${goalDiff}</span>
                    <span class="win-rate">${this.calculateWinRate(player)}%</span>
                </div>
            `;
        }).join('');

        // Show user's position if not in top 20
        if (this.currentUser) {
            const userRank = this.leaderboardData.findIndex(p => p._id === this.currentUser._id);
            if (userRank === -1) {
                // User not in top 20, show their position
                this.loadUserPosition();
            } else if (userRank >= 3) {
                // User is in the list but not on the podium, scroll to their position
                const userElement = leaderboardList.querySelector(`[data-rank="${userRank + 1}"]`);
                if (userElement) {
                    userElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }
        }
    }
    
    async loadUserPosition() {
        try {
            const response = await fetch(`${window.API_BASE_URL || ''}/api/leaderboard/position?userId=${this.currentUser._id}`);
            if (response.ok) {
                const data = await response.json();
                if (data.success && data.position) {
                    this.renderUserPosition(data.position);
                }
            }
        } catch (error) {
            console.error('Error loading user position:', error);
        }
    }
    
    renderUserPosition(position) {
        const container = document.getElementById('userPosition');
        if (!container) return;

        container.style.display = 'block';
        container.querySelector('.leaderboard-item')?.remove();

        const goalDiff = (position.goalsFor || 0) - (position.goalsAgainst || 0);

        const userItem = document.createElement('div');
        userItem.className = 'leaderboard-item current-user';
        userItem.innerHTML = `
            <span class="rank">${position.rank}</span>
            <span class="player">
                <span class="avatar">${this.currentUser.efootballId.charAt(0).toUpperCase()}</span>
                ${this.currentUser.efootballId}
                <span class="you-badge">You</span>
            </span>
            <span class="points">${position.points || 0}</span>
            <span class="wins">${position.wins || 0}</span>
            <span class="goal-diff">${goalDiff >= 0 ? '+' : ''}${goalDiff}</span>
            <span class="win-rate">${this.calculateWinRate(position)}%</span>
        `;

        container.appendChild(userItem);
    }
    
    calculateWinRate(player) {
        if (!player.matchesPlayed || player.matchesPlayed === 0) return 0;
        const winRate = (player.wins / player.matchesPlayed) * 100;
        return Math.round(winRate * 10) / 10; // Round to 1 decimal place
    }
    
    showLoading(show) {
        const container = document.querySelector('.leaderboard-content');
        if (!container) return;
        
        if (show) {
            container.style.opacity = '0.7';
            container.style.pointerEvents = 'none';
        } else {
            container.style.opacity = '1';
            container.style.pointerEvents = 'auto';
        }
    }
    
    showError(message) {
        const container = document.getElementById('leaderboardList');
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

// Initialize the leaderboard page when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    window.leaderboardPage = new LeaderboardPage();
});
