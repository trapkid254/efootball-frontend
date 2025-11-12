class Dashboard {
    constructor() {
        this.currentUser = null;
        this.init();
    }

    init() {
        this.checkAuth();
        this.setupEventListeners();
        this.loadDashboardData();
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
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggleTheme();
            });
        }

        // Navigation links - prevent default and handle navigation manually
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                window.location.href = link.getAttribute('href');
            });
        });

        // Logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
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

    updateUserInfo() {
        document.getElementById('userName').textContent = this.currentUser.efootballId;
        document.getElementById('userAvatar').textContent = this.currentUser.efootballId.charAt(0).toUpperCase();
        
        if (this.currentUser.stats) {
            document.getElementById('totalWins').textContent = this.currentUser.stats.wins || 0;
            document.getElementById('totalMatches').textContent = this.currentUser.stats.totalMatches || 0;
            document.getElementById('playerRank').textContent = this.currentUser.stats.ranking || '-';
        }
    }

    async loadDashboardData() {
        try {
            await Promise.all([
                this.loadUpcomingMatches(),
                this.loadActiveTournaments(),
                this.loadRecentActivity()
            ]);
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            this.showNotification('Failed to load dashboard data', 'error');
        }
    }

    async loadUpcomingMatches() {
        try {
            const response = await fetch(`${window.API_BASE_URL || ''}/api/matches/upcoming`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch upcoming matches');
            }

            const data = await response.json();
            const matches = data.matches || [];
            const container = document.getElementById('upcomingMatches');

            if (matches.length === 0) {
                container.innerHTML = '<p class="empty-state">No upcoming matches</p>';
                return;
            }

            container.innerHTML = matches.map(match => {
                const matchDate = new Date(match.scheduledTime);
                const now = new Date();
                const timeDiff = matchDate - now;
                const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
                
                let timeDisplay;
                if (daysDiff === 0) {
                    timeDisplay = 'Today';
                } else if (daysDiff === 1) {
                    timeDisplay = 'Tomorrow';
                } else if (daysDiff < 7) {
                    timeDisplay = matchDate.toLocaleDateString('en-US', { weekday: 'long' });
                } else {
                    timeDisplay = matchDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                }
                
                timeDisplay += `, ${matchDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
                
                // Determine opponent
                let opponentName = 'TBD';
                if (match.player1 && match.player1._id !== this.currentUser._id) {
                    opponentName = match.player1.efootballId;
                } else if (match.player2 && match.player2._id !== this.currentUser._id) {
                    opponentName = match.player2.efootballId;
                }
                
                return `
                    <div class="match-item">
                        <div class="match-info">
                            <h4>vs ${opponentName}</h4>
                            <p>${match.tournament?.name || 'Tournament'} • ${match.round || 'Match'}</p>
                        </div>
                        <div class="match-time">${timeDisplay}</div>
                    </div>
                `;
            }).join('');
            
        } catch (error) {
            console.error('Error loading upcoming matches:', error);
            const container = document.getElementById('upcomingMatches');
            container.innerHTML = `
                <div class="error-state">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>Failed to load matches</p>
                    <button class="btn-retry" onclick="window.dashboard.loadUpcomingMatches()">
                        <i class="fas fa-sync-alt"></i> Try Again
                    </button>
                </div>
            `;
        }
    }

    async loadActiveTournaments() {
        try {
            const response = await fetch(`${window.API_BASE_URL || ''}/api/tournaments/active`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch active tournaments');
            }

            const data = await response.json();
            const tournaments = data.tournaments || [];
            const container = document.getElementById('activeTournaments');

            if (tournaments.length === 0) {
                container.innerHTML = '<p class="empty-state">No active tournaments</p>';
                return;
            }

            container.innerHTML = await Promise.all(tournaments.map(async tournament => {
                // Get tournament progress
                let progressText = 'Not Started';
                if (tournament.status === 'in_progress') {
                    const participantsCount = tournament.participants?.length || 0;
                    const maxParticipants = tournament.maxParticipants || 0;
                    progressText = `${participantsCount}/${maxParticipants}`;
                } else if (tournament.status === 'completed') {
                    progressText = 'Completed';
                }

                // Get next match info if available
                let nextMatchInfo = 'Check Bracket';
                if (tournament.nextMatch) {
                    const matchDate = new Date(tournament.nextMatch.scheduledTime);
                    nextMatchInfo = `Next: ${matchDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
                }

                // Format prize
                const prizeText = tournament.prizePool 
                    ? `KSh ${Number(tournament.prizePool).toLocaleString()}`
                    : 'No Prize';

                return `
                    <div class="tournament-item" data-tournament-id="${tournament._id}">
                        <h4>${tournament.name}</h4>
                        <div class="tournament-meta">
                            <span>Progress: ${progressText}</span>
                            <span class="tournament-prize">${prizeText}</span>
                        </div>
                        <div class="tournament-meta">
                            <span>${nextMatchInfo}</span>
                            <a href="tournament.html?id=${tournament._id}" class="view-tournament">View</a>
                        </div>
                    </div>
                `;
            })).then(html => html.join(''));
            
        } catch (error) {
            console.error('Error loading active tournaments:', error);
            const container = document.getElementById('activeTournaments');
            container.innerHTML = `
                <div class="error-state">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>Failed to load tournaments</p>
                    <button class="btn-retry" onclick="window.dashboard.loadActiveTournaments()">
                        <i class="fas fa-sync-alt"></i> Try Again
                    </button>
                </div>
            `;
        }
    }

    async loadRecentActivity() {
        try {
            const response = await fetch(`${window.API_BASE_URL || ''}/api/activity/recent`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch recent activity');
            }

            const data = await response.json();
            const activities = data.activities || [];
            const container = document.getElementById('recentActivity');

            if (activities.length === 0) {
                container.innerHTML = '<p class="empty-state">No recent activity</p>';
                return;
            }

            // Define activity icons based on type
            const activityIcons = {
                'match': 'fa-gamepad',
                'tournament': 'fa-trophy',
                'achievement': 'fa-medal',
                'registration': 'fa-user-plus',
                'result': 'fa-flag-checkered'
            };

            container.innerHTML = activities.map(activity => {
                const icon = activityIcons[activity.type] || 'fa-bell';
                const timeAgo = this.formatTimeAgo(new Date(activity.timestamp));
                
                return `
                    <div class="activity-item" data-type="${activity.type}">
                        <div class="activity-icon">
                            <i class="fas ${icon}"></i>
                        </div>
                        <div class="activity-content">
                            <h4>${activity.title}</h4>
                            <p>${activity.description}</p>
                        </div>
                        <div class="activity-time">${timeAgo}</div>
                    </div>
                `;
            }).join('');
            
            // Add click handlers to activity items
            this.setupActivityItemClickHandlers();
            
        } catch (error) {
            console.error('Error loading recent activity:', error);
            const container = document.getElementById('recentActivity');
            container.innerHTML = `
                <div class="error-state">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>Failed to load activity</p>
                    <button class="btn-retry" onclick="window.dashboard.loadRecentActivity()">
                        <i class="fas fa-sync-alt"></i> Try Again
                    </button>
                </div>
            `;
        }
    }

    formatTimeAgo(date) {
        const now = new Date();
        const seconds = Math.floor((now - date) / 1000);
        
        let interval = Math.floor(seconds / 31536000);
        if (interval >= 1) return `${interval} year${interval === 1 ? '' : 's'} ago`;
        
        interval = Math.floor(seconds / 2592000);
        if (interval >= 1) return `${interval} month${interval === 1 ? '' : 's'} ago`;
        
        interval = Math.floor(seconds / 86400);
        if (interval >= 1) return `${interval} day${interval === 1 ? '' : 's'} ago`;
        
        interval = Math.floor(seconds / 3600);
        if (interval >= 1) return `${interval} hour${interval === 1 ? '' : 's'} ago`;
        
        interval = Math.floor(seconds / 60);
        if (interval >= 1) return `${interval} minute${interval === 1 ? '' : 's'} ago`;
        
        return 'Just now';
    }
    
    setupActivityItemClickHandlers() {
        document.querySelectorAll('.activity-item').forEach(item => {
            item.addEventListener('click', () => {
                const type = item.getAttribute('data-type');
                // You can add specific navigation based on activity type
                switch(type) {
                    case 'match':
                        // Navigate to match details if needed
                        break;
                    case 'tournament':
                        // Navigate to tournament details if needed
                        break;
                    default:
                        // Default action or do nothing
                        break;
                }
            });
        });
    }

    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = 'index.html';
    }

    showNotification(message, type = 'info') {
        // Remove existing notifications
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
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

// Initialize dashboard when page loads
document.addEventListener('DOMContentLoaded', () => {
    new Dashboard();
});