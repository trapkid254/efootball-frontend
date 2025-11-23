class MatchesPage {
    constructor() {
        this.currentUser = null;
        this.matches = [];
        this.filteredMatches = [];
        this.filters = {
            status: 'all',
            tournament: 'all'
        };
        this.init();
    }

    init() {
        this.checkAuth();
        this.setupEventListeners();
        this.loadMatches();
    }

    checkAuth() {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');
        
        if (!token || !userData) {
            window.location.href = 'index.html';
            return;
        }

        try {
            this.currentUser = JSON.parse(userData);
            this.updateUserInfo();
        } catch (error) {
            console.error('Error parsing user data:', error);
            this.logout();
        }
    }

    setupEventListeners() {
        // Theme toggle
        document.getElementById('themeToggle')?.addEventListener('click', () => {
            this.toggleTheme();
        });

        // Logout button
        document.getElementById('logoutBtn')?.addEventListener('click', () => {
            this.logout();
        });

        // Status filter
        document.getElementById('statusFilter')?.addEventListener('change', (e) => {
            this.filters.status = e.target.value;
            this.applyFiltersAndRender();
        });

        // Tournament filter
        document.getElementById('tournamentFilter')?.addEventListener('change', (e) => {
            this.filters.tournament = e.target.value;
            this.applyFiltersAndRender();
        });

        // Apply filters button
        document.getElementById('applyFilters')?.addEventListener('click', () => {
            this.applyFiltersAndRender();
        });

        // Match action buttons (delegated event listener)
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('match-action-btn')) {
                const matchId = e.target.getAttribute('data-match-id');
                const action = e.target.getAttribute('data-action');
                this.handleMatchAction(matchId, action);
            }
        });

        // Submit result modal
        const submitModal = document.getElementById('submitResultModal');
        if (submitModal) {
            submitModal.querySelector('.close')?.addEventListener('click', () => {
                this.hideSubmitResultModal();
            });

            // Close modal when clicking outside
            submitModal.addEventListener('click', (e) => {
                if (e.target === submitModal) {
                    this.hideSubmitResultModal();
                }
            });
        }

        // Submit result form
        const submitForm = document.getElementById('submitResultForm');
        if (submitForm) {
            submitForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.submitMatchResult();
            });
        }

        // File upload display
        const screenshotInput = document.getElementById('screenshot');
        if (screenshotInput) {
            screenshotInput.addEventListener('change', (e) => {
                this.updateFileName(e.target);
            });
        }
    }

    toggleTheme() {
        const isDarkTheme = document.body.classList.contains('dark-theme');
        document.body.classList.toggle('light-theme', !isDarkTheme);
        document.body.classList.toggle('dark-theme', isDarkTheme);
        
        const icon = document.querySelector('#themeToggle i');
        if (icon) {
            icon.className = isDarkTheme ? 'fas fa-sun' : 'fas fa-moon';
        }
        
        localStorage.setItem('theme', isDarkTheme ? 'light' : 'dark');
    }

    updateUserInfo() {
        const userNameElement = document.getElementById('userName');
        const userAvatarElement = document.getElementById('userAvatar');
        
        if (userNameElement) {
            userNameElement.textContent = this.currentUser.efootballId || 'Player';
        }
        
        if (userAvatarElement) {
            userAvatarElement.textContent = this.currentUser.efootballId ? this.currentUser.efootballId.charAt(0).toUpperCase() : 'U';
        }
    }

    async loadMatches() {
        try {
            this.showLoading(true);

            // First, check if the user is registered for any tournaments
            const tournamentsResponse = await this.fetchWithAuth('/api/user/my-tournaments');

            if (!tournamentsResponse.success || tournamentsResponse.tournaments.length === 0) {
                this.showNoTournamentsMessage();
                return;
            }

            // Load tournaments for filter
            this.loadTournamentFilter(tournamentsResponse.tournaments);

            // If user is registered in tournaments, fetch their matches
            const matchesResponse = await this.fetchWithAuth('/api/matches/my-matches');

            if (!matchesResponse.success) {
                throw new Error(matchesResponse.message || 'Failed to load matches');
            }

            this.matches = matchesResponse.matches || [];
            this.applyFiltersAndRender();

        } catch (error) {
            console.error('Error loading matches:', error);
            this.showError('Failed to load matches. Please try again later.');
        } finally {
            this.showLoading(false);
        }
    }

    loadTournamentFilter(tournaments) {
        const tournamentFilter = document.getElementById('tournamentFilter');
        if (!tournamentFilter) return;

        // Clear existing options except "All Tournaments"
        tournamentFilter.innerHTML = '<option value="all">All Tournaments</option>';

        // Add tournament options
        tournaments.forEach(tournament => {
            const option = document.createElement('option');
            option.value = tournament._id;
            option.textContent = tournament.name;
            tournamentFilter.appendChild(option);
        });
    }

    applyFiltersAndRender() {
        let filteredMatches = [...this.matches];

        // Apply status filter
        if (this.filters.status && this.filters.status !== 'all') {
            filteredMatches = filteredMatches.filter(match => match.status === this.filters.status);
        }

        // Apply tournament filter
        if (this.filters.tournament && this.filters.tournament !== 'all') {
            filteredMatches = filteredMatches.filter(match => match.tournament?._id === this.filters.tournament);
        }

        // Store filtered matches for rendering
        this.filteredMatches = filteredMatches;
        this.renderMatchesBySections();
    }
    
    async fetchWithAuth(endpoint) {
        const token = localStorage.getItem('token');
        const apiBase = window.API_BASE_URL || 'http://localhost:5000';
        
        const response = await fetch(`${apiBase}${endpoint}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.message || 'Request failed');
        }
        
        return await response.json();
    }
    
    renderMatchesBySections() {
        // Categorize matches
        const now = new Date();
        const upcomingMatches = this.filteredMatches.filter(match =>
            match.status === 'scheduled' && new Date(match.scheduledTime) > now
        );

        const recentMatches = this.filteredMatches.filter(match =>
            match.status === 'completed' && this.isRecentMatch(match)
        );

        const completedMatches = this.filteredMatches.filter(match =>
            match.status === 'completed' && !this.isRecentMatch(match)
        );

        const actionRequiredMatches = this.filteredMatches.filter(match =>
            match.status === 'disputed' || (match.status === 'scheduled' && new Date(match.scheduledTime) <= now)
        );

        // Populate each section
        this.renderSection('upcomingMatches', upcomingMatches, 'No upcoming matches');
        this.renderSection('actionRequiredMatches', actionRequiredMatches, 'No matches requiring action');
        this.renderSection('recentMatches', recentMatches, 'No recent matches');
        this.renderSection('completedMatches', completedMatches, 'No completed matches');

        // Show/hide sections based on content
        this.toggleSectionsVisibility();
    }

    renderSection(containerId, matches, emptyMessage) {
        const container = document.getElementById(containerId);
        if (!container) return;

        if (matches.length === 0) {
            container.innerHTML = `<p class="empty-state">${emptyMessage}</p>`;
        } else {
            container.innerHTML = matches.map(match => this.renderMatchCard(match)).join('');
        }
    }

    toggleSectionsVisibility() {
        const sections = [
            { id: 'upcomingMatches', section: 'upcoming' },
            { id: 'actionRequiredMatches', section: 'actionRequired' },
            { id: 'recentMatches', section: 'recent' },
            { id: 'completedMatches', section: 'completed' }
        ];

        sections.forEach(({ id, section }) => {
            const container = document.getElementById(id);
            const sectionElement = container?.closest('.matches-section');
            if (sectionElement) {
                const hasContent = container && container.innerHTML && !container.innerHTML.includes('empty-state');
                sectionElement.style.display = hasContent ? 'block' : 'none';
            }
        });
    }

    isRecentMatch(match) {
        if (!match.result?.confirmedAt) return false;
        const confirmedDate = new Date(match.result.confirmedAt);
        const now = new Date();
        const diffTime = Math.abs(now - confirmedDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= 7; // Consider matches from last 7 days as recent
    }
    
    renderMatchCard(match) {
        // Format the match date
        const matchDate = new Date(match.scheduledTime);
        const options = {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        const formattedDate = matchDate.toLocaleDateString('en-US', options);

        const isActionable = match.status === 'scheduled' || match.status === 'disputed';
        const buttonText = this.getActionButtonText(match.status);

        return `
            <div class="match-card" data-match-id="${match._id}">
                <div class="match-header">
                    <span class="tournament-name">${match.tournament?.name || 'Tournament'}</span>
                    <span class="match-status ${match.status}">${this.formatStatus(match.status)}</span>
                </div>
                <div class="match-teams">
                    <div class="team">
                        <span class="team-name">${match.player1?.user?.efootballId || 'TBD'}</span>
                        <span class="score">${match.player1?.score ?? '-'}</span>
                    </div>
                    <div class="vs">VS</div>
                    <div class="team">
                        <span class="team-name">${match.player2?.user?.efootballId || 'TBD'}</span>
                        <span class="score">${match.player2?.score ?? '-'}</span>
                    </div>
                </div>
                <div class="match-footer">
                    <span class="match-time"><i class="far fa-clock"></i> ${formattedDate}</span>
                    <button class="btn btn-primary btn-sm match-action-btn" data-match-id="${match._id}" data-action="${this.getActionType(match.status)}" ${!isActionable ? 'disabled' : ''}>
                        ${buttonText}
                    </button>
                </div>
            </div>
        `;
    }

    getActionType(status) {
        switch(status) {
            case 'scheduled': return 'submit-result';
            case 'disputed': return 'view-details';
            case 'completed': return 'view-details';
            default: return 'view-details';
        }
    }
    
    formatStatus(status) {
        const statusMap = {
            'scheduled': 'Upcoming',
            'in_progress': 'In Progress',
            'completed': 'Completed',
            'cancelled': 'Cancelled'
        };
        return statusMap[status] || status;
    }
    
    getActionButtonText(status) {
        const buttonText = {
            'scheduled': 'Submit Result',
            'in_progress': 'Match in Progress',
            'completed': 'View Details',
            'cancelled': 'Match Cancelled'
        };
        return buttonText[status] || 'View';
    }
    
    showNoTournamentsMessage() {
        const container = document.getElementById('matchesContainer') || document.body;
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-trophy"></i>
                <h3>No Tournaments Joined</h3>
                <p>You haven't registered for any tournaments yet. Join a tournament to start playing matches!</p>
                <a href="tournaments.html" class="btn btn-primary">Browse Tournaments</a>
            </div>
        `;
    }
    
    showLoading(show) {
        const loadingState = document.getElementById('loadingState');
        const emptyState = document.getElementById('emptyState');

        if (show) {
            if (loadingState) loadingState.style.display = 'block';
            if (emptyState) emptyState.style.display = 'none';
            // Hide all match sections
            document.querySelectorAll('.matches-section').forEach(section => {
                section.style.display = 'none';
            });
        } else {
            if (loadingState) loadingState.style.display = 'none';
        }
    }
    
    showError(message) {
        const emptyState = document.getElementById('emptyState');
        if (emptyState) {
            emptyState.innerHTML = `
                <i class="fas fa-exclamation-circle"></i>
                <h3>Something Went Wrong</h3>
                <p>${message}</p>
                <button class="btn btn-secondary" onclick="window.location.reload()">Try Again</button>
            `;
            emptyState.style.display = 'block';
        }

        // Hide other sections
        document.querySelectorAll('.matches-section').forEach(section => {
            section.style.display = 'none';
        });
        const loadingState = document.getElementById('loadingState');
        if (loadingState) loadingState.style.display = 'none';
    }
    
    handleMatchAction(matchId, action) {
        const match = this.matches.find(m => m._id === matchId);
        if (!match) return;

        switch(action) {
            case 'submit-result':
                this.showSubmitResultModal(match);
                break;
            case 'view-details':
                this.showMatchDetailsModal(match);
                break;
            default:
                console.log('Unknown action:', action);
        }
    }

    showSubmitResultModal(match) {
        const modal = document.getElementById('submitResultModal');
        const matchInfo = document.getElementById('modalMatchInfo');
        const matchIdInput = document.getElementById('matchId');

        if (!modal || !matchInfo || !matchIdInput) return;

        // Set match ID
        matchIdInput.value = match._id;

        // Populate match info
        const matchDate = new Date(match.scheduledTime);
        const formattedDate = matchDate.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        // Determine opponent
        let opponentName = 'TBD';
        if (match.player1 && match.player1.user && match.player1.user._id !== this.currentUser._id) {
            opponentName = match.player1.user.efootballId;
        } else if (match.player2 && match.player2.user && match.player2.user._id !== this.currentUser._id) {
            opponentName = match.player2.user.efootballId;
        }

        matchInfo.innerHTML = `
            <div class="match-summary">
                <h3>${match.tournament?.name || 'Tournament'}</h3>
                <p><strong>Opponent:</strong> ${opponentName}</p>
                <p><strong>Scheduled:</strong> ${formattedDate}</p>
                <p><strong>Round:</strong> ${match.round || 'N/A'}</p>
            </div>
        `;

        // Reset form
        const form = document.getElementById('submitResultForm');
        if (form) {
            form.reset();
            document.getElementById('fileName').textContent = 'No file chosen';
        }

        // Show modal
        modal.style.display = 'block';
    }

    hideSubmitResultModal() {
        const modal = document.getElementById('submitResultModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    async submitMatchResult() {
        const form = document.getElementById('submitResultForm');
        if (!form) return;

        const formData = new FormData(form);
        const matchId = formData.get('matchId');
        const screenshot = formData.get('screenshot');

        if (!matchId || !screenshot) {
            this.showNotification('Please select a screenshot to upload', 'error');
            return;
        }

        try {
            this.showLoading(true);

            // Submit screenshot for admin review (score will be set by admin)
            // For now, send dummy score of 0 since API requires it
            const response = await this.submitScoreWithFile(matchId, 0, screenshot);

            if (response.success) {
                this.showNotification('Screenshot submitted successfully! The admin will review and update the scores.', 'success');
                this.hideSubmitResultModal();
                this.loadMatches(); // Refresh matches
            } else {
                throw new Error(response.message || 'Failed to submit screenshot');
            }

        } catch (error) {
            console.error('Submit screenshot error:', error);
            this.showNotification(error.message || 'Failed to submit screenshot', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async submitScoreWithFile(matchId, score, screenshotFile) {
        const token = localStorage.getItem('token');
        const apiBase = window.API_BASE_URL || 'http://localhost:5000';

        const formData = new FormData();
        formData.append('score', score);
        formData.append('screenshot', screenshotFile);

        const response = await fetch(`${apiBase}/api/matches/${matchId}/submit-score`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.message || 'Request failed');
        }

        return await response.json();
    }

    updateFileName(input) {
        const fileNameElement = document.getElementById('fileName');
        if (fileNameElement && input.files && input.files[0]) {
            fileNameElement.textContent = input.files[0].name;
        } else {
            fileNameElement.textContent = 'No file chosen';
        }
    }

    showMatchDetailsModal(match) {
        // For now, just show basic info. Can be expanded later
        const modal = document.getElementById('matchDetailsModal');
        const content = document.getElementById('matchDetailsContent');

        if (!modal || !content) return;

        const matchDate = new Date(match.scheduledTime);
        const formattedDate = matchDate.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        content.innerHTML = `
            <h2>Match Details</h2>
            <div class="match-details">
                <p><strong>Tournament:</strong> ${match.tournament?.name || 'N/A'}</p>
                <p><strong>Round:</strong> ${match.round || 'N/A'}</p>
                <p><strong>Status:</strong> ${this.formatStatus(match.status)}</p>
                <p><strong>Scheduled:</strong> ${formattedDate}</p>
                <div class="score-display">
                    <div class="team">
                        <span>${match.player1?.user?.efootballId || 'TBD'}</span>
                        <span class="score">${match.player1?.score ?? '-'}</span>
                    </div>
                    <div class="vs">VS</div>
                    <div class="team">
                        <span>${match.player2?.user?.efootballId || 'TBD'}</span>
                        <span class="score">${match.player2?.score ?? '-'}</span>
                    </div>
                </div>
                ${match.result?.confirmedAt ? `<p><strong>Confirmed:</strong> ${new Date(match.result.confirmedAt).toLocaleDateString()}</p>` : ''}
            </div>
        `;

        modal.style.display = 'block';

        // Close button
        const closeBtn = modal.querySelector('.close');
        if (closeBtn) {
            closeBtn.onclick = () => modal.style.display = 'none';
        }

        // Close on outside click
        modal.onclick = (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        };
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

    getNotificationIcon(type) {
        const icons = {
            success: 'check-circle',
            error: 'exclamation-circle',
            warning: 'exclamation-triangle',
            info: 'info-circle'
        };
        return icons[type] || 'info-circle';
    }

    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = 'index.html';
    }
}

// Initialize the matches page when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    window.matchesPage = new MatchesPage();
});
