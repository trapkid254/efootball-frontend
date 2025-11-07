// Authentication utility functions
class AuthManager {
    static isAuthenticated() {
        const token = localStorage.getItem('token');
        const user = localStorage.getItem('user');
        return !!(token && user);
    }

    static getCurrentUser() {
        const userData = localStorage.getItem('user');
        if (userData) {
            try {
                return JSON.parse(userData);
            } catch (error) {
                console.error('Error parsing user data:', error);
                return null;
            }
        }
        return null;
    }

    static isAdmin() {
        const user = this.getCurrentUser();
        return user && user.role === 'admin';
    }

    static redirectToLogin() {
        window.location.href = 'index.html#login';
    }

    static redirectToDashboard() {
        const user = this.getCurrentUser();
        if (user && user.role === 'admin') {
            window.location.href = 'admin.html';
        } else {
            window.location.href = 'dashboard.html';
        }
    }

    static logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = 'index.html';
    }

    static requireAuth() {
        if (!this.isAuthenticated()) {
            this.redirectToLogin();
            return false;
        }
        return true;
    }

    static requireAdmin() {
        if (!this.isAuthenticated()) {
            this.redirectToLogin();
            return false;
        }
        
        if (!this.isAdmin()) {
            window.location.href = 'dashboard.html';
            return false;
        }
        
        return true;
    }
}

// Update auth buttons on page load
document.addEventListener('DOMContentLoaded', function() {
    const authButton = document.getElementById('authButton');
    if (authButton) {
        if (AuthManager.isAuthenticated()) {
            const user = AuthManager.getCurrentUser();
            authButton.textContent = AuthManager.isAdmin() ? 'Admin Panel' : 'Dashboard';
            authButton.onclick = function() {
                AuthManager.redirectToDashboard();
            };
        } else {
            authButton.textContent = 'Login';
            authButton.onclick = function() {
                window.location.href = 'index.html#login';
            };
        }
    }
});

// Handle page protection
function protectPage() {
    if (!AuthManager.isAuthenticated()) {
        AuthManager.redirectToLogin();
        return false;
    }
    return true;
}

function protectAdminPage() {
    if (!AuthManager.isAuthenticated()) {
        AuthManager.redirectToLogin();
        return false;
    }
    
    if (!AuthManager.isAdmin()) {
        window.location.href = 'dashboard.html';
        return false;
    }
    
    return true;
}