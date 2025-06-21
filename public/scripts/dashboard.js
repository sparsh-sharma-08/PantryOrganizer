// Delete pantry item card
function attachDeleteListeners() {
  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.onclick = function() {
      if (confirm('Are you sure you want to delete this item?')) {
        const card = this.closest('.pantry-card');
        card.style.opacity = '0';
        setTimeout(() => {
          card.remove();
          updateSummaryCards();
        }, 300);
      }
    };
  });
}

// Edit pantry item
function attachEditListeners() {
  document.querySelectorAll('.edit-btn').forEach(btn => {
    btn.onclick = function() {
      const card = this.closest('.pantry-card');
      const name = card.querySelector('.item-name').textContent;
      const qty = card.querySelector('.card-body div:first-child b').textContent;
      const expiry = card.querySelector('.card-body div:last-child b').textContent;
      
      // Convert expiry string to date input format
      const expDate = new Date(expiry);
      const expInput = expDate.toISOString().split('T')[0];

      // Populate edit form
      document.getElementById('editItemName').value = name;
      document.getElementById('editItemQty').value = qty;
      document.getElementById('editItemExpiry').value = expInput;

      // Show edit modal
      const editModal = document.getElementById('editItemModal');
      editModal.style.display = 'flex';
      document.getElementById('editItemName').focus();

      // Store reference to card being edited
      editModal.dataset.editingCard = card.id;
    };
  });
}

// Modal logic
const addBtn = document.querySelector('.add-btn');
const modal = document.getElementById('addItemModal');
const cancelBtn = document.getElementById('cancelAddItem');
const form = document.getElementById('addItemForm');

addBtn.onclick = () => {
  modal.style.display = 'flex';
  form.reset();
  document.getElementById('itemName').focus();
};

cancelBtn.onclick = () => {
  modal.style.display = 'none';
};

// Close modal when clicking outside
modal.onclick = (e) => {
  if (e.target === modal) modal.style.display = 'none';
};

// Add new pantry card on form submit
form.onsubmit = function(e) {
  e.preventDefault();
  const name = document.getElementById('itemName').value.trim();
  const qty = document.getElementById('itemQty').value.trim();
  const expiry = document.getElementById('itemExpiry').value;
  if (!name || !qty || !expiry) return;

  // Calculate status badge
  const today = new Date();
  const expDate = new Date(expiry);
  const diffTime = expDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  let badge = '';
  let badgeClass = '';
  if (diffDays < 0) {
    badge = 'Expired';
    badgeClass = 'expired';
  } else if (diffDays <= 2) {
    badge = diffDays === 1 ? '1 day' : diffDays + ' days';
    badgeClass = 'expiring';
  } else {
    badge = 'Fresh';
    badgeClass = 'fresh';
  }

  // Format date
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  const expString = expDate.toLocaleDateString(undefined, options);

  // Create new pantry card
  const card = document.createElement('div');
  card.className = 'pantry-card';
  card.id = 'item-' + Date.now(); // Add unique ID
  card.innerHTML = `
    <div class="card-header">
      <span class="item-name">${name}</span>
      <span class="badge ${badgeClass}">${badge}</span>
    </div>
    <div class="card-body">
      <div>Quantity: <b>${qty}</b></div>
      <div>Expires: <b>${expString}</b></div>
    </div>
    <div class="card-actions">
      <button class="edit-btn" title="Edit"><i class="fa fa-pen"></i></button>
      <button class="delete-btn" title="Delete"><i class="fa fa-trash"></i></button>
    </div>
  `;
  // Insert at the top of the grid
  const grid = document.querySelector('.pantry-grid');
  grid.prepend(card);

  // Re-attach listeners
  attachDeleteListeners();
  attachEditListeners();

  // Update summary cards
  updateSummaryCards();

  modal.style.display = 'none';
};

// Edit modal logic
const editModal = document.getElementById('editItemModal');
const editForm = document.getElementById('editItemForm');
const cancelEditBtn = document.getElementById('cancelEditItem');

cancelEditBtn.onclick = () => {
  editModal.style.display = 'none';
};

// Close edit modal when clicking outside
editModal.onclick = (e) => {
  if (e.target === editModal) editModal.style.display = 'none';
};

// Handle edit form submission
editForm.onsubmit = function(e) {
  e.preventDefault();
  const name = document.getElementById('editItemName').value.trim();
  const qty = document.getElementById('editItemQty').value.trim();
  const expiry = document.getElementById('editItemExpiry').value;
  if (!name || !qty || !expiry) return;

  // Calculate status badge
  const today = new Date();
  const expDate = new Date(expiry);
  const diffTime = expDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  let badge = '';
  let badgeClass = '';
  if (diffDays < 0) {
    badge = 'Expired';
    badgeClass = 'expired';
  } else if (diffDays <= 2) {
    badge = diffDays === 1 ? '1 day' : diffDays + ' days';
    badgeClass = 'expiring';
  } else {
    badge = 'Fresh';
    badgeClass = 'fresh';
  }

  // Format date
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  const expString = expDate.toLocaleDateString(undefined, options);

  // Update the card
  const cardId = editModal.dataset.editingCard;
  const card = document.getElementById(cardId);
  card.querySelector('.item-name').textContent = name;
  card.querySelector('.card-body div:first-child b').textContent = qty;
  card.querySelector('.card-body div:last-child b').textContent = expString;
  
  const badgeElement = card.querySelector('.badge');
  badgeElement.className = 'badge ' + badgeClass;
  badgeElement.textContent = badge;

  // Update summary cards
  updateSummaryCards();

  // Hide modal
  editModal.style.display = 'none';
};

// Update summary cards
function updateSummaryCards() {
  const cards = document.querySelectorAll('.pantry-card');
  const totalItems = cards.length;
  let freshItems = 0;
  let expiringSoon = 0;
  let expired = 0;

  cards.forEach(card => {
    const badge = card.querySelector('.badge');
    if (badge.classList.contains('fresh')) {
      freshItems++;
    } else if (badge.classList.contains('expiring')) {
      expiringSoon++;
    } else if (badge.classList.contains('expired')) {
      expired++;
    }
  });

  document.querySelector('.summary-card:nth-child(1) .summary-value').textContent = totalItems;
  document.querySelector('.summary-card:nth-child(2) .summary-value').textContent = freshItems;
  document.querySelector('.summary-card:nth-child(3) .summary-value').textContent = expiringSoon;
  document.querySelector('.summary-card:nth-child(4) .summary-value').textContent = expired;
}

// Initial setup
attachDeleteListeners();
attachEditListeners();
updateSummaryCards();