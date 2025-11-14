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

                // Determine API base URL - use the correct port (10001) that the server is running on
                const apiBase = window.API_BASE_URL || 'http://localhost:10001';
                const apiUrl = `${apiBase}/api/auth/login`;
                
                console.log('Making request to:', apiUrl);
                console.log('Request body:', { ...body, password: '***' }); // Don't log actual password
                
                // Make the API request with CORS and timeout handling
                let response;
                const controller = new AbortController();
                const requestTimeout = 30000; // 30 seconds
                const startTime = Date.now();
                const timeoutId = setTimeout(() => {
                    console.error(`Request timed out after ${requestTimeout/1000} seconds`);
                    controller.abort();
                }, requestTimeout);
                
                try {
                    console.log('Sending login request...');
                    
                    // First, handle CORS preflight if needed
                    const corsOptions = {
                        method: 'OPTIONS',
                        headers: {
                            'Origin': window.location.origin,
                            'Access-Control-Request-Method': 'POST',
                            'Access-Control-Request-Headers': 'content-type,authorization'
                        }
                    };
                    
                    // Make the actual request
                    response = await fetch(apiUrl, {
                        method: 'POST',
                        headers: { 
                            'Content-Type': 'application/json',
                            'Accept': 'application/json',
                            'Origin': window.location.origin
                        },
                        body: JSON.stringify(body),
                        credentials: 'include',
                        signal: controller.signal,
                        mode: 'cors'
                    });
                    
                    const responseTime = Date.now() - startTime;
                    console.log(`Request completed in ${responseTime}ms`);
                    console.log('Response status:', response.status);
                    console.log('Response headers:', Object.fromEntries([...response.headers.entries()]));
                
                    if (!response.ok) {
                        const errorData = await response.json().catch(() => ({}));
                        console.error('Server responded with error:', errorData);
                        
                        if (response.status === 401) {
                            throw new Error(errorData.message || 'Invalid credentials. Please check your login details and try again.');
                        }
                        
                        throw new Error(errorData.message || `Server error: ${response.status} ${response.statusText}`);
                    }
                    
                } catch (error) {
                    const errorTime = Date.now() - startTime;
                    const errorDetails = {
                        name: error.name,
                        message: error.message,
                        type: error.constructor.name,
                        timeElapsed: `${errorTime}ms`,
                        url: apiUrl,
                        method: 'POST',
                        isAborted: error.name === 'AbortError',
                        isNetworkError: error.message.includes('Failed to fetch'),
                        stack: error.stack
                    };
                    
                    console.error('Request failed with details:', errorDetails);
                    
                    if (error.name === 'AbortError') {
                        throw new Error(`Request timed out after ${errorTime}ms. The server is not responding. Please check:
1. The server is running on port 10001
2. There are no network issues
3. The server allows requests from this origin: ${window.location.origin}`);
                    } else if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
                        throw new Error(`Cannot connect to the server. Please check:
1. The server is running at ${apiUrl}
2. Your internet connection
3. The server's CORS configuration allows requests from ${window.location.origin}`);
                    }
                    throw error;
                } finally {
                    // Clear the timeout if the request completes before the timeout
                    clearTimeout(timeoutId);
                    console.log('Request cleanup complete');
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
