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
    }

    init() {
        this.checkAuth();
        this.setupEventListeners();
        this.loadTournaments();
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

    async loadTournaments() {
        try {
            this.showLoading(true);
            const apiBase = window.API_BASE_URL || 'http://localhost:5000'; // Changed to localhost for development
            const params = new URLSearchParams();
            params.set('page', this.currentPage);
            params.set('limit', this.itemsPerPage);
            if (this.filters.status && this.filters.status !== 'all') params.set('status', this.filters.status);
            if (this.filters.format && this.filters.format !== 'all') params.set('format', this.filters.format);

            // Add cache-busting parameter
            params.set('_t', new Date().getTime());

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

            try {
                const resp = await fetch(`${apiBase}/api/tournaments?${params.toString()}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    signal: controller.signal
                });
                clearTimeout(timeoutId);

                if (!resp.ok) {
                    const errorData = await resp.json().catch(() => ({}));
                    throw new Error(errorData.message || `HTTP error! status: ${resp.status}`);
                }

                const data = await resp.json();
                
                if (!data.success) {
                    throw new Error(data.message || 'Failed to fetch tournaments');
                }

                const tournaments = data.tournaments || [];
                
                if (tournaments.length === 0) {
                    this.showEmptyState('No tournaments are currently available. New tournaments are added regularly, so please check back soon or refresh the page for updates.', false);
                    return;
                }

                this.renderTournaments(tournaments);
                this.renderPagination(data.pagination?.total || tournaments.length);
            } catch (error) {
                clearTimeout(timeoutId);
                if (error.name === 'AbortError') {
                    throw new Error('Request timed out. Please check your internet connection.');
                }
                throw error;
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
            const entryFee = tournament.entryFee || tournament.settings?.entryFee || 0;
            
            return `
            <div class="tournament-card" data-status="${tournament.status}" data-format="${tournament.format}" data-fee="${entryFee === 0 ? 'free' : 'paid'}">
                <div class="tournament-header">
                    <span class="tournament-prize">KSh ${tournament.prizePool?.toLocaleString() || '0'}</span>
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
                        <span><i class="fas fa-calendar"></i> ${new Date(tournament.schedule?.tournamentStart || tournament.startDate || Date.now()).toLocaleDateString()}</span>
                        <span><i class="fas fa-trophy"></i> ${tournament.format || 'N/A'}</span>
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

            const modal = document.getElementById('tournamentDetailsModal');
            const content = document.getElementById('tournamentDetailsContent');
            
            content.innerHTML = `
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
                            <span>${(tournament.entryFee || tournament.settings?.entryFee || 0) > 0 ? `KSh ${(tournament.entryFee || tournament.settings?.entryFee)}` : 'Free'}</span>
                        </div>
                    </div>
                    
                    <div class="details-section">
                        <h3>Description</h3>
                        <p>${tournament.description || ''}</p>
                    </div>
                    
                    <div class="details-section">
                        <h3>Tournament Rules</h3>
                        <p>${tournament.rules || ''}</p>
                    </div>
                    
                    <div class="details-actions">
                        <button class="btn-secondary" onclick="this.closest('.modal').style.display='none'">Close</button>
                        <button class="btn-primary join-from-details" data-id="${tournament._id}">
                            ${(tournament.entryFee || tournament.settings?.entryFee || 0) > 0 ? `Join Tournament - KSh ${(tournament.entryFee || tournament.settings?.entryFee)}` : 'Join Tournament Free'}
                        </button>
                    </div>
                </div>
            `;

            // Add event listener to join button in modal
            content.querySelector('.join-from-details').addEventListener('click', (e) => {
                this.handleJoinTournament(tournamentId);
                modal.style.display = 'none';
            });

            modal.style.display = 'block';

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
            
            // First, get the latest tournament data to check capacity
            const tournamentResp = await fetch(`${apiBase}/api/tournaments/${tournamentId}`);
            const tournamentData = await tournamentResp.json();
            
            if (!tournamentResp.ok || !tournamentData.success) {
                throw new Error('Failed to fetch tournament details');
            }

            const tournament = tournamentData.tournament;
            const currentParticipants = tournament.participants?.length || 0;
            const maxParticipants = tournament.capacity || tournament.settings?.capacity || 0;

            // Check if tournament is full
            if (currentParticipants >= maxParticipants) {
                throw new Error('This tournament is already full');
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

        const modal = document.getElementById('tournamentDetailsModal');
        const content = document.getElementById('tournamentDetailsContent');
        
        content.innerHTML = `
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
                        <span>${(tournament.entryFee || tournament.settings?.entryFee || 0) > 0 ? `KSh ${(tournament.entryFee || tournament.settings?.entryFee)}` : 'Free'}</span>
                    </div>
                </div>
                
                <div class="details-section">
                    <h3>Description</h3>
                    <p>${tournament.description || ''}</p>
                </div>
                
                <div class="details-section">
                    <h3>Tournament Rules</h3>
                    <p>${tournament.rules || ''}</p>
                </div>
                
                <div class="details-actions">
                    <button class="btn-secondary" onclick="this.closest('.modal').style.display='none'">Close</button>
                    <button class="btn-primary join-from-details" data-id="${tournament._id}">
                        ${(tournament.entryFee || tournament.settings?.entryFee || 0) > 0 ? `Join Tournament - KSh ${(tournament.entryFee || tournament.settings?.entryFee)}` : 'Join Tournament Free'}
                    </button>
                </div>
            </div>
        `;

        // Add event listener to join button in modal
        content.querySelector('.join-from-details').addEventListener('click', (e) => {
            this.handleJoinTournament(tournamentId);
            modal.style.display = 'none';
        });

        modal.style.display = 'block';

    } catch (error) {
        console.error('Error loading tournament details:', error);
        this.showNotification('Failed to load tournament details', 'error');
    }
}

async handleJoinTournament(tournamentId) {
    try {
        const apiBase = (window.API_BASE_URL) || 'http://127.0.0.1:5000';
        const token = localStorage.getItem('token');
        
        if (!token) {
            this.showNotification('Please log in to join tournaments', 'error');
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

        // Check if tournament is full
        if (currentParticipants >= maxParticipants) {
            throw new Error('This tournament is already full');
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