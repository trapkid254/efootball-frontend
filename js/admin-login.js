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
            document.getElementById('identifier').value = '254714003218';
            document.getElementById('password').value = '#Okwonkwo254';
            passwordInput.focus();
        });
    }
    
    // Auto-fill on page load for testing (remove in production)
    document.addEventListener('DOMContentLoaded', () => {
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            document.getElementById('identifier').value = '254714003218';
            document.getElementById('password').value = '#Okwonkwo254';
        }
    });

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
                // Format the identifier if it's a phone number
                let formattedIdentifier = identifier;
                if (/^0\d{9}$/.test(identifier)) {
                    // Convert local format (0714003218) to international (254714003218)
                    formattedIdentifier = '254' + identifier.substring(1);
                } else if (/^7\d{8}$/.test(identifier)) {
                    // If number starts with 7 (missing leading 0), add 254
                    formattedIdentifier = '254' + identifier;
                }

                // Determine if the identifier is a phone number or efootball ID
                const isPhoneNumber = /^\d+$/.test(formattedIdentifier);

                // Validate phone number format if it's a phone number
                if (isPhoneNumber && !/^254\d{9}$/.test(formattedIdentifier)) {
                    showError('Please enter a valid phone number with country code (e.g., 254714003218)');
                    if (submitButton) {
                        submitButton.disabled = false;
                        submitButton.textContent = 'Sign in';
                    }
                    return;
                }
                
                // Prepare request body with only the relevant field
                const body = isPhoneNumber 
                    ? { whatsapp: formattedIdentifier, password }
                    : { efootballId: formattedIdentifier, password };
                
                console.log('Login attempt with:', body);

                // Determine API base URL
                const apiBase = window.API_BASE_URL || '';
                const apiUrl = `${apiBase}/api/auth/login`;
                
                console.log('Making request to:', apiUrl);
                console.log('Request body:', body);
                
                // Make the API request
                let response;
                try {
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
                    
                    response = await fetch(apiUrl, {
                        method: 'POST',
                        headers: { 
                            'Content-Type': 'application/json',
                            'Accept': 'application/json'
                        },
                        body: JSON.stringify(body),
                        credentials: 'include',
                        signal: controller.signal
                    });
                    
                    clearTimeout(timeoutId);
                    
                    console.log('Response status:', response.status);
                    console.log('Response headers:', Object.fromEntries([...response.headers.entries()]));
                    
                    if (!response.ok) {
                        const errorText = await response.text();
                        console.error('Server responded with error:', errorText);
                        throw new Error(`Server error: ${response.status} ${response.statusText}`);
                    }
                    
                } catch (error) {
                    console.error('Request failed:', error);
                    if (error.name === 'AbortError') {
                        throw new Error('Request timed out. Please check your internet connection.');
                    } else if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
                        throw new Error('Cannot connect to the server. Please check your internet connection.');
                    }
                    throw error;
                }

                // Handle response
                let data;
                try {
                    data = await response.json();
                    console.log('Login response data:', data);
                } catch (parseError) {
                    console.error('Error parsing response:', parseError, 'Response status:', response.status);
                    const responseText = await response.text();
                    console.error('Raw response:', responseText);
                    throw new Error('Invalid response from server. Please try again.');
                }

                // Check for errors
                if (!response.ok) {
                    console.error('Login failed with status:', response.status, 'Details:', data);
                    
                    let errorMessage = 'Login failed';
                    if (response.status === 401) {
                        errorMessage = data?.details || 'Invalid credentials. Please check your username and password.';
                    } else if (response.status === 403) {
                        errorMessage = 'Access denied. You do not have permission to access this resource.';
                    } else if (data?.message) {
                        errorMessage = data.message;
                    }
                    
                    throw new Error(errorMessage);
                }

                if (data.user?.role !== 'admin') {
                    console.error('Login failed: User is not an admin');
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
