// Demo data for shopping list
const demoItems = [
  {
    name: 'Milk',
    current: '500ml remaining',
    expiring: true,
    expired: false,
    need: '2 L',
    completed: false
  },
  {
    name: 'Bread',
    current: 'None',
    expiring: false,
    expired: false,
    need: '1 loaf',
    completed: true
  },
  {
    name: 'Bananas',
    current: 'None',
    expiring: false,
    expired: false,
    need: '6 pcs',
    completed: false
  },
  {
    name: 'Yogurt',
    current: 'Expired item',
    expiring: false,
    expired: true,
    need: '500g',
    completed: true
  },
  {
    name: 'Chicken Breast',
    current: '200g remaining',
    expiring: true,
    expired: false,
    need: '1 kg',
    completed: false
  },
  {
    name: 'Eggs',
    current: '3 remaining',
    expiring: false,
    expired: false,
    need: '12 pcs',
    completed: false
  },
  {
    name: 'Tomatoes',
    current: 'None',
    expiring: false,
    expired: false,
    need: '1 kg',
    completed: true
  },
  {
    name: 'Olive Oil',
    current: 'Running low',
    expiring: false,
    expired: false,
    need: '500ml',
    completed: false
  }
];

let items = [];

const addItemModal = document.getElementById('addItemModal');
const addItemForm = document.getElementById('addItemForm');
const cancelAddItemBtn = document.getElementById('cancelAddItem');
const addBtn = document.querySelector('.add-btn');

function showModal() {
  addItemModal.classList.add('visible');
  addItemForm.reset();
  document.getElementById('itemName').focus();
}

function hideModal() {
  addItemModal.classList.remove('visible');
}

addBtn.onclick = showModal;
cancelAddItemBtn.onclick = hideModal;
addItemModal.onclick = (e) => {
  if (e.target === addItemModal) {
    hideModal();
  }
};

addItemForm.onsubmit = (e) => {
  e.preventDefault();
  const name = document.getElementById('itemName').value.trim();
  const need = document.getElementById('itemNeed').value.trim();
  const expiry = document.getElementById('itemExpiry').value;
  const status = document.getElementById('itemStatus').value.trim();

  if (!name || !need) return;

  const newItem = {
    name: name,
    current: status || 'Newly added',
    expiring: false,
    expired: false,
    need: need,
    completed: false,
    expiryDate: expiry || null
  };
  
  // Check expiry date to set flags
  if (newItem.expiryDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize today's date
    const expDate = new Date(newItem.expiryDate);
    const diffTime = expDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      newItem.expired = true;
    } else if (diffDays <= 7) { // Let's say expiring soon is within a week
      newItem.expiring = true;
    }
  }

  items.unshift(newItem);
  renderList();
  updateSummary();
  hideModal();
};

function renderList() {
  const list = document.getElementById('shoppingList');
  list.innerHTML = '';
  items.forEach((item, idx) => {
    const div = document.createElement('div');
    div.className = 'shopping-item' + (item.completed ? ' completed' : '');
    div.innerHTML = `
      <input type="checkbox" id="item-${idx}" ${item.completed ? 'checked' : ''} />
      <div class="item-details">
        <span class="item-title">${item.name}</span>
        <span class="item-status">Current: ${item.current}</span>
        <div class="badges">
          ${item.expiring ? '<span class="badge expiring">Expiring Soon</span>' : ''}
          ${item.expired ? '<span class="badge expired">Expired</span>' : ''}
          <span class="badge need">Need ${item.need}</span>
        </div>
      </div>
    `;
    div.querySelector('input[type="checkbox"]').addEventListener('change', (e) => {
      item.completed = e.target.checked;
      renderList();
      updateSummary();
    });
    list.appendChild(div);
  });
}

function updateSummary() {
  document.getElementById('itemCount').textContent = items.length;
  document.getElementById('completedCount').textContent = items.filter(i => i.completed).length;
}

document.getElementById('generateListBtn').onclick = () => {
  items = JSON.parse(JSON.stringify(demoItems));
  renderList();
  updateSummary();
};

document.getElementById('clearListBtn').onclick = () => {
  if (confirm('Are you sure you want to clear the entire shopping list?')) {
    items = [];
    renderList();
    updateSummary();
  }
};

window.onload = () => {
  items = JSON.parse(JSON.stringify(demoItems));
  renderList();
  updateSummary();
};