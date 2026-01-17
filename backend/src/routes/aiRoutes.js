/**
 * AI Routes
 * Handles AI assistant endpoints
 */

const express = require('express');
const router = express.Router();
const { aiAssistant } = require('../controllers/aiController');
const { validateAIAssistant } = require('../middleware/validationMiddleware');
const { optionalAuth } = require('../middleware/authMiddleware');

/**
 * POST /api/ai/assistant
 * Get AI-powered response for parent questions
 * Authentication is optional but recommended for better context
 */
router.post('/assistant', optionalAuth, validateAIAssistant, aiAssistant);

// Log when route is registered
console.log('✓ AI assistant route: POST /api/ai/assistant');

// Debug route to verify router is working
router.get('/test', (req, res) => {
  res.json({ message: 'AI routes are working!', path: req.path });
});

module.exports = router;

