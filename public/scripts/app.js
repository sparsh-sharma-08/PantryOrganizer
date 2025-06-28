// Signup logic
if (window.location.pathname.endsWith('signup.html')) {
    document.querySelector('.signUpForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirm-password').value;
        if (password !== confirmPassword) {
            alert('Passwords do not match');
            return;
        }
        const res = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password })
        });
        const data = await res.json();
        if (res.ok) {
            // Show verification code input
            document.querySelector('.signUpForm').innerHTML = `
                <div class="form-group">
                    <label for="verification-code">Enter Verification Code (sent to your email)</label>
                    <input type="text" id="verification-code" required />
                </div>
                <button type="button" class="btn submit-btn" id="verify-btn">Verify</button>
            `;
            document.getElementById('verify-btn').onclick = async () => {
                const code = document.getElementById('verification-code').value;
                const verifyRes = await fetch('/api/auth/verify', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, code })
                });
                const verifyData = await verifyRes.json();
                if (verifyRes.ok) {
                    if (window.navbarManager) {
                        window.navbarManager.addNotification({
                            type: 'system',
                            title: 'Account Verified',
                            message: 'Your account has been successfully verified! You can now log in.',
                            actions: ['Go to Dashboard']
                        });
                    }
                    alert('Account verified! You can now log in.');
                    window.location.href = '/login.html';
                } else {
                    alert(verifyData.error || 'Verification failed');
                }
            };
        } else {
            alert(data.error || 'Signup failed');
        }
    });
    // Social login buttons
    document.getElementById('google-login')?.addEventListener('click', () => {
        window.location.href = '/api/auth/google';
    });
    document.getElementById('github-login')?.addEventListener('click', () => {
        window.location.href = '/api/auth/github';
    });
}

// Login logic
if (window.location.pathname.endsWith('login.html')) {
    document.querySelector('.signUpForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (res.ok) {
            // Store JWT in localStorage
            localStorage.setItem('token', data.token);
            
            // Fetch user profile to get profile photo
            try {
                const profileRes = await fetch('/api/auth/profile', {
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${data.token}`
                    }
                });
                if (profileRes.ok) {
                    const profileData = await profileRes.json();
                    if (profileData.profile_photo) {
                        localStorage.setItem('userAvatar', profileData.profile_photo);
                    }
                }
            } catch (error) {
                console.error('Failed to fetch profile photo:', error);
            }
            
            window.location.href = '/dashboard.html';
        } else {
            alert(data.error || 'Login failed');
        }
    });
    // Social login buttons
    document.getElementById('google-login')?.addEventListener('click', () => {
        window.location.href = '/api/auth/google';
    });
    document.getElementById('github-login')?.addEventListener('click', () => {
        window.location.href = '/api/auth/github';
    });
}
