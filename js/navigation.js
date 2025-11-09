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
            // Handle modal close when clicking outside
            const loginModal = document.getElementById('loginModal');
            if (loginModal && loginModal.style.display === 'block' && e.target === loginModal) {
                this.hideModal(loginModal);
            }
            
            // Handle mobile menu close when clicking outside
            if (this.mobileMenuOpen && 
                !this.navMenu.contains(e.target) && 
                !this.mobileMenuBtn.contains(e.target)) {
                this.closeMobileMenu();
            }
        });

        // Close modals when clicking the close button
        document.querySelectorAll('.modal .close').forEach(closeBtn => {
            closeBtn.addEventListener('click', () => {
                const modal = closeBtn.closest('.modal');
                if (modal) {
                    this.hideModal(modal);
                }
            });
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

        // Close modal with Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const activeModal = document.querySelector('.modal[style*="display: block"]');
                if (activeModal) {
                    this.hideModal(activeModal);
                }
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
    
    /**
     * Hides a modal and restores body scrolling
     * @param {HTMLElement} modal - The modal element to hide
     */
    hideModal(modal) {
        if (modal) {
            modal.style.display = 'none';
            document.body.classList.remove('modal-open');
            document.body.style.paddingRight = ''; // Reset any padding added for scrollbar
        }
    }

    handleAuthButtonClick() {
        const token = localStorage.getItem('token');
        if (token) {
            // User is logged in, show logout confirmation
            if (confirm('Are you sure you want to log out?')) {
                AuthManager.logout();
            }
            return;
        }

        // User is not logged in, show login modal
        const loginModal = document.getElementById('loginModal');
        if (!loginModal) {
            console.error('Login modal not found!');
            window.location.href = 'index.html#login';
            return;
        }

        // Add modal styles if they don't exist
        if (!document.getElementById('modal-styles')) {
            const style = document.createElement('style');
            style.id = 'modal-styles';
            style.textContent = `
                .modal {
                    display: none;
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background-color: rgba(0, 0, 0, 0.7);
                    z-index: 1000;
                    overflow-y: auto;
                    padding: 20px;
                    box-sizing: border-box;
                }
                .modal-content {
                    background: var(--bg-secondary);
                    padding: 2rem;
                    border-radius: 8px;
                    width: 90%;
                    max-width: 500px;
                    position: relative;
                    margin: 20px auto;
                    color: var(--text-primary);
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                }
                .close {
                    position: absolute;
                    top: 10px;
                    right: 15px;
                    font-size: 1.5rem;
                    cursor: pointer;
                    color: var(--text-primary);
                    text-decoration: none;
                }
                .close:hover {
                    color: var(--accent-color);
                }
                .modal-open {
                    overflow: hidden;
                    padding-right: 15px; /* Prevent content shift when scrollbar disappears */
                }
                @media (max-width: 768px) {
                    .modal-content {
                        width: 95%;
                        padding: 1.5rem;
                    }
                }
            `;
            document.head.appendChild(style);
        }

        // Show the modal
        loginModal.style.display = 'flex';
        loginModal.style.justifyContent = 'center';
        loginModal.style.alignItems = 'flex-start';
        loginModal.style.paddingTop = '50px';
        
        // Add class to body to handle scroll
        document.body.classList.add('modal-open');
        
        // Focus on first input field
        const firstInput = loginModal.querySelector('input');
        if (firstInput) {
            setTimeout(() => firstInput.focus(), 100);
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
