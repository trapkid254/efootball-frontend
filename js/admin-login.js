document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('adminLoginForm');
    const errorEl = document.getElementById('loginError');
    const devFill = document.getElementById('devFill');
    const togglePassword = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('password');

    // Toggle password visibility
    if (togglePassword) {
        togglePassword.addEventListener('click', function() {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            const icon = this.querySelector('i');
            if (type === 'password') {
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            } else {
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            }
        });
    }

    devFill?.addEventListener('click', function (e) {
        e.preventDefault();
        document.getElementById('identifier').value = '12345'; // Efootball ID
        document.getElementById('password').value = '#Okwonkwo254';
    });

    form.addEventListener('submit', async function (e) {
        e.preventDefault();
        errorEl.style.display = 'none';

        const identifier = document.getElementById('identifier').value.trim();
        const password = document.getElementById('password').value;

        try {
            const body = {
                whatsapp: identifier,  // Always send both fields for better compatibility
                efootballId: identifier,
                password: password
            };

            const apiBase = (window.API_BASE_URL) || 'http://127.0.0.1:5000';
            const resp = await fetch(`${apiBase}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            const data = await resp.json();
            if (!resp.ok || !data.success) {
                throw new Error(data.message || 'Invalid credentials');
            }

            if (data.user?.role !== 'admin') {
                throw new Error('This account is not an admin');
            }

            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));

            window.location.href = 'admin.html';
        } catch (err) {
            errorEl.textContent = err.message || 'Login failed. Please try again.';
            errorEl.style.display = 'block';
        }
    });
});
