// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const compression = require('compression');
const morgan = require('morgan');

// Import security middleware
const {
  securityHeaders,
  generalLimiter,
  authLimiter,
  strictLimiter,
  sanitizeInput,
  generateCSRFToken
} = require('./middleware/security');

// Import error handling
const {
  errorHandler,
  notFoundHandler,
  asyncHandler
} = require('./middleware/errorHandler');

// Import logging
const { logger, logAPIAccess } = require('./utils/logger');

// Import routes
const authRouter = require('./routes/auth');
const { router: itemsRouter, getCategories } = require('./routes/items');
const shoppingRouter = require('./routes/shopping');
const requireAuth = require('./middleware/requireAuth');
const db = require('./database');
const settingsRouter = require('./routes/settings');

// Import session store
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);

const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy for proper IP detection
app.set('trust proxy', 1);

// 1) Security middleware
app.use(securityHeaders);
app.use(sanitizeInput);

// 2) Compression middleware
app.use(compression());

// 3) Request logging
app.use(morgan('combined', { stream: logger.stream }));

// 4) CORS setup with allowed origins
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:3000',
  'https://pantryorganizer.onrender.com', // Render production frontend
  'https://yourdomain.com',
  'https://www.yourdomain.com'
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) === -1) {
      logger.warn(`CORS blocked request from: ${origin}`);
      return callback(new Error('CORS policy violation'), false);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token']
}));

// 5) Body parsing middleware
app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 6) Session middleware with enhanced security and SQLite store
app.use(session({
  store: new SQLiteStore({
    db: 'sessions.db',
    dir: './',
    table: 'sessions'
  }),
  secret: process.env.SESSION_SECRET || 'your-session-secret-change-this',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'strict'
  },
  name: 'pantry-session' // Change default session name
}));

// 7) Initialize Passport
const passport = require('passport');
app.use(passport.initialize());
app.use(passport.session());

// 8) CSRF token generation for all routes
app.use(generateCSRFToken);

// 9) Handle cases where user doesn't exist in session
app.use((req, res, next) => {
  if (req.user === false) {
    req.logout((err) => {
      if (err) {
        logger.error('Error clearing session:', err);
      }
    });
  }
  next();
});

// 10) Static files with security headers
app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: '1d',
  etag: true,
  lastModified: true
}));

// 11) Rate limiting for different routes
app.use('/api/auth', authLimiter);
app.use('/api/', generalLimiter);
app.use('/api/settings', strictLimiter);

// 12) Response time logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logAPIAccess(req, res, duration);
  });
  next();
});

// 13) API Routes
app.use('/api/auth', authRouter);
app.use('/api/items', requireAuth, itemsRouter);
app.get('/api/categories', requireAuth, getCategories);
app.use('/api/shopping-list', requireAuth, shoppingRouter);
app.use('/api/settings', requireAuth, settingsRouter);

// 14) Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0'
  });
});

// 15) Clear all data for the authenticated user
app.delete('/api/clear-all-data', requireAuth, asyncHandler(async (req, res) => {
  const uid = req.user.id;
  
  try {
    await new Promise((resolve, reject) => {
      db.serialize(() => {
        db.run('DELETE FROM pantry_items WHERE user_id = ?', [uid], function(err) {
          if (err) reject(err);
          db.run('DELETE FROM shopping_list WHERE user_id = ?', [uid], function(err2) {
            if (err2) reject(err2);
            db.run('DELETE FROM categories WHERE user_id = ?', [uid], function(err3) {
              if (err3) reject(err3);
              resolve();
            });
          });
        });
      });
    });
    
    res.json({ message: 'All data cleared successfully' });
  } catch (error) {
    throw error;
  }
}));

// 16) Contact form endpoint with enhanced validation
app.post('/api/contact', strictLimiter, asyncHandler(async (req, res) => {
  const { name, email, message, subject } = req.body;
  
  // Enhanced validation
  if (!name || !email || !message) {
    return res.status(400).json({ error: 'All fields are required.' });
  }
  
  if (name.length < 2 || name.length > 50) {
    return res.status(400).json({ error: 'Name must be between 2 and 50 characters.' });
  }
  
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Invalid email address.' });
  }
  
  if (message.length < 10 || message.length > 1000) {
    return res.status(400).json({ error: 'Message must be between 10 and 1000 characters.' });
  }
  
  try {
    const transporter = require('./routes/auth').transporter || require('nodemailer').createTransport({
      service: process.env.EMAIL_SERVICE,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
    
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.SUPPORT_EMAIL || process.env.EMAIL_USER,
      subject: `Contact Form: ${subject || 'General Inquiry'} from ${name}`,
      replyTo: email,
      html: `
        <h3>New Contact Form Submission</h3>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Subject:</strong> ${subject || 'General Inquiry'}</p>
        <p><strong>Message:</strong></p>
        <p>${message.replace(/\n/g, '<br>')}</p>
        <hr>
        <p><small>Sent from Pantry Organizer contact form</small></p>
      `
    });
    
    res.json({ message: 'Message sent successfully!' });
  } catch (err) {
    logger.error('Contact form error:', err);
    throw new Error('Failed to send message. Please try again later.');
  }
}));

// 17) Data export endpoint
app.get('/api/export-data', requireAuth, asyncHandler(async (req, res) => {
  const userId = req.user.id;
  
  try {
    const data = await new Promise((resolve, reject) => {
      db.all(`
        SELECT 
          'pantry_items' as type,
          name,
          quantity,
          expiry_date,
          category,
          created_at,
          updated_at
        FROM pantry_items 
        WHERE user_id = ?
        UNION ALL
        SELECT 
          'shopping_list' as type,
          name,
          quantity,
          expiry_date,
          category,
          created_at,
          updated_at
        FROM shopping_list 
        WHERE user_id = ?
      `, [userId, userId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="pantry-data-${new Date().toISOString().split('T')[0]}.json"`);
    res.json({
      exportDate: new Date().toISOString(),
      user: {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email
      },
      data: data
    });
  } catch (error) {
    throw error;
  }
}));

// 18) 404 handler for API routes
app.use('/api/*', notFoundHandler);

// 19) Serve SPA for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// --- CATCH NON-JSON RESPONSES ---
app.use((req, res, next) => {
  // Only intercept if response is not already sent
  if (!res.headersSent) {
    // If response is not JSON, send a generic error
    res.status(500).json({
      error: true,
      message: 'Unexpected server response. Please try again later.'
    });
  } else {
    next();
  }
});

// 20) Global error handler (must be last)
app.use(errorHandler);

// 21) Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// 22) Unhandled promise rejection handler
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// 23) Uncaught exception handler
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// 24) Start server
app.listen(PORT, '0.0.0.0', () => {
  logger.info(`🚀 Server running on http://0.0.0.0:${PORT}`);
  logger.info(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`🔒 Security headers enabled`);
  logger.info(`📝 Logging enabled`);
});