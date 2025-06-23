// Shopping list functionality
let toBuyItems = [
  { name: 'Milk', quantity: '2 L', expiryDate: '2024-01-15', notes: 'For coffee' },
  { name: 'Bread', quantity: '1 loaf', expiryDate: '2024-01-10', notes: 'Whole wheat' },
  { name: 'Apples', quantity: '6 pcs', expiryDate: '2024-01-20', notes: 'Organic' }
];

let boughtItems = [
  { name: 'Yogurt', quantity: '500g', expiryDate: '2024-01-08', notes: 'Greek style' },
  { name: 'Cheese', quantity: '200g', expiryDate: '2024-01-25', notes: 'Cheddar' }
];

// DOM elements
const itemInput = document.getElementById('itemInput');
const addItemBtn = document.getElementById('addItemBtn');
const toBuyList = document.getElementById('toBuyList');
const boughtList = document.getElementById('boughtList');

// Modal elements
const addItemModal = document.getElementById('addItemModal');
const addItemForm = document.getElementById('addItemForm');
const cancelAddItemBtn = document.getElementById('cancelAddItem');

// Modal state
let isEditing = false;
let editingIndex = -1;
let editingList = '';

// Modal functions
function showModal(item = null, index = -1, list = '') {
  isEditing = item !== null;
  editingIndex = index;
  editingList = list;
  
  addItemModal.classList.add('visible');
  addItemForm.reset();
  
  if (isEditing && item) {
    // Fill form with existing data
    document.getElementById('itemName').value = item.name;
    document.getElementById('itemNeed').value = item.quantity;
    document.getElementById('itemExpiry').value = item.expiryDate || '';
    document.getElementById('itemStatus').value = item.notes || '';
    
    // Update modal title and button
    document.querySelector('.modal h2').textContent = 'Update Shopping Item';
    document.querySelector('.primary-btn').textContent = 'Update Item';
  } else {
    // Reset modal for adding new item
    document.querySelector('.modal h2').textContent = 'Add to Shopping List';
    document.querySelector('.primary-btn').textContent = 'Add Item';
  }
  
  document.getElementById('itemName').focus();
}

function hideModal() {
  addItemModal.classList.remove('visible');
  isEditing = false;
  editingIndex = -1;
  editingList = '';
}

// Modal event listeners
if (cancelAddItemBtn) {
  cancelAddItemBtn.addEventListener('click', hideModal);
}

if (addItemModal) {
  addItemModal.addEventListener('click', (e) => {
    if (e.target === addItemModal) {
      hideModal();
    }
  });
}

if (addItemForm) {
  addItemForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('itemName').value.trim();
    const need = document.getElementById('itemNeed').value.trim();
    const expiry = document.getElementById('itemExpiry').value;
    const status = document.getElementById('itemStatus').value.trim();

    if (!name || !need) return;

    const newItem = {
      name: name,
      quantity: need,
      expiryDate: expiry || null,
      notes: status || ''
    };

    if (isEditing) {
      // Update existing item
      if (editingList === 'toBuy') {
        toBuyItems[editingIndex] = newItem;
      } else if (editingList === 'bought') {
        boughtItems[editingIndex] = newItem;
      }
    } else {
      // Add new item
      toBuyItems.push(newItem);
    }
    
    renderLists();
    updateCounts();
    hideModal();
  });
}

// Add item functionality (opens modal)
function addItem() {
  showModal();
}

// Edit item functionality
function editItem(list, itemIndex) {
  const items = list === 'toBuy' ? toBuyItems : boughtItems;
  const item = items[itemIndex];
  showModal(item, itemIndex, list);
}

// Mark item as bought
function markAsBought(itemIndex) {
  const item = toBuyItems.splice(itemIndex, 1)[0];
  boughtItems.push(item);
  renderLists();
  updateCounts();
}

// Undo bought item
function undoBought(itemIndex) {
  const item = boughtItems.splice(itemIndex, 1)[0];
  toBuyItems.push(item);
  renderLists();
  updateCounts();
}

// Delete item
function deleteItem(list, itemIndex) {
  if (list === 'toBuy') {
    toBuyItems.splice(itemIndex, 1);
  } else {
    boughtItems.splice(itemIndex, 1);
  }
  renderLists();
  updateCounts();
}

// Format date for display
function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = String(date.getFullYear());
  return `${day}/${month}/${year}`;
}

// Render both lists
function renderLists() {
  // Render to buy list
  toBuyList.innerHTML = '';
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
          ${item.expiryDate ? `<span class="item-expiry">Expires: ${formatDate(item.expiryDate)}</span>` : ''}
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

  // Render bought list
  boughtList.innerHTML = '';
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
          ${item.expiryDate ? `<span class="item-expiry">Expires: ${formatDate(item.expiryDate)}</span>` : ''}
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

// Update item counts
function updateCounts() {
  const toBuyCount = document.querySelector('.list-section:first-child .item-count');
  const boughtCount = document.querySelector('.list-section:last-child .item-count');
  
  if (toBuyCount) toBuyCount.textContent = toBuyItems.length;
  if (boughtCount) boughtCount.textContent = boughtItems.length;
}

// Event listeners
addItemBtn.addEventListener('click', addItem);

// Initialize the page
document.addEventListener('DOMContentLoaded', () => {
  renderLists();
  updateCounts();
});