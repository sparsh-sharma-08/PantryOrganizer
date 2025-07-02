// routes/auth.js
const express = require('express');
const bcrypt  = require('bcrypt');
const jwt     = require('jsonwebtoken');
const passport = require('passport');
const nodemailer = require('nodemailer');
const db = require('../database');
const requireAuth = require('../middleware/requireAuth');

const router = express.Router();
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// In-memory store for OTPs (for production, use Redis or DB)
const otpStore = {};

// --- Register ---
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ error: 'Name, email & password required' });

  db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    if (user) return res.status(400).json({ error: 'Email already in use' });

    const hash = await bcrypt.hash(password, 10);
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    db.run(
      'INSERT INTO users (name, email, password_hash, verification_code) VALUES (?, ?, ?, ?)',
      [name, email, hash, code],
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

// --- Get Profile ---
router.get('/profile', requireAuth, (req, res) => {
  db.get('SELECT id, name, email, profile_photo, created_at FROM users WHERE id = ?', [req.user.id], (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  });
});

// --- Update Profile ---
router.put('/profile', requireAuth, (req, res) => {
  const { name, email, profile_photo } = req.body;
  if (!name) return res.status(400).json({ error: 'Name required' });

  // If email is provided, check if it's already taken by another user
  if (email) {
    db.get('SELECT id FROM users WHERE email = ? AND id != ?', [email, req.user.id], (err, existingUser) => {
      if (err) return res.status(500).json({ error: err.message });
      if (existingUser) return res.status(400).json({ error: 'Email already in use' });

      // Build update query based on what's provided
      let updateQuery = 'UPDATE users SET name = ?';
      let params = [name];
      if (email) {
        updateQuery += ', email = ?';
        params.push(email);
      }
      if (profile_photo !== undefined) {
        updateQuery += ', profile_photo = ?';
        params.push(profile_photo);
      }
      updateQuery += ' WHERE id = ?';
      params.push(req.user.id);

      db.run(updateQuery, params, function(err) {
        if (err) {
          console.error('Profile update error:', err);
          return res.status(500).json({ error: err.message });
        }
        res.json({ message: 'Profile updated successfully' });
      });
    });
  } else {
    // No email update, just update name and/or profile_photo
    let updateQuery = 'UPDATE users SET name = ?';
    let params = [name];
    if (profile_photo !== undefined) {
      updateQuery += ', profile_photo = ?';
      params.push(profile_photo);
    }
    updateQuery += ' WHERE id = ?';
    params.push(req.user.id);

    db.run(updateQuery, params, function(err) {
      if (err) {
        console.error('Profile update error:', err);
        return res.status(500).json({ error: err.message });
      }
      res.json({ message: 'Profile updated successfully' });
    });
  }
});

// Send OTP to email
router.post('/request-reset', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });

  db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
    console.log('Reset request for:', email, 'User found:', !!user, 'Error:', err);
    if (err) return res.status(500).json({ error: 'Database error' });
    if (!user) return res.status(404).json({ error: 'This email is not associated with any account.' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore[email] = { otp, expires: Date.now() + 10 * 60 * 1000 }; // 10 min expiry

    // Send email
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Your OTP for Password Reset',
      text: `Your OTP is: ${otp}`
    });

    res.json({ message: 'OTP sent' });
  });
});

// Reset password with OTP
router.post('/reset-password', async (req, res) => {
  const { email, otp, newPassword } = req.body;
  if (!email || !otp || !newPassword) return res.status(400).json({ error: 'All fields required' });

  const record = otpStore[email];
  if (!record || record.otp !== otp || Date.now() > record.expires) {
    return res.status(400).json({ error: 'Invalid or expired OTP' });
  }

  // Hash new password
  const hash = await bcrypt.hash(newPassword, 10);
  db.run('UPDATE users SET password_hash = ? WHERE email = ?', [hash, email], function(err) {
    if (err) {
      console.error('DB error on password reset:', err);
      return res.status(500).json({ error: 'Failed to update password', details: err.message });
    }
    if (this.changes === 0) {
      // No rows updated, likely email not found
      return res.status(404).json({ error: 'No user found with this email.' });
    }
    delete otpStore[email];
    res.json({ message: 'Password reset successful' });
  });
});

// --- Change Password ---
router.post('/change-password', requireAuth, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Current and new password required' });
  }
  // Password strength check
  const passwordStrengthRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;
  if (!passwordStrengthRegex.test(newPassword)) {
    return res.status(400).json({ error: 'Password must be at least 8 characters long and include uppercase, lowercase, number, and special character.' });
  }
  db.get('SELECT password_hash, email FROM users WHERE id = ?', [req.user.id], async (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!user) return res.status(404).json({ error: 'User not found' });
    const ok = await bcrypt.compare(currentPassword, user.password_hash);
    if (!ok) return res.status(400).json({ error: 'Current password is incorrect' });
    const hash = await bcrypt.hash(newPassword, 10);
    db.run('UPDATE users SET password_hash = ? WHERE id = ?', [hash, req.user.id], async function(err) {
      if (err) return res.status(500).json({ error: err.message });
      // Send email notification
      try {
        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: user.email,
          subject: 'Your Smart Pantry password was changed',
          text: 'Hello,\n\nYour password was recently changed. If you did not perform this action, please reset your password immediately or contact support.\n\n- Smart Pantry Team'
        });
      } catch (mailErr) {
        // Log but don't fail the request if email fails
        console.error('Failed to send password change email:', mailErr);
      }
      res.json({ message: 'success' });
    });
  });
});

// --- Delete Account ---
router.delete('/delete-account', requireAuth, async (req, res) => {
  const { password } = req.body;
  if (!password) return res.status(400).json({ error: 'Password required' });
  db.get('SELECT password_hash FROM users WHERE id = ?', [req.user.id], async (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!user) return res.status(404).json({ error: 'User not found' });
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(400).json({ error: 'Incorrect password' });
    // Delete user data from all related tables
    db.serialize(() => {
      db.run('DELETE FROM pantry_items WHERE user_id = ?', [req.user.id]);
      db.run('DELETE FROM shopping_list WHERE user_id = ?', [req.user.id]);
      db.run('DELETE FROM user_settings WHERE user_id = ?', [req.user.id]);
      db.run('DELETE FROM users WHERE id = ?', [req.user.id], function(err2) {
        if (err2) return res.status(500).json({ error: err2.message });
        res.json({ message: 'success' });
      });
    });
  });
});

module.exports = router;
module.exports.transporter = transporter;