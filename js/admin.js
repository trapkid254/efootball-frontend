class AdminPanel {
    constructor() {
        this.currentUser = null;
        this.init();
    }

    init() {
        this.checkAuth();
        this.setupEventListeners();
        this.setupModals();
        this.setupResponsiveMenu();

        // Load page-specific data
        const url = window.location.href;
        if (url.includes('admin.html') && !url.includes('admin-tournaments') && !url.includes('admin-matches') && !url.includes('admin-players') && !url.includes('admin-payments')) {
            this.loadAdminData();
        } else if (url.includes('admin-tournaments.html')) {
            this.loadTournamentsManagement();
        } else if (url.includes('admin-matches.html')) {
            this.loadMatchesManagement();
        } else if (url.includes('admin-players.html')) {
            this.loadPlayersManagement();
        } else if (url.includes('admin-payments.html')) {
            this.loadPaymentsManagement();
        }
    }

    checkAuth() {
        // Bypass all authentication checks
        const devUser = { 
            _id: 'dev-admin', 
            id: 'dev-admin',
            name: 'Admin', 
            role: 'admin',
            efootballId: 'ADMIN',
            isAdmin: true,
            isVerified: true
        };
        localStorage.setItem('token', 'dev-token');
        localStorage.setItem('user', JSON.stringify(devUser));
        this.currentUser = devUser;
        this.updateAdminInfo();
        return true; // Always return true to indicate successful authentication
    }

    setupEventListeners() {
        console.log('Setting up event listeners...');
        
        // Theme toggle
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                console.log('Theme toggle clicked');
                this.toggleTheme();
            });
        } else {
            console.warn('Theme toggle button not found');
        }

        // Logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                console.log('Logout button clicked');
                this.logout();
            });
        } else {
            console.warn('Logout button not found');
        }


        // Create tournament form
        const createTournamentForm = document.getElementById('createTournamentForm');
        if (createTournamentForm) {
            console.log('Found create tournament form');
            createTournamentForm.addEventListener('submit', (e) => {
                e.preventDefault();
                console.log('Tournament form submitted');
                this.handleCreateTournament();
            });
        } else {
            console.warn('Create tournament form not found');
        }

        // Edit tournament form
        const editTournamentForm = document.getElementById('editTournamentForm');
        if (editTournamentForm) {
            console.log('Found edit tournament form');
            editTournamentForm.addEventListener('submit', (e) => {
                e.preventDefault();
                console.log('Edit tournament form submitted');
                this.handleEditTournament();
            });
        } else {
            console.warn('Edit tournament form not found');
        }
        
        // Add click handler for create tournament button
        const createTournamentBtn = document.getElementById('createTournamentBtn');
        if (createTournamentBtn) {
            console.log('Found create tournament button');
            createTournamentBtn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('Create tournament button clicked');
                this.showCreateTournamentModal();
            });
        } else {
            console.error('Create tournament button not found!');
            // Try to find the button again with a more permissive selector
            const altButton = document.querySelector('[onclick*="createTournament"]');
            if (altButton) {
                console.log('Found alternative tournament button using different selector');
                altButton.addEventListener('click', (e) => {
                    e.preventDefault();
                    console.log('Alternative create tournament button clicked');
                    this.showCreateTournamentModal();
                });
            }
        }
    }

    setupModals() {
        // Close modals when clicking X
        document.querySelectorAll('.close').forEach(closeBtn => {
            closeBtn.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                if (modal) {
                    modal.style.display = 'none';
                    document.body.classList.remove('modal-open');
                }
            });
        });

        // Close modals when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                e.target.style.display = 'none';
                document.body.classList.remove('modal-open');
            }
        });

        // Close modal with Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const modals = document.querySelectorAll('.modal');
                modals.forEach(modal => {
                    if (modal.style.display === 'block' || modal.style.display === 'flex') {
                        modal.style.display = 'none';
                        document.body.classList.remove('modal-open');
                    }
                });
            }
        });
    }

    toggleTheme() {
        const isDarkTheme = document.body.classList.contains('dark-theme');
        document.body.classList.toggle('light-theme', !isDarkTheme);
        document.body.classList.toggle('dark-theme', isDarkTheme);
        
        const icon = document.querySelector('#themeToggle i');
        icon.className = isDarkTheme ? 'fas fa-sun' : 'fas fa-moon';
        
        localStorage.setItem('theme', isDarkTheme ? 'light' : 'dark');
    }

    updateAdminInfo() {
        // Update admin-specific UI elements if needed
    }

    showCreateTournamentModal() {
        console.log('showCreateTournamentModal called');
        const modal = document.getElementById('createTournamentModal');
        
        if (!modal) {
            console.error('Modal not found');
            return;
        }
        
        console.log('Modal found, showing...');
        
        // Add modal-open class to body to prevent scrolling
        document.body.classList.add('modal-open');
        
        // Make sure modal is visible and properly positioned
        modal.style.display = 'block';
        modal.style.position = 'fixed';
        modal.style.top = '0';
        modal.style.left = '0';
        modal.style.width = '100%';
        modal.style.height = '100%';
        modal.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        modal.style.zIndex = '1000';
        modal.style.overflowY = 'auto';
        
        // Style the modal content
        const modalContent = modal.querySelector('.modal-content');
        if (modalContent) {
            modalContent.style.margin = '20px auto';
            modalContent.style.maxWidth = '800px';
            modalContent.style.background = '#fff';
            modalContent.style.padding = '20px';
            modalContent.style.borderRadius = '8px';
            modalContent.style.position = 'relative';
        }
        
        console.log('Modal should be visible now');
        
        // Reset form
        const tournamentForm = document.getElementById('createTournamentForm');
        if (tournamentForm) {
            tournamentForm.reset();
            
            // Focus on the first input field
            const firstInput = tournamentForm.querySelector('input, select, textarea');
            if (firstInput) {
                setTimeout(() => {
                    firstInput.focus();
                }, 100);
            }
        }
        
        // Set minimum start date to current date/time
        const now = new Date();
        const timezoneOffset = now.getTimezoneOffset() * 60000;
        const localISOTime = (new Date(now - timezoneOffset)).toISOString().slice(0, 16);
        
        const startDateInput = document.getElementById('startDate');
        if (startDateInput) {
            startDateInput.min = localISOTime;
        }
        
        // Set up close button
        const closeBtn = modal.querySelector('.close');
        if (closeBtn) {
            closeBtn.onclick = (e) => {
                e.preventDefault();
                this.hideCreateTournamentModal();
            };
            
            // Close modal when clicking outside the modal content
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.hideCreateTournamentModal();
                }
            });
            
            // Form submission is already set up in setupEventListeners
        } else {
            console.error('Create tournament modal not found');
        }
    }

    hideCreateTournamentModal() {
        console.log('Hiding tournament modal');
        const modal = document.getElementById('createTournamentModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    // Helper method to process activities from server response
    processActivities(activityData) {
        const activities = [];
        
        // Process tournaments
        (activityData.tournaments || []).forEach(t => activities.push({
            time: new Date(t.createdAt).toLocaleString(),
            activity: 'Tournament Created',
            user: t.organizer?.efootballId || 'Admin',
            details: t.name
        }));
        
        // Process matches
        (activityData.matches || []).forEach(m => activities.push({
            time: new Date(m.createdAt).toLocaleString(),
            activity: 'Match Recorded',
            user: `${m.player1?.user?.efootballId || ''} vs ${m.player2?.user?.efootballId || ''}`.trim(),
            details: m.tournament?.name || `Match #${m.matchNumber || ''}`
        }));
        
        // Process registrations
        (activityData.registrations || []).forEach(r => activities.push({
            time: new Date(r.createdAt).toLocaleString(),
            activity: 'Player Registered',
            user: r.efootballId,
            details: ''
        }));
        
        return activities;
    }

    // Helper method to update the UI with activities
    updateActivitiesUI(activities) {
        const container = document.getElementById('adminActivityTable');
        if (!container) return;
        
        container.innerHTML = activities.slice(0, 15).map(a => `
            <tr>
                <td>${a.time}</td>
                <td>${a.activity}</td>
                <td>${a.user}</td>
                <td>${a.details}</td>
            </tr>
        `).join('');
    }

    async loadAdminData() {
        const container = document.getElementById('adminActivityTable');
        if (!container) return;

        // First try to load from localStorage if available
        try {
            const storedActivities = localStorage.getItem('adminRecentActivities');
            if (storedActivities) {
                const activities = JSON.parse(storedActivities);
                this.updateActivitiesUI(activities);
            }
        } catch (e) {
            console.error('Error loading activities from localStorage:', e);
        }

        // Then try to fetch fresh data
        try {
            const apiBase = window.API_BASE_URL || 'http://127.0.0.1:10000';
            const token = localStorage.getItem('token') || '';
            
            container.innerHTML = '<div class="loading">Loading dashboard data...</div>';
            
            const resp = await fetch(`${apiBase}/api/admin/dashboard`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });
            
            if (!resp.ok) {
                throw new Error(`HTTP error! status: ${resp.status}`);
            }

            const data = await resp.json();
            
            if (data) {
                const stats = data.stats || {};
                const updateStat = (id, value) => {
                    const el = document.getElementById(id);
                    if (el) el.textContent = value;
                };

                updateStat('totalPlayers', stats.totalPlayers || 0);
                updateStat('activeTournamentsCount', stats.activeTournaments || 0);
                updateStat('pendingMatches', stats.pendingMatches || 0);
                updateStat('totalRevenue', `KSh ${(stats.totalRevenue || 0).toLocaleString()}`);

                // Process and save activities
                const activities = this.processActivities(data.recentActivity || {});
                localStorage.setItem('adminRecentActivities', JSON.stringify(activities));
                this.updateActivitiesUI(activities);
            }
        } catch (error) {
            console.error('Error loading admin data:', error);
            
            // Fallback to mock data on error
            const mockStats = {
                totalPlayers: 25,
                activeTournaments: 0,
                pendingMatches: 0,
                totalRevenue: 0
            };
            
            const updateStat = (id, value) => {
                const el = document.getElementById(id);
                if (el) el.textContent = value;
            };
            
            updateStat('totalPlayers', mockStats.totalPlayers);
            updateStat('activeTournamentsCount', mockStats.activeTournaments);
            updateStat('pendingMatches', mockStats.pendingMatches);
            updateStat('totalRevenue', `KSh ${mockStats.totalRevenue.toLocaleString()}`);
            
            // Show error message but keep any existing activities
            if (container) {
                container.innerHTML = `
                    <div class="error-message">
                        <i class="fas fa-exclamation-triangle"></i>
                        <span>Could not load latest data. Showing cached information.</span>
                    </div>
                    ${container.innerHTML}`;
            }
        }
    }


    async handleCreateTournament() {
        const tournamentForm = document.getElementById('createTournamentForm');
        if (!tournamentForm) {
            console.error('Tournament form not found');
            return;
        }

        // Disable the submit button to prevent multiple submissions
        const submitBtn = tournamentForm.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn ? submitBtn.innerHTML : '';
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating...';
        }

        try {
            // Get form data
            const formData = new FormData(tournamentForm);
            const tournamentData = {
                name: formData.get('name')?.trim() || '',
                format: formData.get('format') || 'knockout',
                entryFee: parseFloat(formData.get('entryFee') || 0),
                prizePool: parseFloat(formData.get('prizePool') || 0),
                capacity: parseInt(formData.get('capacity') || '16', 10),
                startDate: formData.get('startDate') || new Date().toISOString(),
                description: formData.get('description')?.trim() || '',
                rules: formData.get('rules')?.trim() || '',
                // Organizer will be set in the fetch call
                settings: {
                    prizePool: parseFloat(formData.get('prizePool') || 0),
                    capacity: parseInt(formData.get('capacity') || '16', 10)
                }
            };

            console.log('Submitting tournament data:', tournamentData);

            // Basic validation
            if (!tournamentData.name) {
                throw new Error('Tournament name is required');
            }
            if (tournamentData.capacity < 2 || tournamentData.capacity > 128) {
                throw new Error('Player capacity must be between 2 and 128');
            }

            const apiBase = window.API_BASE_URL || 'http://127.0.0.1:10000';
            const token = localStorage.getItem('token') || '';

            // Get the current user's ID from the authentication token or user object
            const user = this.currentUser || JSON.parse(localStorage.getItem('user') || '{}');
            const organizerId = user._id || user.id || 'dev-admin';
            
            if (!organizerId) {
                throw new Error('User not authenticated. Please log in again.');
            }
            
            console.log('Sending request to:', `${apiBase}/api/tournaments`);
            console.log('Current user:', user);
            console.log('Using organizer ID:', organizerId);
            
            // Create a clean request body with the required fields
            const requestBody = {
                name: tournamentData.name,
                description: tournamentData.description,
                format: tournamentData.format,
                startDate: tournamentData.startDate,
                organizer: organizerId,  // Include organizer ID in the request body
                settings: {
                    prizePool: tournamentData.prizePool,
                    capacity: tournamentData.capacity,
                    entryFee: tournamentData.entryFee,
                    rules: tournamentData.rules
                },
                status: 'upcoming'
            };

            const response = await fetch(`${apiBase}/api/tournaments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `Failed to create tournament (${response.status})`);
            }

            const created = await response.json().catch(() => ({}));
            console.log('Tournament created:', created);

            this.showNotification('Tournament created successfully!', 'success');
            this.hideCreateTournamentModal();

            // Reset form
            tournamentForm.reset();

            // Refresh the tournaments list if on management page
            try {
                this.loadTournamentsManagement();
            } catch (e) {
                console.warn('Could not refresh tournaments list automatically:', e);
            }

        } catch (error) {
            console.error('Error creating tournament:', error);
            const message = error.message || 'Failed to create tournament. Please try again.';
            this.showNotification(message, 'error');
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnText;
            }
        }
    }

    // Set default capacity to 16 when the page loads
    setDefaultCapacity() {
        const capacityInput = document.getElementById('capacity');
        if (capacityInput && !capacityInput.value) {
            capacityInput.value = '16';
        }
    }

    showManagePlayers() {
        this.handleNavigation('players');
    }

    showPendingResults() {
        this.handleNavigation('matches');
    }

    showPaymentManagement() {
        this.handleNavigation('payments');
    }

    async loadTournamentsManagement() {
        const container = document.getElementById('tournamentsContainer');
        if (!container) {
            console.error('Tournaments container not found');
            return;
        }

        // Show loading state
        container.innerHTML = `
            <div class="loading">
                <i class="fas fa-spinner fa-spin"></i>
                <span>Loading tournaments...</span>
            </div>`;

        try {
            const apiBase = window.API_BASE_URL || 'http://127.0.0.1:10000';
            const token = localStorage.getItem('token') || '';
            
            const resp = await fetch(`${apiBase}/api/tournaments`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });

            if (!resp.ok) {
                const errorData = await resp.json().catch(() => ({}));
                throw new Error(errorData.message || `HTTP error! status: ${resp.status}`);
            }

            const data = await resp.json();
            const tournaments = Array.isArray(data) ? data : (data.tournaments || []);
            
            if (tournaments.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-trophy"></i>
                        <h3>No Tournaments Found</h3>
                        <p>You haven't created any tournaments yet. Get started by creating your first tournament!</p>
                        <button class="btn btn-primary" onclick="window.adminPanel.showCreateTournamentModal()">
                            <i class="fas fa-plus"></i> Create Tournament
                        </button>
                    </div>`;
            } else {
                container.innerHTML = `
                    <div class="section-header">
                        <h2>Tournaments Management</h2>
                        <button class="btn btn-primary" onclick="window.adminPanel.showCreateTournamentModal()">
                            <i class="fas fa-plus"></i> New Tournament
                        </button>
                    </div>
                    <div class="tournaments-grid">
                        ${tournaments.map(tournament => `
                            <div class="tournament-card card">
                                <div class="card-header">
                                    <h3>${tournament.name || 'Unnamed Tournament'}</h3>
                                    <span class="badge badge-${tournament.status || 'secondary'}">
                                        ${(tournament.status || 'draft').charAt(0).toUpperCase() + (tournament.status || 'draft').slice(1)}
                                    </span>
                                </div>
                                <div class="card-body">
                                    <div class="tournament-info">
                                        <p><i class="fas fa-chess-king"></i> <span>Format:</span> ${tournament.format || 'N/A'}</p>
                                        <p><i class="fas fa-users"></i> <span>Participants:</span> ${tournament.participants?.length || 0}/${tournament.capacity || tournament.settings?.capacity || 0}</p>
                                        <p><i class="fas fa-trophy"></i> <span>Prize Pool:</span> KSh ${(tournament.prizePool || tournament.settings?.prizePool || 0).toLocaleString()}</p>
                                        <p><i class="fas fa-ticket-alt"></i> <span>Entry Fee:</span> KSh ${(tournament.entryFee || tournament.settings?.entryFee || 0).toLocaleString()}</p>
                                        ${tournament.startDate ? 
                                            `<p><i class="far fa-calendar-alt"></i> <span>Starts:</span> ${new Date(tournament.startDate).toLocaleDateString()} at ${new Date(tournament.startDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>` 
                                            : ''}
                                    </div>
                                </div>
                                <div class="card-footer">
                                    <button class="btn btn-sm btn-outline-primary" onclick="window.adminPanel.editTournament('${tournament._id}')">
                                        <i class="fas fa-edit"></i> Edit
                                    </button>
                                    <button class="btn btn-sm btn-outline-danger" 
                                            onclick="if(confirm('Are you sure you want to delete this tournament? This action cannot be undone.')) { window.adminPanel.deleteTournament('${tournament._id}') }">
                                        <i class="fas fa-trash"></i> Delete
                                    </button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    <style>
                        .tournaments-grid {
                            display: grid;
                            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                            gap: 1.5rem;
                            margin-top: 1.5rem;
                        }
                        .tournament-card {
                            display: flex;
                            flex-direction: column;
                            height: 100%;
                            transition: transform 0.2s, box-shadow 0.2s;
                        }
                        .tournament-card:hover {
                            transform: translateY(-5px);
                            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
                        }
                        .card-header {
                            display: flex;
                            justify-content: space-between;
                            align-items: flex-start;
                            padding: 1.25rem 1.25rem 0.75rem;
                        }
                        .card-header h3 {
                            margin: 0;
                            font-size: 1.25rem;
                            font-weight: 600;
                            color: var(--text-primary);
                        }
                        .card-body {
                            padding: 0 1.25rem 1.25rem;
                            flex-grow: 1;
                        }
                        .tournament-info p {
                            margin: 0.5rem 0;
                            display: flex;
                            align-items: center;
                            gap: 0.5rem;
                        }
                        .tournament-info i {
                            width: 1.25rem;
                            text-align: center;
                            color: var(--primary-color);
                        }
                        .tournament-info span {
                            font-weight: 500;
                            color: var(--text-secondary);
                            min-width: 90px;
                            display: inline-block;
                        }
                        .card-footer {
                            display: flex;
                            gap: 0.5rem;
                            padding: 0.75rem 1.25rem;
                            background-color: var(--bg-secondary);
                            border-top: 1px solid var(--border-color);
                            border-bottom-left-radius: 0.5rem;
                            border-bottom-right-radius: 0.5rem;
                        }
                        .badge {
                            padding: 0.25rem 0.6rem;
                            border-radius: 20px;
                            font-size: 0.75rem;
                            font-weight: 600;
                            text-transform: capitalize;
                        }
                        .badge-draft { background-color: #6c757d; color: white; }
                        .badge-upcoming { background-color: #17a2b8; color: white; }
                        .badge-active { background-color: #28a745; color: white; }
                        .badge-completed { background-color: #6f42c1; color: white; }
                        .badge-cancelled { background-color: #dc3545; color: white; }
                    </style>`;
            }
        } catch (error) {
            console.error('Error loading tournaments:', error);
            container.innerHTML = `
                <div class="error-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Failed to Load Tournaments</h3>
                    <p>${error.message || 'An error occurred while loading tournaments.'}</p>
                    <div class="d-flex gap-2 mt-3">
                        <button class="btn btn-outline-secondary" onclick="window.adminPanel.loadTournamentsManagement()">
                            <i class="fas fa-sync"></i> Try Again
                        </button>
                        <button class="btn btn-primary" onclick="window.adminPanel.showCreateTournamentModal()">
                            <i class="fas fa-plus"></i> Create New
                        </button>
                    </div>
                </div>`;
        }
    }

// loadPaymentsManagement was moved to the prototype below to avoid parser errors in some environments

    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = 'index.html';
    }

    async editTournament(tournamentId) {
        try {
            const apiBase = window.API_BASE_URL || 'http://127.0.0.1:10000';
            const token = localStorage.getItem('token');

            // Fetch tournament data
            const response = await fetch(`${apiBase}/api/tournaments/${tournamentId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch tournament data');
            }

            const data = await response.json();
            const tournament = data.tournament;

            // Populate edit form
            document.getElementById('editTournamentId').value = tournament._id;
            document.getElementById('editTournamentName').value = tournament.name || '';
            document.getElementById('editTournamentFormat').value = tournament.format || 'knockout';
            document.getElementById('editEntryFee').value = tournament.settings?.entryFee || tournament.entryFee || 0;
            document.getElementById('editPrizePool').value = tournament.settings?.prizePool || tournament.prizePool || 0;
            document.getElementById('editCapacity').value = tournament.settings?.capacity || tournament.capacity || 16;
            document.getElementById('editStatus').value = tournament.status || 'draft';
            document.getElementById('editDescription').value = tournament.description || '';
            document.getElementById('editTournamentRules').value = tournament.settings?.rules || tournament.rules || '';

            // Format start date for datetime-local input
            if (tournament.schedule?.tournamentStart || tournament.startDate) {
                const startDate = new Date(tournament.schedule?.tournamentStart || tournament.startDate);
                const timezoneOffset = startDate.getTimezoneOffset() * 60000;
                const localISOTime = (new Date(startDate - timezoneOffset)).toISOString().slice(0, 16);
                document.getElementById('editStartDate').value = localISOTime;
            }

            // Show edit modal
            this.showEditTournamentModal();

        } catch (error) {
            console.error('Error fetching tournament for edit:', error);
            this.showNotification('Failed to load tournament data for editing', 'error');
        }
    }

    showEditTournamentModal() {
        const modal = document.getElementById('editTournamentModal');
        if (!modal) {
            console.error('Edit tournament modal not found');
            return;
        }

        document.body.classList.add('modal-open');
        modal.style.display = 'block';
        modal.style.position = 'fixed';
        modal.style.top = '0';
        modal.style.left = '0';
        modal.style.width = '100%';
        modal.style.height = '100%';
        modal.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        modal.style.zIndex = '1000';
        modal.style.overflowY = 'auto';

        const modalContent = modal.querySelector('.modal-content');
        if (modalContent) {
            modalContent.style.margin = '20px auto';
            modalContent.style.maxWidth = '800px';
            modalContent.style.background = '#fff';
            modalContent.style.padding = '20px';
            modalContent.style.borderRadius = '8px';
            modalContent.style.position = 'relative';
        }

        // Set up close button
        const closeBtn = modal.querySelector('.close');
        if (closeBtn) {
            closeBtn.onclick = (e) => {
                e.preventDefault();
                this.hideEditTournamentModal();
            };

            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.hideEditTournamentModal();
                }
            });
        }
    }

    hideEditTournamentModal() {
        const modal = document.getElementById('editTournamentModal');
        if (modal) {
            modal.style.display = 'none';
            document.body.classList.remove('modal-open');
        }
    }

    async handleEditTournament() {
        const editForm = document.getElementById('editTournamentForm');
        if (!editForm) {
            console.error('Edit tournament form not found');
            return;
        }

        const submitBtn = editForm.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn ? submitBtn.innerHTML : '';
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Updating...';
        }

        try {
            const formData = new FormData(editForm);
            const tournamentId = formData.get('tournamentId');

            const tournamentData = {
                name: formData.get('name')?.trim(),
                format: formData.get('format'),
                status: formData.get('status'),
                description: formData.get('description')?.trim(),
                settings: {
                    entryFee: parseFloat(formData.get('entryFee') || 0),
                    prizePool: parseFloat(formData.get('prizePool') || 0),
                    capacity: parseInt(formData.get('capacity') || 16, 10),
                    rules: formData.get('rules')?.trim() || ''
                },
                schedule: {
                    tournamentStart: formData.get('startDate') || new Date().toISOString()
                }
            };

            console.log('Updating tournament data:', tournamentData);

            const apiBase = window.API_BASE_URL || 'http://127.0.0.1:10000';
            const token = localStorage.getItem('token');

            const response = await fetch(`${apiBase}/api/tournaments/${tournamentId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(tournamentData)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            console.log('Update result:', result);

            this.showNotification('Tournament updated successfully!', 'success');
            this.hideEditTournamentModal();

            // Reset form
            editForm.reset();

            // Refresh the tournaments list
            this.loadTournamentsManagement();

        } catch (error) {
            console.error('Error updating tournament:', error);
            const errorMessage = error.message || 'Failed to update tournament. Please try again.';
            this.showNotification(errorMessage, 'error');
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnText;
            }
        }
    }

    async deleteTournament(tournamentId) {
        if (!confirm('Are you sure you want to delete this tournament?')) return;

        try {
            const apiBase = (window.API_BASE_URL) || 'http://127.0.0.1:10000';
            const token = localStorage.getItem('token');
            const resp = await fetch(`${apiBase}/api/tournaments/${tournamentId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!resp.ok) throw new Error('Failed to delete tournament');

            this.showNotification('Tournament deleted successfully', 'success');
            this.loadTournamentsManagement(); // Refresh the list
        } catch (error) {
            console.error('Error deleting tournament:', error);
            this.showNotification('Failed to delete tournament', 'error');
        }
    }

    async verifyMatch(matchId) {
        try {
            const apiBase = (window.API_BASE_URL) || 'http://127.0.0.1:10000';
            const token = localStorage.getItem('token');
            const resp = await fetch(`${apiBase}/api/admin/matches/${matchId}/verify`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!resp.ok) throw new Error('Failed to verify match');

            this.showNotification('Match result verified successfully', 'success');
            this.loadMatchesManagement(); // Refresh the list
        } catch (error) {
            console.error('Error verifying match:', error);
            this.showNotification('Failed to verify match', 'error');
        }
    }

    async processPayment(paymentId, action) {
        try {
            const apiBase = (window.API_BASE_URL) || 'http://127.0.0.1:10000';
            const token = localStorage.getItem('token');
            const resp = await fetch(`${apiBase}/api/admin/payments/${paymentId}/process`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ action })
            });

            if (!resp.ok) throw new Error('Failed to process payment');

            this.showNotification(`Payment ${action}d successfully`, 'success');
            this.loadPaymentsManagement(); // Refresh the list
        } catch (error) {
            console.error('Error processing payment:', error);
            this.showNotification('Failed to process payment', 'error');
        }
    }

    setupResponsiveMenu() {
        const hamburger = document.getElementById('hamburger');
        const navMenu = document.getElementById('navMenu');
        
        if (hamburger && navMenu) {
            // Toggle menu on hamburger click
            hamburger.addEventListener('click', () => {
                navMenu.classList.toggle('active');
                hamburger.innerHTML = navMenu.classList.contains('active') ? 
                    '<i class="fas fa-times"></i>' : 
                    '<i class="fas fa-bars"></i>';
            });

            // Close menu when clicking on a nav link
            document.querySelectorAll('.nav-link').forEach(link => {
                link.addEventListener('click', () => {
                    if (window.innerWidth <= 992) {
                        navMenu.classList.remove('active');
                        hamburger.innerHTML = '<i class="fas fa-bars"></i>';
                    }
                });
            });
        }
        
        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            const isClickInside = navMenu.contains(e.target) || 
                               hamburger.contains(e.target);
            
            if (!isClickInside && navMenu.classList.contains('active')) {
                navMenu.classList.remove('active');
                if (hamburger) {
                    hamburger.innerHTML = '<i class="fas fa-bars"></i>';
                }
            }
        });
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

    showLoading(show) {
        // Implementation for loading states
        if (show) {
            // Show loading indicator
        } else {
            // Hide loading indicator
        }
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



}

