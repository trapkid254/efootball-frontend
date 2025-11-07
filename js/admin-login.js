document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('adminLoginForm');
    const errorEl = document.getElementById('loginError');
    const devFill = document.getElementById('devFill');

    devFill?.addEventListener('click', function (e) {
        e.preventDefault();
        document.getElementById('identifier').value = '0712345678';
        document.getElementById('password').value = 'Admin@1234';
    });

    form.addEventListener('submit', async function (e) {
        e.preventDefault();
        errorEl.style.display = 'none';

        const identifier = document.getElementById('identifier').value.trim();
        const password = document.getElementById('password').value;

        try {
            const body = {};
            const whatsappRegex = /^(07\d{8}|2547\d{8}|\+2547\d{8})$/;
            if (whatsappRegex.test(identifier.replace(/\s/g, ''))) {
                body.whatsapp = identifier;
            } else {
                body.efootballId = identifier;
            }
            body.password = password;

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
