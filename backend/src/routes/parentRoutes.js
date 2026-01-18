/**
 * Parent Routes
 * Handles parent authentication and data endpoints
 */

const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { parentLogin } = require('../controllers/authController');
const { getParentDataByKidUsername } = require('../controllers/dataController');
const { validateParentLogin, validateKidUsername } = require('../middleware/validationMiddleware');
const { authenticateToken, optionalAuth } = require('../middleware/authMiddleware');

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

/**
 * POST /api/parent/login
 * Authenticate parent with kid username and PIN
 */
router.post('/login', authLimiter, validateParentLogin, parentLogin);

/**
 * GET /api/parent/:kid_username
 * Get parent-viewable data for a specific kid
 * Requires authentication (optional but recommended)
 */
router.get('/:kid_username', validateKidUsername, optionalAuth, getParentDataByKidUsername);

module.exports = router;