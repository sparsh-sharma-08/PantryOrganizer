// Shopping list functionality (user-specific, persistent)
let toBuyItems = [];
let boughtItems = [];

const addItemBtn = document.getElementById('addItemBtn');
const toBuyList = document.getElementById('toBuyList');
const boughtList = document.getElementById('boughtList');
const addItemModal = document.getElementById('addItemModal');
const addItemForm = document.getElementById('addItemForm');
const cancelAddItemBtn = document.getElementById('cancelAddItem');

let isEditing = false;
let editingId = null;
let editingStatus = '';

const STATIC_CATEGORIES = [
    'Dairy', 'Bakery', 'Fruits', 'Vegetables', 'Meat', 'Grains', 'Snacks', 'Beverages', 'Frozen', 'Condiments', 'Other'
];

function getToken() {
  return localStorage.getItem('token');
}

async function fetchShoppingList() {
  const res = await fetch('/api/shopping-list', {
    headers: { 'Authorization': 'Bearer ' + getToken() }
  });
  const data = await res.json();
  if (res.ok) {
    toBuyItems = data.data.filter(item => item.status === 'to_buy');
    boughtItems = data.data.filter(item => item.status === 'bought');
    renderLists();
    updateCounts();
  } else {
    toBuyItems = [];
    boughtItems = [];
    renderLists();
    updateCounts();
  }
}

function showModal(item = null) {
  isEditing = !!item;
  editingId = item ? item.id : null;
  editingStatus = item ? item.status : '';
  addItemModal.classList.add('visible');
  addItemForm.reset();
  if (item) {
    document.getElementById('itemName').value = item.name;
    document.getElementById('itemNeed').value = item.quantity;
    document.getElementById('itemExpiry').value = item.expiry_date || '';
    document.getElementById('itemStatus').value = item.notes || '';
    document.getElementById('itemCategory').value = item.category || '';
    document.querySelector('.modal h2').textContent = 'Update Shopping Item';
    document.querySelector('.primary-btn').textContent = 'Update Item';
  } else {
    document.querySelector('.modal h2').textContent = 'Add to Shopping List';
    document.querySelector('.primary-btn').textContent = 'Add Item';
  }
  document.getElementById('itemName').focus();
}

function hideModal() {
  addItemModal.classList.remove('visible');
  isEditing = false;
  editingId = null;
  editingStatus = '';
}

