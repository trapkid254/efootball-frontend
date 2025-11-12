// Main Application JavaScript
class TonaKikwetuApp {
    constructor() {
        this.currentUser = null;
        this.isDarkTheme = true;
        this.tournaments = [];
        this.leaderboard = [];
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadSampleData();
        this.checkAuthStatus();
        this.setupSmoothScrolling();
    }

    setupEventListeners() {
        // Theme toggle - only if element exists
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                this.toggleTheme();
            });
        }

        // Login Modal - only if element exists
        const loginBtn = document.getElementById('loginBtn');
        if (loginBtn) {
            loginBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.showLoginModal();
            });
        }

        // Close modals - only if elements exist
        const closeButtons = document.querySelectorAll('.close');
        if (closeButtons.length > 0) {
            closeButtons.forEach(closeBtn => {
                closeBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.hideAllModals();
                });
            });
        }

        // Login Form - only if element exists
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
        }

        // Register Form - only if element exists
        const registerForm = document.getElementById('registerForm');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleRegister();
            });
        }

        // Auth switching - only if elements exist
        const showRegister = document.getElementById('showRegister');
        if (showRegister) {
            showRegister.addEventListener('click', (e) => {
                e.preventDefault();
                this.showRegisterModal();
            });
        }

        const showLogin = document.getElementById('showLogin');
        if (showLogin) {
            showLogin.addEventListener('click', (e) => {
                e.preventDefault();
                this.showLoginModal();
            });
        }

        // Join Tournament - only if element exists
        const joinTournament = document.getElementById('joinTournament');
        if (joinTournament) {
            joinTournament.addEventListener('click', () => {
                this.handleJoinTournament();
            });
        }

        // Filter buttons - only if elements exist
        const filterButtons = document.querySelectorAll('.filter-btn');
        if (filterButtons.length > 0) {
            filterButtons.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    this.handleFilterClick(e.target);
                });
            });
        }

        // Learn More button
        const learnMore = document.getElementById('learnMore');
        if (learnMore) {
            learnMore.addEventListener('click', () => {
                document.getElementById('about').scrollIntoView({ behavior: 'smooth' });
            });
        }

        // Close modal when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.hideAllModals();
            }
        });
    }

    setupSmoothScrolling() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            // Skip the registration link to prevent the error
            if (anchor.id === 'showRegister' || !anchor.getAttribute('href')) {
                return;
            }
            
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const targetId = this.getAttribute('href');
                // Make sure the href is not just '#'
                if (targetId && targetId !== '#') {
                    const target = document.querySelector(targetId);
                    if (target) {
                        target.scrollIntoView({
                            behavior: 'smooth',
                            block: 'start'
                        });
                    }
                }
            });
        });
    }

    toggleTheme() {
        this.isDarkTheme = !this.isDarkTheme;
        document.body.classList.toggle('light-theme', !this.isDarkTheme);
        document.body.classList.toggle('dark-theme', this.isDarkTheme);
        
        const icon = document.querySelector('#themeToggle i');
        icon.className = this.isDarkTheme ? 'fas fa-moon' : 'fas fa-sun';
        
        // Save theme preference
        localStorage.setItem('theme', this.isDarkTheme ? 'dark' : 'light');
    }

    showLoginModal() {
        this.hideAllModals();
        const loginModal = document.getElementById('loginModal');
        if (loginModal) {
            loginModal.style.display = 'block';
            loginModal.classList.add('show');
            // Focus on the first input field
            const firstInput = loginModal.querySelector('input');
            if (firstInput) firstInput.focus();
        } else {
            console.error('Login modal element not found');
        }
    }

    showRegisterModal() {
        this.hideAllModals();
        document.getElementById('registerModal').style.display = 'block';
    }

    hideAllModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.style.display = 'none';
        });
    }

    async handleLogin() {
        const form = document.getElementById('loginForm');
        if (!form) return;

        const formData = new FormData(form);
        const loginData = {
            whatsapp: formData.get('whatsapp')?.trim() || '',
            efootballId: formData.get('efootballId')?.trim() || '',
            password: formData.get('password') || ''
        };

        // Basic validation
        if ((!loginData.whatsapp && !loginData.efootballId) || !loginData.password) {
            this.showNotification('Please provide your login credentials', 'error');
            return;
        }

        try {
            this.showLoading(true);
            
            // Call the login API
            const response = await fetch(`${window.API_BASE_URL || ''}/api/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(loginData)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Login failed');
            }

            // Login successful
            if (data.token && data.user) {
                // Store the token and user data
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                this.currentUser = data.user;
                
                this.hideAllModals();
                this.updateUIForAuth();
                this.showNotification('Login successful!', 'success');
                
                // Redirect based on user role
                if (this.currentUser.role === 'admin') {
                    window.location.href = 'admin/dashboard.html';
                } else {
                    window.location.href = 'dashboard.html';
                }
            } else {
                throw new Error('Invalid response from server');
            }
            
        } catch (error) {
            console.error('Login error:', error);
            
            // More specific error messages based on error type
            let errorMessage = 'Login failed. Please check your credentials.';
            if (error.message.includes('credentials') || error.message.includes('Invalid')) {
                errorMessage = 'Invalid credentials. Please try again.';
            } else if (error.message.includes('verified')) {
                errorMessage = 'Please verify your account before logging in.';
            } else if (error.message.includes('active')) {
                errorMessage = 'Your account has been deactivated. Please contact support.';
            }
            
            this.showNotification(errorMessage, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async handleRegister() {
        const form = document.getElementById('registerForm');
        if (!form) return;

        const formData = new FormData(form);
        const registerData = {
            whatsapp: formData.get('whatsapp')?.trim() || '',
            efootballId: formData.get('efootballId')?.trim() || '',
            password: formData.get('password') || '',
            confirmPassword: formData.get('confirmPassword') || ''
        };

        // Validation
        if (!registerData.whatsapp || !registerData.efootballId || !registerData.password) {
            this.showNotification('Please fill in all fields', 'error');
            return;
        }

        if (!this.validatePhone(registerData.whatsapp)) {
            this.showNotification('Please enter a valid WhatsApp number (e.g., 0712345678, +254712345678, or 254712345678)', 'error');
            return;
        }

        if (registerData.password !== registerData.confirmPassword) {
            this.showNotification('Passwords do not match', 'error');
            return;
        }

        if (registerData.password.length < 6) {
            this.showNotification('Password must be at least 6 characters', 'error');
            return;
        }

        try {
            this.showLoading(true);
            
            // Call the registration API
            const response = await fetch(`${window.API_BASE_URL || ''}/api/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    whatsapp: registerData.whatsapp,
                    efootballId: registerData.efootballId,
                    password: registerData.password
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Registration failed');
            }

            // Registration successful
            this.showNotification(data.message || 'Registration successful!', 'success');
            
            // Auto-login after successful registration if token is returned
            if (data.token && data.user) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                this.currentUser = data.user;
                this.hideAllModals();
                this.updateUIForAuth();
                
                // Redirect to dashboard or home page
                window.location.href = 'dashboard.html';
            } else {
                // If auto-login didn't happen, show login form
                this.showLoginModal();
            }
            
        } catch (error) {
            console.error('Registration error:', error);
            this.showNotification(error.message || 'Registration failed. Please try again.', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    validatePhone(phone) {
        const phoneRegex = /^(07\d{8}|2547\d{8}|\+2547\d{8})$/;
        return phoneRegex.test(phone.replace(/\s/g, ''));
    }

    loadSampleData() {
        // Sample tournaments data
        this.tournaments = [
            {
                _id: '1',
                name: 'Weekly Champions Cup',
                description: 'Weekly knockout tournament with cash prizes. Perfect for competitive players looking for regular action.',
                prizePool: 5000,
                entryFee: 100,
                capacity: 32,
                participants: 24,
                status: 'active',
                startDate: '2024-01-15',
                format: 'knockout',
                duration: '1 day'
            },
            {
                _id: '2',
                name: 'Monthly Grand Tournament',
                description: 'Monthly league with group stages and knockout rounds. The ultimate test of skill and consistency.',
                prizePool: 15000,
                entryFee: 200,
                capacity: 64,
                participants: 45,
                status: 'upcoming',
                startDate: '2024-01-20',
                format: 'group+knockout',
                duration: '2 weeks'
            },
            {
                _id: '3',
                name: 'Weekend Showdown',
                description: 'Quick weekend tournament for casual players. Fast-paced action with great rewards.',
                prizePool: 3000,
                entryFee: 50,
                capacity: 16,
                participants: 12,
                status: 'active',
                startDate: '2024-01-13',
                format: 'knockout',
                duration: '2 days'
            },
            {
                _id: '4',
                name: 'Free Entry Friday',
                description: 'No entry fee tournament! Perfect for beginners to test their skills without risk.',
                prizePool: 1000,
                entryFee: 0,
                capacity: 32,
                participants: 28,
                status: 'upcoming',
                startDate: '2024-01-19',
                format: 'knockout',
                duration: '1 day'
            }
        ];

        // Sample leaderboard data
        this.leaderboard = [
            { rank: 1, player: 'ProGamerKE', points: 2450, wins: 48, avatar: 'P' },
            { rank: 2, player: 'EfootballKing', points: 2310, wins: 45, avatar: 'E' },
            { rank: 3, player: 'NairobiFinest', points: 2180, wins: 42, avatar: 'N' },
            { rank: 4, player: 'MombasaMagic', points: 2050, wins: 40, avatar: 'M' },
            { rank: 5, player: 'KisumuStar', points: 1980, wins: 38, avatar: 'K' },
            { rank: 6, player: 'GoalMachine', points: 1850, wins: 36, avatar: 'G' },
            { rank: 7, player: 'DefenseWall', points: 1720, wins: 33, avatar: 'D' },
            { rank: 8, player: 'MidfieldMaestro', points: 1650, wins: 32, avatar: 'M' },
            { rank: 9, player: 'SpeedDemon', points: 1580, wins: 30, avatar: 'S' },
            { rank: 10, player: 'TacticalGenius', points: 1490, wins: 29, avatar: 'T' }
        ];

        this.renderTournaments();
        this.renderLeaderboard();
    }

    renderTournaments() {
        const grid = document.getElementById('tournamentsGrid');
        if (!grid) return; // Exit if tournaments grid doesn't exist on this page
        
        grid.innerHTML = this.tournaments.map(tournament => `
            <div class="tournament-card" data-status="${tournament.status}" data-fee="${tournament.entryFee === 0 ? 'free' : 'paid'}">
                <div class="tournament-header">
                    <span class="tournament-prize">KSh ${tournament.prizePool.toLocaleString()}</span>
                    <span class="tournament-status ${tournament.status}">${tournament.status}</span>
                </div>
                <div class="tournament-info">
                    <h3>${tournament.name}</h3>
                    <p>${tournament.description}</p>
                    <div class="tournament-meta">
                        <span><i class="fas fa-users"></i> ${tournament.participants}/${tournament.capacity}</span>
                        <span><i class="fas fa-calendar"></i> ${new Date(tournament.startDate).toLocaleDateString()}</span>
                        <span><i class="fas fa-trophy"></i> ${tournament.format}</span>
                    </div>
                    <button class="join-tournament" data-id="${tournament._id}">
                        ${tournament.entryFee > 0 ? `Join - KSh ${tournament.entryFee}` : 'Join Free'}
                    </button>
                </div>
            </div>
        `).join('');

        // Add event listeners to join buttons
        document.querySelectorAll('.join-tournament').forEach(button => {
            button.addEventListener('click', (e) => {
                this.handleTournamentJoin(e.target.dataset.id);
            });
        });
    }

    renderLeaderboard() {
        const list = document.getElementById('leaderboardList');
        if (!list) return; // Exit if leaderboard list doesn't exist on this page
        
        list.innerHTML = this.leaderboard.map(player => `
            <div class="leaderboard-item">
                <div class="rank rank-${player.rank}">#${player.rank}</div>
                <div class="player-info">
                    <div class="player-avatar">${player.avatar}</div>
                    <div>
                        <div class="player-name">${player.player}</div>
                        <div class="player-details">${player.wins} wins</div>
                    </div>
                </div>
                <div class="points">${player.points}</div>
                <div class="wins">${player.wins}</div>
            </div>
        `).join('');
    }

    handleFilterClick(button) {
        // Update active state
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        button.classList.add('active');

        const filter = button.dataset.filter;
        this.filterTournaments(filter);
    }

    filterTournaments(filter) {
        const cards = document.querySelectorAll('.tournament-card');
        
        cards.forEach(card => {
            let show = true;
            
            if (filter === 'active' && !card.dataset.status.includes('active')) {
                show = false;
            } else if (filter === 'upcoming' && !card.dataset.status.includes('upcoming')) {
                show = false;
            } else if (filter === 'free' && !card.dataset.fee.includes('free')) {
                show = false;
            }
            
            card.style.display = show ? 'block' : 'none';
        });
    }

    async handleTournamentJoin(tournamentId) {
        if (!this.currentUser) {
            this.showLoginModal();
            this.showNotification('Please login to join tournaments', 'warning');
            return;
        }

        const tournament = this.tournaments.find(t => t._id === tournamentId);
        
        if (!tournament) {
            this.showNotification('Tournament not found', 'error');
            return;
        }

        if (tournament.participants >= tournament.capacity) {
            this.showNotification('Tournament is full', 'error');
            return;
        }

        try {
            this.showLoading(true);
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Simulate successful join
            tournament.participants++;
            this.renderTournaments();
            
            this.showNotification(`Successfully joined ${tournament.name}!`, 'success');
            
        } catch (error) {
            console.error('Join tournament error:', error);
            this.showNotification('Failed to join tournament', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    updateUIForAuth() {
        const loginBtn = document.getElementById('loginBtn');
        if (this.currentUser) {
            loginBtn.innerHTML = `<i class="fas fa-user"></i> ${this.currentUser.name}`;
            loginBtn.onclick = () => {
                // In a real app, this would go to dashboard
                this.showNotification('Dashboard coming soon!', 'info');
            };
        } else {
            loginBtn.innerHTML = 'Login';
            loginBtn.onclick = () => this.showLoginModal();
        }
    }

    checkAuthStatus() {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');
        
        if (token && userData) {
            try {
                this.currentUser = JSON.parse(userData);
                this.updateUIForAuth();
            } catch (error) {
                console.error('Error parsing user data:', error);
                localStorage.removeItem('token');
                localStorage.removeItem('user');
            }
        }

        // Load saved theme
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'light') {
            this.toggleTheme(); // Switch to light theme
        }
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

        // Add styles if not already added
        if (!document.querySelector('#notification-styles')) {
            const styles = document.createElement('style');
            styles.id = 'notification-styles';
            styles.textContent = `
                .notification {
                    position: fixed;
                    top: 100px;
                    right: 20px;
                    background: var(--card-bg);
                    border-left: 4px solid;
                    border-radius: var(--border-radius);
                    padding: 1rem 1.5rem;
                    box-shadow: var(--shadow);
                    z-index: 3000;
                    animation: slideInRight 0.3s ease;
                    max-width: 400px;
                    border-left-color: var(--accent-color);
                }
                .notification-success { border-left-color: var(--success-color); }
                .notification-error { border-left-color: var(--error-color); }
                .notification-warning { border-left-color: var(--warning-color); }
                .notification-info { border-left-color: var(--accent-color); }
                .notification-content {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    color: var(--text-primary);
                }
                @keyframes slideInRight {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `;
            document.head.appendChild(styles);
        }

        document.body.appendChild(notification);

        // Auto remove after 5 seconds
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

    showLoading(show) {
        // Remove existing loader
        const existingLoader = document.querySelector('.loading-overlay');
        if (existingLoader) {
            existingLoader.remove();
        }

        if (show) {
            const loader = document.createElement('div');
            loader.className = 'loading-overlay';
            loader.innerHTML = `
                <div class="spinner"></div>
            `;

            // Add styles if not already added
            if (!document.querySelector('#loader-styles')) {
                const styles = document.createElement('style');
                styles.id = 'loader-styles';
                styles.textContent = `
                    .loading-overlay {
                        position: fixed;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: 100%;
                        background: rgba(0, 0, 0, 0.7);
                        backdrop-filter: blur(5px);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        z-index: 4000;
                    }
                    .spinner {
                        width: 50px;
                        height: 50px;
                        border: 4px solid rgba(255, 255, 255, 0.3);
                        border-top: 4px solid var(--accent-color);
                        border-radius: 50%;
                        animation: spin 1s linear infinite;
                    }
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                `;
                document.head.appendChild(styles);
            }

            document.body.appendChild(loader);
        }
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new TonaKikwetuApp();
});