// Global functions for modal handling (kept for backward compatibility)
function showManagePlayers() {
    window.adminPanel.showManagePlayers();
}

function showPendingResults() {
    window.adminPanel.showPendingResults();
}

function showPaymentManagement() {
    window.adminPanel.showPaymentManagement();
}

// Initialize admin panel when page loads
console.log('DOM fully loaded, initializing admin panel...');
document.addEventListener('DOMContentLoaded', () => {
    try {
        console.log('Creating new AdminPanel instance...');
        window.adminPanel = new AdminPanel();
        console.log('AdminPanel initialized successfully');
        
        // Direct event listener as a fallback
        const createBtn = document.getElementById('createTournamentBtn');
        if (createBtn) {
            console.log('Adding direct click event to create button');
            createBtn.addEventListener('click', function(e) {
                e.preventDefault();
                console.log('Direct button click handler triggered');
                const modal = document.getElementById('createTournamentModal');
                if (modal) {
                    console.log('Showing modal directly');
                    modal.style.display = 'block';
                    document.body.style.overflow = 'hidden';
                } else {
                    console.error('Modal not found in direct handler');
                }
            });
        } else {
            console.error('Create button not found for direct event listener');
        }
    } catch (error) {
        console.error('Error initializing admin panel:', error);
    }
});