if (cancelAddItemBtn) {
  cancelAddItemBtn.addEventListener('click', hideModal);
}
if (addItemModal) {
  addItemModal.addEventListener('click', (e) => {
    if (e.target === addItemModal) hideModal();
  });
}
if (addItemForm) {
  addItemForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('itemName').value.trim();
    const quantity = document.getElementById('itemNeed').value.trim();
    const expiry_date = document.getElementById('itemExpiry').value;
    const notes = document.getElementById('itemStatus').value.trim();
    const category = document.getElementById('itemCategory').value;
    if (!name || !quantity || !category) return;
    if (isEditing) {
      // Update existing item
      await fetch(`/api/shopping-list/${editingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + getToken()
        },
        body: JSON.stringify({ name, quantity, expiry_date, notes, category, status: editingStatus })
      });
    } else {
      // Add new item
      await fetch('/api/shopping-list', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + getToken()
        },
        body: JSON.stringify({ name, quantity, expiry_date, notes, category, status: 'to_buy' })
      });
    }
    hideModal();
    fetchShoppingList();
  });
}
function addItem() { showModal(); }
function editItem(list, itemIndex) {
  const item = list === 'toBuy' ? toBuyItems[itemIndex] : boughtItems[itemIndex];
  showModal(item);
}
async function markAsBought(itemIndex) {
  const item = toBuyItems[itemIndex];
  // Ensure expiry_date and category are set
  let expiry_date = item.expiry_date;
  if (!expiry_date) {
    const today = new Date();
    expiry_date = today.toISOString().split('T')[0];
  }
  let category = item.category || 'Other';
  // Update shopping list item status
  await fetch(`/api/shopping-list/${item.id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + getToken()
    },
    body: JSON.stringify({ ...item, status: 'bought' })
  });
  // Add to pantry (dashboard)
  await fetch('/api/items', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + getToken()
    },
    body: JSON.stringify({
      name: item.name,
      quantity: item.quantity,
      expiry_date,
      category
    })
  });
  fetchShoppingList();
  window.location.href = '/dashboard.html';
  if (window.navbarManager) {
    window.navbarManager.addNotification({
        type: 'shopping',
        title: 'Item Purchased',
        message: `${item.name} was marked as purchased and added to your pantry!`,
        actions: ['View Item']
    });
  }
}
async function undoBought(itemIndex) {
  const item = boughtItems[itemIndex];
  await fetch(`/api/shopping-list/${item.id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + getToken()
    },
    body: JSON.stringify({ ...item, status: 'to_buy' })
  });
  fetchShoppingList();
}
async function deleteItem(list, itemIndex) {
  showConfirm('Are you sure you want to delete this item?', () => {
    (async () => {
      const item = list === 'toBuy' ? toBuyItems[itemIndex] : boughtItems[itemIndex];
      await fetch(`/api/shopping-list/${item.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': 'Bearer ' + getToken() }
      });
      fetchShoppingList();
    })();
  });
  if (window.navbarManager) {
    window.navbarManager.addNotification({
        type: 'shopping',
        title: 'Item Deleted',
        message: `An item was deleted from your shopping list.`,
        actions: ['View Changes']
    });
  }
}
function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = String(date.getFullYear());
  return `${day}/${month}/${year}`;
}
function renderLists() {
  toBuyList.innerHTML = '';
  if (toBuyItems.length > 0) {
    const clearAllBtn = document.createElement('button');
    clearAllBtn.className = 'clear-all-btn';
    clearAllBtn.textContent = 'Clear All';
    clearAllBtn.onclick = clearAllToBuy;
    toBuyList.appendChild(clearAllBtn);
  }
  toBuyItems.forEach((item, index) => {
    const itemCard = document.createElement('div');
    itemCard.className = 'item-card';
    itemCard.innerHTML = `
      <div class="item-info">
        <div class="item-main">
          <span class="item-name">${item.name}</span>
          <span class="item-quantity">${item.quantity}</span>
        </div>
        <div class="item-details">
          ${item.expiry_date ? `<span class="item-expiry">Expires: ${formatDate(item.expiry_date)}</span>` : ''}
          ${item.notes ? `<span class="item-notes">${item.notes}</span>` : ''}
        </div>
      </div>
      <div class="item-actions">
        <button class="edit-btn" title="Edit item" onclick="editItem('toBuy', ${index})">
          <i class="fa fa-edit"></i>
        </button>
        <button class="bought-btn" title="Mark as bought" onclick="markAsBought(${index})">
          <i class="fa fa-check"></i>
        </button>
        <button class="delete-btn" title="Delete" onclick="deleteItem('toBuy', ${index})">
          <i class="fa fa-trash"></i>
        </button>
      </div>
    `;
    toBuyList.appendChild(itemCard);
  });
  boughtList.innerHTML = '';
  if (boughtItems.length > 0) {
    const clearAllBtn = document.createElement('button');
    clearAllBtn.className = 'clear-all-btn';
    clearAllBtn.textContent = 'Clear All';
    clearAllBtn.onclick = clearAllBought;
    boughtList.appendChild(clearAllBtn);
  }
  boughtItems.forEach((item, index) => {
    const itemCard = document.createElement('div');
    itemCard.className = 'item-card bought';
    itemCard.innerHTML = `
      <div class="item-info">
        <div class="item-main">
          <span class="item-name">${item.name}</span>
          <span class="item-quantity">${item.quantity}</span>
        </div>
        <div class="item-details">
          ${item.expiry_date ? `<span class="item-expiry">Expires: ${formatDate(item.expiry_date)}</span>` : ''}
          ${item.notes ? `<span class="item-notes">${item.notes}</span>` : ''}
        </div>
      </div>
      <div class="item-actions">
        <button class="edit-btn" title="Edit item" onclick="editItem('bought', ${index})">
          <i class="fa fa-edit"></i>
        </button>
        <button class="undo-btn" title="Move back to list" onclick="undoBought(${index})">
          <i class="fa fa-undo"></i>
        </button>
        <button class="delete-btn" title="Delete" onclick="deleteItem('bought', ${index})">
          <i class="fa fa-trash"></i>
        </button>
      </div>
    `;
    boughtList.appendChild(itemCard);
  });
}
function updateCounts() {
  const toBuyCount = document.querySelector('.list-section:first-child .item-count');
  const boughtCount = document.querySelector('.list-section:last-child .item-count');
  if (toBuyCount) toBuyCount.textContent = toBuyItems.length;
  if (boughtCount) boughtCount.textContent = boughtItems.length;
}
async function clearAllToBuy() {
  showConfirm('Are you sure you want to clear all To Buy items?', () => {
    (async () => {
      for (const item of toBuyItems) {
        await fetch(`/api/shopping-list/${item.id}`, {
          method: 'DELETE',
          headers: { 'Authorization': 'Bearer ' + getToken() }
        });
      }
      fetchShoppingList();
    })();
  });
  if (window.navbarManager) {
    window.navbarManager.addNotification({
        type: 'shopping',
        title: 'Shopping List Cleared',
        message: `All items were cleared from your shopping list (${arguments.callee.name === 'clearAllToBuy' ? 'To Buy' : 'Bought'}).`,
        actions: ['View Shopping List']
    });
  }
}
async function clearAllBought() {
  showConfirm('Are you sure you want to clear all Bought items?', () => {
    (async () => {
      for (const item of boughtItems) {
        await fetch(`/api/shopping-list/${item.id}`, {
          method: 'DELETE',
          headers: { 'Authorization': 'Bearer ' + getToken() }
        });
      }
      fetchShoppingList();
    })();
  });
  if (window.navbarManager) {
    window.navbarManager.addNotification({
        type: 'shopping',
        title: 'Shopping List Cleared',
        message: `All items were cleared from your shopping list (${arguments.callee.name === 'clearAllBought' ? 'Bought' : 'To Buy'}).`,
        actions: ['View Shopping List']
    });
  }
}
addItemBtn.addEventListener('click', addItem);
document.addEventListener('DOMContentLoaded', function() {
    if (!localStorage.getItem('token')) {
        window.location.href = '/index.html';
        return;
    }
    fetchShoppingList();
});

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
    document.body.appendChild(notif);
  }
  notif.textContent = message;
  notif.style.background = type === 'error' ? '#e74c3c' : '#3498db';
  notif.style.color = '#fff';
  notif.style.display = 'block';
  setTimeout(() => { notif.style.display = 'none'; }, 3500);
}

function showConfirm(message, onConfirm) {
  let dialog = document.getElementById('customConfirmBox');
  if (!dialog) {
    dialog = document.createElement('div');
    dialog.id = 'customConfirmBox';
    dialog.innerHTML = `
      <div class="dialog-backdrop"></div>
      <div class="dialog-box">
        <p class="dialog-message"></p>
        <div class="dialog-actions">
          <button class="dialog-cancel">Cancel</button>
          <button class="dialog-ok">OK</button>
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
  dialog.querySelector('.dialog-ok').onclick = () => {
    dialog.style.display = 'none';
    if (typeof onConfirm === 'function') onConfirm();
  };
}