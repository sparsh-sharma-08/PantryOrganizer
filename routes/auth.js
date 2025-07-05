// routes/auth.js
const express = require('express');
const bcrypt  = require('bcrypt');
const jwt     = require('jsonwebtoken');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const nodemailer = require('nodemailer');
const db = require('../database');
const requireAuth = require('../middleware/requireAuth');
const { body, validationResult } = require('express-validator');

// Import security middleware
const {
  validateRegistration,
  validateLogin,
  handleValidationErrors,
  logSecurityEvent,
  logUserActivity
} = require('../middleware/security');

// Import error handling
const {
  asyncHandler,
  handleDatabaseError,
  handleValidationError,
  handleAuthError
} = require('../middleware/errorHandler');

const router = express.Router();

// Configure Google OAuth Strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/api/auth/google/callback"
  },
  async function(accessToken, refreshToken, profile, cb) {
    try {
      const email = profile.emails[0].value;
      const name = profile.displayName;
      const googleId = profile.id;

      // Check if user exists
      db.get('SELECT * FROM users WHERE email = ? OR google_id = ?', [email, googleId], (err, user) => {
        if (err) return cb(err);
        
        if (user) {
          // User exists, update google_id if not set
          if (!user.google_id) {
            db.run('UPDATE users SET google_id = ? WHERE id = ?', [googleId, user.id], (updateErr) => {
              if (updateErr) return cb(updateErr);
              return cb(null, user);
            });
          } else {
            return cb(null, user);
          }
        }
        
        // Create new user
        const newUser = {
          name,
          email,
          google_id: googleId,
          is_verified: 1 // Google users are pre-verified
        };
        
        db.run(
          'INSERT INTO users (name, email, google_id, is_verified) VALUES (?, ?, ?, ?)',
          [newUser.name, newUser.email, newUser.google_id, newUser.is_verified],
          function(err) {
            if (err) return cb(err);
            newUser.id = this.lastID;
            logUserActivity('user_registered_oauth', newUser.id, { provider: 'google' });
            cb(null, newUser);
          }
        );
      });
    } catch (error) {
      return cb(error);
    }
  }
));

// Configure GitHub OAuth Strategy
passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: "/api/auth/github/callback"
  },
  async function(accessToken, refreshToken, profile, cb) {
    try {
      const email = profile.emails[0]?.value;
      const name = profile.displayName || profile.username;
      const githubId = profile.id;

      if (!email) {
        return cb(new Error('Email not provided by GitHub'));
      }

      // Check if user exists
      db.get('SELECT * FROM users WHERE email = ? OR github_id = ?', [email, githubId], (err, user) => {
        if (err) return cb(err);
        
        if (user) {
          // User exists, update github_id if not set
          if (!user.github_id) {
            db.run('UPDATE users SET github_id = ? WHERE id = ?', [githubId, user.id], (updateErr) => {
              if (updateErr) return cb(updateErr);
              return cb(null, user);
            });
          } else {
            return cb(null, user);
          }
        }
        
        // Create new user
        const newUser = {
          name,
          email,
          github_id: githubId,
          is_verified: 1 // GitHub users are pre-verified
        };
        
        db.run(
          'INSERT INTO users (name, email, github_id, is_verified) VALUES (?, ?, ?, ?)',
          [newUser.name, newUser.email, newUser.github_id, newUser.is_verified],
          function(err) {
            if (err) return cb(err);
            newUser.id = this.lastID;
            logUserActivity('user_registered_oauth', newUser.id, { provider: 'github' });
            cb(null, newUser);
          }
        );
      });
    } catch (error) {
      return cb(error);
    }
  }
));

// Serialize user for the session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from the session
passport.deserializeUser((id, done) => {
  db.get('SELECT * FROM users WHERE id = ?', [id], (err, user) => {
    if (err) return done(err);
    if (!user) {
      // User doesn't exist (e.g., was deleted), clear the session
      return done(null, false);
    }
    done(null, user);
  });
});

const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// In-memory store for OTPs (for production, use Redis or DB)
const otpStore = {};
const deleteOtpStore = {}; // Separate store for deletion OTPs

