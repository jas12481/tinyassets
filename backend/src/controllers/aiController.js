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

    // If context is not provided, try to fetch it from database
    let finalContext = context;

    if (!finalContext || !finalContext.childUsername) {
      // Try to get childUsername from authenticated user or request
      const childUsername = req.user?.kid_username || context?.childUsername;
      
      if (childUsername) {
        // Fetch game data to build context
        try {
          const gameData = await getGameData(childUsername);
          finalContext = {
            childUsername: childUsername,
            gameState: gameData.game_state,
            recentEvents: gameData.event_history.slice(0, 3),
            earnedBadges: gameData.earned_badges.slice(0, 3),
            learningFocus: gameData.game_state?.selected_asset || 'general'
          };
        } catch (error) {
          console.error('Error fetching game data for AI context:', error);
          // Use provided context or default
          finalContext = context || {
            childUsername: childUsername || 'your child',
            gameState: null,
            recentEvents: [],
            earnedBadges: [],
            learningFocus: 'general'
          };
        }
      }
    }

    // Get AI response
    const response = await getAIResponse(question, finalContext, conversationHistory || []);

    return res.json({
      answer: response.answer,
      confidence: response.confidence,
      suggestions: response.suggestions || []
    });
  } catch (error) {
    console.error('AI Assistant error:', error);
    return res.status(500).json({
      answer: "I'm having trouble processing your question right now. Please try again in a moment.",
      confidence: 0.5,
      suggestions: ['Try rephrasing your question', 'Check your connection']
    });
  }
}

module.exports = {
  aiAssistant
};

