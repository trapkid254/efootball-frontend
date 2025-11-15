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
        const devUser = { _id: 'dev-admin', name: 'Admin', role: 'admin' };
        localStorage.setItem('token', 'dev-token');
        localStorage.setItem('user', JSON.stringify(devUser));
        this.currentUser = devUser;
        this.updateAdminInfo();
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
                    if (modal.style.display === 'flex') {
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
        const updateUI = (activities) => {
            this.updateActivitiesUI(activities);
            // Save to localStorage for offline use
            try {
                localStorage.setItem('adminRecentActivities', JSON.stringify(activities));
            } catch (e) {
                console.warn('Failed to save activities to localStorage', e);
            }
        };

        try {
            const apiBase = window.API_BASE_URL || 'http://127.0.0.1:5000';
            const token = localStorage.getItem('token') || '';
            const resp = await fetch(`${apiBase}/api/admin/dashboard`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!resp.ok) throw new Error('Failed to load from server');

            const data = await resp.json();
            if (data && data.success) {
                const stats = data.stats || {};
                const el = id => document.getElementById(id);
                if (el('totalPlayers')) el('totalPlayers').textContent = stats.totalPlayers ?? 0;
                if (el('activeTournamentsCount')) el('activeTournamentsCount').textContent = stats.activeTournaments ?? 0;
                if (el('pendingMatches')) el('pendingMatches').textContent = stats.pendingMatches ?? 0;
                if (el('totalRevenue')) el('totalRevenue').textContent = `KSh ${(stats.totalRevenue || 0).toLocaleString()}`;

                const activities = this.processActivities(data.recentActivity || {});
                updateUI(activities);
                return;
            }

            throw new Error('Invalid server response');
        } catch (error) {
            console.warn('Server load failed, falling back to localStorage/mock:', error);

            // Try localStorage
            const stored = localStorage.getItem('adminRecentActivities');
            if (stored) {
                try {
                    const parsed = JSON.parse(stored);
                    updateUI(parsed);
                    return;
                } catch (e) {
                    console.warn('Failed to parse stored activities', e);
                }
            }

            // Fallback mock stats and activities
            const mockStats = {
                totalPlayers: 25,
                activeTournaments: 3,
                pendingMatches: 5,
                totalRevenue: 15000
            };
            const el = id => document.getElementById(id);
            if (el('totalPlayers')) el('totalPlayers').textContent = mockStats.totalPlayers;
            if (el('activeTournamentsCount')) el('activeTournamentsCount').textContent = mockStats.activeTournaments;
            if (el('pendingMatches')) el('pendingMatches').textContent = mockStats.pendingMatches;
            if (el('totalRevenue')) el('totalRevenue').textContent = `KSh ${mockStats.totalRevenue.toLocaleString()}`;

            const mockActivities = [
                { time: new Date().toLocaleString(), activity: 'Tournament Created', user: 'Admin', details: 'Sample Tournament' },
                { time: new Date().toLocaleString(), activity: 'Player Registered', user: 'Player1', details: '' }
            ];
            updateUI(mockActivities);
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
            // Temporarily removing login requirement for development
            // Will be re-enabled when authentication is properly set up

            const apiBase = window.API_BASE_URL || 'http://127.0.0.1:5000';
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
                    prizePool: tournamentData.settings?.prizePool || 0,
                    capacity: tournamentData.settings?.capacity || 16,
                    entryFee: tournamentData.entryFee || 0,
                    rules: tournamentData.rules || ''
                },
                status: 'upcoming'
            };
            
            console.log('Request body:', JSON.stringify(requestBody, null, 2));
            
            const response = await fetch(`${apiBase}/api/tournaments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                credentials: 'include',  // Include credentials (cookies) with the request
                body: JSON.stringify(requestBody)
            });

            console.log('Response status:', response.status);
            
            let result;
            try {
                result = await response.json();
                console.log('Response data:', result);
            } catch (jsonError) {
                console.error('Error parsing JSON response:', jsonError);
                throw new Error('Invalid response from server');
            }

            if (!response.ok) {
                const errorMessage = result?.message || 
                                  result?.error || 
                                  `Server error: ${response.status} ${response.statusText}`;
                console.error('Server error details:', result);
                throw new Error(errorMessage);
            }

            this.showNotification('Tournament created successfully!', 'success');
            this.hideCreateTournamentModal();
            
            // Reset the form
            tournamentForm.reset();
            
            // Reload the tournaments section if it's active
            if (window.location.hash === '#tournaments') {
                this.loadSectionData('tournaments');
            }
            
            // Refresh dashboard stats
            this.loadAdminData();
            
        } catch (error) {
            console.error('Error creating tournament:', error);
            const errorMessage = error.message || 'Failed to create tournament. Please try again.';
            this.showNotification(errorMessage, 'error');
        } finally {
            // Re-enable the submit button
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
        try {
            const apiBase = (window.API_BASE_URL) || 'http://127.0.0.1:5000';
            const token = localStorage.getItem('token');
            const resp = await fetch(`${apiBase}/api/admin/tournaments`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await resp.json();
            if (!resp.ok) throw new Error(data.message || 'Failed to load tournaments');

            const tournaments = data.tournaments || [];
            const container = document.getElementById('tournamentsContainer');

            if (tournaments.length === 0) {
                container.innerHTML = '<div class="empty-state"><p>No tournaments created yet. <a href="admin.html">Create your first tournament</a></p></div>';
            } else {
                container.innerHTML = `
                    <div class="tournaments-list">
                        ${tournaments.map(tournament => `
                            <div class="tournament-card admin-card">
                                <div class="card-header">
                                    <h3>${tournament.name}</h3>
                                    <span class="status-badge status-${tournament.status}">${tournament.status}</span>
                                </div>
                                <div class="card-body">
                                    <p><strong>Format:</strong> ${tournament.format}</p>
                                    <p><strong>Participants:</strong> ${tournament.participants?.length || 0}/${tournament.capacity || tournament.settings?.capacity || 0}</p>
                                    <p><strong>Prize Pool:</strong> KSh ${(tournament.prizePool || tournament.settings?.prizePool || 0).toLocaleString()}</p>
                                    <p><strong>Entry Fee:</strong> KSh ${(tournament.entryFee || tournament.settings?.entryFee || 0).toLocaleString()}</p>
                                </div>
                                <div class="card-actions">
                                    <button class="btn-secondary" onclick="window.adminPanel.editTournament('${tournament._id}')">Edit</button>
                                    <button class="btn-danger" onclick="window.adminPanel.deleteTournament('${tournament._id}')">Delete</button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                `;
            }
        } catch (error) {
            console.error('Error loading tournaments:', error);
            // Show mock data for development
            const mockTournaments = [
                {
                    _id: '1',
                    name: 'Sample Tournament 1',
                    status: 'upcoming',
                    format: 'knockout',
                    participants: [],
                    capacity: 16,
                    settings: { prizePool: 5000, entryFee: 100 }
                },
                {
                    _id: '2',
                    name: 'Sample Tournament 2',
                    status: 'active',
                    format: 'league',
                    participants: [],
                    capacity: 8,
                    settings: { prizePool: 2000, entryFee: 50 }
                }
            ];
            const container = document.getElementById('tournamentsContainer');
            container.innerHTML = `
                <div class="tournaments-list">
                    ${mockTournaments.map(tournament => `
                        <div class="tournament-card admin-card">
                            <div class="card-header">
                                <h3>${tournament.name}</h3>
                                <span class="status-badge status-${tournament.status}">${tournament.status}</span>
                            </div>
                            <div class="card-body">
                                <p><strong>Format:</strong> ${tournament.format}</p>
                                <p><strong>Participants:</strong> ${tournament.participants?.length || 0}/${tournament.capacity || tournament.settings?.capacity || 0}</p>
                                <p><strong>Prize Pool:</strong> KSh ${(tournament.prizePool || tournament.settings?.prizePool || 0).toLocaleString()}</p>
                                <p><strong>Entry Fee:</strong> KSh ${(tournament.entryFee || tournament.settings?.entryFee || 0).toLocaleString()}</p>
                            </div>
                            <div class="card-actions">
                                <button class="btn-secondary" onclick="window.adminPanel.editTournament('${tournament._id}')">Edit</button>
                                <button class="btn-danger" onclick="window.adminPanel.deleteTournament('${tournament._id}')">Delete</button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        }
    }

    async loadMatchesManagement() {
        try {
            const apiBase = (window.API_BASE_URL) || 'http://127.0.0.1:5000';
            const token = localStorage.getItem('token');
            const resp = await fetch(`${apiBase}/api/admin/matches/pending`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await resp.json();
            if (!resp.ok) throw new Error(data.message || 'Failed to load matches');

            const matches = data.matches || [];
            const container = document.getElementById('matchesContainer');

            if (matches.length === 0) {
                container.innerHTML = '<div class="empty-state"><p>No pending matches to review.</p></div>';
            } else {
                container.innerHTML = `
                    <div class="matches-list">
                        ${matches.map(match => `
                            <div class="match-card admin-card">
                                <div class="card-header">
                                    <h3>${match.player1?.user?.efootballId || 'Player 1'} vs ${match.player2?.user?.efootballId || 'Player 2'}</h3>
                                    <span class="status-badge status-${match.status}">${match.status}</span>
                                </div>
                                <div class="card-body">
                                    <p><strong>Tournament:</strong> ${match.tournament?.name || 'N/A'}</p>
                                    <p><strong>Submitted Scores:</strong> ${match.result?.score1 || 0} - ${match.result?.score2 || 0}</p>
                                    <p><strong>Winner:</strong> ${match.result?.winner ? (match.result.winner.efootballId || 'Unknown') : 'Pending'}</p>
                                </div>
                                <div class="card-actions">
                                    <button class="btn-primary" onclick="window.adminPanel.verifyMatch('${match._id}')">Verify Result</button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                `;
            }
        } catch (error) {
            console.error('Error loading matches:', error);
            // Show mock data for development
            const mockMatches = [
                {
                    _id: '1',
                    player1: { user: { efootballId: 'Player1' } },
                    player2: { user: { efootballId: 'Player2' } },
                    tournament: { name: 'Sample Tournament' },
                    status: 'completed',
                    result: { score1: 2, score2: 1, winner: { efootballId: 'Player1' } }
                }
            ];
            const container = document.getElementById('matchesContainer');
            container.innerHTML = `
                <div class="matches-list">
                    ${mockMatches.map(match => `
                        <div class="match-card admin-card">
                            <div class="card-header">
                                <h3>${match.player1?.user?.efootballId || 'Player 1'} vs ${match.player2?.user?.efootballId || 'Player 2'}</h3>
                                <span class="status-badge status-${match.status}">${match.status}</span>
                            </div>
                            <div class="card-body">
                                <p><strong>Tournament:</strong> ${match.tournament?.name || 'N/A'}</p>
                                <p><strong>Submitted Scores:</strong> ${match.result?.score1 || 0} - ${match.result?.score2 || 0}</p>
                                <p><strong>Winner:</strong> ${match.result?.winner ? (match.result.winner.efootballId || 'Unknown') : 'Pending'}</p>
                            </div>
                            <div class="card-actions">
                                <button class="btn-primary" onclick="window.adminPanel.verifyMatch('${match._id}')">Verify Result</button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        }
    }

    async loadPlayersManagement() {
        try {
            const apiBase = (window.API_BASE_URL) || 'http://127.0.0.1:5000';
            const token = localStorage.getItem('token');
            // Try to fetch users, but since endpoint may not exist, fall back to mock
            const resp = await fetch(`${apiBase}/api/users`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await resp.json();
            if (!resp.ok) throw new Error(data.message || 'Failed to load players');

            const players = data.users || [];
            this.renderPlayers(players);
        } catch (error) {
            console.error('Error loading players:', error);
            // Show mock data for development
            const mockPlayers = [
                { efootballId: 'Player1', name: 'John Doe', email: 'john@example.com', phone: '+1234567890', createdAt: new Date(), role: 'player' },
                { efootballId: 'Player2', name: 'Jane Smith', email: 'jane@example.com', phone: '+0987654321', createdAt: new Date(), role: 'player' }
            ];
            this.renderPlayers(mockPlayers);
        }
    }

    renderPlayers(players) {
        const container = document.getElementById('playersContainer');

        if (players.length === 0) {
            container.innerHTML = '<div class="empty-state"><p>No players registered yet.</p></div>';
        } else {
            container.innerHTML = `
                <div class="players-list">
                    <table class="admin-table">
                        <thead>
                            <tr>
                                <th>eFootball ID</th>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Phone</th>
                                <th>Joined</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${players.map(player => `
                                <tr>
                                    <td>${player.efootballId || 'N/A'}</td>
                                    <td>${player.name || 'N/A'}</td>
                                    <td>${player.email || 'N/A'}</td>
                                    <td>${player.phone || 'N/A'}</td>
                                    <td>${new Date(player.createdAt).toLocaleDateString()}</td>
                                    <td><span class="status-badge status-active">Active</span></td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        }
    }

    async loadPaymentsManagement() {
        try {
            const apiBase = (window.API_BASE_URL) || 'http://127.0.0.1:5000';
            const token = localStorage.getItem('token');
            const resp = await fetch(`${apiBase}/api/admin/payments`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await resp.json();
            if (!resp.ok) throw new Error(data.message || 'Failed to load payments');

            const payments = data.payments || [];
            const container = document.getElementById('paymentsContainer');

            if (payments.length === 0) {
                container.innerHTML = '<div class="empty-state"><p>No payments recorded yet.</p></div>';
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
            const container = document.getElementById('paymentsContainer');
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
    }

    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = 'index.html';
    }

    async editTournament(tournamentId) {
        // For now, just show an alert. Full edit functionality can be implemented later
        alert('Edit tournament functionality will be implemented. Tournament ID: ' + tournamentId);
    }

    async deleteTournament(tournamentId) {
        if (!confirm('Are you sure you want to delete this tournament?')) return;

        try {
            const apiBase = (window.API_BASE_URL) || 'http://127.0.0.1:5000';
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
            const apiBase = (window.API_BASE_URL) || 'http://127.0.0.1:5000';
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
            const apiBase = (window.API_BASE_URL) || 'http://127.0.0.1:5000';
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