// --- Register ---
router.post('/register', validateRegistration, handleValidationErrors, asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  
  try {
    const user = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
        if (err) reject(err);
        else resolve(user);
      });
    });

    if (user) {
      throw handleValidationError([{ field: 'email', message: 'Email already in use' }]);
    }

    const hash = await bcrypt.hash(password, 12); // Increased salt rounds for security
    
    const result = await new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO users (name, email, password_hash, is_verified) VALUES (?, ?, ?, 1)',
        [name, email, hash],
        function (err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });

    // Generate JWT token immediately after registration
    const token = jwt.sign(
      { id: result, email: email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    logUserActivity('user_registered', result, { method: 'email' });
    
    res.status(201).json({
      message: 'Account created successfully',
      token,
      user: {
        id: result,
        name,
        email
      }
    });
  } catch (error) {
    throw handleDatabaseError(error);
  }
}));

// --- Login ---
router.post('/login', validateLogin, handleValidationErrors, asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
        if (err) reject(err);
        else resolve(user);
      });
    });

    if (!user) {
      logSecurityEvent('failed_login_attempt', req, { email, reason: 'user_not_found' });
      throw handleAuthError('Invalid email or password');
    }

    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      logSecurityEvent('failed_login_attempt', req, { email, reason: 'invalid_password' });
      throw handleAuthError('Invalid email or password');
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    logUserActivity('user_login', user.id, { method: 'email' });

    res.json({
      message: 'Logged in successfully',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    throw handleDatabaseError(error);
  }
}));

// --- OAuth Callbacks ---
// Note: callbackURL in your strategy config must be a path (e.g. '/api/auth/google/callback'), not a full URL.
router.get('/google', passport.authenticate('google', { scope: ['profile','email']}));
router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/login.html' }),
  (req, res) => {
    const token = jwt.sign(
      { id: req.user.id, email: req.user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    logUserActivity('user_login', req.user.id, { method: 'google' });
    res.redirect(`/dashboard.html?token=${token}`);
  }
);

router.get('/github', passport.authenticate('github', { scope: ['user:email'] }));
router.get('/github/callback',
  passport.authenticate('github', { failureRedirect: '/login.html' }),
  (req, res) => {
    const token = jwt.sign(
      { id: req.user.id, email: req.user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    logUserActivity('user_login', req.user.id, { method: 'github' });
    res.redirect(`/dashboard.html?token=${token}`);
  }
);

// --- Logout ---
router.get('/logout', (req, res) => {
  if (req.user) {
    logUserActivity('user_logout', req.user.id);
  }
  req.logout(() => res.redirect('/login.html'));
});

// --- Get Profile ---
router.get('/profile', requireAuth, asyncHandler(async (req, res) => {
  try {
    const user = await new Promise((resolve, reject) => {
      db.get(
        'SELECT id, name, email, profile_photo, created_at FROM users WHERE id = ?',
        [req.user.id],
        (err, user) => {
          if (err) reject(err);
          else resolve(user);
        }
      );
    });

    if (!user) {
      throw handleAuthError('User not found');
    }

    res.json(user);
  } catch (error) {
    throw handleDatabaseError(error);
  }
}));

// --- Update Profile ---
router.put('/profile', requireAuth, asyncHandler(async (req, res) => {
  const { name, profile_photo } = req.body;

  if (!name || name.trim().length < 2) {
    throw handleValidationError([{ field: 'name', message: 'Name must be at least 2 characters' }]);
  }

  try {
    await new Promise((resolve, reject) => {
      db.run(
        'UPDATE users SET name = ?, profile_photo = ? WHERE id = ?',
        [name.trim(), profile_photo || null, req.user.id],
        function (err) {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    logUserActivity('profile_updated', req.user.id);

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: req.user.id,
        name: name.trim(),
        profile_photo
      }
    });
  } catch (error) {
    throw handleDatabaseError(error);
  }
}));

// --- Change Password ---
router.put('/change-password', requireAuth, asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    throw handleValidationError([{ field: 'password', message: 'Both current and new password are required' }]);
  }

  if (newPassword.length < 8) {
    throw handleValidationError([{ field: 'newPassword', message: 'New password must be at least 8 characters' }]);
  }

  try {
    const user = await new Promise((resolve, reject) => {
      db.get('SELECT password_hash FROM users WHERE id = ?', [req.user.id], (err, user) => {
        if (err) reject(err);
        else resolve(user);
      });
    });

    if (!user) {
      throw handleAuthError('User not found');
    }

    const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isValidPassword) {
      throw handleAuthError('Current password is incorrect');
    }

    const newHash = await bcrypt.hash(newPassword, 12);

    await new Promise((resolve, reject) => {
      db.run('UPDATE users SET password_hash = ? WHERE id = ?', [newHash, req.user.id], function (err) {
        if (err) reject(err);
        else resolve();
      });
    });

    logUserActivity('password_changed', req.user.id);
    logSecurityEvent('password_changed', req, { userId: req.user.id });

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    throw handleDatabaseError(error);
  }
}));

