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
        console.log('loadUserProfile called');
        
        // First try to load from localStorage
        const cachedUser = JSON.parse(localStorage.getItem('user') || '{}');
        if (cachedUser) {
            console.log('Found cached user in localStorage:', cachedUser);
            this.currentUser = { ...cachedUser };
            await this.updateAvatarUI();
        }
        
        let retryCount = 0;
        let lastError = null;

        const loadProfile = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    throw new Error('No authentication token found. Please log in again.');
                }

                const apiUrl = `${window.API_BASE_URL || ''}/api/users/me`;
                const storedToken = localStorage.getItem('token');
                console.log('🔍 Profile API call:', {
                    apiUrl: apiUrl,
                    apiBaseUrl: window.API_BASE_URL,
                    hostname: window.location.hostname,
                    hasToken: !!storedToken,
                    tokenLength: storedToken ? storedToken.length : 0,
                    fullUrl: window.location.href
                });
                
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
                        // Redirect to home page with login modal
                        window.location.href = 'index.html#login';
                        return null;
                    }
                    
                    const error = new Error(errorData?.message || `Failed to fetch user profile: ${response.status} ${response.statusText}`);
                    error.isRetryable = response.status >= 500 || response.status === 0; // Retry on server errors or network issues
                    throw error;
                }

                const userData = await response.json();
                console.log('User data received:', userData);
                
                // Ensure avatar URL is properly formatted
                if (userData.avatarUrl && !userData.avatarUrl.startsWith('http')) {
                    userData.avatarUrl = `${window.API_BASE_URL || ''}${userData.avatarUrl.startsWith('/') ? '' : '/'}${userData.avatarUrl}`;
                    console.log('Formatted avatar URL:', userData.avatarUrl);
                }
                
                this.currentUser = userData;
                localStorage.setItem('user', JSON.stringify(this.currentUser));
                
                // Update the UI with the latest user data
                this.updateUI();
                
                // Update the avatar UI specifically
                await this.updateAvatarUI();
                
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

        // Update form fields
        this.populateFormFields();

        // Update stats
        this.updateStats();
    }

    populateFormFields() {
        if (!this.currentUser) return;

        // Populate profile form
        const efootballIdField = document.getElementById('efootballId');
        const whatsappField = document.getElementById('whatsapp');

        if (efootballIdField) efootballIdField.value = this.currentUser.efootballId || '';
        if (whatsappField) whatsappField.value = this.currentUser.whatsapp || '';
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

        // Profile form submission
        const profileForm = document.getElementById('profileForm');
        if (profileForm) {
            profileForm.addEventListener('submit', (e) => this.handleProfileUpdate(e));
        }

        // Password form submission
        const passwordForm = document.getElementById('passwordForm');
        if (passwordForm) {
            passwordForm.addEventListener('submit', (e) => this.handlePasswordChange(e));
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

        // Load data for specific tabs
        if (tabName === 'tournaments') {
            this.loadUserTournaments();
        } else if (tabName === 'history') {
            this.loadMatchHistory();
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
        console.log('handleAvatarUpload called');
        const fileInput = event.target;
        const file = fileInput.files[0];
        const userAvatar = document.getElementById('userAvatar');
        const uploadBtn = document.querySelector('#avatarUploadBtn');
        let originalBtnHTML = '';

        if (!file) return;

        // Store original button HTML for restoring later
        if (uploadBtn) {
            originalBtnHTML = uploadBtn.innerHTML;
        }

        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            this.showNotification('❌ Image size should be less than 10MB', 'error');
            return;
        }

        const formData = new FormData();
        formData.append('avatar', file);

        try {
            // Show loading state
            if (uploadBtn) {
                uploadBtn.disabled = true;
                uploadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading...';
            }

            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No authentication token found');
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
                throw new Error(errorData.message || 'Failed to upload avatar');
            }

            const result = await response.json();
            console.log('Avatar upload response:', result);
            
            if (result.avatarUrl) {
                // Make sure the avatar URL is absolute
                let avatarUrl = result.avatarUrl;
                if (!avatarUrl.startsWith('http') && !avatarUrl.startsWith('data:')) {
                    // Prepend base URL if it's a relative path
                    avatarUrl = `${window.API_BASE_URL || ''}${avatarUrl.startsWith('/') ? '' : '/'}${avatarUrl}`;
                }
                
                // Update current user data
                this.currentUser = this.currentUser || {};
                this.currentUser.avatar = result.avatar;
                this.currentUser.avatarUrl = avatarUrl;
                
                // Update UI
                if (userAvatar) {
                    // Add cache-busting parameter
                    const separator = avatarUrl.includes('?') ? '&' : '?';
                    const urlWithCacheBust = `${avatarUrl}${separator}t=${Date.now()}`;
                    this.setAvatarImage(userAvatar, urlWithCacheBust);
                }
                
                // Update local storage
                const user = JSON.parse(localStorage.getItem('user') || '{}');
                user.avatar = this.currentUser.avatar;
                user.avatarUrl = this.currentUser.avatarUrl;
                localStorage.setItem('user', JSON.stringify(user));
                
                // Show success message
                this.showNotification('✅ Profile picture updated successfully!', 'success');
            } else {
                throw new Error('No avatar URL returned from server');
            }
        } catch (error) {
            console.error('Error uploading avatar:', error);
            this.showNotification(`❌ ${error.message || 'Failed to upload avatar. Please try again.'}`, 'error');
        } finally {
            // Reset file input and button state
            if (fileInput) fileInput.value = '';
            if (uploadBtn) {
                uploadBtn.disabled = false;
                uploadBtn.innerHTML = originalBtnHTML || 'Change Avatar';
            }
        }
    }

    // Check if an image exists at the given URL
    async checkImageExists(url) {
        try {
            const response = await fetch(url, { method: 'HEAD' });
            return response.ok;
        } catch (error) {
            console.error('Error checking image:', url, error);
            return false;
        }
    }

    async updateAvatarUI() {
        console.log('updateAvatarUI called');
        const userAvatar = document.getElementById('userAvatar');
        if (!userAvatar) {
            console.log('userAvatar element not found');
            return;
        }
        
        // First, try to show the avatar from the current user object
        if (this.currentUser?.avatarUrl) {
            const avatarUrl = this.currentUser.avatarUrl;
            console.log('Trying to load avatar from currentUser:', avatarUrl);
            
            // Check if the image exists on the server
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
            throw new Error(errorData.message || 'Failed to upload avatar');
        }

        const result = await response.json();
        console.log('Avatar upload response:', result);
        
        if (result.avatarUrl) {
            // Make sure the avatar URL is absolute
            let avatarUrl = result.avatarUrl;
            if (!avatarUrl.startsWith('http') && !avatarUrl.startsWith('data:')) {
                // Prepend base URL if it's a relative path
                avatarUrl = `${window.API_BASE_URL || ''}${avatarUrl.startsWith('/') ? '' : '/'}${avatarUrl}`;
            }
            
            // Update current user data
            this.currentUser = this.currentUser || {};
            this.currentUser.avatar = result.avatar;
            this.currentUser.avatarUrl = avatarUrl;
            
            // Update UI
            if (userAvatar) {
                // Add cache-busting parameter
                const separator = avatarUrl.includes('?') ? '&' : '?';
                const urlWithCacheBust = `${avatarUrl}${separator}t=${Date.now()}`;
                this.setAvatarImage(userAvatar, urlWithCacheBust);
            }
            
            // Update local storage
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            user.avatar = this.currentUser.avatar;
            user.avatarUrl = this.currentUser.avatarUrl;
            localStorage.setItem('user', JSON.stringify(user));
            
            // Show success message
            this.showNotification('✅ Profile picture updated successfully!', 'success');
        } else {
            throw new Error('No avatar URL returned from server');
        }
    } catch (error) {
        console.error('Error uploading avatar:', error);
        this.showNotification(`❌ ${error.message || 'Failed to upload avatar. Please try again.'}`, 'error');
        if (uploadBtn) {
            uploadBtn.disabled = false;
            uploadBtn.innerHTML = originalBtnHTML || 'Change Avatar';
        }
    }

    async updateAvatarUI() {
        const userAvatar = document.getElementById('userAvatar');
        if (!userAvatar) {
            console.log('updateAvatarUI: No user avatar element found');
            return;
        return;
    }
    
    // Check if we have a cached avatar URL in local storage
    const cachedUser = JSON.parse(localStorage.getItem('user') || '{}');
    
    // Try to get the avatar URL from currentUser or cached user
    let avatarUrl = this.currentUser?.avatarUrl || cachedUser?.avatarUrl;
    
    if (avatarUrl) {
        // Make sure the URL is absolute
        if (!avatarUrl.startsWith('http') && !avatarUrl.startsWith('data:')) {
            avatarUrl = `${window.API_BASE_URL || ''}${avatarUrl.startsWith('/') ? '' : '/'}${avatarUrl}`;
        }
        
        // Add cache-busting parameter
        const separator = avatarUrl.includes('?') ? '&' : '?';
        const urlWithCacheBust = `${avatarUrl}${separator}t=${Date.now()}`;
        
        console.log('Setting avatar image from URL:', urlWithCacheBust);
        
        try {
            // First check if the image exists
            const imageExists = await this.checkImageExists(urlWithCacheBust);
            if (imageExists) {
                await this.setAvatarImage(userAvatar, urlWithCacheBust);
            } else {
                console.log('Avatar image not found at URL, showing initials');
                this.showInitials(userAvatar);
            }
        } catch (error) {
            console.error('Error checking avatar image:', error);
            this.showInitials(userAvatar);
        }
    } else {
        // No avatar URL found, show initials
        this.showInitials(userAvatar);
    }
}

