class AdminPanel {
    constructor() {
        this.currentUser = null;
        this.init();
    }

    init() {
        this.checkAuth();
        this.setupEventListeners();
        this.loadAdminData();
        this.setupModals();
    }

    checkAuth() {
        const token = localStorage.getItem('token');
        let userData = localStorage.getItem('user');
        const isDevBypass = /[?&]dev=1/.test(window.location.search) || window.location.hash.includes('dev');
        const isDevHost = ['localhost', '127.0.0.1'].includes(window.location.hostname);
        
        // In dev mode (flag or localhost), always ensure we are an admin regardless of existing storage
        if (isDevBypass || isDevHost) {
            const devUser = { id: 'dev-admin', name: 'Dev Admin', role: 'admin' };
            localStorage.setItem('token', 'dev-token');
            localStorage.setItem('user', JSON.stringify(devUser));
            userData = localStorage.getItem('user');
        } else if (!token || !userData) {
            window.location.href = 'admin-login.html';
            return;
        }

        try {
            this.currentUser = JSON.parse(userData);
            if (this.currentUser.role !== 'admin') {
                window.location.href = 'dashboard.html';
                return;
            }
            this.updateAdminInfo();
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

        // Navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleNavigation(e.target.getAttribute('href').substring(1));
            });
        });

        // Create tournament form
        document.getElementById('createTournamentForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleCreateTournament();
        });
    }

    setupModals() {
        // Close modals when clicking X
        document.querySelectorAll('.close').forEach(closeBtn => {
            closeBtn.addEventListener('click', (e) => {
                e.target.closest('.modal').style.display = 'none';
            });
        });

        // Close modals when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                e.target.style.display = 'none';
            }
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

    updateAdminInfo() {
        // Update admin-specific UI elements if needed
    }

    async loadAdminData() {
        try {
            const apiBase = (window.API_BASE_URL) || 'http://127.0.0.1:5000';
            const token = localStorage.getItem('token');
            const resp = await fetch(`${apiBase}/api/admin/dashboard`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await resp.json();
            if (!resp.ok || !data.success) throw new Error(data.message || 'Failed to load admin data');

            const stats = data.stats || {};
            document.getElementById('totalPlayers').textContent = stats.totalPlayers ?? 0;
            document.getElementById('activeTournamentsCount').textContent = stats.activeTournaments ?? 0;
            document.getElementById('pendingMatches').textContent = stats.pendingMatches ?? 0;
            document.getElementById('totalRevenue').textContent = `KSh ${(stats.totalRevenue || 0).toLocaleString()}`;

            const recent = data.recentActivity || {};
            const activities = [];
            (recent.tournaments || []).forEach(t => activities.push({
                time: new Date(t.createdAt).toLocaleString(),
                activity: 'Tournament Created',
                user: t.organizer?.efootballId || 'Admin',
                details: t.name
            }));
            (recent.matches || []).forEach(m => activities.push({
                time: new Date(m.createdAt).toLocaleString(),
                activity: 'Match Recorded',
                user: `${m.player1?.user?.efootballId || ''} vs ${m.player2?.user?.efootballId || ''}`.trim(),
                details: m.tournament?.name || `Match #${m.matchNumber || ''}`
            }));
            (recent.registrations || []).forEach(r => activities.push({
                time: new Date(r.createdAt).toLocaleString(),
                activity: 'Player Registered',
                user: r.efootballId,
                details: ''
            }));

            const container = document.getElementById('adminActivityTable');
            container.innerHTML = activities.slice(0, 15).map(a => `
                <tr>
                    <td>${a.time}</td>
                    <td>${a.activity}</td>
                    <td>${a.user}</td>
                    <td>${a.details}</td>
                </tr>
            `).join('');

        } catch (error) {
            console.error('Error loading admin data:', error);
            this.showNotification('Failed to load admin data', 'error');
        }
    }

    handleNavigation(section) {
        // Update active nav link
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        document.querySelector(`[href="#${section}"]`).classList.add('active');

        // Show corresponding section
        document.querySelectorAll('.admin-section').forEach(section => {
            section.style.display = 'none';
        });
        document.getElementById(section).style.display = 'block';

        // Load section-specific data
        this.loadSectionData(section);
    }

    loadSectionData(section) {
        switch (section) {
            case 'tournaments':
                this.loadTournamentsManagement();
                break;
            case 'matches':
                this.loadMatchesManagement();
                break;
            case 'players':
                this.loadPlayersManagement();
                break;
            case 'payments':
                this.loadPaymentsManagement();
                break;
        }
    }

    showCreateTournamentModal() {
        document.getElementById('createTournamentModal').style.display = 'block';
    }

    hideCreateTournamentModal() {
        document.getElementById('createTournamentModal').style.display = 'none';
    }

    async handleCreateTournament() {
        const formData = new FormData(document.getElementById('createTournamentForm'));
        const tournamentData = {
            name: formData.get('name'),
            format: formData.get('format'),
            entryFee: parseInt(formData.get('entryFee')),
            prizePool: parseInt(formData.get('prizePool')),
            capacity: parseInt(formData.get('capacity')),
            startDate: formData.get('startDate'),
            description: formData.get('description'),
            rules: formData.get('rules')
        };

        try {
            this.showLoading(true);
            
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            this.hideCreateTournamentModal();
            this.showNotification('Tournament created successfully!', 'success');
            document.getElementById('createTournamentForm').reset();
            
            // Refresh tournaments list if on that section
            if (document.querySelector('[href="#tournaments"]').classList.contains('active')) {
                this.loadTournamentsManagement();
            }
            
        } catch (error) {
            console.error('Create tournament error:', error);
            this.showNotification('Failed to create tournament', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    showManagePlayers() {
        this.handleNavigation('players');
    }

    showPendingResults() {
        this.handleNavigation('matches');
    }

    showPaymentManagement() {
        this.handleNavigation('payments');
    }

    async loadTournamentsManagement() {
        // Implementation for tournaments management
        console.log('Loading tournaments management...');
    }

    async loadMatchesManagement() {
        // Implementation for matches management
        console.log('Loading matches management...');
    }

    async loadPlayersManagement() {
        // Implementation for players management
        console.log('Loading players management...');
    }

    async loadPaymentsManagement() {
        // Implementation for payments management
        console.log('Loading payments management...');
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

    showLoading(show) {
        // Implementation for loading states
        if (show) {
            // Show loading indicator
        } else {
            // Hide loading indicator
        }
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

// Global functions for modal handling
function showCreateTournamentModal() {
    window.adminPanel.showCreateTournamentModal();
}

function hideCreateTournamentModal() {
    window.adminPanel.hideCreateTournamentModal();
}

function showManagePlayers() {
    window.adminPanel.showManagePlayers();
}

function showPendingResults() {
    window.adminPanel.showPendingResults();
}

function showPaymentManagement() {
    window.adminPanel.showPaymentManagement();
}

// Initialize admin panel when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.adminPanel = new AdminPanel();
});