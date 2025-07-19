document.addEventListener('DOMContentLoaded', function() {
  const forgotLink = document.getElementById('forgotPasswordLink');
  const resetModal = document.getElementById('resetModal');
  const resetStep1 = document.getElementById('resetStep1');
  const resetStep2 = document.getElementById('resetStep2');
  const closeResetModal = document.getElementById('closeResetModal');
  const closeResetModal2 = document.getElementById('closeResetModal2');
  const resetMessage = document.getElementById('resetMessage');
  let email = '';

  forgotLink.onclick = function(e) {
    e.preventDefault();
    resetModal.style.display = 'flex';
    resetStep1.style.display = '';
    resetStep2.style.display = 'none';
    resetMessage.textContent = '';
  };
  closeResetModal.onclick = closeResetModal2.onclick = function() {
    resetModal.style.display = 'none';
    resetMessage.textContent = '';
  };

  resetStep1.onsubmit = async function(e) {
    e.preventDefault();
    email = document.getElementById('resetEmail').value.trim();
    resetMessage.style.color = 'black';
    resetMessage.textContent = 'Checking email...';
    const res = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ email })
    });
    const data = await res.json();
    if (res.ok) {
      resetMessage.style.color = 'green';
      resetMessage.textContent = 'OTP sent to your email.';
      resetStep1.style.display = 'none';
      resetStep2.style.display = '';
    } else {
      resetMessage.style.color = 'red';
      resetMessage.textContent = data.error || 'Error sending OTP.';
    }
  };

  resetStep2.onsubmit = async function(e) {
    e.preventDefault();
    const otp = document.getElementById('resetOtp').value.trim();
    const newPassword = document.getElementById('resetNewPassword').value;
    const confirmPassword = document.getElementById('resetConfirmPassword').value;
    if (newPassword !== confirmPassword) {
      resetMessage.style.color = 'red';
      resetMessage.textContent = 'Passwords do not match.';
      return;
    }
    resetMessage.textContent = 'Verifying OTP...';
    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ email, otp, newPassword })
    });
    const data = await res.json();
    if (res.ok) {
      resetMessage.style.color = 'green';
      resetMessage.textContent = 'Password reset successful! You can now log in.';
      setTimeout(() => { resetModal.style.display = 'none'; }, 2000);
    } else {
      resetMessage.style.color = 'red';
      resetMessage.textContent = data.error || 'Error resetting password.';
    }
  };

  // Eye toggle for password fields
  document.getElementById('reset-password-toggle').onclick = function() {
    const input = document.getElementById('resetNewPassword');
    const type = input.type === 'password' ? 'text' : 'password';
    input.type = type;
    this.classList.toggle('fa-eye');
    this.classList.toggle('fa-eye-slash');
  };
  document.getElementById('reset-confirm-password-toggle').onclick = function() {
    const input = document.getElementById('resetConfirmPassword');
    const type = input.type === 'password' ? 'text' : 'password';
    input.type = type;
    this.classList.toggle('fa-eye');
    this.classList.toggle('fa-eye-slash');
  };
}); 