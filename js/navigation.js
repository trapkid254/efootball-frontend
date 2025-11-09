/**
 * Navigation and Mobile Menu Handler
 * Ensures consistent navigation and mobile menu functionality across all pages
 */

class NavigationManager {
    constructor() {
        this.mobileMenuOpen = false;
        this.currentPage = this.getCurrentPage();
        this.init();
    }
    
    getCurrentPage() {
        const path = window.location.pathname;
        if (path.endsWith('index.html') || path.endsWith('/')) return 'home';
        if (path.includes('tournament')) return 'tournaments';
        if (path.includes('matches')) return 'matches';
        if (path.includes('leaderboard')) return 'leaderboard';
        if (path.includes('profile')) return 'profile';
        return 'home';
    }

    init() {
        // Initialize mobile menu button and navigation elements
        this.mobileMenuBtn = document.querySelector('.mobile-menu-btn');
        this.navMenu = document.querySelector('.nav-menu');
        this.authButton = document.getElementById('authButton') || document.getElementById('loginBtn');
        
        // Set up event listeners and update UI
        this.setupEventListeners();
        this.updateAuthButton();
        this.updateActiveLink();
        this.checkAuthState();
    }

    setupEventListeners() {
        // Mobile menu toggle
        if (this.mobileMenuBtn) {
            this.mobileMenuBtn.addEventListener('click', () => this.toggleMobileMenu());
        }

        // Close mobile menu when clicking outside
        document.addEventListener('click', (e) => {
            if (this.mobileMenuOpen && 
                !this.navMenu.contains(e.target) && 
                !this.mobileMenuBtn.contains(e.target)) {
                this.closeMobileMenu();
            }
        });

        // Close mobile menu when clicking on a nav link
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => this.closeMobileMenu());
        });

        // Handle auth button click
        if (this.authButton) {
            this.authButton.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleAuthButtonClick();
            });
        }

        // Handle theme toggle
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => this.toggleTheme());
        }

        // Close mobile menu on window resize if it becomes desktop view
        window.addEventListener('resize', () => {
            if (window.innerWidth > 768) {
                this.closeMobileMenu();
            }
        });
    }

    toggleMobileMenu() {
        this.mobileMenuOpen = !this.mobileMenuOpen;
        if (this.mobileMenuOpen) {
            this.navMenu.style.display = 'flex';
            this.navMenu.style.flexDirection = 'column';
            this.navMenu.style.position = 'absolute';
            this.navMenu.style.top = '70px';
            this.navMenu.style.right = '20px';
            this.navMenu.style.background = 'var(--bg-secondary)';
            this.navMenu.style.padding = '1rem';
            this.navMenu.style.borderRadius = '8px';
            this.navMenu.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)';
            this.navMenu.style.zIndex = '1000';
            this.navMenu.style.gap = '1rem';
        } else {
            this.closeMobileMenu();
        }
    }

    closeMobileMenu() {
        this.mobileMenuOpen = false;
        if (window.innerWidth <= 768) {
            this.navMenu.style.display = 'none';
        } else {
            this.navMenu.style.display = 'flex';
            this.navMenu.style.flexDirection = 'row';
            this.navMenu.style.position = 'static';
            this.navMenu.style.background = 'transparent';
            this.navMenu.style.padding = '0';
            this.navMenu.style.boxShadow = 'none';
        }
    }

    handleAuthButtonClick(e) {
        e.preventDefault();
        const token = localStorage.getItem('token');
        
        if (token) {
            // User is logged in, show logout confirmation
            if (confirm('Are you sure you want to log out?')) {
                AuthManager.logout();
                // Update UI immediately
                this.updateAuthButton();
                // If on a protected page, redirect to home
                if (['profile', 'matches'].includes(this.currentPage)) {
                    window.location.href = 'index.html';
                }
            }
        } else {
            // User is not logged in, redirect to login
            const currentPath = window.location.pathname;
            const returnTo = currentPath.endsWith('index.html') ? '' : `?returnTo=${encodeURIComponent(currentPath)}`;
            window.location.href = `index.html#login${returnTo}`;
        }
    }

    updateAuthButton() {
        if (!this.authButton) return;
        
        const token = localStorage.getItem('token');
        if (token) {
            const user = AuthManager.getCurrentUser();
            if (user) {
                this.authButton.textContent = 'Logout';
                this.authButton.title = `Logged in as ${user.username || user.whatsapp}`;
                this.authButton.classList.add('logged-in');
            }
        } else {
            this.authButton.textContent = 'Login';
            this.authButton.title = 'Login to your account';
            this.authButton.classList.remove('logged-in');
        }
    }
    
    updateActiveLink() {
        // Remove active class from all links
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
            if (link.dataset.page === this.currentPage) {
                link.classList.add('active');
            }
        });
    }
    
    checkAuthState() {
        const protectedPages = ['profile', 'matches'];
        const token = localStorage.getItem('token');
        
        if (protectedPages.includes(this.currentPage) && !token) {
            window.location.href = 'index.html#login';
            return false;
        }
        return true;
    }

    toggleTheme() {
        document.body.classList.toggle('light-theme');
        const isLight = document.body.classList.contains('light-theme');
        localStorage.setItem('theme', isLight ? 'light' : 'dark');
        
        const themeIcon = document.querySelector('.theme-toggle i');
        if (themeIcon) {
            themeIcon.className = isLight ? 'fas fa-moon' : 'fas fa-sun';
        }
    }
}

