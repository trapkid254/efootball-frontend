/**
 * Navigation and Mobile Menu Handler
 * Ensures consistent navigation and mobile menu functionality across all pages
 */

class NavigationManager {
    constructor() {
        this.mobileMenuOpen = false;
        this.userDropdownOpen = false;
        this.init();
    }

    init() {
        // Initialize mobile menu button (works for both user and admin pages)
        this.mobileMenuBtn = document.querySelector('.mobile-menu-btn') || document.getElementById('hamburger');
        this.navMenu = document.querySelector('.nav-menu');
        this.authButton = document.getElementById('authButton') || document.getElementById('loginBtn');

        // Set up event listeners
        this.setupEventListeners();
        this.updateAuthButton();
    }

    setupEventListeners() {
        // Check if this is an admin page
        const isAdminPage = document.querySelector('.admin-navbar') !== null;

        // Mobile menu toggle (skip on admin pages as they handle their own hamburger menu)
        if (this.mobileMenuBtn && !isAdminPage) {
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

            // Handle user dropdown close when clicking outside
            const userMenu = document.getElementById('userMenu');
            const userDropdown = document.getElementById('userDropdown');
            if (this.userDropdownOpen &&
                userMenu && !userMenu.contains(e.target)) {
                this.closeUserDropdown();
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

        // Handle user button click
        const userBtn = document.getElementById('userBtn');
        if (userBtn) {
            userBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggleUserDropdown();
            });
        }

        // Handle logout button click
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleLogout();
            });
        }

        // Close mobile menu on window resize if it becomes desktop view (skip on admin pages)
        if (!isAdminPage) {
            window.addEventListener('resize', () => {
                if (window.innerWidth > 768) {
                    this.closeMobileMenu();
                }
            });
        }

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
                if (typeof AuthManager !== 'undefined' && typeof AuthManager.logout === 'function') {
                    AuthManager.logout();
                } else {
                    // Fallback logout if AuthManager is not available
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    window.location.reload();
                }
            }
            return;
        }

        // Check if we're on the index page
        const isIndexPage = window.location.pathname.endsWith('index.html') || 
                           window.location.pathname.endsWith('/') ||
                           window.location.pathname === '';

        // If not on index page, redirect to index with login hash
        if (!isIndexPage) {
            window.location.href = 'index.html#login';
            return;
        }

        // On index page, show the login modal
        const loginModal = document.getElementById('loginModal');
        if (!loginModal) {
            console.error('Login modal not found!');
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
                    z-index: 1001;
                }
                .close:hover {
                    color: var(--accent-color);
                }
                .modal-open {
                    overflow: hidden;
                    padding-right: 15px;
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
        
        // Prevent default and stop propagation
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }
    }

    updateAuthButton() {
        // Check if this is an admin page
        const isAdminPage = document.querySelector('.admin-navbar') !== null;

        if (isAdminPage) {
            // Admin pages don't need user menu updates, just ensure hamburger works
            return;
        }

        // Handle user pages
        const userMenu = document.getElementById('userMenu');
        const loginBtn = document.getElementById('loginBtn');
        const userDisplayName = document.getElementById('userDisplayName');
        const userBtn = document.getElementById('userBtn');

        const token = localStorage.getItem('token');
        if (token) {
            const user = AuthManager.getCurrentUser();
            if (user && user.efootballId) {
                // Show user menu with efootball ID
                if (userMenu) userMenu.style.display = 'flex';
                if (loginBtn) loginBtn.style.display = 'none';
                if (userDisplayName) userDisplayName.textContent = user.efootballId;
                if (userBtn) userBtn.title = `Logged in as ${user.efootballId}`;
            } else {
                // Fallback if no user data
                if (userMenu) userMenu.style.display = 'none';
                if (loginBtn) loginBtn.style.display = 'inline-block';
            }
        } else {
            // Show login button
            if (userMenu) userMenu.style.display = 'none';
            if (loginBtn) loginBtn.style.display = 'inline-block';
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

    toggleUserDropdown() {
        const userDropdown = document.getElementById('userDropdown');
        const userBtn = document.getElementById('userBtn');

        if (!userDropdown || !userBtn) return;

        this.userDropdownOpen = !this.userDropdownOpen;

        if (this.userDropdownOpen) {
            userDropdown.classList.add('show');
            userBtn.classList.add('active');
        } else {
            this.closeUserDropdown();
        }
    }

    closeUserDropdown() {
        const userDropdown = document.getElementById('userDropdown');
        const userBtn = document.getElementById('userBtn');

        this.userDropdownOpen = false;

        if (userDropdown) {
            userDropdown.classList.remove('show');
        }
        if (userBtn) {
            userBtn.classList.remove('active');
        }
    }

    handleLogout() {
        if (confirm('Are you sure you want to log out?')) {
            if (typeof AuthManager !== 'undefined' && typeof AuthManager.logout === 'function') {
                AuthManager.logout();
            } else {
                // Fallback logout
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.reload();
            }
        }
        this.closeUserDropdown();
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
