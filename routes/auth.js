// routes/auth.js
const express = require('express');
const bcrypt  = require('bcrypt');
const jwt     = require('jsonwebtoken');
const passport = require('passport');
const nodemailer = require('nodemailer');
const db = require('../database');

const router = express.Router();
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// --- Register ---
router.post('/register', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: 'Email & password required' });

  db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    if (user) return res.status(400).json({ error: 'Email already in use' });

    const hash = await bcrypt.hash(password, 10);
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    db.run(
      'INSERT INTO users (email, password_hash, verification_code) VALUES (?, ?, ?)',
      [email, hash, code],
      function (err) {
        if (err) return res.status(500).json({ error: err.message });

        transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: email,
          subject: 'Verify your account',
          text: `Your code is ${code}`
        }, (mailErr) => {
          if (mailErr) return res.status(500).json({ error: 'Email failed' });
          res.json({ message: 'Verification email sent' });
        });
      }
    );
  });
});

// --- Verify ---
router.post('/verify', (req, res) => {
  const { email, code } = req.body;
  db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.is_verified) return res.status(400).json({ error: 'Already verified' });
    if (user.verification_code !== code)
      return res.status(400).json({ error: 'Invalid code' });

    db.run(
      'UPDATE users SET is_verified = 1, verification_code = NULL WHERE email = ?',
      [email],
      (updErr) => {
        if (updErr) return res.status(500).json({ error: updErr.message });
        res.json({ message: 'Account verified' });
      }
    );
  });
});

// --- Login ---
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (!user.is_verified) return res.status(400).json({ error: 'Email not verified' });

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(400).json({ error: 'Invalid password' });

    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ message: 'Logged in', token });
  });
});

// --- OAuth Callbacks ---
// Note: callbackURL in your strategy config must be a path (e.g. '/api/auth/google/callback'), not a full URL.
router.get('/google', passport.authenticate('google', { scope: ['profile','email']}));
router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/login.html' }),
  (req, res) => res.redirect('/dashboard.html')
);

router.get('/github', passport.authenticate('github', { scope: ['user:email'] }));
router.get('/github/callback',
  passport.authenticate('github', { failureRedirect: '/login.html' }),
  (req, res) => res.redirect('/dashboard.html')
);

// --- Logout ---
router.get('/logout', (req, res) => {
  req.logout(() => res.redirect('/login.html'));
});

module.exports = router;