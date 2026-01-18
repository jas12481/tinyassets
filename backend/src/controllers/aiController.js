/**
 * AI Controller
 * Handles AI assistant requests
 */

const { getAIResponse } = require('../services/aiService');
const { getGameData } = require('../services/supabaseService');

/**
 * AI Assistant handler
 */
async function aiAssistant(req, res) {
  try {
    const { question, context, conversationHistory } = req.body;

    // Validate question is provided
    if (!question || typeof question !== 'string' || question.trim().length === 0) {
      return res.status(400).json({
        success: false,
        answer: "Please provide a question.",
        confidence: 0.0,
        suggestions: []
      });
    }

    // Build context - prioritize sources in this order:
    // 1. Provided context from frontend
    // 2. Authenticated user's kid_username from JWT token
    // 3. childUsername from provided context
    let finalContext = context || {};
    let childUsername = null;

    // Try to get childUsername from multiple sources
    if (finalContext?.childUsername) {
      childUsername = finalContext.childUsername;
    } else if (req.user?.kid_username) {
      // JWT token contains kid_username (if parent login generates tokens)
      childUsername = req.user.kid_username;
    } else if (req.body.childUsername) {
      // Fallback: check request body directly
      childUsername = req.body.childUsername;
    }

    // If we have childUsername but no complete context, fetch from database
    if (childUsername && (!finalContext.gameState || !finalContext.recentEvents || !finalContext.earnedBadges)) {
      try {
        console.log(`[AI Controller] Fetching game data for: ${childUsername}`);
        const gameData = await getGameData(childUsername);
        
        // Build context with proper null/undefined handling
        finalContext = {
          childUsername: childUsername,
          gameState: gameData.game_state || null,
          recentEvents: Array.isArray(gameData.event_history) 
            ? gameData.event_history.slice(0, 3) 
            : [],
          earnedBadges: Array.isArray(gameData.earned_badges) 
            ? gameData.earned_badges.slice(0, 3) 
            : [],
          learningFocus: gameData.game_state?.selected_asset || finalContext.learningFocus || 'general'
        };
      } catch (error) {
        console.error('[AI Controller] Error fetching game data for AI context:', error);
        // Use provided context or build minimal default context
        if (!finalContext.childUsername) {
          finalContext = {
            childUsername: childUsername || 'your child',
            gameState: finalContext.gameState || null,
            recentEvents: Array.isArray(finalContext.recentEvents) ? finalContext.recentEvents : [],
            earnedBadges: Array.isArray(finalContext.earnedBadges) ? finalContext.earnedBadges : [],
            learningFocus: finalContext.learningFocus || 'general'
          };
        }
      }
    } else if (!childUsername) {
      // No childUsername available - use minimal context
      finalContext = {
        childUsername: finalContext.childUsername || 'your child',
        gameState: finalContext.gameState || null,
        recentEvents: Array.isArray(finalContext.recentEvents) ? finalContext.recentEvents : [],
        earnedBadges: Array.isArray(finalContext.earnedBadges) ? finalContext.earnedBadges : [],
        learningFocus: finalContext.learningFocus || 'general'
      };
    }

    // Ensure finalContext has required fields
    if (!finalContext.childUsername) {
      finalContext.childUsername = 'your child';
    }

    // Get AI response
    const response = await getAIResponse(question.trim(), finalContext, conversationHistory || []);

    return res.json({
      success: true,
      answer: response.answer,
      confidence: response.confidence || 0.5,
      suggestions: Array.isArray(response.suggestions) ? response.suggestions : []
    });
  } catch (error) {
    console.error('[AI Controller] AI Assistant error:', error);
    return res.status(500).json({
      success: false,
      answer: "I'm having trouble processing your question right now. Please try again in a moment.",
      confidence: 0.5,
      suggestions: ['Try rephrasing your question', 'Check your connection']
    });
  }
}

module.exports = {
  aiAssistant
};

