// server.js
require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const path    = require('path');
const sqlite3 = require('sqlite3');
const nodemailer = require('nodemailer');

const authRouter     = require('./routes/auth');
const { router: itemsRouter, getCategories } = require('./routes/items');
const shoppingRouter = require('./routes/shopping');
const requireAuth    = require('./middleware/requireAuth');
const db = require('./database');
const settingsRouter = require('./routes/settings');

const app  = express();
const PORT = process.env.PORT || 3000;

// 1) Global middleware
app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// 2) Auth routes (no auth required)
app.use('/api/auth', authRouter);

// 3) Protected routes
app.use('/api/items',         requireAuth, itemsRouter);
app.get('/api/categories',    requireAuth, getCategories);
app.use('/api/shopping-list', requireAuth, shoppingRouter);
app.use('/api/settings', requireAuth, settingsRouter);

// Clear all data for the authenticated user
app.delete('/api/clear-all-data', requireAuth, (req, res) => {
  const uid = req.user.id;
  db.serialize(() => {
    db.run('DELETE FROM pantry_items WHERE user_id = ?', [uid], function(err) {
      if (err) return res.status(500).json({ error: 'Failed to clear pantry items', details: err.message });
      db.run('DELETE FROM shopping_list WHERE user_id = ?', [uid], function(err2) {
        if (err2) return res.status(500).json({ error: 'Failed to clear shopping list', details: err2.message });
        db.run('DELETE FROM categories WHERE user_id = ?', [uid], function(err3) {
          if (err3) return res.status(500).json({ error: 'Failed to clear categories', details: err3.message });
          res.json({ message: 'success' });
        });
      });
    });
  });
});

// Contact form endpoint
app.post('/api/contact', async (req, res) => {
  const { name, email, message } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ error: 'All fields are required.' });
  }
  // Basic email validation
  if (!/^.+@.+\..+$/.test(email)) {
    return res.status(400).json({ error: 'Invalid email address.' });
  }
  try {
    const transporter = require('./routes/auth').transporter || nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.SUPPORT_EMAIL || process.env.EMAIL_USER,
      subject: `Contact Form Submission from ${name}`,
      replyTo: email,
      text: `Name: ${name}\nEmail: ${email}\n\n${message}`
    });
    res.json({ message: 'success' });
  } catch (err) {
    console.error('Contact form error:', err);
    res.status(500).json({ error: 'Failed to send message. Please try again later.' });
  }
});

// 5) All other paths → serve your SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// 6) Start listening
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Listening on http://0.0.0.0:${PORT}`);
});