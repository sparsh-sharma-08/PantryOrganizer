document.addEventListener('DOMContentLoaded', () => {
  if (!localStorage.getItem('token')) {
    window.location.href = '/index.html';
    return;
  }
  const notificationsList = document.getElementById('notificationsList');
  const markAllReadBtn = document.getElementById('markAllReadBtn');
  const clearAllBtn = document.getElementById('clearAllBtn');
  const filterBtns = document.querySelectorAll('.filter-btn');
  const emptyState = document.getElementById('emptyState');

  let currentFilter = 'all';

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
    renderNotifications();
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
        showNotification('Notifications cleared successfully', 'success');
        renderNotifications();
      }
    });
  });

  // Filter notifications
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      currentFilter = btn.getAttribute('data-filter');
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderNotifications();
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
      renderNotifications();
    }
  });

  // Action button functionality
  document.addEventListener('click', (e) => {
    if (e.target.closest('.action-btn')) {
      const actionBtn = e.target.closest('.action-btn');
      const action = actionBtn.textContent.trim();
      const notificationDiv = actionBtn.closest('.notification-item');
      const notificationId = parseInt(notificationDiv.getAttribute('data-id'));
      const notifications = window.navbarManager.getNotifications();
      const notification = notifications.find(n => n.id === notificationId);
      switch(action) {
        case 'View Item':
          if (notification && notification.itemId) {
            window.location.href = `/dashboard.html?itemId=${notification.itemId}`;
          } else {
            window.location.href = '/dashboard.html';
          }
          break;
        case 'Add to Shopping List':
          showNotification('Added to shopping list!', 'success');
          break;
        case 'View Shopping List':
          window.location.href = '/shopping-list.html';
          break;
        case 'View Expiring Items':
          window.location.href = '/dashboard.html';
          break;
        case 'View Changes':
          showNotification('Showing shopping list changes...', 'info');
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

  function renderNotifications() {
    if (!window.navbarManager) return;
    const notifications = window.navbarManager.getNotifications();
    notificationsList.innerHTML = '';
    let filtered = notifications;
    if (currentFilter !== 'all') {
      filtered = notifications.filter(n => n.type === currentFilter);
    }
    if (filtered.length === 0) {
      emptyState.style.display = 'block';
      return;
    }
    emptyState.style.display = 'none';
    filtered.forEach(n => {
      const notifDiv = document.createElement('div');
      notifDiv.className = 'notification-item' + (n.unread ? ' unread' : '');
      notifDiv.setAttribute('data-type', n.type);
      notifDiv.setAttribute('data-id', n.id);
      notifDiv.innerHTML = `
        <div class="notification-icon ${n.type}">
          <i class="fa ${n.type === 'expiry' ? 'fa-exclamation-triangle' : n.type === 'shopping' ? 'fa-shopping-cart' : 'fa-info-circle'}"></i>
        </div>
        <div class="notification-content">
          <div class="notification-header">
            <h3>${n.title}</h3>
            <span class="notification-time">${n.time || ''}</span>
          </div>
          <p>${n.message}</p>
          <div class="notification-actions">
            ${(n.actions || []).map(a => `<button class="action-btn">${a}</button>`).join('')}
          </div>
        </div>
        <button class="mark-read-btn" title="Mark as read">
          <i class="fa fa-check"></i>
        </button>
      `;
      notificationsList.appendChild(notifDiv);
    });
  }

  // Call renderNotifications on load
  renderNotifications();
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