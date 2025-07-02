// database.js
// Initializes SQLite DB and defines tables for per-user data isolation
const sqlite3 = require('sqlite3').verbose();

// Open or create pantry.db in project root
db = new sqlite3.Database('./pantry.db');

// Create tables if they don't exist
db.serialize(() => {
  // Users table: one record per registered user
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      username TEXT UNIQUE,
      email TEXT UNIQUE,
      password_hash TEXT,
      profile_photo TEXT,
      is_verified INTEGER DEFAULT 0,
      verification_code TEXT,
      google_id TEXT,
      github_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Add name column if it doesn't exist (for existing databases)
  db.run(`ALTER TABLE users ADD COLUMN name TEXT`, (err) => {
    if (err && !err.message.includes('duplicate column name')) {
      console.error('Error adding name column:', err.message);
    }
  });

  // Add profile_photo column if it doesn't exist (for existing databases)
  db.run(`ALTER TABLE users ADD COLUMN profile_photo TEXT`, (err) => {
    if (err && !err.message.includes('duplicate column name')) {
      console.error('Error adding profile_photo column:', err.message);
    }
  });

  // Pantry items: scoped by user_id
  db.run(`
    CREATE TABLE IF NOT EXISTS pantry_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      expiry_date TEXT NOT NULL,
      category TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Shopping list items: scoped by user_id
  db.run(`
    CREATE TABLE IF NOT EXISTS shopping_list (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      notes TEXT,
      status TEXT DEFAULT 'to_buy',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Add expiry_date column if it doesn't exist (for existing databases)
  db.run(`ALTER TABLE shopping_list ADD COLUMN expiry_date TEXT`, (err) => {
    if (err && !err.message.includes('duplicate column name')) {
      console.error('Error adding expiry_date column:', err.message);
    }
  });

  // Add category column if it doesn't exist (for existing databases)
  db.run(`ALTER TABLE shopping_list ADD COLUMN category TEXT`, (err) => {
    if (err && !err.message.includes('duplicate column name')) {
      console.error('Error adding category column:', err.message);
    }
  });

  // (Optional) Categories per user, if you want dynamic categories
  db.run(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Add index for performance
  db.run(`
    CREATE INDEX IF NOT EXISTS idx_pantry_items_user_id ON pantry_items(user_id);
  `);
});

module.exports = db;