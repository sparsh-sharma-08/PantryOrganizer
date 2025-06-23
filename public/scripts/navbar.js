// Shared Navbar Functionality
class NavbarManager {
    constructor() {
        this.notificationCount = 0;
        this.init();
    }

    init() {
        this.updateNotificationCount();
        this.setupNavbarLinks();
        this.updateActivePage();
        this.updateUserAvatar();
        
        // Update notification count every 30 seconds
        setInterval(() => {
            this.updateNotificationCount();
        }, 30000);
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
        
        // Default notifications
        const defaultNotifications = [
            {
                id: 1,
                type: 'expiry',
                title: 'Item Expiring Soon',
                message: 'Milk will expire in 1 day. Consider using it soon or adding it to your shopping list.',
                time: '2 hours ago',
                unread: true,
                actions: ['View Item', 'Add to Shopping List']
            },
            {
                id: 2,
                type: 'shopping',
                title: 'Shopping List Reminder',
                message: 'You have 5 items in your shopping list. Don\'t forget to pick them up!',
                time: '1 day ago',
                unread: true,
                actions: ['View Shopping List']
            },
            {
                id: 3,
                type: 'expiry',
                title: 'Multiple Items Expiring',
                message: '3 items in your pantry will expire within the next 2 days.',
                time: '1 day ago',
                unread: true,
                actions: ['View Expiring Items']
            },
            {
                id: 4,
                type: 'system',
                title: 'Welcome to Smart Pantry!',
                message: 'Your account has been successfully created. Start adding items to your pantry to get the most out of the app.',
                time: '3 days ago',
                unread: false,
                actions: ['Get Started']
            }
        ];
        
        localStorage.setItem('smartPantryNotifications', JSON.stringify(defaultNotifications));
        return defaultNotifications;
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
        if (storedAvatar) {
            const avatars = document.querySelectorAll('.avatar');
            avatars.forEach(avatar => {
                avatar.src = storedAvatar;
            });
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
}

// Initialize navbar when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.navbarManager = new NavbarManager();
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NavbarManager;
} 