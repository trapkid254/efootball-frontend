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
        this.setupResponsiveMenu();
    }

    checkAuth() {
        // Bypass all authentication checks
        const devUser = { id: 'dev-admin', name: 'Admin', role: 'admin' };
        localStorage.setItem('token', 'dev-token');
        localStorage.setItem('user', JSON.stringify(devUser));
        this.currentUser = devUser;
        this.updateAdminInfo();
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
                const href = link.getAttribute('href');
                if (href && href.startsWith('#')) {
                    this.handleNavigation(href.substring(1));
                }
            });
        });

        // Create tournament form
        const createTournamentForm = document.getElementById('createTournamentForm');
        if (createTournamentForm) {
            createTournamentForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleCreateTournament();
            });
        }
        
        // Add click handler for create tournament button
        const createTournamentBtn = document.querySelector('.admin-btn.primary');
        if (createTournamentBtn) {
            createTournamentBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.showCreateTournamentModal();
            });
        }
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
        if (!section) return;
        
        // Update active nav link
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        
        const activeLink = document.querySelector(`[href="#${section}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }

        // Show corresponding section
        const sections = document.querySelectorAll('.admin-section');
        if (sections.length > 0) {
            sections.forEach(sectionEl => {
                if (sectionEl.style) {
                    sectionEl.style.display = 'none';
                }
            });
            
            const targetSection = document.getElementById(section);
            if (targetSection && targetSection.style) {
                targetSection.style.display = 'block';
            }
        }

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
        const modal = document.getElementById('createTournamentModal');
        if (modal) {
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden'; // Prevent scrolling when modal is open
            
            // Reset form
            const form = document.getElementById('createTournamentForm');
            if (form) form.reset();
            
            // Set default start date to now + 1 hour
            const now = new Date();
            now.setHours(now.getHours() + 1);
            const startDateInput = document.getElementById('startDate');
            if (startDateInput) {
                startDateInput.min = now.toISOString().slice(0, 16);
                startDateInput.value = now.toISOString().slice(0, 16);
            }
            
            // Set default capacity to 16
            const capacityInput = document.getElementById('capacity');
            if (capacityInput && !capacityInput.value) {
                capacityInput.value = '16';
            }
        }
    }

    async handleCreateTournament() {
        const form = document.getElementById('createTournamentForm');
        if (!form) return;

        // Disable the submit button to prevent multiple submissions
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn ? submitBtn.innerHTML : '';
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating...';
        }

        try {
            const formData = new FormData(form);
            const tournamentData = {
                name: formData.get('name').trim(),
                format: formData.get('format'),
                entryFee: parseFloat(formData.get('entryFee')) || 0,
                prizePool: parseFloat(formData.get('prizePool')) || 0,
                capacity: parseInt(formData.get('capacity'), 10) || 16,
                startDate: formData.get('startDate'),
                description: formData.get('description').trim(),
                rules: formData.get('rules').trim()
            };

            // Basic validation
            if (!tournamentData.name) {
                throw new Error('Tournament name is required');
            }
            if (tournamentData.capacity < 2 || tournamentData.capacity > 128) {
                throw new Error('Player capacity must be between 2 and 128');
            }

            const apiBase = window.API_BASE_URL || 'http://127.0.0.1:5000';
            const token = localStorage.getItem('token');
            
            const response = await fetch(`${apiBase}/api/tournaments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(tournamentData)
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Failed to create tournament');
            }

            this.showNotification('Tournament created successfully!', 'success');
            this.hideCreateTournamentModal();
            
            // Reload the tournaments section if it's active
            if (window.location.hash === '#tournaments') {
                this.loadSectionData('tournaments');
            }
            
            // Refresh dashboard stats
            this.loadAdminData();
            
        } catch (error) {
            console.error('Error creating tournament:', error);
            this.showNotification(error.message || 'Failed to create tournament', 'error');
        } finally {
            // Re-enable the submit button
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnText;
            }
        }
    }

    hideCreateTournamentModal() {
        const modal = document.getElementById('createTournamentModal');
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto'; // Re-enable scrolling
        }
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

    setupResponsiveMenu() {
        const hamburger = document.getElementById('hamburger');
        const navMenu = document.getElementById('navMenu');
        
        if (hamburger && navMenu) {
            // Toggle menu on hamburger click
            hamburger.addEventListener('click', () => {
                navMenu.classList.toggle('active');
                hamburger.innerHTML = navMenu.classList.contains('active') ? 
                    '<i class="fas fa-times"></i>' : 
                    '<i class="fas fa-bars"></i>';
            });

            // Close menu when clicking on a nav link
            document.querySelectorAll('.nav-link').forEach(link => {
                link.addEventListener('click', () => {
                    if (window.innerWidth <= 992) {
                        navMenu.classList.remove('active');
                        hamburger.innerHTML = '<i class="fas fa-bars"></i>';
                    }
                });
            });
        }
        
        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            const isClickInside = navMenu.contains(e.target) || 
                               hamburger.contains(e.target);
            
            if (!isClickInside && navMenu.classList.contains('active')) {
                navMenu.classList.remove('active');
                if (hamburger) {
                    hamburger.innerHTML = '<i class="fas fa-bars"></i>';
                }
            }
        });
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

// Global functions for modal handling (kept for backward compatibility)
function showCreateTournamentModal() {
    if (window.adminPanel) {
        window.adminPanel.showCreateTournamentModal();
    }
}

function hideCreateTournamentModal() {
    if (window.adminPanel) {
        window.adminPanel.hideCreateTournamentModal();
    }
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