// Initialize navigation manager when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // Create default navigation if not already present
    const navbar = document.querySelector('.navbar');
    if (!navbar || !navbar.hasChildNodes()) {
        // Create default navigation structure
        const navHTML = `
            <div class="nav-container">
                <a href="index.html" class="nav-logo">
                    <div class="logo-placeholder">TK</div>
                    <span>TONA KIKWETU</span>
                </a>
                <div class="nav-menu">
                    <a href="index.html" class="nav-link" data-page="home">Home</a>
                    <a href="tournament.html" class="nav-link" data-page="tournaments">Tournaments</a>
                    <a href="matches.html" class="nav-link" data-page="matches">My Matches</a>
                    <a href="leaderboard.html" class="nav-link" data-page="leaderboard">Leaderboard</a>
                    <a href="profile.html" class="nav-link" data-page="profile">Profile</a>
                    <button class="theme-toggle" id="themeToggle" aria-label="Toggle theme">
                        <i class="fas fa-moon"></i>
                    </button>
                    <button class="btn-login" id="authButton">Login</button>
                </div>
                <button class="mobile-menu-btn" aria-label="Toggle menu">
                    <i class="fas fa-bars"></i>
                </button>
            </div>
        `;
        
        if (navbar) {
            navbar.innerHTML = navHTML;
        } else {
            // Create navbar if it doesn't exist
            const newNav = document.createElement('nav');
            newNav.className = 'navbar';
            newNav.innerHTML = navHTML;
            document.body.insertBefore(newNav, document.body.firstChild);
        }
    }
    
    // Initialize navigation manager
    window.navigationManager = new NavigationManager();
    
    // Apply saved theme
    const savedTheme = localStorage.getItem('theme') || 'dark';
    if (savedTheme === 'light') {
        document.body.classList.add('light-theme');
    }
    
    // Update theme icon
    const updateThemeIcon = () => {
        const themeIcon = document.querySelector('.theme-toggle i');
        if (themeIcon) {
            const isLight = document.body.classList.contains('light-theme');
            themeIcon.className = isLight ? 'fas fa-sun' : 'fas fa-moon';
        }
    };
    
    // Initial update
    updateThemeIcon();
    
    // Watch for theme changes
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.attributeName === 'class') {
                updateThemeIcon();
            }
        });
    });
    
    observer.observe(document.body, {
        attributes: true,
        attributeFilter: ['class']
    });
});
