/**
 * Navigation and Mobile Menu Handler
 * Ensures consistent navigation and mobile menu functionality across all pages
 */

class NavigationManager {
    constructor() {
        this.mobileMenuOpen = false;
        this.init();
    }

    init() {
        // Initialize mobile menu button
        this.mobileMenuBtn = document.querySelector('.mobile-menu-btn');
        this.navMenu = document.querySelector('.nav-menu');
        this.authButton = document.getElementById('authButton') || document.getElementById('loginBtn');
        
        // Set up event listeners
        this.setupEventListeners();
        this.updateAuthButton();
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

    handleAuthButtonClick() {
        const token = localStorage.getItem('token');
        if (token) {
            // User is logged in, show logout confirmation or profile
            if (confirm('Are you sure you want to log out?')) {
                AuthManager.logout();
            }
        } else {
            // User is not logged in, redirect to login
            window.location.href = 'index.html#login';
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
            }
        } else {
            this.authButton.textContent = 'Login';
            this.authButton.title = 'Login to your account';
        }
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
    window.navigationManager = new NavigationManager();
    
    // Apply saved theme
    const savedTheme = localStorage.getItem('theme') || 'dark';
    if (savedTheme === 'light') {
        document.body.classList.add('light-theme');
    }
    
    // Update theme icon
    const themeIcon = document.querySelector('.theme-toggle i');
    if (themeIcon) {
        themeIcon.className = savedTheme === 'light' ? 'fas fa-sun' : 'fas fa-moon';
    }
});
