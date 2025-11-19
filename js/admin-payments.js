class AdminPaymentsPage {
    constructor() {
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadPayments();
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
    }

    toggleTheme() {
        const isDarkTheme = document.body.classList.contains('dark-theme');
        document.body.classList.toggle('light-theme', !isDarkTheme);
        document.body.classList.toggle('dark-theme', isDarkTheme);

        const icon = document.querySelector('#themeToggle i');
        icon.className = isDarkTheme ? 'fas fa-sun' : 'fas fa-moon';

        localStorage.setItem('theme', isDarkTheme ? 'light' : 'dark');
    }

    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = 'index.html';
    }

    async loadPayments() {
        const container = document.getElementById('paymentsContainer');
        if (!container) {
            console.error('Payments container not found');
            return;
        }

        // Show loading state
        container.innerHTML = `
            <div class="loading">
                <i class="fas fa-spinner fa-spin"></i>
                <span>Loading payments...</span>
            </div>`;

        try {
            const apiBase = window.API_BASE_URL || 'https://efootball-backend-f8ws.onrender.com';

            const response = await fetch(`${apiBase}/api/admin/payments?limit=50`, {
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            const payments = data.payments || [];

            console.log(`Loaded ${payments.length} payments for admin`);

            if (payments.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-credit-card"></i>
                        <h3>No Payments Found</h3>
                        <p>No payment transactions have been recorded yet.</p>
                        <button class="btn btn-primary" onclick="window.adminPaymentsPage.loadPayments()">
                            <i class="fas fa-sync"></i> Refresh
                        </button>
                    </div>`;
                return;
            }

            container.innerHTML = `
                <div class="section-header">
                    <h2>Payment Transactions (${payments.length})</h2>
                    <button class="btn btn-secondary" onclick="window.adminPaymentsPage.loadPayments()">
                        <i class="fas fa-sync"></i> Refresh
                    </button>
                </div>
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
                                            <button class="btn btn-sm btn-approve" onclick="window.adminPaymentsPage.processPayment('${payment._id}', 'approve')">
                                                <i class="fas fa-check"></i> Approve
                                            </button>
                                            <button class="btn btn-sm btn-reject" onclick="window.adminPaymentsPage.processPayment('${payment._id}', 'reject')">
                                                <i class="fas fa-times"></i> Reject
                                            </button>
                                        ` : ''}
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
                <style>
                    .payments-list {
                        background: var(--bg-secondary);
                        border-radius: 8px;
                        overflow: hidden;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                    }
                    .admin-table {
                        width: 100%;
                        border-collapse: collapse;
                    }
                    .admin-table th,
                    .admin-table td {
                        padding: 1rem;
                        text-align: left;
                        border-bottom: 1px solid var(--border-color);
                    }
                    .admin-table th {
                        background: var(--bg-primary);
                        font-weight: 600;
                        color: var(--text-primary);
                        text-transform: uppercase;
                        font-size: 0.85rem;
                        letter-spacing: 0.05em;
                    }
                    .admin-table tr:hover {
                        background: var(--bg-primary);
                    }
                    .status-badge {
                        padding: 0.25rem 0.6rem;
                        border-radius: 20px;
                        font-size: 0.75rem;
                        font-weight: 600;
                        text-transform: capitalize;
                    }
                    .status-completed { background-color: #28a745; color: white; }
                    .status-pending { background-color: #ffc107; color: #1f1f1f; }
                    .status-failed { background-color: #dc3545; color: white; }
                    .btn-sm {
                        padding: 0.375rem 0.75rem;
                        font-size: 0.875rem;
                        border-radius: 0.375rem;
                        border: 1px solid transparent;
                        cursor: pointer;
                        transition: all 0.2s;
                        margin-right: 0.25rem;
                    }
                    .btn-approve {
                        background-color: #28a745;
                        color: white;
                        border-color: #28a745;
                    }
                    .btn-approve:hover {
                        background-color: #218838;
                        border-color: #1e7e34;
                    }
                    .btn-reject {
                        background-color: #dc3545;
                        color: white;
                        border-color: #dc3545;
                    }
                    .btn-reject:hover {
                        background-color: #c82333;
                        border-color: #bd2130;
                    }
                </style>`;

        } catch (error) {
            console.error('Error loading payments:', error);
            container.innerHTML = `
                <div class="error-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Failed to Load Payments</h3>
                    <p>${error.message || 'An error occurred while loading payments.'}</p>
                    <div class="d-flex gap-2 mt-3">
                        <button class="btn btn-outline-secondary" onclick="window.adminPaymentsPage.loadPayments()">
                            <i class="fas fa-sync"></i> Try Again
                        </button>
                    </div>
                </div>`;
        }
    }

    async processPayment(paymentId, action) {
        if (!confirm(`Are you sure you want to ${action} this payment?`)) {
            return;
        }

        try {
            const apiBase = window.API_BASE_URL || 'https://efootball-backend-f8ws.onrender.com';

            const response = await fetch(`${apiBase}/api/admin/payments/${paymentId}/process`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ action })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `Failed to ${action} payment (${response.status})`);
            }

            this.showNotification(`Payment ${action}d successfully!`, 'success');
            // Reload payments list
            this.loadPayments();

        } catch (error) {
            console.error('Error processing payment:', error);
            this.showNotification(error.message || `Failed to ${action} payment`, 'error');
        }
    }

    showNotification(message, type = 'info') {
        // Remove existing notifications
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }

        // Add styles if not already added
        if (!document.querySelector('#notification-styles')) {
            const styles = document.createElement('style');
            styles.id = 'notification-styles';
            styles.textContent = `
                .notification {
                    position: fixed;
                    top: 100px;
                    right: 20px;
                    background: #fff;
                    border-left: 4px solid;
                    border-radius: 8px;
                    padding: 1rem 1.5rem;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                    z-index: 3000;
                    animation: slideInRight 0.3s ease;
                    max-width: 400px;
                    border-left-color: #007bff;
                }
                .notification-success { border-left-color: #28a745; }
                .notification-error { border-left-color: #dc3545; }
                .notification-warning { border-left-color: #ffc107; }
                .notification-info { border-left-color: #007bff; }
                .notification-content {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    color: #333;
                }
                @keyframes slideInRight {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOutRight {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
            `;
            document.head.appendChild(styles);
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
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.adminPaymentsPage = new AdminPaymentsPage();
});