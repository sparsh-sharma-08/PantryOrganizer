// Prevent conflicts with existing app.js
document.addEventListener('DOMContentLoaded', function() {
  // Remove any existing event listeners from app.js
  const oldForms = document.querySelectorAll('.signUpForm');
  oldForms.forEach(form => {
    const newForm = form.cloneNode(true);
    form.parentNode.replaceChild(newForm, form);
  });
});

// Helper for safe logging
function safeLog(...args) {
  // Only log in development mode
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    console.log(...args);
  }
}

function safeErrorLog(...args) {
  // Always log errors, but mask sensitive info
  const sanitizedArgs = args.map(arg => {
    if (typeof arg === 'string') {
      return arg.replace(/([\w.-]+)@([\w.-]+)/g, '***@***');
    }
    return arg;
  });
  console.error(...sanitizedArgs);
}

// Password Toggle Functionality
document.querySelectorAll('.password-toggle').forEach(button => {
  button.addEventListener('click', function() {
    const input = this.parentElement.querySelector('input');
    const icon = this.querySelector('i');
    
    if (input.type === 'password') {
      input.type = 'text';
      icon.classList.remove('fa-eye');
      icon.classList.add('fa-eye-slash');
    } else {
      input.type = 'password';
      icon.classList.remove('fa-eye-slash');
      icon.classList.add('fa-eye');
    }
  });
});

// Password Strength Checker
const passwordInput = document.getElementById('password');
const strengthFill = document.getElementById('strength-fill');
const strengthText = document.getElementById('strength-text');

if (passwordInput && strengthFill && strengthText) {
  passwordInput.addEventListener('input', function() {
    const password = this.value;
    const strength = checkPasswordStrength(password);
    updatePasswordStrength(strength);
  });
}

function checkPasswordStrength(password) {
  let score = 0;
  
  // Length check
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  
  // Character variety checks
  if (/[a-z]/.test(password)) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  
  if (score <= 2) return 'weak';
  if (score <= 3) return 'fair';
  if (score <= 4) return 'good';
  return 'strong';
}

function updatePasswordStrength(strength) {
  const strengthMap = {
    weak: { width: '25%', color: '#ef4444', text: 'Weak password' },
    fair: { width: '50%', color: '#f59e0b', text: 'Fair password' },
    good: { width: '75%', color: '#10b981', text: 'Good password' },
    strong: { width: '100%', color: '#059669', text: 'Strong password' }
  };
  
  const config = strengthMap[strength];
  strengthFill.style.width = config.width;
  strengthFill.style.background = config.color;
  strengthFill.className = `strength-fill ${strength}`;
  strengthText.textContent = config.text;
}

// Form Validation
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');

if (loginForm) {
  loginForm.addEventListener('submit', handleLoginSubmit);
}

if (signupForm) {
  signupForm.addEventListener('submit', handleSignupSubmit);
}

