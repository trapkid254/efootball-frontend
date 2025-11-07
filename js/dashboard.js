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
        document.getElementById('themeToggle').addEventListener('click', () => {
            this.toggleTheme();
        });

        // Logout button
        document.getElementById('logoutBtn').addEventListener('click', () => {
            this.logout();
        });
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
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const matches = [
            {
                id: 1,
                opponent: 'ProGamerKE',
                tournament: 'Weekly Champions Cup',
                time: 'Today, 20:00',
                round: 'Round of 16'
            },
            {
                id: 2,
                opponent: 'EfootballKing',
                tournament: 'Monthly Grand Tournament',
                time: 'Tomorrow, 19:00',
                round: 'Group Stage'
            }
        ];

        const container = document.getElementById('upcomingMatches');
        container.innerHTML = matches.map(match => `
            <div class="match-item">
                <div class="match-info">
                    <h4>vs ${match.opponent}</h4>
                    <p>${match.tournament} • ${match.round}</p>
                </div>
                <div class="match-time">${match.time}</div>
            </div>
        `).join('') || '<p class="empty-state">No upcoming matches</p>';
    }

    async loadActiveTournaments() {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 800));
        
        const tournaments = [
            {
                id: 1,
                name: 'Weekly Champions Cup',
                progress: '24/32',
                prize: 'KSh 5,000',
                nextMatch: 'Round of 16'
            },
            {
                id: 2,
                name: 'Monthly Grand Tournament',
                progress: 'Group Stage',
                prize: 'KSh 15,000',
                nextMatch: 'Match 3'
            }
        ];

        const container = document.getElementById('activeTournaments');
        container.innerHTML = tournaments.map(tournament => `
            <div class="tournament-item">
                <h4>${tournament.name}</h4>
                <div class="tournament-meta">
                    <span>Progress: ${tournament.progress}</span>
                    <span class="tournament-prize">${tournament.prize}</span>
                </div>
                <div class="tournament-meta">
                    <span>Next: ${tournament.nextMatch}</span>
                </div>
            </div>
        `).join('') || '<p class="empty-state">No active tournaments</p>';
    }

    async loadRecentActivity() {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 600));
        
        const activities = [
            {
                type: 'match',
                icon: 'fa-gamepad',
                title: 'Match Result Submitted',
                description: 'Weekly Champions Cup - Round of 32',
                time: '2 hours ago'
            },
            {
                type: 'tournament',
                icon: 'fa-trophy',
                title: 'Tournament Joined',
                description: 'Monthly Grand Tournament',
                time: '1 day ago'
            },
            {
                type: 'achievement',
                icon: 'fa-medal',
                title: 'New Achievement',
                description: '10 Matches Won',
                time: '2 days ago'
            }
        ];

        const container = document.getElementById('recentActivity');
        container.innerHTML = activities.map(activity => `
            <div class="activity-item">
                <div class="activity-icon">
                    <i class="fas ${activity.icon}"></i>
                </div>
                <div class="activity-content">
                    <h4>${activity.title}</h4>
                    <p>${activity.description}</p>
                </div>
                <div class="activity-time">${activity.time}</div>
            </div>
        `).join('') || '<p class="empty-state">No recent activity</p>';
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