const express = require('express');
const cors = require('cors');
const productRoutes = require('./routes/product.routes');
const shoppingListRoutes = require('./routes/shoppingList.routes');
const { notFoundHandler, errorHandler } = require('./middleware/error.middleware');
const { successResponse } = require('./utils/response');

const app = express();

// CORS configuration supporting environment-defined origins for Vercel deployment
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
  : '*';

app.use(
  cors({
    origin: allowedOrigins === '*' ? '*' : allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Body parser with support for base64 image data
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logger for development
if (process.env.NODE_ENV !== 'test') {
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      console.log(`[HTTP] ${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`);
    });
    next();
  });
}

// Root endpoint for Render deployment verification
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Scan & Bill POS API Server is operational',
    version: '1.0.0',
    documentation: {
      health: '/api/health',
      products: '/api/products',
      shoppingLists: '/api/shopping-lists',
    },
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  return successResponse(
    res,
    {
      status: 'UP',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    },
    'Barcode Shopping API is running'
  );
});

// API Routes
app.use('/api/products', productRoutes);
app.use('/api/shopping-lists', shoppingListRoutes);

// Catch-all 404 Route Handler
app.use(notFoundHandler);

// Centralized Error Handling Middleware
app.use(errorHandler);

module.exports = app;
