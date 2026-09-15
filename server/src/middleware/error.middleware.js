const { errorResponse } = require('../utils/response');

/**
 * 404 Route Not Found Middleware
 */
const notFoundHandler = (req, res, next) => {
  return errorResponse(res, `Route not found: ${req.method} ${req.originalUrl}`, 404);
};

/**
 * Centralized Global Error Handling Middleware
 */
const errorHandler = (err, req, res, next) => {
  console.error(`[Error] ${err.name || 'Server Error'}: ${err.message}`);

  // Mongoose CastError (e.g. invalid ObjectId)
  if (err.name === 'CastError') {
    return errorResponse(res, `Invalid format for field: ${err.path}`, 400);
  }

  // Mongoose Duplicate Key Error (E11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    const value = err.keyValue ? err.keyValue[field] : '';
    return errorResponse(res, `Duplicate value '${value}' for unique field '${field}'`, 409);
  }

  // Mongoose Validation Error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return errorResponse(res, messages.join(', '), 400, messages);
  }

  // Custom Application Error
  const statusCode = err.statusCode || 500;
  const message = err.isOperational || process.env.NODE_ENV !== 'production'
    ? err.message
    : 'Internal server error';

  return errorResponse(res, message, statusCode);
};

module.exports = {
  notFoundHandler,
  errorHandler,
};
