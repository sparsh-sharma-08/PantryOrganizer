document.addEventListener('DOMContentLoaded', () => {
    // Session check: redirect to index.html if not logged in
    if (!localStorage.getItem('token')) {
        window.location.href = '/index.html';
        return;
    }
    
    // Check for pending clear notifications
    const urlParams = new URLSearchParams(window.location.search);
    const clearNotifications = urlParams.get('clearNotifications');
    const pendingClear = localStorage.getItem('pendingClearNotifications');
    
    if (clearNotifications === 'true' && pendingClear === 'true') {
        // Clear all notifications and update count
        if (window.navbarManager) {
            window.navbarManager.clearAllNotifications();
        }
        localStorage.removeItem('pendingClearNotifications');
        
        // Show confirmation message
        showNotification('All notifications have been cleared successfully!', 'success');
        
        // Clean up URL
        const newUrl = window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
    }
    
    const profilePicInput = document.getElementById('profilePicInput');
    const profilePic = document.getElementById('profilePic');
    const deleteAccountModal = document.getElementById('deleteAccountModal');
    const deleteConfirmInput = document.getElementById('deleteConfirmInput');
    const confirmDeleteBtn = document.getElementById('confirmDelete');

    // Modal elements
    const editProfileModal = document.getElementById('editProfileModal');
    const editProfileBtn = document.getElementById('editProfileBtn');
    const closeModal = document.getElementById('closeModal');
    const cancelEdit = document.getElementById('cancelEdit');
    const editProfileForm = document.getElementById('editProfileForm');
    
    // Password modal elements
    const changePasswordModal = document.getElementById('changePasswordModal');
    const closePasswordModal = document.getElementById('closePasswordModal');
    const cancelPassword = document.getElementById('cancelPassword');
    const changePasswordForm = document.getElementById('changePasswordForm');
    
    // Delete account modal elements
    const closeDeleteModal = document.getElementById('closeDeleteModal');
    const cancelDelete = document.getElementById('cancelDelete');
    const deleteAccountForm = document.getElementById('deleteAccountForm');
    const deleteConfirmText = document.getElementById('deleteConfirmText');
    const deleteOtp = document.getElementById('deleteOtp');
    const requestDeleteOtp = document.getElementById('requestDeleteOtp');
    
    // Export modal elements
    const exportDataModal = document.getElementById('exportDataModal');
    const closeExportModal = document.getElementById('closeExportModal');
    const cancelExport = document.getElementById('cancelExport');
    const startExport = document.getElementById('startExport');
    
    // Clear data modal elements
    const clearDataModal = document.getElementById('clearDataModal');
    const closeClearModal = document.getElementById('closeClearModal');
    const cancelClear = document.getElementById('cancelClear');
    const clearConfirmText = document.getElementById('clearConfirmText');
    const confirmClear = document.getElementById('confirmClear');
    
    // Form elements
    const profilePhotoInput = document.getElementById('profilePhotoInput');
    const profilePhotoPreview = document.getElementById('profilePhotoPreview');
    const editName = document.getElementById('editName');
    
    // Display elements
    const currentProfilePic = document.getElementById('currentProfilePic');
    const currentName = document.getElementById('currentName');
    const currentUsername = document.getElementById('currentUsername');
    
    // Success message
    const successMessage = document.getElementById('successMessage');
    
    // Store initial values
    const initialValues = {
        name: currentName.textContent,
        username: currentUsername.textContent,
        profilePic: currentProfilePic.src
    };

    // API helper functions
    function getToken() {
        return localStorage.getItem('token');
    }

    async function apiCall(endpoint, options = {}) {
        const token = getToken();
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        };
        
        const response = await fetch(`/api${endpoint}`, { ...defaultOptions, ...options });
        
        if (!response.ok) {
            throw new Error(`API call failed: ${response.status}`);
        }
        
        return response.json();
    }

    // Load user profile data
    async function loadUserProfile() {
        try {
            const userData = await apiCall('/auth/profile');
            currentName.textContent = userData.name || 'No name set';
            currentUsername.textContent = userData.email || 'No email set';
            // Store user data for edit form
            window.currentUserData = userData;
            // Handle profile photo
            if (userData.profile_photo) {
                localStorage.setItem('userAvatar', userData.profile_photo);
                currentProfilePic.innerHTML = `<img src="${userData.profile_photo}" alt="Profile" class="avatar"/>`;
                if (window.navbarManager) {
                    window.navbarManager.updateUserAvatar();
                }
            } else {
                localStorage.removeItem('userAvatar');
                currentProfilePic.innerHTML = `<i class="fa fa-user"></i>`;
                if (window.navbarManager) {
                    window.navbarManager.updateUserAvatar();
                }
            }
            // Update navbar avatar as well
            const navbarAvatar = document.getElementById('userAvatar');
            if (navbarAvatar) {
                if (userData.profile_photo) {
                    navbarAvatar.innerHTML = `<img src="${userData.profile_photo}" alt="User" class="avatar"/>`;
                } else {
                    navbarAvatar.innerHTML = `<i class="fa fa-user"></i>`;
                }
            }
        } catch (error) {
            console.error('Failed to load user profile:', error);
            let errorMsg = 'Error loading profile';
            let emailMsg = 'Error loading email';
            if (error && error.message) {
                errorMsg = error.message;
                emailMsg = error.message;
            }
            // If error is 401, auto-logout
            if (error && error.message && error.message.includes('401')) {
                localStorage.removeItem('token');
                window.location.href = '/login.html';
                return;
            }
            currentName.textContent = errorMsg;
            currentUsername.textContent = emailMsg;
        }
    }

    // Populate edit form with current user data
    function populateEditForm() {
        if (window.currentUserData) {
            editName.value = window.currentUserData.name || '';
            // Populate profile photo preview
            if (window.currentUserData.profile_photo) {
                profilePhotoPreview.innerHTML = `<img src="${window.currentUserData.profile_photo}" alt="Profile Preview" class="avatar"/>`;
            } else {
                profilePhotoPreview.innerHTML = `<i class="fa fa-user"></i>`;
            }
        }
    }

    // Show success message function
    function showSuccessMessage(message = 'Successfully updated the profile') {
        const messageSpan = successMessage.querySelector('span');
        messageSpan.textContent = message;
        successMessage.classList.add('show');
        setTimeout(() => {
            successMessage.classList.remove('show');
        }, 5000);
    }

    // Generic modal functions
    function openModal(modal) {
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }

    function closeModalFunc(modal) {
        modal.classList.remove('show');
        document.body.style.overflow = 'auto';
    }

    // Event listeners for edit profile modal
    editProfileBtn.addEventListener('click', () => {
        populateEditForm();
        openModal(editProfileModal);
    });
    closeModal.addEventListener('click', () => closeModalFunc(editProfileModal));
    cancelEdit.addEventListener('click', () => closeModalFunc(editProfileModal));

    // Event listeners for password modal
    closePasswordModal.addEventListener('click', () => closeModalFunc(changePasswordModal));
    cancelPassword.addEventListener('click', () => closeModalFunc(changePasswordModal));

    // Event listeners for delete account modal
    closeDeleteModal.addEventListener('click', () => closeModalFunc(deleteAccountModal));
    cancelDelete.addEventListener('click', () => closeModalFunc(deleteAccountModal));

    // Event listeners for export modal
    closeExportModal.addEventListener('click', () => closeModalFunc(exportDataModal));
    cancelExport.addEventListener('click', () => closeModalFunc(exportDataModal));

    // Event listeners for clear data modal
    closeClearModal.addEventListener('click', () => closeModalFunc(clearDataModal));
    cancelClear.addEventListener('click', () => closeModalFunc(clearDataModal));

    // Close modals when clicking outside
    [editProfileModal, changePasswordModal, deleteAccountModal, exportDataModal, clearDataModal].forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModalFunc(modal);
            }
        });
    });

    // Close modals with Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (editProfileModal.classList.contains('show')) {
                closeModalFunc(editProfileModal);
            } else if (changePasswordModal.classList.contains('show')) {
                closeModalFunc(changePasswordModal);
            } else if (deleteAccountModal.classList.contains('show')) {
                closeModalFunc(deleteAccountModal);
            } else if (exportDataModal.classList.contains('show')) {
                closeModalFunc(exportDataModal);
            } else if (clearDataModal.classList.contains('show')) {
                closeModalFunc(clearDataModal);
            }
        }
    });

    // Profile photo upload
    profilePhotoInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                showNotification('Please select an image file.', 'error');
                return;
            }
            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                showNotification('Image size should be less than 5MB.', 'error');
                return;
            }
            const reader = new FileReader();
            reader.onload = (event) => {
                profilePhotoPreview.innerHTML = `<img src="${event.target.result}" alt="Profile Preview" class="avatar"/>`;
                // Update the main profile picture in the settings card
                currentProfilePic.innerHTML = `<img src="${event.target.result}" alt="Profile" class="avatar"/>`;
                // Save to localStorage for global avatar use
                localStorage.setItem('userAvatar', event.target.result);
                if (window.navbarManager) {
                    window.navbarManager.updateUserAvatar();
                }
            };
            reader.readAsDataURL(file);
        }
    });

    // Edit profile form submission
    editProfileForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const newName = editName.value.trim();
        // Basic validation
        if (!newName) {
            showNotification('Please fill in all fields.', 'error');
            return;
        }
        if (newName.length < 2) {
            showNotification('Name must be at least 2 characters long.', 'error');
            return;
        }
        try {
            // Always include the current avatar value
            const updateData = {
                name: newName,
                profile_photo: localStorage.getItem('userAvatar') || null
            };
            const result = await apiCall('/auth/profile', {
                method: 'PUT',
                body: JSON.stringify(updateData)
            });
            if (result.message === 'Profile updated successfully') {
                // Update the display
                currentName.textContent = newName;
                // Force refresh avatar across all pages
                if (window.navbarManager) {
                    window.navbarManager.forceRefreshAvatar();
                }
                // Close modal
                closeModalFunc(editProfileModal);
                // Show success message
                showSuccessMessage('Profile updated successfully');
                // Add notification
                if (window.navbarManager) {
                    window.navbarManager.addNotification({
                        type: 'system',
                        title: 'Profile Updated',
                        message: 'Your profile information was updated successfully.',
                        actions: ['View Profile']
                    });
                }
            } else {
                throw new Error(result.error || 'Failed to update profile');
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            showNotification('Failed to update profile. Please try again.', 'error');
        }
    });

    // Change password form submission
    changePasswordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        // Password strength check
        const passwordStrengthRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;
        if (!passwordStrengthRegex.test(newPassword)) {
            showNotification('Password must be at least 8 characters long and include uppercase, lowercase, number, and special character.', 'error');
            return;
        }
        if (newPassword !== confirmPassword) {
            showNotification('New passwords do not match.', 'error');
            return;
        }
        try {
            // Change password via API
            const token = localStorage.getItem('token');
            const response = await fetch('/api/auth/change-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    currentPassword,
                    newPassword
                })
            });
            const result = await response.json();
            if (response.status === 401) {
                showNotification('Session expired. Please log in again.', 'error');
                localStorage.clear();
                window.location.href = '/login.html';
                return;
            }
            if (response.ok && result.message === 'success') {
                closeModalFunc(changePasswordModal);
                showSuccessMessage('Password changed successfully');
                changePasswordForm.reset();
                if (window.navbarManager) {
                    window.navbarManager.addNotification({
                        type: 'system',
                        title: 'Password Changed',
                        message: 'Your password was changed successfully.',
                        actions: ['Secure Account']
                    });
                }
            } else {
                showNotification(result.error || 'Failed to change password. Please check your current password and try again.', 'error');
            }
        } catch (error) {
            console.error('Error changing password:', error);
            showNotification('Failed to change password. Please check your current password and try again.', 'error');
        }
    });

    // Request OTP for account deletion
    requestDeleteOtp.addEventListener('click', async () => {
        try {
            requestDeleteOtp.disabled = true;
            requestDeleteOtp.textContent = 'Sending...';
            
            const result = await apiCall('/auth/request-delete-otp', {
                method: 'POST'
            });
            
            if (result.message) {
                showNotification('OTP sent to your email. Please check your inbox.', 'success');
                deleteOtp.focus();
            } else {
                throw new Error(result.error || 'Failed to send OTP');
            }
        } catch (error) {
            console.error('Error requesting deletion OTP:', error);
            showNotification('Failed to send OTP. Please try again.', 'error');
        } finally {
            requestDeleteOtp.disabled = false;
            requestDeleteOtp.textContent = 'Request OTP';
        }
    });

    // Delete account confirmation logic
    deleteConfirmText.addEventListener('input', () => {
        const canDelete = deleteConfirmText.value === 'DELETE' && deleteOtp.value.length === 6;
        confirmDelete.disabled = !canDelete;
    });

    deleteOtp.addEventListener('input', () => {
        const canDelete = deleteConfirmText.value === 'DELETE' && deleteOtp.value.length === 6;
        confirmDelete.disabled = !canDelete;
    });

    // Delete account form submission
    deleteAccountForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const confirmText = deleteConfirmText.value;
        const otp = deleteOtp.value;
        
        if (confirmText !== 'DELETE') {
            showNotification('Please type "DELETE" to confirm.', 'error');
            return;
        }
        
        if (!otp || otp.length !== 6) {
            showNotification('Please enter the 6-digit OTP from your email.', 'error');
            return;
        }
        
        try {
            // Delete account via API
            const result = await apiCall('/auth/delete-account', {
                method: 'DELETE',
                body: JSON.stringify({
                    otp
                })
            });
            
            if (result.message === 'success') {
                // Show success message
                showSuccessMessage('Account deleted successfully');
                
                // Close modal
                closeModalFunc(deleteAccountModal);
                
                // Clear form
                deleteAccountForm.reset();
                confirmDelete.disabled = true;
                
                // Clear all local data
                localStorage.clear();
                
                // Redirect to login page
                showNotification('Your account has been deleted. You will be redirected to the login page.', 'success');
                setTimeout(() => {
                    window.location.href = '/login.html';
                }, 2000);
            } else {
                throw new Error(result.error || 'Failed to delete account');
            }
        } catch (error) {
            console.error('Error deleting account:', error);
            showNotification('Failed to delete account. Please check your OTP and try again.', 'error');
        }
    });

    // Export data functionality
    startExport.addEventListener('click', async () => {
        const format = document.getElementById('exportFormat').value;
        const includeItems = document.getElementById('exportItems').checked;
        const includeCategories = document.getElementById('exportCategories').checked;
        const includeShoppingLists = document.getElementById('exportShoppingLists').checked;
        const includeSettings = document.getElementById('exportSettings').checked;
        
        try {
            // Get real data based on selected options
            const exportData = {};
            
            if (includeItems) {
                try {
                    const itemsResult = await apiCall('/items');
                    exportData.items = itemsResult.data || [];
                } catch (error) {
                    console.error('Error fetching items:', error);
                    exportData.items = [];
                }
            }
            
            if (includeCategories) {
                try {
                    const categoriesResult = await apiCall('/categories');
                    exportData.categories = categoriesResult.data || [];
                } catch (error) {
                    console.error('Error fetching categories:', error);
                    exportData.categories = [];
                }
            }
            
            if (includeShoppingLists) {
                try {
                    const shoppingResult = await apiCall('/shopping-list');
                    exportData.shoppingLists = shoppingResult.data || [];
                } catch (error) {
                    console.error('Error fetching shopping lists:', error);
                    exportData.shoppingLists = [];
                }
            }
            
            if (includeSettings) {
                const savedSettings = localStorage.getItem('pantrySettings');
                exportData.settings = savedSettings ? JSON.parse(savedSettings) : {};
            }
            
            let content, filename, mimeType;
            
            switch(format) {
                case 'json':
                    content = JSON.stringify(exportData, null, 2);
                    filename = `pantry-data-${new Date().toISOString().split('T')[0]}.json`;
                    mimeType = 'application/json';
                    break;
                    
                case 'csv':
                    content = convertToCSV(exportData);
                    filename = `pantry-data-${new Date().toISOString().split('T')[0]}.csv`;
                    mimeType = 'text/csv';
                    break;
                    
                case 'txt':
                    content = convertToText(exportData);
                    filename = `pantry-data-${new Date().toISOString().split('T')[0]}.txt`;
                    mimeType = 'text/plain';
                    break;
                    
                default:
                    content = JSON.stringify(exportData, null, 2);
                    filename = `pantry-data-${new Date().toISOString().split('T')[0]}.json`;
                    mimeType = 'application/json';
            }
            
            // Create and download file
            const blob = new Blob([content], { type: mimeType });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            // Close modal and show success message
            closeModalFunc(exportDataModal);
            showSuccessMessage('Data exported successfully');

            if (window.navbarManager) {
                window.navbarManager.addNotification({
                    type: 'system',
                    title: 'Data Exported',
                    message: 'Your pantry data was exported successfully.',
                    actions: ['View Exported Data']
                });
            }
        } catch (error) {
            console.error('Error exporting data:', error);
            showNotification('Failed to export data. Please try again.', 'error');
        }
    });

    // Convert data to CSV format
    function convertToCSV(data) {
        let csvContent = '';
        
        // Add timestamp
        csvContent += `Export Date,${new Date().toISOString()}\n\n`;
        
        // Export items
        if (data.items && data.items.length > 0) {
            csvContent += 'PANTRY ITEMS\n';
            csvContent += 'Name,Quantity,Category,Expiry Date\n';
            data.items.forEach(item => {
                csvContent += `"${item.name}",${item.quantity},"${item.category}","${item.expiry_date || 'No expiry'}"\n`;
            });
            csvContent += '\n';
        }
        
        // Export categories
        if (data.categories && data.categories.length > 0) {
            csvContent += 'CATEGORIES\n';
            csvContent += 'Category Name\n';
            data.categories.forEach(category => {
                csvContent += `"${category}"\n`;
            });
            csvContent += '\n';
        }
        
        // Export shopping lists
        if (data.shoppingLists && data.shoppingLists.length > 0) {
            csvContent += 'SHOPPING LISTS\n';
            csvContent += 'Name,Quantity,Status\n';
            data.shoppingLists.forEach(item => {
                const status = item.status === 'bought' ? 'Purchased' : 'To Buy';
                csvContent += `"${item.name}",${item.quantity},"${status}"\n`;
            });
            csvContent += '\n';
        }
        
        // Export settings
        if (data.settings && Object.keys(data.settings).length > 0) {
            csvContent += 'SETTINGS\n';
            csvContent += 'Setting,Value\n';
            Object.entries(data.settings).forEach(([key, value]) => {
                csvContent += `"${key}","${value}"\n`;
            });
        }
        
        return csvContent;
    }

    // Convert data to plain text format
    function convertToText(data) {
        let textContent = '';
        
        // Add header
        textContent += 'SMART PANTRY DATA EXPORT\n';
        textContent += '========================\n';
        textContent += `Export Date: ${new Date().toLocaleString()}\n\n`;
        
        // Export items
        if (data.items && data.items.length > 0) {
            textContent += 'PANTRY ITEMS:\n';
            textContent += '-------------\n';
            data.items.forEach((item, index) => {
                textContent += `${index + 1}. ${item.name}\n`;
                textContent += `   Quantity: ${item.quantity} ${item.unit || ''}\n`;
                textContent += `   Expiry: ${item.expiry_date || 'No expiry'}\n`;
                textContent += `   Category: ${item.category}\n\n`;
            });
        }
        
        // Export categories
        if (data.categories && data.categories.length > 0) {
            textContent += 'CATEGORIES:\n';
            textContent += '-----------\n';
            data.categories.forEach((category, index) => {
                textContent += `${index + 1}. ${category}\n`;
            });
            textContent += '\n';
        }
        
        // Export shopping lists
        if (data.shoppingLists && data.shoppingLists.length > 0) {
            textContent += 'SHOPPING LISTS:\n';
            textContent += '---------------\n';
            data.shoppingLists.forEach((item, index) => {
                textContent += `${index + 1}. ${item.name}\n`;
                textContent += `   Quantity: ${item.quantity}\n`;
                textContent += `   Status: ${item.status === 'bought' ? 'Purchased' : 'To Buy'}\n\n`;
            });
        }
        
        // Export settings
        if (data.settings && Object.keys(data.settings).length > 0) {
            textContent += 'SETTINGS:\n';
            textContent += '---------\n';
            Object.entries(data.settings).forEach(([key, value]) => {
                const formattedKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                textContent += `${formattedKey}: ${value}\n`;
            });
        }
        
        return textContent;
    }

    // Clear data confirmation logic
    clearConfirmText.addEventListener('input', () => {
        confirmClear.disabled = clearConfirmText.value !== 'CLEAR';
    });

    // Clear all data functionality
    confirmClear.addEventListener('click', async () => {
        const confirmText = clearConfirmText.value;
        
        if (confirmText !== 'CLEAR') {
            showNotification('Please type "CLEAR" to confirm.', 'error');
            return;
        }
        
        try {
            // Clear all data via API
            const result = await apiCall('/clear-all-data', {
                method: 'DELETE'
            });
            
            if (result.message === 'success') {
                // Clear localStorage
                localStorage.clear();
                
                // Show success message
                showSuccessMessage('All data cleared successfully');
                
                // Close modal
                closeModalFunc(clearDataModal);
                
                // Clear form
                clearConfirmText.value = '';
                confirmClear.disabled = true;
                
                // Add notification
                if (window.navbarManager) {
                    window.navbarManager.addNotification({
                        type: 'system',
                        title: 'Data Cleared',
                        message: 'All your pantry data has been cleared successfully.',
                        actions: ['Start Fresh']
                    });
                }
                
                // Reload settings
                setTimeout(() => {
                    location.reload();
                }, 2000);
            } else {
                throw new Error(result.error || 'Failed to clear data');
            }
        } catch (error) {
            console.error('Error clearing data:', error);
            showNotification('Failed to clear data. Please try again.', 'error');
        }
    });

    // Toggle switches functionality
    const toggleSwitches = document.querySelectorAll('.toggle-switch input');
    toggleSwitches.forEach(toggle => {
        toggle.addEventListener('change', async () => {
            const settingLabel = toggle.closest('.setting-item').querySelector('.setting-label').textContent;
            
            try {
                // Save settings to API
                const settings = {
                    expiryReminders: document.querySelectorAll('input[type="checkbox"]')[0].checked,
                    shoppingReminders: document.querySelectorAll('input[type="checkbox"]')[1].checked,
                    emailNotifications: document.querySelectorAll('input[type="checkbox"]')[2].checked,
                    autoCategorization: document.querySelectorAll('input[type="checkbox"]')[3].checked,
                    expiryWarningDays: document.querySelector('.setting-select').value
                };
                
                const result = await apiCall('/settings', {
                    method: 'PUT',
                    body: JSON.stringify(settings)
                });
                
                if (result.message === 'success') {
                    // Save to localStorage as backup
                    localStorage.setItem('pantrySettings', JSON.stringify(settings));
                    
                    if (window.navbarManager) {
                        window.navbarManager.addNotification({
                            type: 'system',
                            title: 'Settings Changed',
                            message: 'Your pantry settings were updated.',
                            actions: ['View Settings']
                        });
                    }
                } else {
                    throw new Error(result.error || 'Failed to save settings');
                }
            } catch (error) {
                console.error('Error saving settings:', error);
                // Revert the toggle if save failed
                toggle.checked = !toggle.checked;
                showNotification('Failed to save settings. Please try again.', 'error');
            }
        });
    });

    // Select dropdown functionality
    const selectDropdowns = document.querySelectorAll('.setting-select');
    selectDropdowns.forEach(select => {
        select.addEventListener('change', async () => {
            const settingLabel = select.closest('.setting-item').querySelector('.setting-label').textContent;
            
            try {
                // Save settings to API
                const settings = {
                    expiryReminders: document.querySelectorAll('input[type="checkbox"]')[0].checked,
                    shoppingReminders: document.querySelectorAll('input[type="checkbox"]')[1].checked,
                    emailNotifications: document.querySelectorAll('input[type="checkbox"]')[2].checked,
                    autoCategorization: document.querySelectorAll('input[type="checkbox"]')[3].checked,
                    expiryWarningDays: select.value
                };
                
                const result = await apiCall('/settings', {
                    method: 'PUT',
                    body: JSON.stringify(settings)
                });
                
                if (result.message === 'success') {
                    // Save to localStorage as backup
                    localStorage.setItem('pantrySettings', JSON.stringify(settings));
                    
                    if (window.navbarManager) {
                        window.navbarManager.addNotification({
                            type: 'system',
                            title: 'Settings Changed',
                            message: 'Your pantry settings were updated.',
                            actions: ['View Settings']
                        });
                    }
                } else {
                    throw new Error(result.error || 'Failed to save settings');
                }
            } catch (error) {
                console.error('Error saving settings:', error);
                showNotification('Failed to save settings. Please try again.', 'error');
            }
        });
    });

    // Action buttons functionality
    const actionBtns = document.querySelectorAll('.action-btn');
    actionBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const action = btn.textContent.trim();
            const settingLabel = btn.closest('.setting-item').querySelector('.setting-label').textContent;
            
            switch(action) {
                case 'Export':
                    openModal(exportDataModal);
                    break;
                case 'Clear':
                    openModal(clearDataModal);
                    break;
                case 'Change':
                    openModal(changePasswordModal);
                    break;
                case 'Delete':
                    openModal(deleteAccountModal);
                    break;
                default:
                    // Handle other actions silently
                    break;
            }
        });
    });

    // About links functionality
    const aboutLinks = document.querySelectorAll('.about-link');
    aboutLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const linkText = link.textContent.trim();
            
            switch(linkText) {
                case 'Privacy Policy':
                    window.location.href = '/privacy-policy.html';
                    break;
                case 'Terms of Service':
                    window.location.href = '/terms-of-service.html';
                    break;
                case 'Support':
                    window.location.href = '/support.html';
                    break;
                default:
                    // Handle other links silently
                    break;
            }
        });
    });

    // Load settings from API and localStorage
    const loadSettings = async () => {
        try {
            // Try to load settings from API first
            const result = await apiCall('/settings');
            if (result.message === 'success' && result.data) {
                const settings = result.data;
                applySettingsToUI(settings);
                localStorage.setItem('pantrySettings', JSON.stringify(settings));
            } else {
                // Fallback to localStorage
                const savedSettings = localStorage.getItem('pantrySettings');
                if (savedSettings) {
                    const settings = JSON.parse(savedSettings);
                    applySettingsToUI(settings);
                }
            }
        } catch (error) {
            console.error('Error loading settings from API:', error);
            // Fallback to localStorage
            const savedSettings = localStorage.getItem('pantrySettings');
            if (savedSettings) {
                const settings = JSON.parse(savedSettings);
                applySettingsToUI(settings);
            }
        }
    };

    // Apply settings to UI
    const applySettingsToUI = (settings) => {
        const checkboxes = document.querySelectorAll('input[type="checkbox"]');
        if (checkboxes[0]) checkboxes[0].checked = settings.expiryReminders || false;
        if (checkboxes[1]) checkboxes[1].checked = settings.shoppingReminders || false;
        if (checkboxes[2]) checkboxes[2].checked = settings.emailNotifications || false;
        if (checkboxes[3]) checkboxes[3].checked = settings.autoCategorization || false;
        
        const select = document.querySelector('.setting-select');
        if (select && settings.expiryWarningDays) {
            select.value = settings.expiryWarningDays;
        }
    };

    // Setup password toggle functionality
    const setupPasswordToggles = () => {
        const passwordToggles = document.querySelectorAll('.password-toggle');
        passwordToggles.forEach(toggle => {
            toggle.addEventListener('click', function() {
                const targetId = this.getAttribute('data-target');
                const targetInput = document.getElementById(targetId);
                const icon = this.querySelector('i');
                
                if (targetInput.type === 'password') {
                    targetInput.type = 'text';
                    icon.className = 'fa fa-eye-slash';
                    this.classList.add('active');
                } else {
                    targetInput.type = 'password';
                    icon.className = 'fa fa-eye';
                    this.classList.remove('active');
                }
            });
        });
    };

    // Initialize settings and password toggles
    loadSettings();
    loadUserProfile();
    setupPasswordToggles();

    // Logout functionality
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    
    // Logout handler function
    function handleLogout() {
        try {
            // Clear all stored data
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('notifications');
            localStorage.removeItem('pantryItems');
            localStorage.removeItem('shoppingList');
            localStorage.removeItem('settings');
            localStorage.removeItem('userAvatar');
            // Redirect to index page
            window.location.href = '/index.html';
        } catch (error) {
            // Fallback redirect
            window.location.href = '/index.html';
        }
    }

    // Notification utility
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
}); 