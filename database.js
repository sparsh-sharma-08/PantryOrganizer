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
      username TEXT UNIQUE,
      email TEXT UNIQUE,
      password_hash TEXT,
      is_verified INTEGER DEFAULT 0,
      verification_code TEXT,
      google_id TEXT,
      github_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

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
    CREATE INDEX idx_pantry_items_user_id ON pantry_items(user_id);
  `);
});

module.exports = db;