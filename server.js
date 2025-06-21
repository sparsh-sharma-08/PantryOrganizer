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

// A placeholder for future pantry items API
app.get('/api/items', (req, res) => {
    const sql = "SELECT * FROM pantry_items";
    db.all(sql, [], (err, rows) => {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        res.json({
            "message": "success",
            "data": rows
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