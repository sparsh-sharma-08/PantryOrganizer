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
  handleValidationErrors
} = require('../middleware/security');

const { logUserActivity } = require('../utils/logger');

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
      let email = null;
      if (profile.emails && profile.emails.length > 0) {
        email = profile.emails[0].value;
      }
      if (!email) {
        return cb(new Error('No email found in your Google profile. Please ensure your Google account has a public email or use another login method.'));
      }
      const name = profile.displayName || (profile.name && (profile.name.givenName + ' ' + profile.name.familyName)) || 'Google User';
      const googleId = profile.id;
      // Get profile picture URL (Google)
      let profilePhoto = null;
      if (profile.photos && profile.photos.length > 0) {
        profilePhoto = profile.photos[0].value;
      }
      // Check if user exists
      db.get('SELECT * FROM users WHERE email = ? OR google_id = ?', [email, googleId], (err, user) => {
        if (err) return cb(err);
        
        if (user) {
          // User exists, update google_id and profile_photo if needed
          const updates = [];
          const params = [];
          if (!user.google_id) {
            updates.push('google_id = ?');
            params.push(googleId);
          }
          if (profilePhoto && user.profile_photo !== profilePhoto) {
            updates.push('profile_photo = ?');
            params.push(profilePhoto);
          }
          if (updates.length > 0) {
            params.push(user.id);
            db.run(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params, (updateErr) => {
              if (updateErr) return cb(updateErr);
              // Return updated user object
              db.get('SELECT * FROM users WHERE id = ?', [user.id], (err2, updatedUser) => {
                if (err2) return cb(err2);
                return cb(null, updatedUser);
              });
            });
          } else {
            return cb(null, user);
          }
        } else {
          // Create new user
          const newUser = {
            name,
            email,
            google_id: googleId,
            is_verified: 1, // Google users are pre-verified
            profile_photo: profilePhoto
          };
          db.run(
            'INSERT INTO users (name, email, google_id, is_verified, profile_photo) VALUES (?, ?, ?, ?, ?)',
            [newUser.name, newUser.email, newUser.google_id, newUser.is_verified, newUser.profile_photo],
            function(err) {
              if (err) return cb(err);
              newUser.id = this.lastID;
              logUserActivity('user_registered_oauth', newUser.id, { provider: 'google' });
              cb(null, newUser);
            }
          );
        }
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
      let email = null;
      if (profile.emails && profile.emails.length > 0) {
        email = profile.emails[0].value;
      }
      if (!email) {
        return cb(new Error('No public email found in your GitHub profile. Please add a public email to your GitHub account or use another login method.'));
      }
      const name = profile.displayName || profile.username || 'GitHub User';
      const githubId = profile.id;
      // Get profile picture URL (GitHub)
      let profilePhoto = null;
      if (profile.photos && profile.photos.length > 0) {
        profilePhoto = profile.photos[0].value;
      } else if (profile._json && profile._json.avatar_url) {
        profilePhoto = profile._json.avatar_url;
      }
      // Check if user exists
      db.get('SELECT * FROM users WHERE email = ? OR github_id = ?', [email, githubId], (err, user) => {
        if (err) return cb(err);
        
        if (user) {
          // User exists, update github_id and profile_photo if needed
          const updates = [];
          const params = [];
          if (!user.github_id) {
            updates.push('github_id = ?');
            params.push(githubId);
          }
          if (profilePhoto && user.profile_photo !== profilePhoto) {
            updates.push('profile_photo = ?');
            params.push(profilePhoto);
          }
          if (updates.length > 0) {
            params.push(user.id);
            db.run(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params, (updateErr) => {
              if (updateErr) return cb(updateErr);
              db.get('SELECT * FROM users WHERE id = ?', [user.id], (err2, updatedUser) => {
                if (err2) return cb(err2);
                return cb(null, updatedUser);
              });
            });
          } else {
            return cb(null, user);
          }
        } else {
          // Create new user
          const newUser = {
            name,
            email,
            github_id: githubId,
            is_verified: 1, // GitHub users are pre-verified
            profile_photo: profilePhoto
          };
          db.run(
            'INSERT INTO users (name, email, github_id, is_verified, profile_photo) VALUES (?, ?, ?, ?, ?)',
            [newUser.name, newUser.email, newUser.github_id, newUser.is_verified, newUser.profile_photo],
            function(err) {
              if (err) return cb(err);
              newUser.id = this.lastID;
              logUserActivity('user_registered_oauth', newUser.id, { provider: 'github' });
              cb(null, newUser);
            }
          );
        }
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

// Helper for safe logging
function safeLog(...args) {
  if (process.env.NODE_ENV === 'development') {
    console.log(...args);
  }
}
function safeErrorLog(...args) {
  // Always log errors, but mask sensitive info
  if (args && args.length > 0 && typeof args[0] === 'string') {
    args[0] = args[0].replace(/([\w.-]+)@([\w.-]+)/g, '***@***');
  }
  console.error(...args);
}

// --- Register ---
router.post('/register', validateRegistration, handleValidationErrors, asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  
  // Log the incoming request
  safeLog('Registration attempt:', { name, email: email ? '***' : 'undefined', hasPassword: !!password });
  
  try {
    const user = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
        if (err) {
          safeErrorLog('Database error during registration:', err);
          return reject(err);
        } else {
          safeLog('User lookup result:', user ? 'User exists' : 'User not found');
          resolve(user);
        }
      });
    });

    if (user) {
      safeLog('Registration failed: Email already in use');
      return res.status(409).json({ error: true, message: 'Email already in use. Please use a different email or log in.' });
    }

    const hash = await bcrypt.hash(password, 12); // Increased salt rounds for security
    
    const result = await new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO users (name, email, password_hash, is_verified) VALUES (?, ?, ?, 1)',
        [name, email, hash],
        function (err) {
          if (err) {
            safeErrorLog('Database insert error:', err);
            return reject(err);
          } else {
            safeLog('User created successfully with ID:', this.lastID);
            resolve(this.lastID);
          }
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
    
    const response = {
      message: 'Account created successfully',
      token,
      user: {
        id: result,
        name,
        email
      }
    };
    
    safeLog('Registration successful, sending response:', { ...response, token: '***' });
    res.status(201).json(response);
  } catch (error) {
    safeErrorLog('Registration error caught:', error);
    // Handle known database constraint errors
    if (error && error.code === 'SQLITE_CONSTRAINT') {
      return res.status(409).json({ error: true, message: 'Email already in use. Please use a different email or log in.' });
    }
    // Handle validation errors
    if (error && error.name === 'ValidationError') {
      return res.status(400).json({ error: true, message: 'Validation failed. Please check your input.' });
    }
    // Fallback for other errors
    res.status(500).json({ error: true, message: 'An unexpected error occurred during registration. Please try again.' });
  }
}));

