class ProfileManager {
    constructor() {
        this.currentUser = null;
        this.init();
    }

    async init() {
        await this.loadUserProfile();
        this.setupEventListeners();
        this.updateUI();
    }

    async loadUserProfile() {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No authentication token found. Please log in again.');
            }

            const apiUrl = `${window.API_BASE_URL || ''}/api/users/me`;
            console.log('Fetching user profile from:', apiUrl);
            
            const response = await fetch(apiUrl, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                credentials: 'include' // Include cookies if using session-based auth
            });

            console.log('Response status:', response.status);
            
            if (!response.ok) {
                let errorData;
                try {
                    errorData = await response.json();
                    console.error('Error response:', errorData);
                } catch (e) {
                    console.error('Could not parse error response');
                }
                
                if (response.status === 401) {
                    // Token might be expired or invalid
                    localStorage.removeItem('token');
                    window.location.href = 'login.html';
                    return;
                }
                
                throw new Error(errorData?.message || `Failed to fetch user profile: ${response.status} ${response.statusText}`);
            }

            const userData = await response.json();
            console.log('User data received:', userData);
            
            this.currentUser = userData;
            localStorage.setItem('user', JSON.stringify(this.currentUser));
            this.updateUI();
        } catch (error) {
            console.error('Error loading user profile:', {
                message: error.message,
                name: error.name,
                stack: error.stack
            });
            this.showNotification(error.message || 'Failed to load profile. Please try again.', 'error');
            
            // If it's a network error, try to show more details
            if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
                console.error('Network error. Check if the server is running and accessible.');
                console.error('Current API base URL:', window.API_BASE_URL || 'Not set (using relative URL)');
            }
        }
    }

    updateUI() {
        if (!this.currentUser) return;

        // Update profile header
        const nameElement = document.getElementById('userDisplayName');
        const efootballIdElement = document.getElementById('userEfootballId');
        const whatsappElement = document.getElementById('userWhatsApp');
        const userAvatar = document.getElementById('userAvatar');

        if (nameElement) nameElement.textContent = this.currentUser.efootballId || 'Player';
        if (efootballIdElement) efootballIdElement.textContent = `Efootball ID: ${this.currentUser.efootballId || 'Not set'}`;
        if (whatsappElement) whatsappElement.textContent = `WhatsApp: ${this.currentUser.whatsapp || 'Not set'}`;
        if (userAvatar) userAvatar.textContent = (this.currentUser.efootballId || 'U').charAt(0).toUpperCase();

        // Update stats
        this.updateStats();
    }

    updateStats() {
        if (!this.currentUser) return;

        const stats = this.currentUser.stats || {};
        
        // Update matches played
        const matchesPlayedElement = document.getElementById('matchesPlayed');
        if (matchesPlayedElement) matchesPlayedElement.textContent = stats.matchesPlayed || 0;
        
        // Update wins
        const winsElement = document.getElementById('wins');
        if (winsElement) winsElement.textContent = stats.wins || 0;
        
        // Update losses
        const lossesElement = document.getElementById('losses');
        if (lossesElement) lossesElement.textContent = (stats.matchesPlayed || 0) - (stats.wins || 0);
        
        // Update win rate
        const winRateElement = document.getElementById('winRate');
        if (winRateElement) {
            const winRate = stats.matchesPlayed > 0 
                ? Math.round(((stats.wins || 0) / stats.matchesPlayed) * 100) 
                : 0;
            winRateElement.textContent = `${winRate}%`;
        }
    }

    setupEventListeners() {
        // Theme toggle
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', (e) => {
                e.preventDefault();
                document.body.classList.toggle('dark-theme');
                document.body.classList.toggle('light-theme');
                // Save theme preference
                const isDark = document.body.classList.contains('dark-theme');
                localStorage.setItem('theme', isDark ? 'dark' : 'light');
            });
        }

        // Logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = 'index.html';
            });
        }

        // Tab switching
        const tabButtons = document.querySelectorAll('.tab-btn');
        tabButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const tabName = e.target.getAttribute('data-tab');
                this.switchTab(tabName);
            });
        });

        // Avatar upload
        const avatarUploadBtn = document.getElementById('avatarUploadBtn');
        const avatarInput = document.getElementById('avatarInput');
        if (avatarUploadBtn && avatarInput) {
            avatarUploadBtn.addEventListener('click', () => avatarInput.click());
            avatarInput.addEventListener('change', (e) => this.handleAvatarUpload(e));
        }
    }

    switchTab(tabName) {
        // Hide all tab contents
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.style.display = 'none';
        });
        
        // Remove active class from all buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Show the selected tab content
        const selectedTab = document.getElementById(`${tabName}-tab`);
        if (selectedTab) {
            selectedTab.style.display = 'block';
        }
        
        // Add active class to the clicked button
        const activeButton = document.querySelector(`.tab-btn[data-tab="${tabName}"]`);
        if (activeButton) {
            activeButton.classList.add('active');
        }
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    async handleAvatarUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        // Validate file type
        const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
        if (!validTypes.includes(file.type)) {
            this.showNotification('❌ Invalid file type. Please upload a JPEG, PNG, or GIF image.', 'error');
            return;
        }

        // Validate file size (max 10MB)
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
            this.showNotification(`❌ Image size (${this.formatFileSize(file.size)}) exceeds the 10MB limit`, 'error');
            return;
        }
        
        // Show loading state
        const uploadBtn = document.getElementById('avatarUploadBtn');
        const originalHTML = uploadBtn.innerHTML;
        uploadBtn.disabled = true;
        uploadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading...';

        try {
            // Create form data
            const formData = new FormData();
            formData.append('avatar', file);
            
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('Session expired. Please log in again.');
            }

            // Show preview
            const reader = new FileReader();
            reader.onload = (e) => {
                const userAvatar = document.getElementById('userAvatar');
                if (userAvatar) {
                    userAvatar.style.backgroundImage = `url(${e.target.result})`;
                    userAvatar.style.backgroundSize = 'cover';
                    userAvatar.style.backgroundPosition = 'center';
                    userAvatar.textContent = '';
                }
            };
            reader.readAsDataURL(file);

            // Upload to server
            const response = await fetch(`${window.API_BASE_URL || ''}/api/users/avatar`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'Failed to upload avatar. The server returned an error.');
            }

            const result = await response.json();
            this.currentUser = { ...this.currentUser, ...result };
            
            // Update user in local storage
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            localStorage.setItem('user', JSON.stringify({ ...user, ...result }));
            
            this.showNotification('✅ Profile picture updated successfully!', 'success');
        } catch (error) {
            console.error('Error uploading avatar:', error);
            this.showNotification(`❌ ${error.message || 'Failed to upload avatar. Please try again.'}`, 'error');
        } catch (error) {
            console.error('Error uploading avatar:', error);
            this.showNotification(`❌ ${error.message || 'Failed to upload avatar. Please try again.'}`, 'error');
            
            // Revert to default avatar on error
            const userAvatar = document.getElementById('userAvatar');
            if (userAvatar) {
                userAvatar.style.backgroundImage = '';
                userAvatar.textContent = (this.currentUser?.efootballId || 'U').charAt(0).toUpperCase();
            }
        } finally {
            // Reset the file input and button state
            event.target.value = '';
            if (uploadBtn) {
                uploadBtn.disabled = false;
                uploadBtn.innerHTML = originalHTML;
            }
            }
            // Reset file input
            event.target.value = '';
        }
    }

    updateAvatarUI() {
        const userAvatar = document.getElementById('userAvatar');
        if (!userAvatar) return;

        if (this.currentUser.avatarUrl) {
            userAvatar.style.backgroundImage = `url(${this.currentUser.avatarUrl})`;
            userAvatar.textContent = '';
        } else {
            userAvatar.style.backgroundImage = '';
            userAvatar.textContent = (this.currentUser.efootballId || 'U').charAt(0).toUpperCase();
        }
    }

    showNotification(message, type = 'info') {
        // Remove existing notifications
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }

        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;

        document.body.appendChild(notification);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => notification.remove(), 300);
        }, 5000);
    }
}

// Initialize the profile manager when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Check if user is authenticated
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'index.html#login';
        return;
    }

    // Initialize profile manager
    window.profileManager = new ProfileManager();

    // Set initial theme
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.body.className = `${savedTheme}-theme`;

    // Update theme toggle icon
    const themeIcon = document.querySelector('#themeToggle i');
    if (themeIcon) {
        themeIcon.className = savedTheme === 'dark' ? 'fas fa-moon' : 'fas fa-sun';
    }
});
