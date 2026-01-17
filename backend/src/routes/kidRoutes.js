/**
 * Kid Routes
 * Handles kid account setup endpoints
 */

const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { kidSetup } = require('../controllers/authController');
const { validateKidSetup } = require('../middleware/validationMiddleware');

// Rate limiting for setup endpoint
const setupLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 setup requests per windowMs
  message: {
    success: false,
    error: 'Too many setup requests. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * POST /api/kid/setup
 * Generate parent PIN for a kid account (one-time setup)
 */
router.post('/setup', setupLimiter, validateKidSetup, kidSetup);

module.exports = router;

