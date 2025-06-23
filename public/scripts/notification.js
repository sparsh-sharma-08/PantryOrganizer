document.addEventListener('DOMContentLoaded', () => {
  const notificationsList = document.getElementById('notificationsList');
  const markAllReadBtn = document.getElementById('markAllReadBtn');
  const clearAllBtn = document.getElementById('clearAllBtn');
  const filterBtns = document.querySelectorAll('.filter-btn');
  const emptyState = document.getElementById('emptyState');

  // Mark all notifications as read
  markAllReadBtn.addEventListener('click', () => {
    const unreadNotifications = document.querySelectorAll('.notification-item.unread');
    unreadNotifications.forEach(notification => {
      notification.classList.remove('unread');
    });
    
    // Update navbar manager
    if (window.navbarManager) {
      window.navbarManager.markAllAsRead();
    }
    
    updateEmptyState();
  });

  // Clear all notifications
  clearAllBtn.addEventListener('click', () => {
    showConfirmDialog({
      message: 'Are you sure you want to clear all notifications?',
      onConfirm: () => {
        const allNotifications = document.querySelectorAll('.notification-item');
        allNotifications.forEach(notification => {
          notification.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
          notification.style.opacity = '0';
          notification.style.transform = 'scale(0.95)';
          setTimeout(() => {
            notification.remove();
          }, 300);
        });
        // Update navbar manager
        if (window.navbarManager) {
          window.navbarManager.clearAllNotifications();
        }
        updateEmptyState();
        showToast('Notifications cleared successfully');
      }
    });
  });

  // Filter notifications
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const filter = btn.getAttribute('data-filter');
      
      // Update active filter button
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      // Filter notifications
      const notifications = document.querySelectorAll('.notification-item');
      notifications.forEach(notification => {
        const type = notification.getAttribute('data-type');
        if (filter === 'all' || type === filter) {
          notification.style.display = 'flex';
        } else {
          notification.style.display = 'none';
        }
      });
      
      updateEmptyState();
    });
  });

  // Mark individual notification as read
  document.addEventListener('click', (e) => {
    if (e.target.closest('.mark-read-btn')) {
      const notification = e.target.closest('.notification-item');
      notification.classList.remove('unread');
      
      // Update navbar manager
      if (window.navbarManager) {
        const notificationId = parseInt(notification.getAttribute('data-id') || Date.now());
        window.navbarManager.markAsRead(notificationId);
      }
      
      updateEmptyState();
    }
  });

  // Action button functionality
  document.addEventListener('click', (e) => {
    if (e.target.closest('.action-btn')) {
      const actionBtn = e.target.closest('.action-btn');
      const action = actionBtn.textContent.trim();
      
      // Handle different actions
      switch(action) {
        case 'View Item':
          alert('Viewing item details...');
          break;
        case 'Add to Shopping List':
          alert('Added to shopping list!');
          break;
        case 'View Shopping List':
          window.location.href = '/shopping-list.html';
          break;
        case 'View Expiring Items':
          window.location.href = '/dashboard.html';
          break;
        case 'View Changes':
          alert('Showing shopping list changes...');
          break;
        case 'Get Started':
          window.location.href = '/dashboard.html';
          break;
        default:
          console.log('Action:', action);
      }
    }
  });

  // Update empty state visibility
  function updateEmptyState() {
    const visibleNotifications = document.querySelectorAll('.notification-item[style*="display: flex"], .notification-item:not([style*="display: none"])');
    
    if (visibleNotifications.length === 0) {
      emptyState.style.display = 'block';
    } else {
      emptyState.style.display = 'none';
    }
  }

  // Initialize
  updateEmptyState();
});

// Custom confirm dialog
function showConfirmDialog({ message, onConfirm }) {
  let dialog = document.getElementById('customConfirmDialog');
  if (!dialog) {
    dialog = document.createElement('div');
    dialog.id = 'customConfirmDialog';
    dialog.innerHTML = `
      <div class="dialog-backdrop"></div>
      <div class="dialog-box">
        <p class="dialog-message"></p>
        <div class="dialog-actions">
          <button class="dialog-cancel">Cancel</button>
          <button class="dialog-confirm">Confirm</button>
        </div>
      </div>
    `;
    document.body.appendChild(dialog);
  }
  dialog.querySelector('.dialog-message').textContent = message;
  dialog.style.display = 'flex';
  dialog.querySelector('.dialog-cancel').onclick = () => {
    dialog.style.display = 'none';
  };
  dialog.querySelector('.dialog-confirm').onclick = () => {
    dialog.style.display = 'none';
    if (typeof onConfirm === 'function') onConfirm();
  };
}

// Toast notification
function showToast(message) {
  let toast = document.getElementById('customToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'customToast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.className = 'show';
  setTimeout(() => {
    toast.className = toast.className.replace('show', '');
  }, 5000);
}