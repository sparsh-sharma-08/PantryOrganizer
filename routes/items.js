// routes/items.js
const express = require('express');
const db = require('../database');
const router = express.Router();

// GET /api/items
router.get('/', (req, res) => {
  const uid = req.user.id;
  const { search, category, status } = req.query;
  let sql = 'SELECT * FROM pantry_items WHERE user_id = ?';
  const params = [uid];

  if (search) {
    sql += ' AND name LIKE ?';
    params.push(`%${search}%`);
  }
  if (category) {
    sql += ' AND category = ?';
    params.push(category);
  }
  sql += ' ORDER BY created_at DESC';

  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    // ...apply status filter in JS if needed...
    res.json({ message: 'success', data: rows });
  });
});

// Static categories handler
function getCategories(req, res) {
  res.json({
    message: 'success',
    data: ['Dairy','Bakery','Fruits','Vegetables','Meat','Grains','Snacks','Beverages','Frozen','Condiments','Other']
  });
}

// POST /api/items
router.post('/', (req, res) => {
  const uid = req.user.id;
  const { name, quantity, expiry_date, category } = req.body;
  if (!name || !quantity || !expiry_date) {
    return res.status(400).json({ error: 'Missing fields' });
  }
  const sql = 'INSERT INTO pantry_items (user_id,name,quantity,expiry_date,category) VALUES (?,?,?,?,?)';
  db.run(sql, [uid, name, quantity, expiry_date, category||'Other'], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'success', id: this.lastID });
  });
});

// PUT /api/items/:id
router.put('/:id', (req, res) => {
  const uid = req.user.id;
  const { id } = req.params;
  const { name, quantity, expiry_date, category } = req.body;
  if (!name||!quantity||!expiry_date) {
    return res.status(400).json({ error: 'Missing fields' });
  }
  const sql = `
    UPDATE pantry_items
       SET name=?, quantity=?, expiry_date=?, category=?, updated_at=CURRENT_TIMESTAMP
     WHERE id=? AND user_id=?
  `;
  db.run(sql, [name,quantity,expiry_date,category||'Other',id,uid], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'success' });
  });
});

// DELETE /api/items/:id
router.delete('/:id', (req, res) => {
  const uid = req.user.id;
  const { id } = req.params;
  db.run('DELETE FROM pantry_items WHERE id=? AND user_id=?', [id,uid], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'success' });
  });
});

module.exports = { router, getCategories };