// Shared Navbar Functionality
class NavbarManager {
    constructor() {
        this.notificationCount = 0;
        this.init();
    }

    async init() {
        this.updateNotificationCount();
        this.setupNavbarLinks();
        this.updateActivePage();
        await this.fetchAndSetUserAvatar();
        
        // Small delay to ensure DOM is ready
        setTimeout(() => {
            this.updateUserAvatar();
        }, 100);
        
        // Update notification count every 30 seconds
        setInterval(() => {
            this.updateNotificationCount();
        }, 30000);
    }

    // Fetch profile photo from backend and update localStorage
    async fetchAndSetUserAvatar() {
        const token = localStorage.getItem('token');
        if (!token) return;
        try {
            const res = await fetch('/api/auth/profile', {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
            if (res.ok) {
                const data = await res.json();
                if (data.profile_photo) {
                    localStorage.setItem('userAvatar', data.profile_photo);
                } else {
                    localStorage.removeItem('userAvatar');
                }
            }
        } catch (err) {
            // Fail silently
        }
    }

    // Update notification count based on unread notifications
    updateNotificationCount() {
        const notifications = this.getNotifications();
        const unreadCount = notifications.filter(n => n.unread).length;
        
        // Update all notification dots across the app
        const notificationDots = document.querySelectorAll('.notif-dot');
        notificationDots.forEach(dot => {
            if (unreadCount > 0) {
                dot.textContent = unreadCount;
                dot.style.display = 'inline';
            } else {
                dot.style.display = 'none';
            }
        });
        
        this.notificationCount = unreadCount;
    }

    // Get notifications from localStorage or return default data
    getNotifications() {
        const stored = localStorage.getItem('smartPantryNotifications');
        if (stored) {
            return JSON.parse(stored);
        }
        // Return empty array if no notifications in localStorage
        return [];
    }

    // Setup navbar links with consistent behavior
    setupNavbarLinks() {
        const navLinks = document.querySelectorAll('.nav-links a');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                // Remove active class from all links
                navLinks.forEach(l => l.classList.remove('active'));
                // Add active class to clicked link
                link.classList.add('active');
            });
        });
    }

    // Update active page based on current URL
    updateActivePage() {
        const currentPath = window.location.pathname;
        const navLinks = document.querySelectorAll('.nav-links a');
        
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === currentPath || 
                (currentPath === '/' && link.getAttribute('href') === '/dashboard.html') ||
                (currentPath === '/index.html' && link.getAttribute('href') === '/dashboard.html')) {
                link.classList.add('active');
            }
        });
    }

    // Update user avatar from localStorage if available
    updateUserAvatar() {
        const storedAvatar = localStorage.getItem('userAvatar');
        const avatarDiv = document.getElementById('userAvatar');
        
        if (avatarDiv) {
            if (storedAvatar) {
                // Show uploaded photo
                avatarDiv.innerHTML = `<img src="${storedAvatar}" alt="User" class="avatar"/>`;
            } else {
                // Show placeholder icon
                avatarDiv.innerHTML = `<i class="fa fa-user"></i>`;
            }
        }
    }

    // Add new notification
    addNotification(notification) {
        const notifications = this.getNotifications();
        const newNotification = {
            id: Date.now(),
            unread: true,
            time: 'Just now',
            ...notification
        };
        
        notifications.unshift(newNotification);
        localStorage.setItem('smartPantryNotifications', JSON.stringify(notifications));
        this.updateNotificationCount();
    }

    // Mark notification as read
    markAsRead(notificationId) {
        const notifications = this.getNotifications();
        const notification = notifications.find(n => n.id === notificationId);
        if (notification) {
            notification.unread = false;
            localStorage.setItem('smartPantryNotifications', JSON.stringify(notifications));
            this.updateNotificationCount();
        }
    }

    // Mark all notifications as read
    markAllAsRead() {
        const notifications = this.getNotifications();
        notifications.forEach(n => n.unread = false);
        localStorage.setItem('smartPantryNotifications', JSON.stringify(notifications));
        this.updateNotificationCount();
    }

    // Clear all notifications
    clearAllNotifications() {
        localStorage.setItem('smartPantryNotifications', JSON.stringify([]));
        this.updateNotificationCount();
    }

    // Get notification count
    getNotificationCount() {
        return this.notificationCount;
    }

    // Force refresh user avatar (called when profile photo changes)
    forceRefreshAvatar() {
        this.fetchAndSetUserAvatar().then(() => {
            this.updateUserAvatar();
        });
    }
}

// Initialize navbar when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.navbarManager = new NavbarManager();
    
    // Update avatar when page becomes visible (in case user switches tabs)
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden && window.navbarManager) {
            window.navbarManager.updateUserAvatar();
        }
    });
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NavbarManager;
} 