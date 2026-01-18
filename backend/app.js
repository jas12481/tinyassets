/**
 * TinyAssets Backend API
 * Express server for TinyAssets educational game
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

// Import routes
const parentRoutes = require('./src/routes/parentRoutes');
const aiRoutes = require('./src/routes/aiRoutes');
const dataRoutes = require('./src/routes/dataRoutes');
const kidRoutes = require('./src/routes/kidRoutes');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3001;

// ============ Middleware ============

// CORS configuration
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  // Debug: Log all incoming requests to help troubleshoot routing
  if (req.path.includes('/api/ai')) {
    console.log(`[DEBUG] AI route request: ${req.method} ${req.path}`);
  }
  next();
});

// Rate limiting for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: {
    success: false,
    error: 'Too many login attempts. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// General rate limiter
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: 'Too many requests. Please try again later.'
  }
});

// ============ Routes ============
// IMPORTANT: Register more specific routes BEFORE less specific ones
// Express matches routes in the order they are registered

// Health check (no rate limiting) - specific route first
app.get('/api/health', (req, res) => {
  const { checkConnection } = require('./src/services/supabaseService');
  
  checkConnection().then(dbStatus => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: dbStatus.connected ? 'connected' : 'disconnected'
    });
  }).catch(error => {
    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      database: 'error',
      error: error.message
    });
  });
});

// AI routes - MUST be registered BEFORE /api route
app.use('/api/ai', generalLimiter, aiRoutes);
console.log('✓ AI router mounted at /api/ai');

// Kid routes - for account setup
app.use('/api/kid', generalLimiter, kidRoutes);
console.log('✓ Kid router mounted at /api/kid');

// Parent routes (with rate limiting on login)
// Support both /api/parent and /api/parents for flexibility
app.use('/api/parent', generalLimiter, parentRoutes);
app.use('/api/parents', generalLimiter, parentRoutes);

// Data routes - register LAST (less specific, could catch other routes)
// This should come after all specific /api/* routes
app.use('/api', generalLimiter, dataRoutes);

// ============ Error Handling ============

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.path
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ============ Server Startup ============

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║   TinyAssets Backend API Server       ║
╚════════════════════════════════════════╝
  
  Server running on port ${PORT}
  Environment: ${process.env.NODE_ENV || 'development'}
  Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}
  
  Available endpoints:
  - POST /api/kid/setup (generate parent PIN)
  - POST /api/parent/login (also /api/parents/login)
  - GET  /api/parent/:kid_username (also /api/parents/:kid_username)
  - POST /api/ai/assistant
  - GET  /api/game-data/:user_id
  - GET  /api/health
  
  `);
});

module.exports = app;
