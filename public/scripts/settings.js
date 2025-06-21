document.addEventListener('DOMContentLoaded', () => {
    const profilePicInput = document.getElementById('profilePicInput');
    const profilePic = document.getElementById('profilePic');
    const deleteAccountModal = document.getElementById('deleteAccountModal');
    const deleteConfirmInput = document.getElementById('deleteConfirmInput');
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');

    // Store initial values for reset
    const initialValues = {
        username: document.getElementById('username').value,
        lowStockThreshold: document.getElementById('lowStockThreshold').value,
        expiryAlertWindow: document.getElementById('expiryAlertWindow').value,
        emailNotifications: document.getElementById('emailNotifications').checked,
        profilePicSrc: profilePic.src,
    };

    // --- Profile Picture Change ---
    profilePicInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                profilePic.src = event.target.result;
            };
            reader.readAsDataURL(file);
        }
    });

    // --- Low Stock Threshold Slider ---
    const lowStockSlider = document.getElementById('lowStockThreshold');
    const lowStockValue = document.getElementById('lowStockValue');
    lowStockSlider.addEventListener('input', () => {
        lowStockValue.textContent = `${lowStockSlider.value} day${lowStockSlider.value > 1 ? 's' : ''}`;
    });

    // --- Save Changes Button ---
    document.getElementById('saveBtn').addEventListener('click', () => {
        const username = document.getElementById('username').value.trim();
        // Simulate a check for a unique username
        if (username === 'admin' || username === 'root') {
            alert('Username is already taken. Please choose another.');
            return;
        }

        // Handle password change logic
        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        if (currentPassword || newPassword) {
            if (!currentPassword || !newPassword) {
                alert('Please provide both current and new passwords to change it.');
                return;
            }
            alert('Password changed successfully! (Demo)');
        }

        alert('Settings saved successfully!');
        Object.assign(initialValues, {
            username: username,
            lowStockThreshold: lowStockSlider.value,
            expiryAlertWindow: document.getElementById('expiryAlertWindow').value,
            emailNotifications: document.getElementById('emailNotifications').checked,
            profilePicSrc: profilePic.src,
        });
        document.getElementById('currentPassword').value = '';
        document.getElementById('newPassword').value = '';
    });

    // --- Reset Changes Button ---
    document.getElementById('resetBtn').addEventListener('click', () => {
        document.getElementById('username').value = initialValues.username;
        document.getElementById('lowStockThreshold').value = initialValues.lowStockThreshold;
        document.getElementById('expiryAlertWindow').value = initialValues.expiryAlertWindow;
        document.getElementById('emailNotifications').checked = initialValues.emailNotifications;
        profilePic.src = initialValues.profilePicSrc;
        
        document.getElementById('currentPassword').value = '';
        document.getElementById('newPassword').value = '';
        lowStockSlider.dispatchEvent(new Event('input'));
    });

    // --- Delete Account Modal Logic ---
    document.getElementById('deleteAccountBtn').addEventListener('click', () => {
        deleteAccountModal.classList.add('visible');
    });

    document.getElementById('cancelDeleteBtn').addEventListener('click', () => {
        deleteAccountModal.classList.remove('visible');
        deleteConfirmInput.value = '';
        confirmDeleteBtn.disabled = true;
    });

    deleteConfirmInput.addEventListener('input', () => {
        confirmDeleteBtn.disabled = deleteConfirmInput.value !== 'DELETE';
    });
    
    confirmDeleteBtn.addEventListener('click', () => {
        alert('Account deleted successfully.');
        deleteAccountModal.classList.remove('visible');
        // In a real app, you'd redirect or log out the user here.
    });
}); 