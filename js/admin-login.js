document.addEventListener('DOMContentLoaded', function () {
    // DOM Elements
    const form = document.getElementById('adminLoginForm');
    const errorEl = document.getElementById('loginError');
    const devFill = document.getElementById('devFill');
    const togglePassword = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('password');
    const submitButton = form?.querySelector('button[type="submit"]');

    // Toggle password visibility
    if (togglePassword && passwordInput) {
        togglePassword.addEventListener('click', function(e) {
            e.preventDefault();
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            const icon = this.querySelector('i');
            icon.className = type === 'password' ? 'fas fa-eye' : 'fas fa-eye-slash';
            passwordInput.focus(); // Keep focus on the input
        });
    }

    // Auto-fill demo credentials
    if (devFill) {
        devFill.addEventListener('click', function (e) {
            e.preventDefault();
            document.getElementById('identifier').value = '12345';
            document.getElementById('password').value = '#Okwonkwo254';
            passwordInput.focus();
        });
    }

    // Handle form submission
    if (form) {
        form.addEventListener('submit', async function (e) {
            e.preventDefault();
            
            // Reset error state
            errorEl.style.display = 'none';
            
            // Get form values
            const identifier = document.getElementById('identifier')?.value.trim() || '';
            const password = document.getElementById('password')?.value || '';
            
            // Basic validation
            if (!identifier || !password) {
                showError('Please fill in all fields');
                return;
            }

            // Disable submit button during request
            if (submitButton) {
                submitButton.disabled = true;
                submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing in...';
            }

            try {
                // Prepare request body
                const body = {
                    whatsapp: identifier,
                    efootballId: identifier,
                    password: password
                };

                // Determine API base URL
                const apiBase = window.API_BASE_URL || '';
                
                // Make the API request
                let response;
                try {
                    response = await fetch(`${apiBase}/api/auth/login`, {
                        method: 'POST',
                        headers: { 
                            'Content-Type': 'application/json',
                            'Accept': 'application/json'
                        },
                        body: JSON.stringify(body),
                        credentials: 'include' // Important for cookies/sessions
                    });
                } catch (networkError) {
                    console.error('Network error:', networkError);
                    throw new Error('Unable to connect to the server. Please check your internet connection.');
                }

                // Handle response
                let data;
                try {
                    data = await response.json();
                } catch (parseError) {
                    console.error('Error parsing response:', parseError);
                    throw new Error('Invalid response from server');
                }

                // Check for errors
                if (!response.ok) {
                    const errorMessage = data?.message || 
                                      (response.status === 401 ? 'Invalid credentials' : 
                                      response.status === 403 ? 'Access denied' :
                                      'Login failed');
                    throw new Error(errorMessage);
                }

                if (data.user?.role !== 'admin') {
                    throw new Error('This account does not have admin privileges');
                }

                // Store authentication data
                if (data.token) {
                    localStorage.setItem('token', data.token);
                    localStorage.setItem('user', JSON.stringify(data.user));
                }

                // Redirect to admin dashboard
                window.location.href = 'admin.html';

            } catch (error) {
                console.error('Login error:', error);
                showError(error.message || 'An error occurred during login');
            } finally {
                // Re-enable submit button
                if (submitButton) {
                    submitButton.disabled = false;
                    submitButton.textContent = 'Sign in';
                }
            }
        });
    }

    // Helper function to show error messages
    function showError(message) {
        if (!errorEl) return;
        errorEl.textContent = message;
        errorEl.style.display = 'block';
        
        // Auto-hide error after 5 seconds
        setTimeout(() => {
            if (errorEl.textContent === message) {
                errorEl.style.display = 'none';
            }
        }, 5000);
    }
});