// --- Login ---
router.post('/login', validateLogin, handleValidationErrors, asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Log the incoming request
  safeLog('Login attempt:', { email: email ? '***' : 'undefined', hasPassword: !!password });

  try {
    const user = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
        if (err) {
          safeErrorLog('Database error during login:', err);
          reject(err);
        } else {
          safeLog('User lookup result:', user ? 'User found' : 'User not found');
          resolve(user);
        }
      });
    });

    if (!user) {
      safeLog('Login failed: User not found');
      return res.status(401).json({ error: true, message: 'No account found with that email.' });
    }

    if (user.is_verified === 0) {
      safeLog('Login failed: Account not verified');
      return res.status(401).json({ error: true, message: 'Account not verified. Please check your email.' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    safeLog('Password validation result:', isValidPassword);
    
    if (!isValidPassword) {
      safeLog('Login failed: Invalid password');
      return res.status(401).json({ error: true, message: 'Incorrect password.' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    logUserActivity('user_login', user.id, { method: 'email' });

    const response = {
      message: 'Logged in successfully',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    };

    safeLog('Login successful, sending response:', { ...response, token: '***' });
    res.json(response);
  } catch (error) {
    safeErrorLog('Login error caught:', error);
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
    const userId = req.user && req.user.id;
    if (!userId) {
      safeErrorLog('Profile fetch: No user id in request.');
      return res.status(401).json({ error: true, message: 'Authentication failed: No user id.' });
    }
    const user = await new Promise((resolve, reject) => {
      db.get(
        'SELECT id, name, email, profile_photo, created_at FROM users WHERE id = ?',
        [userId],
        (err, user) => {
          if (err) {
            safeErrorLog('Profile fetch: DB error:', err);
            reject(err);
          } else {
            resolve(user);
          }
        }
      );
    });

    if (!user) {
      safeErrorLog('Profile fetch: User not found for id', userId);
      return res.status(404).json({ error: true, message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    safeErrorLog('Profile fetch: Exception:', error);
    res.status(500).json({ error: true, message: 'Internal server error', details: error.message });
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
    safeLog('Password changed successfully');

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

    safeLog('Password reset link sent for email:', email);

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

    safeLog('Password reset completed for user:', user.id);

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

    safeLog('Account deleted for user:', req.user.id);

    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    throw handleDatabaseError(error);
  }
}));

module.exports = router;
module.exports.transporter = transporter;