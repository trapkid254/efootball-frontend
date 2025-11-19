class TournamentsPage {
    constructor() {
        this.currentPage = 1;
        this.itemsPerPage = 9;
        this.filters = {
            status: 'all',
            format: 'all',
            fee: 'all'
        };
        this.init();
        this.setupModal();
    }

    init() {
        this.checkAuth();
        this.setupEventListeners();
        this.loadTournaments();
    }

    setupModal() {
        // Get the modal element
        this.modal = document.getElementById('tournamentDetailsModal');
        
        // Get the element that closes the modal
        const closeBtn = document.querySelector('.modal .close');
        
        // When the user clicks on (x), close the modal
        if (closeBtn) {
            closeBtn.onclick = () => {
                this.hideModal();
            };
        }
        
        // When the user clicks anywhere outside of the modal, close it
        window.onclick = (event) => {
            if (event.target === this.modal) {
                this.hideModal();
            }
        };
        
        // Close modal with Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal && this.modal.style.display === 'block') {
                this.hideModal();
            }
        });
    }
    
    showModal() {
        if (this.modal) {
            this.modal.style.display = 'block';
            document.body.style.overflow = 'hidden';
        }
    }
    
    hideModal() {
        if (this.modal) {
            this.modal.style.display = 'none';
            document.body.style.overflow = '';
        }
    }

    checkAuth() {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');
        
        if (token && userData) {
            try {
                this.currentUser = JSON.parse(userData);
                this.updateAuthButton();
            } catch (error) {
                console.error('Error parsing user data:', error);
            }
        }
    }

    setupEventListeners() {
        // Theme toggle
        document.getElementById('themeToggle').addEventListener('click', () => {
            this.toggleTheme();
        });

        // Auth button
        document.getElementById('authButton').addEventListener('click', () => {
            this.handleAuthButtonClick();
        });

        // Filter controls
        document.getElementById('applyFilters').addEventListener('click', () => {
            this.applyFilters();
        });

        document.getElementById('statusFilter').addEventListener('change', (e) => {
            this.filters.status = e.target.value;
        });

        document.getElementById('formatFilter').addEventListener('change', (e) => {
            this.filters.format = e.target.value;
        });

        document.getElementById('feeFilter').addEventListener('change', (e) => {
            this.filters.fee = e.target.value;
        });

        // Enter key on filters
        document.querySelectorAll('.filters select').forEach(select => {
            select.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.applyFilters();
                }
            });
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

    updateAuthButton() {
        const authButton = document.getElementById('authButton');
        if (this.currentUser) {
            authButton.textContent = 'Dashboard';
            authButton.onclick = () => {
                window.location.href = 'dashboard.html';
            };
        } else {
            authButton.textContent = 'Login';
            authButton.onclick = () => {
                window.location.href = 'index.html#login';
            };
        }
    }

    handleAuthButtonClick() {
        if (this.currentUser) {
            window.location.href = 'dashboard.html';
        } else {
            window.location.href = 'index.html#login';
        }
    }

    async loadPublicTournaments() {
        try {
            const apiBase = window.API_BASE_URL || 'http://localhost:5000';
            const params = new URLSearchParams();
            params.set('status', 'upcoming');
            params.set('limit', 10);
            params.set('_t', new Date().getTime());

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);

            try {
                const resp = await fetch(`${apiBase}/api/tournaments?${params.toString()}`, {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                    signal: controller.signal
                });
                clearTimeout(timeoutId);

                if (!resp.ok) {
                    throw new Error(`HTTP error! status: ${resp.status}`);
                }

                const data = await resp.json();
                const tournaments = data.tournaments || [];
                
                if (tournaments.length === 0) {
                    this.showEmptyState('No public tournaments are currently available. Please log in to see all available tournaments.', true);
                    return;
                }

                // Mark all as not registered since this is the public endpoint
                this.renderTournaments(tournaments.map(t => ({ ...t, isRegistered: false })));
                
            } catch (error) {
                clearTimeout(timeoutId);
                throw error;
            }
        } catch (error) {
            console.error('Error loading public tournaments:', error);
            this.showEmptyState('Unable to load tournaments. Please try again later or contact support if the problem persists.', true);
        }
    }

    async loadTournaments() {
        try {
            this.showLoading(true);
            const apiBase = window.API_BASE_URL || 'http://localhost:5000';
            
            // Get the authentication token
            const token = localStorage.getItem('token');
            
            // If user is not logged in, show only public tournaments
            if (!token) {
                await this.loadPublicTournaments();
                return;
            }
            
            // If user is logged in, load their tournaments
            const headers = {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            };
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);

            try {
                // First, try to get user's tournaments
                const [myTournamentsResp, availableResp] = await Promise.all([
                    fetch(`${apiBase}/api/user/my-tournaments`, { headers, signal: controller.signal }),
                    fetch(`${apiBase}/api/user/available-tournaments`, { headers, signal: controller.signal })
                ]);
                
                clearTimeout(timeoutId);

                // Handle my tournaments response
                if (!myTournamentsResp.ok) {
                    throw new Error(`Failed to fetch your tournaments: ${myTournamentsResp.status}`);
                }
                
                const myTournamentsData = await myTournamentsResp.json();
                const myTournaments = myTournamentsData.tournaments || [];
                
                // Handle available tournaments response
                let availableTournaments = [];
                if (availableResp.ok) {
                    const availableData = await availableResp.json();
                    availableTournaments = availableData.tournaments || [];
                }
                
                // Combine both lists, marking which ones the user is registered for
                const allTournaments = [
                    ...myTournaments.map(t => ({ ...t, isRegistered: true })),
                    ...availableTournaments.map(t => ({ ...t, isRegistered: false }))
                ];
                
                if (allTournaments.length === 0) {
                    this.showEmptyState('No tournaments are currently available. Check back later or contact the administrator for upcoming events.', false);
                    return;
                }
                
                this.renderTournaments(allTournaments);
                
            } catch (error) {
                clearTimeout(timeoutId);
                if (error.name === 'AbortError') {
                    throw new Error('Request timed out. Please check your internet connection.');
                }
                console.error('Error loading tournaments:', error);
                // Fall back to public tournaments if there's an error
                await this.loadPublicTournaments();
            }
        } catch (error) {
            console.error('Error loading tournaments:', error);
            let errorMessage = 'Failed to load tournaments. ';
            
            if (error.message.includes('Failed to fetch')) {
                errorMessage += 'Unable to connect to the server. Please check your internet connection and try again.';
            } else if (error.message.includes('timeout')) {
                errorMessage += 'The request timed out. The server might be busy. Please try again later.';
            } else {
                errorMessage += error.message || 'Please try again later.';
            }
            
            this.showEmptyState(errorMessage, true);
        } finally {
            this.showLoading(false);
        }
    }

    applyFilters() {
        this.currentPage = 1;
        this.loadTournaments();
    }

    renderTournaments(tournaments) {
        const filteredTournaments = this.filterTournaments(tournaments);
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const paginatedTournaments = filteredTournaments.slice(startIndex, endIndex);

        const grid = document.getElementById('tournamentsGrid');
        
        if (paginatedTournaments.length === 0) {
            this.showEmptyState('No tournaments match your filters. Try adjusting your search criteria.');
            return;
        }

        grid.innerHTML = paginatedTournaments.map(tournament => {
            const participants = tournament.participants?.length || 0;
            const maxParticipants = tournament.capacity || tournament.settings?.capacity || 0;
            const isFull = participants >= maxParticipants;
            const isUpcoming = tournament.status === 'upcoming' || tournament.status === 'registration';
            const canJoin = isUpcoming && !isFull;
            const entryFee = tournament.entryFee ?? tournament.settings?.entryFee ?? 0;
            const prizePool = tournament.prizePool ?? tournament.settings?.prizePool ?? 0;
            const startDate = tournament.schedule?.tournamentStart || tournament.startDate || Date.now();
            
            return `
            <div class="tournament-card" data-status="${tournament.status}" data-format="${tournament.format}" data-fee="${entryFee === 0 ? 'free' : 'paid'}">
                <div class="tournament-header">
                    <span class="tournament-prize">KSh ${prizePool.toLocaleString()}</span>
                    <span class="tournament-status ${tournament.status}">${tournament.status.charAt(0).toUpperCase() + tournament.status.slice(1)}</span>
                </div>
                <div class="tournament-info">
                    <h3>${tournament.name}</h3>
                    <p>${tournament.description || 'No description available.'}</p>
                    <div class="tournament-meta">
                        <span class="participants-count" title="${participants} out of ${maxParticipants} participants">
                            <i class="fas fa-users"></i> ${participants}/${maxParticipants}
                            ${isFull ? '<span class="badge-full">FULL</span>' : ''}
                        </span>
                        <span><i class="fas fa-calendar"></i> ${new Date(startDate).toLocaleDateString()}</span>
                        <span><i class="fas fa-trophy"></i> ${tournament.format || 'N/A'}</span>
                        <span><i class="fas fa-ticket-alt"></i> ${entryFee > 0 ? `Entry: KSh ${entryFee.toLocaleString()}` : 'Free Entry'}</span>
                    </div>
                    <div class="tournament-actions">
                        <button class="btn-secondary view-details" data-id="${tournament._id}">
                            <i class="fas fa-info-circle"></i> Details
                        </button>
                        <button 
                            class="join-tournament ${entryFee === 0 ? 'free' : 'paid'} ${!canJoin ? 'disabled' : ''}" 
                            data-id="${tournament._id}"
                            ${!canJoin ? 'disabled' : ''}
                            title="${isFull ? 'Tournament is full' : !isUpcoming ? 'Registration closed' : ''}"
                        >
                            ${isFull ? 'Tournament Full' : !isUpcoming ? 'Registration Closed' : 
                              entryFee > 0 ? `Join - KSh ${entryFee.toLocaleString()}` : 'Join Free'}
                        </button>
                    </div>
                </div>
            </div>
        `}).join('');

        // Add event listeners
        this.attachTournamentEventListeners();
    }

    filterTournaments(tournaments) {
        return tournaments.filter(tournament => {
            // Status filter
            if (this.filters.status !== 'all' && tournament.status !== this.filters.status) {
                return false;
            }
            
            // Format filter
            if (this.filters.format !== 'all' && tournament.format !== this.filters.format) {
                return false;
            }
            
            // Fee filter
            if (this.filters.fee === 'free' && (tournament.entryFee || tournament.settings?.entryFee || 0) > 0) {
                return false;
            }
            if (this.filters.fee === 'paid' && (tournament.entryFee || tournament.settings?.entryFee || 0) === 0) {
                return false;
            }
            
            return true;
        });
    }

    attachTournamentEventListeners() {
        // View details buttons
        document.querySelectorAll('.view-details').forEach(button => {
            button.addEventListener('click', (e) => {
                const tournamentId = e.target.closest('.view-details').dataset.id;
                this.showTournamentDetails(tournamentId);
            });
        });

        // Join tournament buttons
        document.querySelectorAll('.join-tournament').forEach(button => {
            button.addEventListener('click', (e) => {
                const tournamentId = e.target.closest('.join-tournament').dataset.id;
                this.handleJoinTournament(tournamentId);
            });
        });
    }

    async showTournamentDetails(tournamentId) {
        try {
            const apiBase = (window.API_BASE_URL) || 'http://127.0.0.1:5000';
            const resp = await fetch(`${apiBase}/api/tournaments/${tournamentId}`);
            const data = await resp.json();
            if (!resp.ok || !data.success) throw new Error(data.message || 'Failed to fetch tournament');
            const tournament = data.tournament;
            
            if (!tournament) {
                this.showNotification('Tournament not found', 'error');
                return;
            }

            const entryFee = tournament.entryFee ?? tournament.settings?.entryFee ?? 0;
            const rules = tournament.settings?.rules || tournament.rules || 'Standard Efootball rules apply';

            this.modalContent.innerHTML = `
                <div class="tournament-details">
                    <div class="details-header">
                        <h2>${tournament.name}</h2>
                        <div class="details-meta">
                            <span class="status-badge status-${tournament.status}">${tournament.status}</span>
                            <span class="prize-badge">KSh ${(tournament.prizePool || tournament.settings?.prizePool || 0).toLocaleString()} Prize Pool</span>
                        </div>
                    </div>
                    
                    <div class="details-grid">
                        <div class="detail-item">
                            <label><i class="fas fa-calendar"></i> Start Date</label>
                            <span>${new Date(tournament.schedule?.tournamentStart || tournament.startDate || Date.now()).toLocaleDateString()}</span>
                        </div>
                        <div class="detail-item">
                            <label><i class="fas fa-users"></i> Participants</label>
                            <span>${(tournament.participants?.length||0)}/${tournament.capacity || tournament.settings?.capacity || 0}</span>
                        </div>
                        <div class="detail-item">
                            <label><i class="fas fa-trophy"></i> Format</label>
                            <span>${tournament.format}</span>
                        </div>
                        <div class="detail-item">
                            <label><i class="fas fa-money-bill-wave"></i> Entry Fee</label>
                            <span>${entryFee > 0 ? `KSh ${entryFee.toLocaleString()}` : 'Free'}</span>
                        </div>
                    </div>
                    
                    <div class="details-section">
                        <h3>Description</h3>
                        <p>${tournament.description || ''}</p>
                    </div>
                    
                    <div class="details-section">
                        <h3>Tournament Rules</h3>
                        <p>${rules}</p>
                    </div>
                    
                    <div class="details-actions">
                        <button class="btn-secondary close-modal">Close</button>
                        <button class="btn-primary join-from-details" data-id="${tournament._id}">
                            ${entryFee > 0 ? `Join Tournament - KSh ${entryFee.toLocaleString()}` : 'Join Tournament Free'}
                        </button>
                    </div>
                </div>
            `;

            // Add event listeners
            this.modalContent.querySelector('.join-from-details').addEventListener('click', () => {
                this.handleJoinTournament(tournamentId);
                this.closeModal();
            });
            
            this.modalContent.querySelector('.close-modal').addEventListener('click', () => this.closeModal());

            // Show the modal
            this.modal.style.display = 'block';
            document.body.style.overflow = 'hidden'; // Prevent scrolling when modal is open

        } catch (error) {
            console.error('Error loading tournament details:', error);
            this.showNotification('Failed to load tournament details', 'error');
        }
    }

    async handleJoinTournament(tournamentId) {
        if (!this.currentUser) {
            this.showNotification('Please login to join tournaments', 'warning');
            setTimeout(() => {
                window.location.href = 'index.html#login';
            }, 1000);
            return;
        }
        
        try {
            const apiBase = (window.API_BASE_URL) || 'http://127.0.0.1:5000';
            const token = localStorage.getItem('token');
            
            if (!token) {
                this.showNotification('Please login again to continue.', 'warning');
                setTimeout(() => window.location.href = 'index.html#login', 800);
                return;
            }
            
            // First, get the latest tournament data to check capacity
            const tournamentResp = await fetch(`${apiBase}/api/tournaments/${tournamentId}`);
            const tournamentData = await tournamentResp.json();
            
            if (!tournamentResp.ok || !tournamentData.success) {
                throw new Error('Failed to fetch tournament details');
            }

            const tournament = tournamentData.tournament;
            const currentParticipants = tournament.participants?.length || 0;
            const maxParticipants = tournament.capacity || tournament.settings?.capacity || 0;
            const entryFee = tournament.entryFee ?? tournament.settings?.entryFee ?? 0;

            // Check if tournament is full
            if (currentParticipants >= maxParticipants) {
                throw new Error('This tournament is already full');
            }

            if (entryFee > 0) {
                const confirmed = this.promptPaymentInstructions(entryFee);
                if (!confirmed) {
                    this.showNotification('Payment is required to join this tournament.', 'warning');
                    return;
                }
            }

            // If not full, proceed with joining
            const joinResp = await fetch(`${apiBase}/api/tournaments/${tournamentId}/join`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await joinResp.json();
            
            if (!joinResp.ok) {
                throw new Error(data.message || 'Failed to join tournament');
            }

            this.showNotification('Successfully joined the tournament!', 'success');
            this.loadTournaments(); // Refresh the list
        } catch (error) {
            console.error('Error joining tournament:', error);
            this.showNotification(error.message || 'Failed to join tournament', 'error');
            
            // If the error is because the tournament is full, refresh the list to update UI
            if (error.message.includes('full')) {
                this.loadTournaments();
            }
        }
    }

    promptPaymentInstructions(amount) {
        const formattedAmount = Number(amount || 0).toLocaleString();
        const message = `This tournament requires an entry fee of KSh ${formattedAmount}.\n\n` +
            `Please send the payment via M-PESA to 0714003218 before continuing.\n` +
            `Tap OK once you've completed the payment to finish your registration.`;
        return window.confirm(message);
    }


renderPagination(totalItems) {
    const totalPages = Math.ceil(totalItems / this.itemsPerPage);
    const pagination = document.getElementById('pagination');
    
    if (totalPages <= 1) {
        pagination.innerHTML = '';
        return;
    }

    let paginationHTML = '';
    
    // Previous button
    if (this.currentPage > 1) {
        paginationHTML += `<button class="page-btn" onclick="tournamentsPage.goToPage(${this.currentPage - 1})">Previous</button>`;
    }
    
    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        if (i === this.currentPage) {
            paginationHTML += `<button class="page-btn active">${i}</button>`;
        } else {
            paginationHTML += `<button class="page-btn" onclick="tournamentsPage.goToPage(${i})">${i}</button>`;
        }
    }
    
    // Next button
    if (this.currentPage < totalPages) {
        paginationHTML += `<button class="page-btn" onclick="tournamentsPage.goToPage(${this.currentPage + 1})">Next</button>`;
    }
    
    pagination.innerHTML = paginationHTML;
}

