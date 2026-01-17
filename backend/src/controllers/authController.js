/**
 * Authentication Controller
 * Handles parent authentication logic
 */

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { getGameState, getGameData } = require('../services/supabaseService');
const { supabase } = require('../services/supabaseService');

/**
 * Kid setup handler - Generate parent PIN for a kid account
 */
async function kidSetup(req, res) {
  try {
    const { kid_username } = req.body;

    // Check if user exists in game_state
    const { data: gameState, error: gameStateError } = await getGameState(kid_username);

    if (gameStateError || !gameState) {
      return res.status(404).json({
        success: false,
        error: 'User not found. Please check the username.'
      });
    }

    // Check if PIN already exists
    if (gameState.parent_pin) {
      return res.status(400).json({
        success: false,
        error: 'PIN already set for this user. If you lost the PIN, please contact support to reset.'
      });
    }

    // Generate a random 4-digit PIN
    const parentPin = Math.floor(1000 + Math.random() * 9000).toString();

    // Hash the PIN before storing
    const hashedPin = await bcrypt.hash(parentPin, 10);

    // Update game_state with the hashed PIN
    const { error: updateError } = await supabase
      .from('game_state')
      .update({ parent_pin: hashedPin })
      .eq('user_id', kid_username);

    if (updateError) {
      console.error('Error updating parent PIN:', updateError);
      return res.status(500).json({
        success: false,
        error: 'Failed to set parent PIN. Please try again.'
      });
    }

    // Return the PIN (show this to parent ONCE!)
    return res.json({
      success: true,
      parent_pin: parentPin,
      message: 'PIN generated successfully. Show this to the parent once. If lost, the account needs to be reset.'
    });
  } catch (error) {
    console.error('Kid setup error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error. Please try again later.'
    });
  }
}

/**
 * Parent login handler - Returns profile data directly
 */
async function parentLogin(req, res) {
  try {
    const { kid_username, parent_pin } = req.body;

    // Check if user exists in game_state
    const { data: gameState, error: gameStateError } = await getGameState(kid_username);

    if (gameStateError || !gameState) {
      return res.status(404).json({
        success: false,
        error: 'User not found. Please check the username.'
      });
    }

    // Verify PIN
    let pinValid = false;
    
    if (gameState.parent_pin) {
      // PIN is stored as hashed
      try {
        pinValid = await bcrypt.compare(parent_pin, gameState.parent_pin);
      } catch (error) {
        // If comparison fails, might be plain text (for migration)
        pinValid = gameState.parent_pin === parent_pin;
      }
    } else {
      // No PIN set
      return res.status(400).json({
        success: false,
        error: 'No PIN set for this user. Please run setup first.'
      });
    }

    if (!pinValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid PIN. Please try again.'
      });
    }

    // Get comprehensive game data (profile)
    const gameData = await getGameData(kid_username);

    // Return success response with profile data
    return res.json({
      success: true,
      kid_username: kid_username,
      profile: {
        game_state: gameData.game_state,
        event_history: gameData.event_history,
        earned_badges: gameData.earned_badges,
        learning_progress: gameData.learning_progress
      }
    });
  } catch (error) {
    console.error('Parent login error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error. Please try again later.'
    });
  }
}

module.exports = {
  kidSetup,
  parentLogin
};

