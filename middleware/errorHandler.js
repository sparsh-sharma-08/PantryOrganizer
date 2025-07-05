const { logError } = require('../utils/logger');

// Global error handler middleware
const errorHandler = (err, req, res, next) => {
  // Log the error
  logError(err, req);

  // Set default error values
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let details = null;

  // Handle specific error types
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation Error';
    details = err.details || err.errors;
  } else if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid ID format';
  } else if (err.code === 11000) {
    statusCode = 409;
    message = 'Duplicate field value';
  } else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  } else if (err.name === 'UnauthorizedError') {
    statusCode = 401;
    message = 'Unauthorized access';
  } else if (err.name === 'ForbiddenError') {
    statusCode = 403;
    message = 'Access forbidden';
  } else if (err.name === 'NotFoundError') {
    statusCode = 404;
    message = 'Resource not found';
  } else if (err.name === 'RateLimitError') {
    statusCode = 429;
    message = 'Too many requests';
  }

  // Don't leak error details in production
  if (process.env.NODE_ENV === 'production' && statusCode === 500) {
    message = 'Internal Server Error';
    details = null;
  }

  // Send error response
  const errorResponse = {
    error: true,
    message,
    ...(details && { details }),
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method,
  };

  res.status(statusCode).json(errorResponse);
};

// Async error wrapper
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// 404 handler
const notFoundHandler = (req, res, next) => {
  const error = new Error(`Route ${req.originalUrl} not found`);
  error.statusCode = 404;
  error.name = 'NotFoundError';
  next(error);
};

// Database error handler
const handleDatabaseError = (err) => {
  if (err.code === 'SQLITE_CONSTRAINT') {
    const error = new Error('Database constraint violation');
    error.statusCode = 400;
    error.name = 'ValidationError';
    return error;
  }
  
  if (err.code === 'SQLITE_BUSY') {
    const error = new Error('Database is busy, please try again');
    error.statusCode = 503;
    error.name = 'ServiceUnavailableError';
    return error;
  }
  
  return err;
};

// Validation error handler
const handleValidationError = (errors) => {
  const error = new Error('Validation failed');
  error.statusCode = 400;
  error.name = 'ValidationError';
  error.details = errors;
  return error;
};

// Authentication error handler
const handleAuthError = (message = 'Authentication failed') => {
  const error = new Error(message);
  error.statusCode = 401;
  error.name = 'UnauthorizedError';
  return error;
};

// Authorization error handler
const handleAuthorizationError = (message = 'Access denied') => {
  const error = new Error(message);
  error.statusCode = 403;
  error.name = 'ForbiddenError';
  return error;
};

module.exports = {
  errorHandler,
  asyncHandler,
  notFoundHandler,
  handleDatabaseError,
  handleValidationError,
  handleAuthError,
  handleAuthorizationError,
}; 