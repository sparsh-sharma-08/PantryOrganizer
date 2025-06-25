// server.js
require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const path    = require('path');

const authRouter     = require('./routes/auth');
const { router: itemsRouter, getCategories } = require('./routes/items');
const shoppingRouter = require('./routes/shopping');
const requireAuth    = require('./middleware/requireAuth');

const app  = express();
const PORT = process.env.PORT || 3000;

// 1) Global middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// 2) Auth routes (no auth required)
app.use('/api/auth', authRouter);

// 3) Protected routes
app.use('/api/items',         requireAuth, itemsRouter);
app.get('/api/categories',    requireAuth, getCategories);
app.use('/api/shopping-list', requireAuth, shoppingRouter);

// 5) All other paths → serve your SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// 6) Start listening
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Listening on http://0.0.0.0:${PORT}`);
});
