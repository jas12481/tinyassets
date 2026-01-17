/**
 * Data Routes
 * Handles game data endpoints
 */

const express = require('express');
const router = express.Router();
const { getGameDataByUserId, healthCheck } = require('../controllers/dataController');
const { validateUserId } = require('../middleware/validationMiddleware');
const { optionalAuth } = require('../middleware/authMiddleware');

/**
 * GET /api/game-data/:user_id
 * Get comprehensive game data for a specific user
 */
router.get('/game-data/:user_id', optionalAuth, validateUserId, getGameDataByUserId);

/**
 * GET /api/health
 * Health check endpoint
 */
router.get('/health', healthCheck);

module.exports = router;

