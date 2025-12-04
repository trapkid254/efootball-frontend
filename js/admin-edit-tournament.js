class AdminEditTournamentPage {
    constructor() {
        this.tournamentId = this.getTournamentIdFromUrl();
        this.init();
    }

    getTournamentIdFromUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('id');
    }

    init() {
        if (!this.tournamentId) {
            this.showError('No tournament ID provided');
            return;
        }

        this.setupEventListeners();
        this.loadTournament();
    }

    setupEventListeners() {
        // Theme toggle
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                this.toggleTheme();
            });
        }

        // Logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                this.logout();
            });
        }

        // Back button
        const backBtn = document.getElementById('backBtn');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                window.location.href = 'admin-tournaments.html';
            });
        }
    }

    toggleTheme() {
        const isDarkTheme = document.body.classList.contains('dark-theme');
        document.body.classList.toggle('light-theme', !isDarkTheme);
        document.body.classList.toggle('dark-theme', isDarkTheme);

        const icon = document.querySelector('#themeToggle i');
        if (icon) icon.className = isDarkTheme ? 'fas fa-sun' : 'fas fa-moon';

        localStorage.setItem('theme', isDarkTheme ? 'light' : 'dark');
    }

    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = 'index.html';
    }

    async loadTournament() {
        const container = document.getElementById('editContainer');
        if (!container) {
            console.error('Edit container not found');
            return;
        }

        // Show loading state
        container.innerHTML = `
            <div class="loading">
                <i class="fas fa-spinner fa-spin"></i>
                <span>Loading tournament...</span>
            </div>`;

        try {
            const apiBase = window.API_BASE_URL || 'https://efootball-backend-f8ws.onrender.com';
            const token = localStorage.getItem('token');

            const response = await fetch(`${apiBase}/api/admin/tournaments/${this.tournamentId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                const ct = response.headers.get('content-type') || '';
                if (ct.includes('application/json')) {
                    const errBody = await response.json().catch(() => ({}));
                    throw new Error(errBody.message || `HTTP error! status: ${response.status}`);
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const tournament = await response.json();

            this.renderEditForm(tournament);

        } catch (error) {
            console.error('Error loading tournament:', error);
            container.innerHTML = `
                <div class="error-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Failed to Load Tournament</h3>
                    <p>${error.message || 'An error occurred while loading the tournament.'}</p>
                    <div class="d-flex gap-2 mt-3">
                        <button class="btn btn-outline-secondary" onclick="window.adminEditTournamentPage.loadTournament()">
                            <i class="fas fa-sync"></i> Try Again
                        </button>
                        <button class="btn btn-secondary" onclick="window.location.href='admin-tournaments.html'">
                            <i class="fas fa-arrow-left"></i> Back to Tournaments
                        </button>
                    </div>
                </div>`;
        }
    }

    renderEditForm(tournament) {
        const container = document.getElementById('editContainer');
        if (!container) return;

        // Format dates for datetime-local input
        const formatDateTime = (dateString) => {
            if (!dateString) return '';
            const date = new Date(dateString);
            return date.toISOString().slice(0, 16);
        };

        container.innerHTML = `
            <div class="edit-form-container">
                <form id="editTournamentForm">
                    <div class="form-row">
                        <div class="form-group">
                            <label for="tournamentName">Tournament Name</label>
                            <input type="text" id="tournamentName" name="name" value="${tournament.name || ''}" required>
                        </div>
                        <div class="form-group">
                            <label for="tournamentFormat">Format</label>
                            <select id="tournamentFormat" name="format" required>
                                <option value="knockout" ${tournament.format === 'knockout' ? 'selected' : ''}>Knockout</option>
                                <option value="group" ${tournament.format === 'group' ? 'selected' : ''}>Group Stage</option>
                                <option value="group+knockout" ${tournament.format === 'group+knockout' ? 'selected' : ''}>Group + Knockout</option>
                                <option value="league" ${tournament.format === 'league' ? 'selected' : ''}>League</option>
                            </select>
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label for="entryFee">Entry Fee (KSh)</label>
                            <input type="number" id="entryFee" name="entryFee" min="0" value="${tournament.entryFee || 0}">
                        </div>
                        <div class="form-group">
                            <label for="prizePool">Prize Pool (KSh)</label>
                            <input type="number" id="prizePool" name="prizePool" min="0" value="${tournament.prizePool || 0}" required>
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label for="capacity">Player Capacity</label>
                            <input type="number" id="capacity" name="capacity" min="2" max="128" value="${tournament.capacity || 16}" required>
                        </div>
                        <div class="form-group">
                            <label for="startDate">Start Date</label>
                            <input type="datetime-local" id="startDate" name="startDate" value="${formatDateTime(tournament.startDate || tournament.schedule?.tournamentStart)}" required>
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label for="status">Status</label>
                            <select id="status" name="status" required>
                                <option value="draft" ${tournament.status === 'draft' ? 'selected' : ''}>Draft</option>
                                <option value="upcoming" ${tournament.status === 'upcoming' ? 'selected' : ''}>Upcoming</option>
                                <option value="active" ${tournament.status === 'active' ? 'selected' : ''}>Active</option>
                                <option value="completed" ${tournament.status === 'completed' ? 'selected' : ''}>Completed</option>
                                <option value="cancelled" ${tournament.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                            </select>
                        </div>
                    </div>

                    <div class="form-group">
                        <label for="description">Description</label>
                        <textarea id="description" name="description" rows="4" required>${tournament.description || ''}</textarea>
                    </div>

                    <div class="form-group">
                        <label for="rules">Rules</label>
                        <textarea id="rules" name="rules" rows="3">${tournament.rules || ''}</textarea>
                    </div>

                    <div class="form-actions">
                        <button type="button" class="btn-secondary" onclick="window.location.href='admin-tournaments.html'">Cancel</button>
                        <button type="submit" class="btn-primary">Update Tournament</button>
                    </div>
                </form>
            </div>
            <style>
                .edit-form-container {
                    max-width: 800px;
                    margin: 0 auto;
                }

                .form-row {
                    display: flex;
                    gap: 1rem;
                    margin-bottom: 1rem;
                }

                .form-row .form-group {
                    flex: 1;
                }

                .form-group {
                    margin-bottom: 1.5rem;
                }

                .form-group label {
                    display: block;
                    margin-bottom: 0.5rem;
                    font-weight: 500;
                    color: var(--text-primary);
                }

                .form-group input,
                .form-group select,
                .form-group textarea {
                    width: 100%;
                    padding: 0.75rem;
                    border: 1px solid var(--border-color);
                    border-radius: 6px;
                    background: var(--bg-primary);
                    color: var(--text-primary);
                    font-size: 1rem;
                }

                .form-group input:focus,
                .form-group select:focus,
                .form-group textarea:focus {
                    outline: none;
                    border-color: var(--primary-color);
                    box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
                }

                .form-actions {
                    display: flex;
                    gap: 1rem;
                    justify-content: flex-end;
                    margin-top: 2rem;
                    padding-top: 1rem;
                    border-top: 1px solid var(--border-color);
                }

                .btn-primary, .btn-secondary {
                    padding: 0.75rem 1.5rem;
                    border: none;
                    border-radius: 6px;
                    font-size: 1rem;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }

                .btn-primary {
                    background: var(--primary-color);
                    color: white;
                }

                .btn-primary:hover {
                    background: var(--primary-color-dark);
                    transform: translateY(-1px);
                }

                .btn-secondary {
                    background: var(--bg-secondary);
                    color: var(--text-primary);
                    border: 1px solid var(--border-color);
                }

                .btn-secondary:hover {
                    background: var(--bg-primary);
                }

                @media (max-width: 768px) {
                    .form-row {
                        flex-direction: column;
                        gap: 0;
                    }
                }
            </style>`;

        // Setup form submission
        const form = document.getElementById('editTournamentForm');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.updateTournament();
            });
        }
    }

    async updateTournament() {
        const form = document.getElementById('editTournamentForm');
        if (!form) return;

        const formData = new FormData(form);
        const tournamentData = {
            name: formData.get('name'),
            format: formData.get('format'),
            entryFee: parseInt(formData.get('entryFee')) || 0,
            prizePool: parseInt(formData.get('prizePool')) || 0,
            capacity: parseInt(formData.get('capacity')) || 16,
            startDate: formData.get('startDate'),
            status: formData.get('status'),
            description: formData.get('description'),
            rules: formData.get('rules')
        };

        // Show loading state
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Updating...';

        try {
            const apiBase = window.API_BASE_URL || 'https://efootball-backend-f8ws.onrender.com';
            const token = localStorage.getItem('token');

            const response = await fetch(`${apiBase}/api/admin/tournaments/${this.tournamentId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(tournamentData)
            });

            if (!response.ok) {
                const ct = response.headers.get('content-type') || '';
                if (ct.includes('application/json')) {
                    const errBody = await response.json().catch(() => ({}));
                    throw new Error(errBody.message || `HTTP error! status: ${response.status}`);
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            this.showNotification('Tournament updated successfully!', 'success');

            // Redirect back to tournaments list after a short delay
            setTimeout(() => {
                window.location.href = 'admin-tournaments.html';
            }, 1500);

        } catch (error) {
            console.error('Error updating tournament:', error);
            this.showNotification(error.message || 'Failed to update tournament', 'error');

            // Reset button
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
    }

    showNotification(message, type = 'info') {
        // Simple alert for now - can be enhanced with a proper notification system
        alert(message);
    }

    showError(message) {
        const container = document.getElementById('editContainer');
        if (container) {
            container.innerHTML = `
                <div class="error-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Error</h3>
                    <p>${message}</p>
                    <button class="btn btn-secondary" onclick="window.location.href='admin-tournaments.html'">
                        <i class="fas fa-arrow-left"></i> Back to Tournaments
                    </button>
                </div>`;
        }
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.adminEditTournamentPage = new AdminEditTournamentPage();
});