goToPage(page) {
    this.currentPage = page;
    this.loadTournaments();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

showLoading(show) {
    const loadingState = document.getElementById('loadingState');
    const tournamentsGrid = document.getElementById('tournamentsGrid');
    const emptyState = document.getElementById('emptyState');
    
    if (show) {
        loadingState.style.display = 'block';
        tournamentsGrid.style.display = 'none';
        emptyState.style.display = 'none';
    } else {
        loadingState.style.display = 'none';
        tournamentsGrid.style.display = 'grid';
    }
}

showEmptyState(message, isError = false) {
    const grid = document.getElementById('tournamentsGrid');
    const emptyState = document.getElementById('emptyState');
    const loadingState = document.getElementById('loadingState');
    
    loadingState.style.display = 'none';
    grid.style.display = 'none';
    
    if (isError) {
        emptyState.innerHTML = `
            <div class="empty-state-content">
                <div class="empty-state-icon error">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <h3>Unable to Load Tournaments</h3>
                <p>${message}</p>
                <div class="empty-state-actions">
                    <button class="btn btn-primary" id="retryButton">
                        <i class="fas fa-sync-alt"></i> Try Again
                    </button>
                </div>
            </div>
        `;
        
        document.getElementById('retryButton').addEventListener('click', () => {
            // Reset filters and reload
            this.filters = {
                status: 'all',
                format: 'all',
                fee: 'all'
            };
            document.getElementById('statusFilter').value = 'all';
            document.getElementById('formatFilter').value = 'all';
            document.getElementById('feeFilter').value = 'all';
            this.currentPage = 1;
            this.loadTournaments();
        });
    } else {
        emptyState.innerHTML = `
            <div class="empty-state-content">
                <div class="empty-state-icon">
                    <i class="fas fa-trophy"></i>
                </div>
                <h3>No Tournaments Available</h3>
                <p>${message}</p>
                <div class="empty-state-actions">
                    <button class="btn btn-secondary" id="refreshButton">
                        <i class="fas fa-sync-alt"></i> Refresh Page
                    </button>
                    <a href="index.html" class="btn btn-primary">
                        <i class="fas fa-home"></i> Return Home
                    </a>
                </div>
            </div>
        `;
        
        document.getElementById('refreshButton').addEventListener('click', () => {
            window.location.reload();
        });
    }
    
    emptyState.style.display = 'flex';
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

// Initialize tournaments page when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.tournamentsPage = new TournamentsPage();
});