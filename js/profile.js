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

    async loadUserProfile(maxRetries = 2, retryDelay = 1000) {
        let retryCount = 0;
        
        const loadProfile = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    throw new Error('No authentication token found. Please log in again.');
                }

                const apiUrl = `${window.API_BASE_URL || ''}/api/users/me`;
                console.log('Fetching user profile from:', apiUrl);
                
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
                
                const response = await fetch(apiUrl, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    credentials: 'include',
                    signal: controller.signal
                });
                
                clearTimeout(timeoutId);

                console.log('Response status:', response.status);
                
                if (!response.ok) {
                    let errorData;
                    try {
                        errorData = await response.json().catch(() => ({}));
                        console.error('Error response:', errorData);
                    } catch (e) {
                        console.error('Could not parse error response');
                    }
                    
                    if (response.status === 401) {
                        // Token might be expired or invalid
                        localStorage.removeItem('token');
                        localStorage.removeItem('user');
                        window.location.href = 'login.html';
                        return null;
                    }
                    
                    const error = new Error(errorData?.message || `Failed to fetch user profile: ${response.status} ${response.statusText}`);
                    error.isRetryable = response.status >= 500 || response.status === 0; // Retry on server errors or network issues
                    throw error;
                }

                const userData = await response.json();
                console.log('User data received:', userData);
                
                this.currentUser = userData;
                localStorage.setItem('user', JSON.stringify(this.currentUser));
                this.updateUI();
                return userData;
                
            } catch (error) {
                console.error('Error in loadProfile attempt:', {
                    message: error.message,
                    name: error.name,
                    stack: error.stack,
                    isRetryable: error.isRetryable !== false
                });
                
                if (error.isRetryable !== false) {
                    throw error;
                }
                
                // For non-retryable errors, show error immediately
                this.showNotification(error.message || 'Failed to load profile. Please try again.', 'error');
                return null;
            }
        };

        while (retryCount <= maxRetries) {
            try {
                return await loadProfile();
            } catch (error) {
                retryCount++;
                
                if (retryCount > maxRetries) {
                    console.error(`Failed after ${maxRetries} retries:`, error);
                    
                    if (error.name === 'AbortError') {
                        this.showNotification('Request timed out. The server is taking too long to respond.', 'error');
                    } else if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
                        console.error('Network error. Check if the server is running and accessible.');
                        console.error('Current API base URL:', window.API_BASE_URL || 'Not set (using relative URL)');
                        this.showNotification('Unable to connect to the server. Please check your internet connection and try again.', 'error');
                    } else {
                        this.showNotification(error.message || 'Failed to load profile. Please try again later.', 'error');
                    }
                    
                    // Try to show cached user data if available
                    const cachedUser = localStorage.getItem('user');
                    if (cachedUser) {
                        try {
                            this.currentUser = JSON.parse(cachedUser);
                            this.updateUI();
                            this.showNotification('Showing cached profile data. Some features may be limited.', 'warning');
                        } catch (e) {
                            console.error('Error parsing cached user data:', e);
                        }
                    }
                    
                    return null;
                }
                
                // Wait before retrying
                console.log(`Retrying in ${retryDelay}ms... (attempt ${retryCount}/${maxRetries})`);
                await new Promise(resolve => setTimeout(resolve, retryDelay));
                retryDelay *= 2; // Exponential backoff
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
        const fileInput = event.target;
        const file = fileInput.files[0];
        const userAvatar = document.getElementById('userAvatar');
        const uploadBtn = document.querySelector('#avatarUploadBtn');
        let originalBtnHTML = '';

        if (!file) return;

        // Store original button HTML for restoring later
        if (uploadBtn) {
            originalBtnHTML = uploadBtn.innerHTML;
            uploadBtn.disabled = true;
            uploadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading...';
        }

        try {
            // Validate file type
            const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
            if (!validTypes.includes(file.type)) {
                throw new Error('Please upload a valid image file (JPEG, PNG, or GIF)');
            }

            // Validate file size (max 10MB)
            const maxSize = 10 * 1024 * 1024; // 10MB
            if (file.size > maxSize) {
                throw new Error('Image size should be less than 10MB');
            }

            const formData = new FormData();
            formData.append('avatar', file);

            // Show preview
            const reader = new FileReader();
            reader.onload = (e) => {
                if (userAvatar) {
                    userAvatar.style.backgroundImage = `url(${e.target.result})`;
                }
            };
            reader.readAsDataURL(file);

            // Upload to server
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('You must be logged in to upload an avatar');
            }

            const response = await fetch(`${window.API_BASE_URL || ''}/api/users/avatar`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'Failed to upload avatar. Please try again.');
            }


            // Get the response as JSON
            const result = await response.json();
            
            if (result.avatar) {
                // Construct the full avatar URL
                const serverAvatarUrl = `${window.API_BASE_URL || ''}/uploads/avatars/${result.avatar}`;
                
                // Update the current user data
                this.currentUser.avatarUrl = serverAvatarUrl;
                
                // Update the UI with the new avatar
                if (userAvatar) {
                    this.setAvatarImage(userAvatar, serverAvatarUrl);
                }
                
                // Update local storage
                const user = JSON.parse(localStorage.getItem('user') || '{}');
                user.avatarUrl = serverAvatarUrl;
                localStorage.setItem('user', JSON.stringify(user));
                
                this.showNotification('✅ Profile picture updated successfully!', 'success');
            } else {
                throw new Error('No avatar URL returned from server');
            }
        } catch (error) {
            if (error instanceof SyntaxError) {
                console.log('Could not parse JSON response, using blob URL');
            } else {
                console.error('Error uploading avatar:', error);
                this.showNotification(`❌ ${error.message || 'Failed to upload avatar. Please try again.'}`, 'error');
                
                // Revert to default avatar on error
                const userAvatar = document.getElementById('userAvatar');
                if (userAvatar) {
                    userAvatar.style.backgroundImage = '';
                    userAvatar.textContent = (this.currentUser?.efootballId || 'U').charAt(0).toUpperCase();
                }
            }
        } finally {
            // Reset the file input and button state
            if (fileInput) fileInput.value = '';
            if (uploadBtn) {
                uploadBtn.disabled = false;
                uploadBtn.innerHTML = originalBtnHTML || 'Change Avatar';
            }
        }
    }

    async updateAvatarUI() {
        const userAvatar = document.getElementById('userAvatar');
        if (!userAvatar) return;
        
        // First, try to use the blob URL if available (from recent upload)
        if (this.currentUser?.avatarBlobUrl) {
            this.setAvatarImage(userAvatar, this.currentUser.avatarBlobUrl);
            // Don't return here, try to load the server URL in the background
        }
        
        if (this.currentUser?.avatarUrl) {
            try {
                // First try to load the avatar directly
                let avatarUrl = this.currentUser.avatarUrl;
                
                // If it's a relative URL, make it absolute
                if (!avatarUrl.startsWith('http') && !avatarUrl.startsWith('data:')) {
                    const baseUrl = window.API_BASE_URL || '';
                    avatarUrl = `${baseUrl}${avatarUrl.startsWith('/') ? '' : '/'}${avatarUrl}`;
                }
                
                // Add cache-busting parameter
                const separator = avatarUrl.includes('?') ? '&' : '?';
                const timestamp = new Date().getTime();
                avatarUrl = `${avatarUrl}${separator}t=${timestamp}`;
                
                // Try to load the image directly first
                const img = new Image();
                img.crossOrigin = 'anonymous';
                
                // Set a timeout for the image load
                const loadPromise = new Promise((resolve) => {
                    const timer = setTimeout(() => {
                        img.onload = null;
                        img.onerror = null;
                        resolve(false);
                    }, 5000);
                    
                    img.onload = () => {
                        clearTimeout(timer);
                        resolve(true);
                    };
                    img.onerror = () => {
                        clearTimeout(timer);
                        resolve(false);
                    };
                    img.src = avatarUrl;
                });
                
                const loaded = await loadPromise;
                
                if (loaded) {
                    this.setAvatarImage(userAvatar, avatarUrl);
                    return;
                }
                
                // If direct load fails, show initials
                this.showInitials(userAvatar);
                
            } catch (error) {
                console.error('Error loading avatar:', error);
                this.showInitials(userAvatar);
            }
        } else {
            this.showInitials(userAvatar);
        }
    }
    
    async loadAvatarImage(url, token = null) {
        return new Promise((resolve) => {
            const img = new Image();
            
            // If we have a token, add it to the headers
            if (token) {
                img.crossOrigin = 'use-credentials';
                const xhr = new XMLHttpRequest();
                xhr.open('GET', url, true);
                xhr.responseType = 'blob';
                xhr.setRequestHeader('Authorization', `Bearer ${token}`);
                xhr.onload = function() {
                    if (this.status === 200) {
                        const blob = this.response;
                        const objectUrl = URL.createObjectURL(blob);
                        resolve(objectUrl);
                    } else {
                        resolve(null);
                    }
                };
                xhr.onerror = function() {
                    resolve(null);
                };
                xhr.send();
            } else {
                // Try with anonymous CORS first
                img.crossOrigin = 'anonymous';
                img.onload = function() { resolve(url); };
                img.onerror = function() { resolve(null); };
                img.src = url;
            }
        });
    }
    
    setAvatarImage(element, imageUrl) {
        if (!element || !imageUrl) return;
        
        // If it's a blob URL or data URL, use it directly
        if (imageUrl.startsWith('blob:') || imageUrl.startsWith('data:')) {
            element.style.backgroundImage = `url(${imageUrl})`;
        } else {
            // For server URLs, add cache-busting parameter
            const separator = imageUrl.includes('?') ? '&' : '?';
            const timestamp = new Date().getTime();
            const urlWithCacheBust = `${imageUrl}${separator}t=${timestamp}`;
            
            // Try to load with CORS first
            const img = new Image();
            const self = this;
            
            img.crossOrigin = 'anonymous';
            
            img.onload = function() {
                element.style.backgroundImage = `url(${urlWithCacheBust})`;
            };
            
            img.onerror = function() {
                // If CORS fails, try without CORS
                console.log('CORS failed, trying without CORS');
                const imgNoCors = new Image();
                imgNoCors.onload = function() {
                    element.style.backgroundImage = `url(${urlWithCacheBust})`;
                };
                imgNoCors.onerror = function() {
                    console.error('Failed to load avatar image');
                    this.showInitials(element);
                }.bind(this);
                imgNoCors.src = urlWithCacheBust;
            }.bind(this);
        }
        
        element.style.backgroundSize = 'cover';
        element.style.backgroundPosition = 'center';
        element.textContent = '';
    }
    
    showInitials(element) {
        if (!element) return;
        element.style.backgroundImage = '';
        element.style.backgroundColor = '#e0e0e0';
        element.style.display = 'flex';
        element.style.alignItems = 'center';
        element.style.justifyContent = 'center';
        element.style.color = '#555';
        element.style.fontWeight = 'bold';
        element.style.fontSize = '24px';
        
        const username = this.currentUser && (this.currentUser.efootballId || this.currentUser.username || this.currentUser.email || 'U');
        element.textContent = username.charAt(0).toUpperCase();
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
document.addEventListener('DOMContentLoaded', function() {
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