async function handleLoginSubmit(e) {
  e.preventDefault();
  
  const formData = new FormData(loginForm);
  const submitButton = loginForm.querySelector('.btn-primary');
  
  // Show loading state
  setButtonLoading(submitButton, true);
  
  const requestData = {
    email: formData.get('email'),
    password: formData.get('password')
  };
  
  safeLog('Sending login request:', { ...requestData, password: '***' });
  
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData)
    });
    
    safeLog('Login response status:', response.status);
    safeLog('Login response headers:', Object.fromEntries(response.headers.entries()));
    
    let data;
    let responseText;
    
    try {
      responseText = await response.text();
      safeLog('Login response text:', responseText);
      
      // Try to parse as JSON
      if (responseText.trim()) {
        data = JSON.parse(responseText);
      } else {
        throw new Error('Empty response');
      }
    } catch (jsonErr) {
      safeErrorLog('JSON parse error:', jsonErr);
      safeErrorLog('Raw response text:', responseText);
      
      // If response is not JSON, show a generic error
      showFormError(loginForm, 'Unexpected server response. Please try again later.');
      setButtonLoading(submitButton, false);
      return;
    }
    
    // Defensive: if data is not an object, show a generic error
    if (typeof data !== 'object' || data === null) {
      safeErrorLog('Response is not an object:', data);
      showFormError(loginForm, 'Unexpected server response. Please try again later.');
      setButtonLoading(submitButton, false);
      return;
    }
    
    safeLog('Parsed login response:', data);
    
    if (response.ok) {
      // Store token and redirect
      if (data.token) {
        localStorage.setItem('token', data.token);
      }
      window.location.href = '/dashboard.html';
    } else {
      let errorMessage = 'Login failed. Please try again.';
      if (typeof data.message === 'string') {
        errorMessage = data.message;
      } else if (typeof data.error === 'string') {
        errorMessage = data.error;
      } else if (typeof data.error === 'boolean') {
        errorMessage = 'Login failed. Please check your credentials.';
      }
      showFormError(loginForm, errorMessage);
    }
  } catch (error) {
    safeErrorLog('Login network error:', error);
    showFormError(loginForm, 'Network error. Please check your connection.');
  } finally {
    setButtonLoading(submitButton, false);
  }
}

async function handleSignupSubmit(e) {
  e.preventDefault();
  
  const formData = new FormData(signupForm);
  const submitButton = signupForm.querySelector('.btn-primary');
  
  // Validate password match
  const password = formData.get('password');
  const confirmPassword = formData.get('confirm-password');
  
  if (password !== confirmPassword) {
    showFormError(signupForm, 'Passwords do not match.');
    return;
  }
  
  // Validate terms acceptance
  const termsAccepted = document.getElementById('terms').checked;
  if (!termsAccepted) {
    showFormError(signupForm, 'Please accept the Terms of Service and Privacy Policy.');
    return;
  }
  
  // Show loading state
  setButtonLoading(submitButton, true);
  
  const requestData = {
    name: formData.get('name'),
    email: formData.get('email'),
    password: password
  };
  
  safeLog('Sending signup request:', { ...requestData, password: '***' });
  
  try {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData)
    });
    
    safeLog('Signup response status:', response.status);
    safeLog('Signup response headers:', Object.fromEntries(response.headers.entries()));
    
    let data;
    let responseText;
    
    try {
      responseText = await response.text();
      safeLog('Signup response text:', responseText);
      
      // Try to parse as JSON
      if (responseText.trim()) {
        data = JSON.parse(responseText);
      } else {
        throw new Error('Empty response');
      }
    } catch (jsonErr) {
      safeErrorLog('JSON parse error:', jsonErr);
      safeErrorLog('Raw response text:', responseText);
      
      // If response is not JSON, show a generic error
      showFormError(signupForm, 'Unexpected server response. Please try again later.');
      setButtonLoading(submitButton, false);
      return;
    }
    
    // Defensive: if data is not an object, show a generic error
    if (typeof data !== 'object' || data === null) {
      safeErrorLog('Response is not an object:', data);
      showFormError(signupForm, 'Unexpected server response. Please try again later.');
      setButtonLoading(submitButton, false);
      return;
    }
    
    safeLog('Parsed signup response:', data);
    
    if (response.ok) {
      // Store token and redirect immediately
      if (data.token) {
        localStorage.setItem('token', data.token);
        showFormSuccess(signupForm, 'Account created successfully! Redirecting to dashboard...');
        setTimeout(() => {
          window.location.href = '/dashboard.html';
        }, 1500);
      } else {
        showFormError(signupForm, 'Account created but login failed. Please try logging in.');
      }
    } else {
      // Show all validation errors if present
      if (data.details && Array.isArray(data.details)) {
        const messages = data.details.map(d => d.message).join('\n');
        showFormError(signupForm, messages);
      } else {
        let errorMessage = 'Signup failed. Please try again.';
        if (typeof data.message === 'string') {
          errorMessage = data.message;
        } else if (typeof data.error === 'string') {
          errorMessage = data.error;
        } else if (typeof data.error === 'boolean') {
          errorMessage = 'Signup failed. Please check your credentials.';
        }
        showFormError(signupForm, errorMessage);
      }
    }
  } catch (error) {
    safeErrorLog('Signup network error:', error);
    showFormError(signupForm, 'Network error. Please check your connection.');
  } finally {
    setButtonLoading(submitButton, false);
  }
}

