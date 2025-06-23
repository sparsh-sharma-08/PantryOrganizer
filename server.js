const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./database'); // Our database setup

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json()); // To parse JSON bodies
app.use(express.static(path.join(__dirname, 'public'))); // Serve static files

// API Routes
app.get('/api/health', (req, res) => {
    res.json({ status: 'Server is running', database: 'connected' });
});

// Get all pantry items with optional search and filters
app.get('/api/items', (req, res) => {
    const { search, category, status } = req.query;
    
    let sql = "SELECT * FROM pantry_items WHERE 1=1";
    const params = [];
    
    // Add search filter
    if (search && search.trim()) {
        sql += " AND name LIKE ?";
        params.push(`%${search.trim()}%`);
    }
    
    // Add category filter
    if (category && category !== 'All Categories') {
        sql += " AND category = ?";
        params.push(category);
    }
    
    sql += " ORDER BY created_at DESC";
    
    db.all(sql, params, (err, rows) => {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        
        // Filter by status if specified
        let filteredRows = rows;
        if (status && status !== 'All Status') {
            const today = new Date();
            filteredRows = rows.filter(item => {
                const expDate = new Date(item.expiry_date);
                const diffTime = expDate - today;
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                
                switch (status) {
                    case 'Fresh':
                        return diffDays > 2;
                    case 'Expiring':
                        return diffDays >= 0 && diffDays <= 2;
                    case 'Expired':
                        return diffDays < 0;
                    default:
                        return true;
                }
            });
        }
        
        res.json({
            "message": "success",
            "data": filteredRows
        });
    });
});

// Get unique categories
app.get('/api/categories', (req, res) => {
    const sql = "SELECT DISTINCT category FROM pantry_items ORDER BY category";
    db.all(sql, [], (err, rows) => {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        const categories = rows.map(row => row.category);
        res.json({
            "message": "success",
            "data": categories
        });
    });
});

// Add new pantry item
app.post('/api/items', (req, res) => {
    const { name, quantity, expiry_date, category } = req.body;
    
    if (!name || !quantity || !expiry_date) {
        res.status(400).json({ "error": "Missing required fields" });
        return;
    }
    
    const sql = "INSERT INTO pantry_items (name, quantity, expiry_date, category) VALUES (?, ?, ?, ?)";
    const params = [name, quantity, expiry_date, category || 'Other'];
    
    db.run(sql, params, function(err) {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        res.json({
            "message": "success",
            "id": this.lastID
        });
    });
});

// Update pantry item
app.put('/api/items/:id', (req, res) => {
    const { name, quantity, expiry_date, category } = req.body;
    const { id } = req.params;
    
    if (!name || !quantity || !expiry_date) {
        res.status(400).json({ "error": "Missing required fields" });
        return;
    }
    
    const sql = "UPDATE pantry_items SET name = ?, quantity = ?, expiry_date = ?, category = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?";
    const params = [name, quantity, expiry_date, category || 'Other', id];
    
    db.run(sql, params, function(err) {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        if (this.changes === 0) {
            res.status(404).json({ "error": "Item not found" });
            return;
        }
        res.json({
            "message": "success",
            "changes": this.changes
        });
    });
});

// Delete pantry item
app.delete('/api/items/:id', (req, res) => {
    const { id } = req.params;
    
    const sql = "DELETE FROM pantry_items WHERE id = ?";
    db.run(sql, [id], function(err) {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        if (this.changes === 0) {
            res.status(404).json({ "error": "Item not found" });
            return;
        }
        res.json({
            "message": "success",
            "changes": this.changes
        });
    });
});

// Serve the main dashboard page for the root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
}); 