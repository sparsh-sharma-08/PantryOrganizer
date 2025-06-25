document.addEventListener('DOMContentLoaded', () => {
    const profilePicInput = document.getElementById('profilePicInput');
    const profilePic = document.getElementById('profilePic');
    const deleteAccountModal = document.getElementById('deleteAccountModal');
    const deleteConfirmInput = document.getElementById('deleteConfirmInput');
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');

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
    const confirmDelete = document.getElementById('confirmDelete');
    
    // Export modal elements
    const exportDataModal = document.getElementById('exportDataModal');
    const closeExportModal = document.getElementById('closeExportModal');
    const cancelExport = document.getElementById('cancelExport');
    const startExport = document.getElementById('startExport');
    
    // Import modal elements
    const importDataModal = document.getElementById('importDataModal');
    const closeImportModal = document.getElementById('closeImportModal');
    const cancelImport = document.getElementById('cancelImport');
    const importFile = document.getElementById('importFile');
    const startImport = document.getElementById('startImport');
    
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
    const editUsername = document.getElementById('editUsername');
    
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
    editProfileBtn.addEventListener('click', () => openModal(editProfileModal));
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

    // Event listeners for import modal
    closeImportModal.addEventListener('click', () => closeModalFunc(importDataModal));
    cancelImport.addEventListener('click', () => closeModalFunc(importDataModal));

    // Event listeners for clear data modal
    closeClearModal.addEventListener('click', () => closeModalFunc(clearDataModal));
    cancelClear.addEventListener('click', () => closeModalFunc(clearDataModal));

    // Close modals when clicking outside
    [editProfileModal, changePasswordModal, deleteAccountModal, exportDataModal, importDataModal, clearDataModal].forEach(modal => {
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
            } else if (importDataModal.classList.contains('show')) {
                closeModalFunc(importDataModal);
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
                alert('Please select an image file.');
                return;
            }
            
            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                alert('Image size should be less than 5MB.');
                return;
            }

            const reader = new FileReader();
            reader.onload = (event) => {
                profilePhotoPreview.src = event.target.result;
            };
            reader.readAsDataURL(file);
        }
    });

    // Edit profile form submission
    editProfileForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const newName = editName.value.trim();
        const newUsername = editUsername.value.trim();
        
        // Basic validation
        if (!newName || !newUsername) {
            alert('Please fill in all fields.');
            return;
        }
        
        if (newName.length < 2) {
            alert('Name must be at least 2 characters long.');
            return;
        }
        
        if (newUsername.length < 3) {
            alert('Username must be at least 3 characters long.');
            return;
        }

        // Update the display
        currentName.textContent = newName;
        currentUsername.textContent = newUsername;
        
        // Update profile picture if changed
        if (profilePhotoPreview.src !== currentProfilePic.src) {
            currentProfilePic.src = profilePhotoPreview.src;
        }
        
        // Update navbar avatar if it exists
        const navbarAvatar = document.querySelector('.navbar .avatar');
        if (navbarAvatar && profilePhotoPreview.src !== navbarAvatar.src) {
            navbarAvatar.src = profilePhotoPreview.src;
        }
        
        // Update localStorage for navbar manager
        localStorage.setItem('userAvatar', profilePhotoPreview.src);
        
        // Update all avatars across the app if navbar manager exists
        if (window.navbarManager) {
            window.navbarManager.updateUserAvatar();
        }
        
        // Close modal
        closeModalFunc(editProfileModal);
        
        // Show success message
        showSuccessMessage('Successfully updated the profile');
        
        // Update initial values
        initialValues.name = newName;
        initialValues.username = newUsername;
        initialValues.profilePic = profilePhotoPreview.src;
    });

    // Change password form submission
    changePasswordForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        // Validation
        if (!currentPassword || !newPassword || !confirmPassword) {
            alert('Please fill in all fields.');
            return;
        }
        
        if (newPassword.length < 8) {
            alert('New password must be at least 8 characters long.');
            return;
        }
        
        if (newPassword !== confirmPassword) {
            alert('New passwords do not match.');
            return;
        }
        
        // Simulate password change (in real app, this would make an API call)
        console.log('Password changed:', { currentPassword, newPassword });
        
        // Close modal
        closeModalFunc(changePasswordModal);
        
        // Show success message
        showSuccessMessage('Password changed successfully');
        
        // Clear form
        changePasswordForm.reset();
    });

    // Delete account confirmation logic
    deleteConfirmText.addEventListener('input', () => {
        confirmDelete.disabled = deleteConfirmText.value !== 'DELETE';
    });

    // Delete account form submission
    deleteAccountForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const confirmText = deleteConfirmText.value;
        const password = document.getElementById('deletePassword').value;
        
        if (confirmText !== 'DELETE') {
            alert('Please type "DELETE" to confirm.');
            return;
        }
        
        if (!password) {
            alert('Please enter your password.');
            return;
        }
        
        // Simulate account deletion (in real app, this would make an API call)
        console.log('Account deleted:', { password });
        
        // Show success message
        showSuccessMessage('Account deleted successfully');
        
        // Close modal
        closeModalFunc(deleteAccountModal);
        
        // Clear form
        deleteAccountForm.reset();
        confirmDelete.disabled = true;
        
        // In a real app, you would redirect to login page or logout
        setTimeout(() => {
            alert('You will be redirected to the login page.');
            // window.location.href = '/login.html';
        }, 2000);
    });

    // Export data functionality
    startExport.addEventListener('click', () => {
        const format = document.getElementById('exportFormat').value;
        const includeItems = document.getElementById('exportItems').checked;
        const includeCategories = document.getElementById('exportCategories').checked;
        const includeShoppingLists = document.getElementById('exportShoppingLists').checked;
        const includeSettings = document.getElementById('exportSettings').checked;
        
        // Get data based on selected options
        const exportData = {
            items: includeItems ? getMockPantryItems() : [],
            categories: includeCategories ? getMockCategories() : [],
            shoppingLists: includeShoppingLists ? getMockShoppingLists() : [],
            settings: includeSettings ? getMockSettings() : {}
        };
        
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
    });

    // Convert data to CSV format
    function convertToCSV(data) {
        let csvContent = '';
        
        // Add timestamp
        csvContent += `Export Date,${new Date().toISOString()}\n\n`;
        
        // Export items
        if (data.items && data.items.length > 0) {
            csvContent += 'PANTRY ITEMS\n';
            csvContent += 'Name,Quantity,Unit,Expiry Date,Category\n';
            data.items.forEach(item => {
                csvContent += `"${item.name}",${item.quantity},"${item.unit}","${item.expiry}","${item.category}"\n`;
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
            csvContent += 'List Name,Items,Completed\n';
            data.shoppingLists.forEach(list => {
                const items = list.items.join('; ');
                const completed = list.completed ? 'Yes' : 'No';
                csvContent += `"${list.name}","${items}","${completed}"\n`;
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
                textContent += `   Quantity: ${item.quantity} ${item.unit}\n`;
                textContent += `   Expiry: ${item.expiry}\n`;
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
            data.shoppingLists.forEach((list, index) => {
                textContent += `${index + 1}. ${list.name}\n`;
                textContent += `   Items: ${list.items.join(', ')}\n`;
                textContent += `   Status: ${list.completed ? 'Completed' : 'Pending'}\n\n`;
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

    // Import file selection
    importFile.addEventListener('change', () => {
        startImport.disabled = !importFile.files[0];
    });

    // Import data functionality
    startImport.addEventListener('click', () => {
        const file = importFile.files[0];
        if (!file) {
            alert('Please select a file to import.');
            return;
        }
        
        // Validate file size
        if (file.size > 10 * 1024 * 1024) {
            alert('File size must be less than 10MB.');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                console.log('Importing data:', data);
                
                // Simulate data import
                showSuccessMessage('Data imported successfully');
                closeModalFunc(importDataModal);
                importFile.value = '';
                startImport.disabled = true;

                if (window.navbarManager) {
                    window.navbarManager.addNotification({
                        type: 'system',
                        title: 'Data Imported',
                        message: 'Your pantry data was imported successfully.',
                        actions: ['View Imported Data']
                    });
                }
            } catch (error) {
                alert('Invalid file format. Please select a valid JSON file.');
            }
        };
        reader.readAsText(file);
    });

    // Clear data confirmation logic
    clearConfirmText.addEventListener('input', () => {
        confirmClear.disabled = clearConfirmText.value !== 'CLEAR';
    });

    // Clear all data functionality
    confirmClear.addEventListener('click', () => {
        const confirmText = clearConfirmText.value;
        
        if (confirmText !== 'CLEAR') {
            alert('Please type "CLEAR" to confirm.');
            return;
        }
        
        // Simulate clearing all data
        console.log('All data cleared');
        
        // Clear localStorage
        localStorage.clear();
        
        // Show success message
        showSuccessMessage('All data cleared successfully');
        
        // Close modal
        closeModalFunc(clearDataModal);
        
        // Clear form
        clearConfirmText.value = '';
        confirmClear.disabled = true;
        
        // Reload settings
        setTimeout(() => {
            location.reload();
        }, 2000);
    });

    // Mock data functions for export
    function getMockPantryItems() {
        return [
            { name: 'Rice', quantity: 2, unit: 'kg', expiry: '2024-12-31', category: 'Grains' },
            { name: 'Pasta', quantity: 3, unit: 'packets', expiry: '2024-11-30', category: 'Grains' },
            { name: 'Tomatoes', quantity: 1, unit: 'kg', expiry: '2024-10-15', category: 'Vegetables' }
        ];
    }

    function getMockCategories() {
        return ['Grains', 'Vegetables', 'Fruits', 'Dairy', 'Meat', 'Spices'];
    }

    function getMockShoppingLists() {
        return [
            { name: 'Weekly Groceries', items: ['Milk', 'Bread', 'Eggs'], completed: false },
            { name: 'Party Supplies', items: ['Chips', 'Soda', 'Cake'], completed: true }
        ];
    }

    function getMockSettings() {
        return {
            expiryReminders: true,
            shoppingReminders: true,
            emailNotifications: false,
            autoCategorization: true,
            expiryWarningDays: 2
        };
    }

    // Toggle switches functionality
    const toggleSwitches = document.querySelectorAll('.toggle-switch input');
    toggleSwitches.forEach(toggle => {
        toggle.addEventListener('change', () => {
            const settingLabel = toggle.closest('.setting-item').querySelector('.setting-label').textContent;
            console.log(`${settingLabel} is now ${toggle.checked ? 'enabled' : 'disabled'}`);
        });
    });

    // Select dropdown functionality
    const selectDropdowns = document.querySelectorAll('.setting-select');
    selectDropdowns.forEach(select => {
        select.addEventListener('change', () => {
            const settingLabel = select.closest('.setting-item').querySelector('.setting-label').textContent;
            console.log(`${settingLabel} changed to ${select.value}`);
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
                case 'Import':
                    openModal(importDataModal);
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
                    console.log(`Action: ${action} for ${settingLabel}`);
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
                    console.log(`Navigating to: ${linkText}`);
            }
        });
    });

    // Simulate some settings being saved to localStorage
    const saveSettings = () => {
        const settings = {
            expiryReminders: document.querySelector('input[type="checkbox"]').checked,
            shoppingReminders: document.querySelectorAll('input[type="checkbox"]')[1].checked,
            emailNotifications: document.querySelectorAll('input[type="checkbox"]')[2].checked,
            autoCategorization: document.querySelectorAll('input[type="checkbox"]')[3].checked,
            expiryWarningDays: document.querySelector('.setting-select').value
        };
        localStorage.setItem('pantrySettings', JSON.stringify(settings));
        console.log('Settings saved:', settings);

        if (window.navbarManager) {
            window.navbarManager.addNotification({
                type: 'system',
                title: 'Settings Changed',
                message: 'Your pantry settings were updated.',
                actions: ['View Settings']
            });
        }
    };

    // Load settings from localStorage
    const loadSettings = () => {
        const savedSettings = localStorage.getItem('pantrySettings');
        if (savedSettings) {
            const settings = JSON.parse(savedSettings);
            // Apply saved settings to the UI
            const checkboxes = document.querySelectorAll('input[type="checkbox"]');
            if (checkboxes[0]) checkboxes[0].checked = settings.expiryReminders;
            if (checkboxes[1]) checkboxes[1].checked = settings.shoppingReminders;
            if (checkboxes[2]) checkboxes[2].checked = settings.emailNotifications;
            if (checkboxes[3]) checkboxes[3].checked = settings.autoCategorization;
            
            const select = document.querySelector('.setting-select');
            if (select && settings.expiryWarningDays) {
                select.value = settings.expiryWarningDays;
            }
        }
    };

    // Initialize settings and password toggles
    loadSettings();
    setupPasswordToggles();
}); 