// Social Login Handlers
document.querySelectorAll('#google-login').forEach(button => {
  button.addEventListener('click', () => {
    window.location.href = '/api/auth/google';
  });
});

document.querySelectorAll('#github-login').forEach(button => {
  button.addEventListener('click', () => {
    window.location.href = '/api/auth/github';
  });
});

// Utility Functions
function setButtonLoading(button, loading) {
  if (loading) {
    button.classList.add('loading');
    button.disabled = true;
  } else {
    button.classList.remove('loading');
    button.disabled = false;
  }
}

function showFormError(form, message) {
  // Remove existing error messages
  const existingError = form.querySelector('.form-error');
  if (existingError) {
    existingError.remove();
  }
  
  // Create error message
  const errorDiv = document.createElement('div');
  errorDiv.className = 'form-error';
  errorDiv.style.cssText = `
    background: #fee2e2;
    color: #991b1b;
    border: 1px solid #fca5a5;
    padding: 0.75rem;
    border-radius: 8px;
    font-size: 0.875rem;
    margin-bottom: 1rem;
  `;
  errorDiv.textContent = message;
  
  // Insert at the top of the form
  form.insertBefore(errorDiv, form.firstChild);
  
  // Auto-remove after 5 seconds
  setTimeout(() => {
    if (errorDiv.parentNode) {
      errorDiv.remove();
    }
  }, 5000);
}

function showFormSuccess(form, message) {
  // Remove existing messages
  const existingMessage = form.querySelector('.form-success');
  if (existingMessage) {
    existingMessage.remove();
  }
  
  // Create success message
  const successDiv = document.createElement('div');
  successDiv.className = 'form-success';
  successDiv.style.cssText = `
    background: #d1fae5;
    color: #065f46;
    border: 1px solid #a7f3d0;
    padding: 0.75rem;
    border-radius: 8px;
    font-size: 0.875rem;
    margin-bottom: 1rem;
  `;
  successDiv.textContent = message;
  
  // Insert at the top of the form
  form.insertBefore(successDiv, form.firstChild);
}

// Modal Functionality
const resetModal = document.getElementById('resetModal');
const forgotPasswordLink = document.getElementById('forgotPasswordLink');
const closeResetModal = document.getElementById('closeResetModal');
const closeResetModal2 = document.getElementById('closeResetModal2');

if (forgotPasswordLink) {
  forgotPasswordLink.addEventListener('click', (e) => {
    e.preventDefault();
    resetModal.classList.add('show');
  });
}

if (closeResetModal) {
  closeResetModal.addEventListener('click', () => {
    resetModal.classList.remove('show');
  });
}

if (closeResetModal2) {
  closeResetModal2.addEventListener('click', () => {
    resetModal.classList.remove('show');
  });
}

// Close modal when clicking outside
if (resetModal) {
  resetModal.addEventListener('click', (e) => {
    if (e.target === resetModal) {
      resetModal.classList.remove('show');
    }
  });
}

// Reset Password Form Handlers
const resetStep1 = document.getElementById('resetStep1');
const resetStep2 = document.getElementById('resetStep2');
const resetMessage = document.getElementById('resetMessage');