// --- Forgot Password ---
router.post('/forgot-password', asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw handleValidationError([{ field: 'email', message: 'Email is required' }]);
  }

  try {
    const user = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
        if (err) reject(err);
        else resolve(user);
      });
    });

    if (!user) {
      // Don't reveal if user exists or not
      res.json({ message: 'If an account with that email exists, a password reset link has been sent.' });
      return;
    }

    const resetToken = require('crypto').randomBytes(32).toString('hex');
    const resetExpiry = new Date(Date.now() + 3600000); // 1 hour

    await new Promise((resolve, reject) => {
      db.run(
        'UPDATE users SET reset_token = ?, reset_expiry = ? WHERE id = ?',
        [resetToken, resetExpiry.toISOString(), user.id],
        function (err) {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    // Send reset email
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password.html?token=${resetToken}`;
    
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Password Reset Request - Pantry Organizer',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2>Password Reset Request</h2>
          <p>Hello ${user.name},</p>
          <p>You requested a password reset for your Pantry Organizer account.</p>
          <p>Click the button below to reset your password:</p>
          <a href="${resetUrl}" style="background: #3498db; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0;">
            Reset Password
          </a>
          <p>This link will expire in 1 hour.</p>
          <p>If you didn't request this reset, please ignore this email.</p>
        </div>
      `
    });

    logSecurityEvent('password_reset_requested', req, { email });

    res.json({ message: 'If an account with that email exists, a password reset link has been sent.' });
  } catch (error) {
    throw handleDatabaseError(error);
  }
}));

// --- Reset Password ---
router.post('/reset-password', asyncHandler(async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    throw handleValidationError([{ field: 'token', message: 'Token and new password are required' }]);
  }

  if (newPassword.length < 8) {
    throw handleValidationError([{ field: 'newPassword', message: 'Password must be at least 8 characters' }]);
  }

  try {
    const user = await new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM users WHERE reset_token = ? AND reset_expiry > ?',
        [token, new Date().toISOString()],
        (err, user) => {
          if (err) reject(err);
          else resolve(user);
        }
      );
    });

    if (!user) {
      throw handleAuthError('Invalid or expired reset token');
    }

    const newHash = await bcrypt.hash(newPassword, 12);

    await new Promise((resolve, reject) => {
      db.run(
        'UPDATE users SET password_hash = ?, reset_token = NULL, reset_expiry = NULL WHERE id = ?',
        [newHash, user.id],
        function (err) {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    logSecurityEvent('password_reset_completed', req, { userId: user.id });

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    throw handleDatabaseError(error);
  }
}));

// --- Delete Account ---
router.delete('/delete-account', requireAuth, asyncHandler(async (req, res) => {
  const { password } = req.body;

  if (!password) {
    throw handleValidationError([{ field: 'password', message: 'Password is required to delete account' }]);
  }

  try {
    const user = await new Promise((resolve, reject) => {
      db.get('SELECT password_hash FROM users WHERE id = ?', [req.user.id], (err, user) => {
        if (err) reject(err);
        else resolve(user);
      });
    });

    if (!user) {
      throw handleAuthError('User not found');
    }

    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      throw handleAuthError('Password is incorrect');
    }

    // Delete all user data
    await new Promise((resolve, reject) => {
      db.serialize(() => {
        db.run('DELETE FROM pantry_items WHERE user_id = ?', [req.user.id], function(err) {
          if (err) reject(err);
          db.run('DELETE FROM shopping_list WHERE user_id = ?', [req.user.id], function(err2) {
            if (err2) reject(err2);
            db.run('DELETE FROM categories WHERE user_id = ?', [req.user.id], function(err3) {
              if (err3) reject(err3);
              db.run('DELETE FROM users WHERE id = ?', [req.user.id], function(err4) {
                if (err4) reject(err4);
                resolve();
              });
            });
          });
        });
      });
    });

    logSecurityEvent('account_deleted', req, { userId: req.user.id });

    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    throw handleDatabaseError(error);
  }
}));

module.exports = router;
module.exports.transporter = transporter;