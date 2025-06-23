const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Create database file in the project directory
const dbPath = path.join(__dirname, 'pantry.db');
const db = new sqlite3.Database(dbPath);

// Initialize database tables
db.serialize(() => {
    // Create pantry_items table
    db.run(`CREATE TABLE IF NOT EXISTS pantry_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        quantity TEXT NOT NULL,
        expiry_date TEXT NOT NULL,
        category TEXT DEFAULT 'Other',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Insert some sample data if table is empty
    db.get("SELECT COUNT(*) as count FROM pantry_items", (err, row) => {
        if (err) {
            console.error('Error checking pantry items:', err);
            return;
        }
        
        if (row.count === 0) {
            const sampleItems = [
                ['Milk', '2 L', '2024-12-20', 'Dairy'],
                ['Bread', '1 loaf', '2024-12-14', 'Bakery'],
                ['Apples', '6 pcs', '2024-12-25', 'Fruits'],
                ['Yogurt', '500g', '2024-12-10', 'Dairy'],
                ['Chicken Breast', '1 kg', '2024-12-13', 'Meat'],
                ['Rice', '5 kg', '2025-06-15', 'Grains'],
                ['Tomatoes', '8 pcs', '2024-12-18', 'Vegetables'],
                ['Cheese', '200g', '2024-12-22', 'Dairy'],
                ['Bananas', '12 pcs', '2024-12-16', 'Fruits'],
                ['Pasta', '500g', '2025-03-15', 'Grains']
            ];
            
            const insertStmt = db.prepare("INSERT INTO pantry_items (name, quantity, expiry_date, category) VALUES (?, ?, ?, ?)");
            sampleItems.forEach(item => {
                insertStmt.run(item);
            });
            insertStmt.finalize();
            console.log('Sample pantry items inserted');
        }
    });
});

module.exports = db; 