async setAvatarImage(element, imageUrl) {
    if (!element || !imageUrl) {
        console.log('setAvatarImage: Missing element or imageUrl');
        return Promise.reject('Missing element or imageUrl');
    }
            
    console.log('Setting avatar image:', imageUrl);
            
    // Clean up URL - remove any existing cache-busting parameters
    const cleanUrl = imageUrl.split('?')[0];
            
    // Add a single cache-busting parameter
    const separator = cleanUrl.includes('?') ? '&' : '?';
    const urlWithCacheBust = `${cleanUrl}${separator}t=${Date.now()}`;
            
    return new Promise((resolve, reject) => {
        const img = new Image();
                
        // Set CORS policy - use 'anonymous' for cross-origin requests
        img.crossOrigin = 'anonymous';
                
        // Set timeout for image loading
        const timeout = setTimeout(() => {
            img.onload = null;
            img.onerror = null;
            console.error('Image load timeout for:', cleanUrl);
            this.showInitials(element);
            reject(new Error('Image took too long to load. Please try again.'));
        }, 10000); // 10 second timeout
                
        img.onload = () => {
            clearTimeout(timeout);
            element.style.backgroundImage = `url(${urlWithCacheBust})`;
            element.textContent = ''; // Clear any initials
                    
            // Also update the profile picture in the navigation if it exists
            const navAvatar = document.querySelector('.user-avatar, .nav-avatar');
            if (navAvatar) {
                navAvatar.style.backgroundImage = `url(${urlWithCacheBust})`;
                navAvatar.textContent = '';
            }
                    
            // Update local storage
            if (this.currentUser) {
                this.currentUser.avatarUrl = urlWithCacheBust;
                const user = JSON.parse(localStorage.getItem('user') || '{}');
                user.avatarUrl = urlWithCacheBust;
                localStorage.setItem('user', JSON.stringify(user));
            }
                    
            resolve();
        };
                
        img.onerror = () => {
            clearTimeout(timeout);
            console.error('Error loading image with CORS, trying without CORS...');
                    
            // Try again without CORS
            const imgNoCors = new Image();
            imgNoCors.crossOrigin = ''; // No CORS
                    
            imgNoCors.onload = () => {
                element.style.backgroundImage = `url(${urlWithCacheBust})`;
                element.textContent = '';
                        
                // Update navigation avatar if it exists
                const navAvatar = document.querySelector('.user-avatar, .nav-avatar');
                if (navAvatar) {
                    navAvatar.style.backgroundImage = `url(${urlWithCacheBust})`;
                    navAvatar.textContent = '';
                }
                        
                // Update local storage
                if (this.currentUser) {
                    this.currentUser.avatarUrl = urlWithCacheBust;
                    const user = JSON.parse(localStorage.getItem('user') || '{}');
                    user.avatarUrl = urlWithCacheBust;
                    localStorage.setItem('user', JSON.stringify(user));
                }
                        
                resolve();
            };
                    
            imgNoCors.onerror = () => {
                console.error('Failed to load image with or without CORS, showing initials');
                this.showInitials(element);
                reject(new Error('Failed to load image. Using default avatar.'));
            };
                    
            imgNoCors.src = urlWithCacheBust;
        };
                
        // Start loading the image with CORS
        img.src = urlWithCacheBust;
    });
} catch (error) {
    console.error('Error setting avatar image:', error);
    this.showInitials(element);
}

