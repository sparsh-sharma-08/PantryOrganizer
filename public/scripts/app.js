// Signup logic
if (window.location.pathname.endsWith('signup.html')) {
    const signupForm = document.querySelector('.signUpForm');
    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirm-password').value;
            if (password !== confirmPassword) {
                showNotification('Passwords do not match', 'error');
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
                        showNotification('Account verified! You can now log in.', 'success');
                        window.location.href = '/login.html';
                    } else {
                        showNotification(verifyData.error || 'Verification failed', 'error');
                    }
                };
            } else {
                showNotification(data.error || 'Signup failed', 'error');
            }
        });
    }
    
    // Social login buttons
    const googleLoginBtn = document.getElementById('google-login');
    if (googleLoginBtn) {
        googleLoginBtn.addEventListener('click', () => {
            window.location.href = '/api/auth/google';
        });
    }
    
    const githubLoginBtn = document.getElementById('github-login');
    if (githubLoginBtn) {
        githubLoginBtn.addEventListener('click', () => {
            window.location.href = '/api/auth/github';
        });
    }
}

// Login logic
if (window.location.pathname.endsWith('login.html')) {
    const loginForm = document.querySelector('.signUpForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
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
                showNotification(data.error || 'Login failed', 'error');
            }
        });
    }
    
    // Social login buttons
    const googleLoginBtn = document.getElementById('google-login');
    if (googleLoginBtn) {
        googleLoginBtn.addEventListener('click', () => {
            window.location.href = '/api/auth/google';
        });
    }
    
    const githubLoginBtn = document.getElementById('github-login');
    if (githubLoginBtn) {
        githubLoginBtn.addEventListener('click', () => {
            window.location.href = '/api/auth/github';
        });
    }
}

function showNotification(message, type = 'info') {
    let notif = document.getElementById('customNotificationBox');
    if (!notif) {
        notif = document.createElement('div');
        notif.id = 'customNotificationBox';
        notif.style.position = 'fixed';
        notif.style.top = '24px';
        notif.style.right = '24px';
        notif.style.zIndex = '9999';
        notif.style.minWidth = '220px';
        notif.style.padding = '1em 1.5em';
        notif.style.borderRadius = '6px';
        notif.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
        notif.style.fontSize = '1em';
        notif.style.display = 'none';
        notif.style.background = '#3498db';
        notif.style.color = '#fff';
        notif.style.transition = 'opacity 0.3s, transform 0.3s';
        notif.style.opacity = '0';
        notif.innerHTML = '<span id="notifMsg"></span><button id="notifClose" style="background:none;border:none;color:#fff;font-size:1.2em;position:absolute;top:8px;right:12px;cursor:pointer;">&times;</button>';
        document.body.appendChild(notif);
        notif.querySelector('#notifClose').onclick = () => {
            notif.style.opacity = '0';
            setTimeout(() => { notif.style.display = 'none'; }, 300);
        };
    }
    notif.querySelector('#notifMsg').textContent = message;
    notif.style.background = type === 'error' ? '#e74c3c' : (type === 'success' ? '#27ae60' : '#3498db');
    notif.style.display = 'block';
    notif.style.opacity = '1';
    notif.style.transform = 'translateY(0)';
    setTimeout(() => {
        notif.style.opacity = '0';
        setTimeout(() => { notif.style.display = 'none'; }, 300);
    }, 4000);
}

document.addEventListener('DOMContentLoaded', () => {
    // Contact form logic
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('contactName').value.trim();
            const email = document.getElementById('contactEmail').value.trim();
            const message = document.getElementById('contactMessage').value.trim();
            const statusDiv = document.getElementById('contactFormStatus');
            statusDiv.style.display = 'none';
            statusDiv.classList.remove('error');

            if (!name || !email || !message) {
                showNotification('Please fill in all fields.', 'error');
                statusDiv.textContent = 'Please fill in all fields.';
                statusDiv.classList.add('error');
                statusDiv.style.display = 'block';
                return;
            }
            // Basic email validation
            if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
                showNotification('Please enter a valid email address.', 'error');
                statusDiv.textContent = 'Please enter a valid email address.';
                statusDiv.classList.add('error');
                statusDiv.style.display = 'block';
                return;
            }
            statusDiv.textContent = 'Sending...';
            statusDiv.style.display = 'block';
            try {
                const res = await fetch('/api/contact', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, email, message })
                });
                const data = await res.json();
                if (res.ok) {
                    showNotification('Message sent! We will get back to you soon.', 'success');
                    statusDiv.textContent = 'Message sent! We will get back to you soon.';
                    contactForm.reset();
                } else {
                    showNotification(data.error || 'Failed to send message.', 'error');
                    statusDiv.textContent = data.error || 'Failed to send message.';
                    statusDiv.classList.add('error');
                }
            } catch (err) {
                showNotification('Failed to send message. Please try again.', 'error');
                statusDiv.textContent = 'Failed to send message. Please try again.';
                statusDiv.classList.add('error');
            }
            statusDiv.style.display = 'block';
        });
    }
});
