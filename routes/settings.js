const express = require('express');
const db = require('../database');
const router = express.Router();
const requireAuth = require('../middleware/requireAuth');

// Ensure user_settings table exists
// user_id INTEGER PRIMARY KEY, settings TEXT (JSON)
db.run(`CREATE TABLE IF NOT EXISTS user_settings (
  user_id INTEGER PRIMARY KEY,
  settings TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id)
)`);

// GET /api/settings
router.get('/', requireAuth, (req, res) => {
  const uid = req.user.id;
  db.get('SELECT settings FROM user_settings WHERE user_id = ?', [uid], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.json({ message: 'success', data: {} });
    try {
      const settings = JSON.parse(row.settings || '{}');
      res.json({ message: 'success', data: settings });
    } catch (e) {
      res.json({ message: 'success', data: {} });
    }
  });
});

// PUT /api/settings
router.put('/', requireAuth, (req, res) => {
  const uid = req.user.id;
  const settings = req.body;
  const settingsStr = JSON.stringify(settings);
  db.run(
    `INSERT INTO user_settings (user_id, settings) VALUES (?, ?)
     ON CONFLICT(user_id) DO UPDATE SET settings=excluded.settings`,
    [uid, settingsStr],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'success' });
    }
  );
});

module.exports = router; 