showNotification(message, type = 'info') {
    // Create notification container if it doesn't exist
    let notificationContainer = document.querySelector('.notification-container');
    if (!notificationContainer) {
        notificationContainer = document.createElement('div');
        notificationContainer.className = 'notification-container';
        document.body.appendChild(notificationContainer);
    }

    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    // Add to container
    notificationContainer.appendChild(notification);
    
    // Trigger animation
    setTimeout(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateX(0)';
    }, 10);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            notification.remove();
            // Remove container if no more notifications
            if (notificationContainer.children.length === 0) {
                notificationContainer.remove();
            }
        }, 300);
    }, 5000);
}

    // Show initials if no avatar is set
    showInitials(element) {
        if (!element) {
            console.log('showInitials: No element provided');
            return;
        }

        // Clear any existing background image
        element.style.backgroundImage = '';

        // Get user's initials from the current user or element's data attribute
        let initials = '';
        if (this.currentUser && this.currentUser.username) {
            initials = this.currentUser.username.charAt(0).toUpperCase();
        } else if (element.dataset.initials) {
            initials = element.dataset.initials;
        } else {
            // Default to 'U' if no initials can be determined
            initials = 'U';
        }

        // Set the initials text
        element.textContent = initials;

        // Set a default background color based on the first letter
        const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD', '#D4A5A5', '#9C9C9C'];
        const colorIndex = initials.charCodeAt(0) % colors.length;
        element.style.backgroundColor = colors[colorIndex];

        // Also update the profile picture in the navigation if it exists
        const navAvatar = document.querySelector('.user-avatar, .nav-avatar');
        if (navAvatar && navAvatar !== element) {
            navAvatar.textContent = initials;
            navAvatar.style.backgroundImage = 'none';
            navAvatar.style.backgroundColor = colors[colorIndex];
        }
    }

    async loadUserTournaments() {
        const container = document.getElementById('myTournamentsList');
        const emptyState = document.getElementById('tournamentsEmpty');

        if (!container) return;

        try {
            // Show loading state
            container.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i><p>Loading your tournaments...</p></div>';
            if (emptyState) emptyState.style.display = 'none';

            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No authentication token found');
            }

            const response = await fetch(`${window.API_BASE_URL || ''}/api/user/my-tournaments`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to load tournaments');
            }

            const data = await response.json();

            if (data.success && data.tournaments && data.tournaments.length > 0) {
                this.displayUserTournaments(data.tournaments);
                if (emptyState) emptyState.style.display = 'none';
            } else {
                container.innerHTML = '';
                if (emptyState) emptyState.style.display = 'block';
            }

        } catch (error) {
            console.error('Error loading user tournaments:', error);
            container.innerHTML = '<div class="error-message"><i class="fas fa-exclamation-triangle"></i><p>Failed to load tournaments. Please try again.</p></div>';
            if (emptyState) emptyState.style.display = 'none';
        }
    }

    displayUserTournaments(tournaments) {
        const container = document.getElementById('myTournamentsList');
        if (!container) return;

        container.innerHTML = '';

        tournaments.forEach(tournament => {
            const tournamentCard = this.createTournamentCard(tournament);
            container.appendChild(tournamentCard);
        });
    }

    createTournamentCard(tournament) {
        const card = document.createElement('div');
        card.className = 'tournament-card';

        const statusClass = tournament.status === 'active' ? 'active' : 'upcoming';
        const statusText = tournament.status === 'active' ? 'Active' : 'Upcoming';

        card.innerHTML = `
            <div class="tournament-header">
                <h3>${tournament.name}</h3>
                <span class="tournament-status ${statusClass}">${statusText}</span>
            </div>
            <div class="tournament-info">
                <p><i class="fas fa-calendar"></i> ${new Date(tournament.schedule?.tournamentStart).toLocaleDateString()}</p>
                <p><i class="fas fa-users"></i> ${tournament.participants?.length || 0}/${tournament.settings?.capacity || 0} players</p>
                <p><i class="fas fa-trophy"></i> Prize: KSh ${tournament.prizePool || 0}</p>
            </div>
            <div class="tournament-actions">
                <button class="btn-secondary" onclick="window.location.href='matches.html'">
                    <i class="fas fa-eye"></i> View Matches
                </button>
            </div>
        `;

        return card;
    }

    async loadMatchHistory() {
        // This method can be implemented later if needed
        console.log('Loading match history...');
    }

    async handleProfileUpdate(event) {
        event.preventDefault();

        const whatsappField = document.getElementById('whatsapp');
        const whatsapp = whatsappField ? whatsappField.value.trim() : '';

        if (!whatsapp) {
            this.showNotification('Please enter a WhatsApp number', 'error');
            return;
        }

        // Basic WhatsApp validation
        if (!/^(07\d{8}|2547\d{8}|\+2547\d{8})$/.test(whatsapp.replace(/\s/g, ''))) {
            this.showNotification('Please enter a valid WhatsApp number', 'error');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No authentication token found');
            }

            const response = await fetch(`${window.API_BASE_URL || ''}/api/users/profile`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ whatsapp })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'Failed to update profile');
            }

            const result = await response.json();

            // Update local user data
            this.currentUser.whatsapp = whatsapp;
            localStorage.setItem('user', JSON.stringify(this.currentUser));

            // Update UI
            this.updateUI();

            this.showNotification('Profile updated successfully!', 'success');

        } catch (error) {
            console.error('Error updating profile:', error);
            this.showNotification(error.message || 'Failed to update profile', 'error');
        }
    }

    async handlePasswordChange(event) {
        event.preventDefault();

        const currentPasswordField = document.getElementById('currentPassword');
        const newPasswordField = document.getElementById('newPassword');
        const confirmPasswordField = document.getElementById('confirmPassword');

        const currentPassword = currentPasswordField ? currentPasswordField.value : '';
        const newPassword = newPasswordField ? newPasswordField.value : '';
        const confirmPassword = confirmPasswordField ? confirmPasswordField.value : '';

        if (!currentPassword || !newPassword || !confirmPassword) {
            this.showNotification('Please fill in all password fields', 'error');
            return;
        }

        if (newPassword !== confirmPassword) {
            this.showNotification('New passwords do not match', 'error');
            return;
        }

        if (newPassword.length < 6) {
            this.showNotification('New password must be at least 6 characters long', 'error');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No authentication token found');
            }

            const response = await fetch(`${window.API_BASE_URL || ''}/api/auth/change-password`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    currentPassword,
                    newPassword
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'Failed to change password');
            }

            // Clear form
            currentPasswordField.value = '';
            newPasswordField.value = '';
            confirmPasswordField.value = '';

            this.showNotification('Password changed successfully!', 'success');

        } catch (error) {
            console.error('Error changing password:', error);
            this.showNotification(error.message || 'Failed to change password', 'error');
        }
    }
}
function showInitials(element) {
    if (!element) {
        console.log('showInitials: No element provided');
        return;
    }

    element.style.backgroundImage = '';
    element.style.backgroundSize = 'cover';
    element.style.backgroundPosition = 'center';

    if (!this.currentUser) {
        console.log('showInitials: No current user data');
        element.textContent = 'U';
        return;
    }

    // Get the first letter of the username or email
    const name = this.currentUser.username || this.currentUser.email || 'U';
    const initial = name.charAt(0).toUpperCase();

    console.log('Showing initials:', initial);
    element.textContent = initial;

    // Also update the profile picture in the navigation if it exists
    const navAvatar = document.querySelector('.user-avatar, .nav-avatar');
    if (navAvatar) {
        navAvatar.textContent = initial;
        navAvatar.style.backgroundImage = 'none';
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
    
    // Add cache-busting to avatar URLs
    document.querySelectorAll('img[src*="/uploads/avatars/"], img[src*="/uploads/profile/"]').forEach(img => {
        const src = img.getAttribute('src');
        if (src && !src.includes('?')) {
            img.src = `${src}?t=${Date.now()}`;
        }
    });
});