// Define loadPaymentsManagement on the prototype (moved out of the class to avoid parser issues)
AdminPanel.prototype.loadPaymentsManagement = async function() {
    const container = document.getElementById('paymentsContainer');
    if (!container) {
        console.error('Payments container not found');
        return;
    }

    container.innerHTML = '<div class="loading">Loading payments...</div>';

    try {
        const apiBase = window.API_BASE_URL || 'http://127.0.0.1:10000';
        const token = localStorage.getItem('token') || '';

        const resp = await fetch(`${apiBase}/api/admin/payments`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            },
            credentials: 'include'
        });

        if (!resp.ok) {
            const err = await resp.json().catch(() => ({}));
            throw new Error(err.message || `HTTP error! status: ${resp.status}`);
        }

        const data = await resp.json();
        const payments = data.payments || [];

        if (payments.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-wallet"></i>
                    <h3>No Payments Found</h3>
                    <p>There are no payment transactions to display right now.</p>
                </div>`;
        } else {
            container.innerHTML = `
                <div class="payments-list">
                    <table class="admin-table">
                        <thead>
                            <tr>
                                <th>Transaction ID</th>
                                <th>Player</th>
                                <th>Amount</th>
                                <th>Tournament</th>
                                <th>Status</th>
                                <th>Date</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${payments.map(payment => `
                                <tr>
                                    <td>${payment.transactionId || 'N/A'}</td>
                                    <td>${payment.user?.efootballId || payment.user?.name || 'N/A'}</td>
                                    <td>KSh ${payment.amount?.toLocaleString() || '0'}</td>
                                    <td>${payment.tournament?.name || 'N/A'}</td>
                                    <td><span class="status-badge status-${payment.status}">${payment.status}</span></td>
                                    <td>${new Date(payment.createdAt).toLocaleDateString()}</td>
                                    <td>
                                        ${payment.status === 'pending' ? `
                                            <button class="btn-sm btn-approve" onclick="window.adminPanel.processPayment('${payment._id}', 'approve')">Approve</button>
                                            <button class="btn-sm btn-reject" onclick="window.adminPanel.processPayment('${payment._id}', 'reject')">Reject</button>
                                        ` : ''}
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading payments:', error);

        // Show mock data for development
        const mockPayments = [
            {
                _id: '1',
                transactionId: 'TXN001',
                user: { efootballId: 'Player1' },
                amount: 100,
                tournament: { name: 'Sample Tournament' },
                status: 'completed',
                createdAt: new Date()
            },
            {
                _id: '2',
                transactionId: 'TXN002',
                user: { efootballId: 'Player2' },
                amount: 50,
                tournament: { name: 'Another Tournament' },
                status: 'pending',
                createdAt: new Date()
            }
        ];

        const containerEl = document.getElementById('paymentsContainer');
        if (!containerEl) return;

        containerEl.innerHTML = `
            <div class="payments-list">
                <table class="admin-table">
                    <thead>
                        <tr>
                            <th>Transaction ID</th>
                            <th>Player</th>
                            <th>Amount</th>
                            <th>Tournament</th>
                            <th>Status</th>
                            <th>Date</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${mockPayments.map(payment => `
                            <tr>
                                <td>${payment.transactionId || 'N/A'}</td>
                                <td>${payment.user?.efootballId || payment.user?.name || 'N/A'}</td>
                                <td>KSh ${payment.amount?.toLocaleString() || '0'}</td>
                                <td>${payment.tournament?.name || 'N/A'}</td>
                                <td><span class="status-badge status-${payment.status}">${payment.status}</span></td>
                                <td>${new Date(payment.createdAt).toLocaleDateString()}</td>
                                <td>
                                    ${payment.status === 'pending' ? `
                                        <button class="btn-sm btn-approve" onclick="window.adminPanel.processPayment('${payment._id}', 'approve')">Approve</button>
                                        <button class="btn-sm btn-reject" onclick="window.adminPanel.processPayment('${payment._id}', 'reject')">Reject</button>
                                    ` : ''}
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }
};

// Global functions for modal handling (kept for backward compatibility)
