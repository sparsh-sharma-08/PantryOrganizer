const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');

console.log('Checking database file...');

if (!fs.existsSync('./pantry.db')) {
    console.log('Database file does not exist. It will be created when the server starts.');
    console.log('The new database will include the name column automatically.');
    process.exit(0);
}

const db = new sqlite3.Database('./pantry.db');

console.log('Database file exists. Checking schema...');

// Check if users table exists
db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='users'", (err, row) => {
    if (err) {
        console.error('Error checking if users table exists:', err);
        db.close();
        return;
    }
    
    if (!row) {
        console.log('Users table does not exist. It will be created when the server starts.');
        db.close();
        return;
    }
    
    console.log('Users table exists. Checking columns...');
    
    // Check if name column exists
    db.all("PRAGMA table_info(users)", (err, columns) => {
        if (err) {
            console.error('Error getting table info:', err);
            db.close();
            return;
        }
        
        console.log('Current columns in users table:');
        columns.forEach(col => {
            console.log(`  - ${col.name} (${col.type})`);
        });
        
        const hasNameColumn = columns.some(col => col.name === 'name');
        
        if (!hasNameColumn) {
            console.log('Adding name column to users table...');
            db.run("ALTER TABLE users ADD COLUMN name TEXT", (err) => {
                if (err) {
                    console.error('Error adding name column:', err);
                } else {
                    console.log('Successfully added name column to users table');
                }
                db.close();
            });
        } else {
            console.log('Name column already exists in users table');
            db.close();
        }
    });
}); 