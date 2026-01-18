/**
 * AI Routes
 * Handles AI assistant endpoints
 */

const express = require('express');
const router = express.Router();
const { aiAssistant } = require('../controllers/aiController');
const { optionalAuth } = require('../middleware/authMiddleware');

/**
 * POST /api/ai/assistant
 * Get AI assistant response for parent questions
 * Uses optional authentication to get child username from token
 */
router.post('/assistant', optionalAuth, aiAssistant);

module.exports = router;