if (resetStep1) {
  resetStep1.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('resetEmail').value;
    const submitButton = resetStep1.querySelector('.btn-primary');
    
    setButtonLoading(submitButton, true);
    resetMessage.textContent = '';
    
    try {
      const response = await fetch('/api/auth/request-reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        resetStep1.style.display = 'none';
        resetStep2.style.display = 'block';
        showModalMessage('OTP sent to your email!', 'success');
      } else {
        showModalMessage(data.error || 'Failed to send OTP.', 'error');
      }
    } catch (error) {
      safeErrorLog('Reset request error:', error);
      showModalMessage('Network error. Please try again.', 'error');
    } finally {
      setButtonLoading(submitButton, false);
    }
  });
}

if (resetStep2) {
  resetStep2.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('resetEmail').value; // Get email from step 1
    const otp = document.getElementById('resetOtp').value;
    const newPassword = document.getElementById('resetNewPassword').value;
    const confirmPassword = document.getElementById('resetConfirmPassword').value;
    const submitButton = resetStep2.querySelector('.btn-primary');
    
    if (newPassword !== confirmPassword) {
      showModalMessage('Passwords do not match.', 'error');
      return;
    }
    
    setButtonLoading(submitButton, true);
    
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          otp,
          newPassword
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        showModalMessage('Password reset successfully!', 'success');
        setTimeout(() => {
          resetModal.classList.remove('show');
          resetStep1.style.display = 'block';
          resetStep2.style.display = 'none';
          resetStep1.reset();
          resetStep2.reset();
        }, 2000);
      } else {
        showModalMessage(data.error || 'Failed to reset password.', 'error');
      }
    } catch (error) {
      safeErrorLog('Reset password error:', error);
      showModalMessage('Network error. Please try again.', 'error');
    } finally {
      setButtonLoading(submitButton, false);
    }
  });
}

function showModalMessage(message, type) {
  if (resetMessage) {
    resetMessage.textContent = message;
    resetMessage.className = `message ${type}`;
  }
}

// Input Focus Effects
document.querySelectorAll('.form-group input').forEach(input => {
  input.addEventListener('focus', function() {
    this.parentElement.classList.add('focused');
  });
  
  input.addEventListener('blur', function() {
    this.parentElement.classList.remove('focused');
  });
});

// Enhanced Accessibility
document.querySelectorAll('input, button').forEach(element => {
  element.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && this.type !== 'textarea') {
      e.preventDefault();
      this.closest('form')?.requestSubmit();
    }
  });
});

// Check for token in URL (for OAuth redirects)
function checkForToken() {
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');
  
  if (token) {
    localStorage.setItem('token', token);
    // Clean up URL
    window.history.replaceState({}, document.title, window.location.pathname);
    // Redirect to dashboard
    window.location.href = '/dashboard.html';
  }
}

// Run token check on page load
document.addEventListener('DOMContentLoaded', checkForToken);

// Global error handler to catch any unhandled errors
window.addEventListener('error', function(event) {
  safeErrorLog('Global error caught:', event.error);
  safeErrorLog('Error details:', {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno
  });
  
  // Prevent the default error handling
  event.preventDefault();
});

// Global promise rejection handler
window.addEventListener('unhandledrejection', function(event) {
  safeErrorLog('Unhandled promise rejection:', event.reason);
  
  // Prevent the default error handling
  event.preventDefault();
});

// Add CSS for enhanced interactions
const style = document.createElement('style');
style.textContent = `
  .form-group.focused .input-icon {
    color: var(--primary);
  }
  
  .form-group input:focus {
    transform: translateY(-1px);
  }
  
  .btn-primary:focus,
  .btn-secondary:focus,
  .btn-social:focus {
    outline: 2px solid var(--primary);
    outline-offset: 2px;
  }
  
  .form-error,
  .form-success {
    animation: slideInDown 0.3s ease;
  }
  
  @keyframes slideInDown {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  .feature-item {
    --i: 0;
  }
  
  .feature-item:nth-child(1) { --i: 1; }
  .feature-item:nth-child(2) { --i: 2; }
  .feature-item:nth-child(3) { --i: 3; }
`;

document.head.appendChild(style); 