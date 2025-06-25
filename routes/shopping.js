// routes/shopping.js

const express = require('express');
const db = require('../database');
const router = express.Router();

// GET /api/shopping-list
// Returns all shopping-list items for the authenticated user
router.get('/', (req, res) => {
  const uid = req.user.id;
  db.all(
    'SELECT * FROM shopping_list WHERE user_id = ? ORDER BY created_at DESC',
    [uid],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'success', data: rows });
    }
  );
});

// POST /api/shopping-list
// Adds a new shopping-list item for the authenticated user
router.post('/', (req, res) => {
  const uid = req.user.id;
  const { name, quantity, notes, status } = req.body;

  if (!name || !quantity) {
    return res.status(400).json({ error: 'Missing required fields: name and quantity' });
  }

  const sql = `
    INSERT INTO shopping_list
      (user_id, name, quantity, notes, status)
    VALUES
      (?, ?, ?, ?, ?)
  `;
  const params = [
    uid,
    name,
    quantity,
    notes || '',
    status || 'to_buy'
  ];

  db.run(sql, params, function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'success', id: this.lastID });
  });
});

// PUT /api/shopping-list/:id
// Updates an existing shopping-list item (only if it belongs to the user)
router.put('/:id', (req, res) => {
  const uid = req.user.id;
  const { id } = req.params;
  const { name, quantity, notes, status } = req.body;

  if (!name || !quantity) {
    return res.status(400).json({ error: 'Missing required fields: name and quantity' });
  }

  const sql = `
    UPDATE shopping_list
       SET name      = ?,
           quantity  = ?,
           notes     = ?,
           status    = ?,
           updated_at = CURRENT_TIMESTAMP
     WHERE id = ? AND user_id = ?
  `;
  const params = [
    name,
    quantity,
    notes || '',
    status || 'to_buy',
    id,
    uid
  ];

  db.run(sql, params, function(err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Item not found or not owned by you' });
    }
    res.json({ message: 'success', changes: this.changes });
  });
});

// DELETE /api/shopping-list/:id
// Deletes a shopping-list item (only if it belongs to the user)
router.delete('/:id', (req, res) => {
  const uid = req.user.id;
  const { id } = req.params;

  const sql = 'DELETE FROM shopping_list WHERE id = ? AND user_id = ?';
  db.run(sql, [id, uid], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Item not found or not owned by you' });
    }
    res.json({ message: 'success', changes: this.changes });
  });
});

module.exports = router;