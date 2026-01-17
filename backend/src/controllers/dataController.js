/**
 * Data Controller
 * Handles game data and parent data requests
 */

const { getGameData } = require('../services/supabaseService');
const { getParentData } = require('../services/dataService');

/**
 * Get game data for a specific user
 */
async function getGameDataByUserId(req, res) {
  try {
    const { user_id } = req.params;

    const gameData = await getGameData(user_id);

    return res.json({
      success: true,
      ...gameData
    });
  } catch (error) {
    console.error('Get game data error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch game data'
    });
  }
}

/**
 * Get parent-viewable data for a specific kid
 */
async function getParentDataByKidUsername(req, res) {
  try {
    const { kid_username } = req.params;

    // Verify authentication if token is provided
    if (req.user && req.user.kid_username !== kid_username) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. You can only view your own child\'s data.'
      });
    }

    const parentData = await getParentData(kid_username);

    return res.json({
      success: true,
      ...parentData
    });
  } catch (error) {
    console.error('Get parent data error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch parent data'
    });
  }
}

/**
 * Health check endpoint
 */
async function healthCheck(req, res) {
  try {
    const { checkConnection } = require('../services/supabaseService');
    const dbStatus = await checkConnection();

    return res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: dbStatus.connected ? 'connected' : 'disconnected'
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      database: 'error',
      error: error.message
    });
  }
}

module.exports = {
  getGameDataByUserId,
  getParentDataByKidUsername,
  healthCheck
};

