// Global variables
let allItems = [];
let currentFilters = {
    search: '',
    category: '',
    status: ''
};

// Initialize the dashboard
document.addEventListener('DOMContentLoaded', function() {
    // Initialize summary cards with 0 values
    initializeSummaryCards();
    loadCategories();
    loadItems();
    setupEventListeners();
});

// Initialize summary cards with 0 values
function initializeSummaryCards() {
    document.querySelector('.summary-card:nth-child(1) .summary-value').textContent = '0';
    document.querySelector('.summary-card:nth-child(2) .summary-value').textContent = '0';
    document.querySelector('.summary-card:nth-child(3) .summary-value').textContent = '0';
    document.querySelector('.summary-card:nth-child(4) .summary-value').textContent = '0';
}

// Load categories from database
async function loadCategories() {
    try {
        const response = await fetch('/api/categories');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        
        if (result.message === 'success') {
            const categoryFilter = document.getElementById('categoryFilter');
            categoryFilter.innerHTML = '<option value="">All Categories</option>';
            
            result.data.forEach(category => {
                const option = document.createElement('option');
                option.value = category;
                option.textContent = category;
                categoryFilter.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

// Load pantry items from database
async function loadItems() {
    try {
        const params = new URLSearchParams();
        if (currentFilters.search) params.append('search', currentFilters.search);
        if (currentFilters.category) params.append('category', currentFilters.category);
        if (currentFilters.status) params.append('status', currentFilters.status);
        
        const response = await fetch(`/api/items?${params.toString()}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        
        if (result.message === 'success') {
            allItems = result.data;
            renderItems();
            updateSummaryCards();
        }
    } catch (error) {
        console.error('Error loading items:', error);
        // Show error message in the grid
        const grid = document.getElementById('pantryGrid');
        grid.innerHTML = '<div class="no-items">Error loading items. Please refresh the page.</div>';
    }
}

// Render pantry items
function renderItems() {
    const grid = document.getElementById('pantryGrid');
    grid.innerHTML = '';
    
    if (allItems.length === 0) {
        grid.innerHTML = '<div class="no-items">No items found matching your criteria</div>';
        return;
    }
    
    allItems.forEach(item => {
        const card = createItemCard(item);
        grid.appendChild(card);
    });
    
    attachCardListeners();
}

// Create a pantry item card
function createItemCard(item) {
    const card = document.createElement('div');
    card.className = 'pantry-card';
    card.id = `item-${item.id}`;
    
    // Calculate status
    const today = new Date();
    const expDate = new Date(item.expiry_date);
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
    
    // Format date as DD/MM/YYYY
    const expString = formatDateDDMMYYYY(item.expiry_date);
    
    card.innerHTML = `
        <div class="card-header">
            <span class="item-name">${item.name}</span>
            <span class="badge ${badgeClass}">${badge}</span>
        </div>
        <div class="card-body">
            <div>Quantity: <b>${item.quantity}</b></div>
            <div>Category: <b>${item.category}</b></div>
            <div>Expires: <b>${expString}</b></div>
        </div>
        <div class="card-actions">
            <button class="edit-btn" title="Edit" data-id="${item.id}"><i class="fa fa-pen"></i></button>
            <button class="delete-btn" title="Delete" data-id="${item.id}"><i class="fa fa-trash"></i></button>
        </div>
    `;
    
    return card;
}

// Format date as DD/MM/YYYY
function formatDateDDMMYYYY(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear());
    return `${day}/${month}/${year}`;
}

// Setup event listeners
function setupEventListeners() {
    // Search functionality
    const searchInput = document.getElementById('searchInput');
    let searchTimeout;
    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            currentFilters.search = e.target.value;
            loadItems();
        }, 300);
    });
    
    // Category filter
    const categoryFilter = document.getElementById('categoryFilter');
    categoryFilter.addEventListener('change', (e) => {
        currentFilters.category = e.target.value;
        loadItems();
    });
    
    // Status filter
    const statusFilter = document.getElementById('statusFilter');
    statusFilter.addEventListener('change', (e) => {
        currentFilters.status = e.target.value;
        loadItems();
    });
    
    // Add item modal;
    const addBtn = document.querySelector('.add-btn');
    const addModal = document.getElementById('addItemModal');
    const addForm = document.getElementById('addItemForm');
    const cancelAddBtn = document.getElementById('cancelAddItem');
    
    addBtn.onclick = () => {
        addModal.style.display = 'flex';
        addForm.reset();
        document.getElementById('itemName').focus();
    };
    
    cancelAddBtn.onclick = () => {
        addModal.style.display = 'none';
    };
    
    addModal.onclick = (e) => {
        if (e.target === addModal) addModal.style.display = 'none';
    };
    
    addForm.onsubmit = handleAddItem;
    
    // Edit item modal
    const editModal = document.getElementById('editItemModal');
    const editForm = document.getElementById('editItemForm');
    const cancelEditBtn = document.getElementById('cancelEditItem');
    
    cancelEditBtn.onclick = () => {
        editModal.style.display = 'none';
    };
    
    editModal.onclick = (e) => {
        if (e.target === editModal) editModal.style.display = 'none';
    };
    
    editForm.onsubmit = handleEditItem;
}

// Attach listeners to card buttons
function attachCardListeners() {
    // Delete buttons
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.onclick = function() {
            const itemId = this.getAttribute('data-id');
            handleDeleteItem(itemId);
        };
    });
    
    // Edit buttons
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.onclick = function() {
            const itemId = this.getAttribute('data-id');
            handleEditItemClick(itemId);
        };
    });
}

// Handle add item
async function handleAddItem(e) {
    e.preventDefault();
    
    const formData = {
        name: document.getElementById('itemName').value.trim(),
        quantity: document.getElementById('itemQty').value.trim(),
        category: document.getElementById('itemCategory').value,
        expiry_date: document.getElementById('itemExpiry').value
    };
    
    if (!formData.name || !formData.quantity || !formData.category || !formData.expiry_date) {
        alert('Please fill in all fields');
        return;
    }
    
    try {
        console.log('Sending data:', formData);
        const response = await fetch('/api/items', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        console.log('Response status:', response.status);
        const result = await response.json();
        console.log('Response data:', result);
        
        if (result.message === 'success') {
            document.getElementById('addItemModal').style.display = 'none';
            loadItems();
        } else {
            alert('Error adding item: ' + (result.error || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error adding item:', error);
        alert('Error adding item. Please check the console for details.');
    }
}

// Handle edit item click
async function handleEditItemClick(itemId) {
    const item = allItems.find(item => item.id == itemId);
    if (!item) return;
    
    // Populate edit form
    document.getElementById('editItemId').value = item.id;
    document.getElementById('editItemName').value = item.name;
    document.getElementById('editItemQty').value = item.quantity;
    document.getElementById('editItemCategory').value = item.category;
    document.getElementById('editItemExpiry').value = item.expiry_date;
    
    // Show edit modal
    document.getElementById('editItemModal').style.display = 'flex';
    document.getElementById('editItemName').focus();
}

// Handle edit item submission
async function handleEditItem(e) {
    e.preventDefault();
    
    const itemId = document.getElementById('editItemId').value;
    const formData = {
        name: document.getElementById('editItemName').value.trim(),
        quantity: document.getElementById('editItemQty').value.trim(),
        category: document.getElementById('editItemCategory').value,
        expiry_date: document.getElementById('editItemExpiry').value
    };
    
    if (!formData.name || !formData.quantity || !formData.category || !formData.expiry_date) {
        alert('Please fill in all fields');
        return;
    }
    
    try {
        const response = await fetch(`/api/items/${itemId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        const result = await response.json();
        
        if (result.message === 'success') {
            document.getElementById('editItemModal').style.display = 'none';
            loadItems();
        } else {
            alert('Error updating item: ' + result.error);
        }
    } catch (error) {
        console.error('Error updating item:', error);
        alert('Error updating item. Please try again.');
    }
}

// Handle delete item
async function handleDeleteItem(itemId) {
    if (!confirm('Are you sure you want to delete this item?')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/items/${itemId}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (result.message === 'success') {
            loadItems();
        } else {
            alert('Error deleting item: ' + result.error);
        }
    } catch (error) {
        console.error('Error deleting item:', error);
        alert('Error deleting item. Please try again.');
    }
}

// Update summary cards
function updateSummaryCards() {
    const totalItems = allItems.length;
    let freshItems = 0;
    let expiringSoon = 0;
    let expired = 0;
    
    const today = new Date();
    
    allItems.forEach(item => {
        const expDate = new Date(item.expiry_date);
        const diffTime = expDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays < 0) {
            expired++;
        } else if (diffDays <= 2) {
            expiringSoon++;
        } else {
            freshItems++;
        }
    });
    
    document.querySelector('.summary-card:nth-child(1) .summary-value').textContent = totalItems;
    document.querySelector('.summary-card:nth-child(2) .summary-value').textContent = freshItems;
    document.querySelector('.summary-card:nth-child(3) .summary-value').textContent = expiringSoon;
    document.querySelector('.summary-card:nth-child(4) .summary-value').textContent = expired;
}