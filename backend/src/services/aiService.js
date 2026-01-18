/**
 * AI Service
 * Handles AI assistant functionality using OpenAI or rule-based system
 */

/**
 * Rule-based AI Assistant (fallback when OpenAI is not available)
 */
function ruleBasedAssistant(question, context) {
    const lowerQuestion = question.toLowerCase();
    const { childUsername, gameState, recentEvents, earnedBadges, learningFocus } = context;
  
    // Extract key information
    const level = gameState?.level || 1;
    const xp = gameState?.xp || 0;
    const asset = gameState?.selected_asset || 'general';
    const eventCount = recentEvents?.length || 0;
    const badgeCount = earnedBadges?.length || 0;
  
    // Question patterns and responses
    if (lowerQuestion.includes('level') || lowerQuestion.includes('progress')) {
      return {
        answer: `Your child ${childUsername} is currently at Level ${level} with ${xp} XP. They've experienced ${eventCount} learning events and earned ${badgeCount} badges.`,
        confidence: 0.9,
        suggestions: ['Ask about badges', 'Check learning focus', 'View recent events']
      };
    }
  
    if (lowerQuestion.includes('badge') || lowerQuestion.includes('achievement')) {
      if (badgeCount === 0) {
        return {
          answer: `Your child hasn't earned any badges yet. Badges are unlocked as they progress through the game and complete learning milestones.`,
          confidence: 0.95,
          suggestions: ['Ask about current level', 'Check learning focus']
        };
      }
      
      const badgeNames = earnedBadges.slice(0, 3).map(b => b.badge_name || b.name).join(', ');
      return {
        answer: `Your child has earned ${badgeCount} badge${badgeCount > 1 ? 's' : ''}. Recent badges include: ${badgeNames}. Each badge represents a learning milestone they've achieved.`,
        confidence: 0.9,
        suggestions: ['Ask about events', 'Check current level']
      };
    }
  
    if (lowerQuestion.includes('event') || lowerQuestion.includes('happen')) {
      if (eventCount === 0) {
        return {
          answer: `Your child hasn't experienced any events yet. Events simulate real-world scenarios that affect asset values, helping them learn about cause and effect.`,
          confidence: 0.95,
          suggestions: ['Ask about current level', 'Check learning focus']
        };
      }
      
      const recentEvent = recentEvents[0];
      return {
        answer: `Your child has experienced ${eventCount} learning event${eventCount > 1 ? 's' : ''}. The most recent was "${recentEvent?.event_name || 'an event'}" which taught them about ${recentEvent?.asset_type || asset}. These events help children understand how real-world factors affect different types of assets.`,
        confidence: 0.85,
        suggestions: ['Ask about badges', 'Check current level']
      };
    }
  
    if (lowerQuestion.includes('learn') || lowerQuestion.includes('focus') || lowerQuestion.includes('asset')) {
      const assetMessages = {
        'Solar': 'Your child is learning about solar energy and how it responds to weather conditions, maintenance, and government policies.',
        'Property': 'Your child is discovering how property values change based on location, amenities, and economic factors.',
        'Gold': 'Your child is exploring how gold prices respond to market conditions, inflation, and global events.'
      };
      
      const message = assetMessages[asset] || 'Your child is learning about real-world assets and how they respond to various economic and environmental factors.';
      
      return {
        answer: `Currently, your child is focusing on ${asset} assets. ${message} This helps build foundational financial literacy in a safe, gamified environment.`,
        confidence: 0.9,
        suggestions: ['Ask about current level', 'Check badges earned']
      };
    }
  
    if (lowerQuestion.includes('xp') || lowerQuestion.includes('experience')) {
      return {
        answer: `Your child has earned ${xp} XP so far. XP (experience points) are gained by interacting with assets, experiencing events, and completing learning activities. They're currently at Level ${level}.`,
        confidence: 0.9,
        suggestions: ['Ask about badges', 'Check learning focus']
      };
    }
  
    // Default response
    return {
      answer: `I can help you understand your child ${childUsername}'s learning progress in TinyAssets. They're currently at Level ${level} with ${xp} XP, learning about ${asset} assets. They've experienced ${eventCount} events and earned ${badgeCount} badges. You can ask me about their level, badges, events, or what they're learning!`,
      confidence: 0.7,
      suggestions: [
        "What is my child's current level?",
        "What badges has my child earned?",
        "What is my child learning about?",
        "Recent learning events?"
      ]
    };
  }
  
  /**
   * OpenAI-powered AI Assistant (if API key is available)
   */
  async function openAIAssistant(question, context, conversationHistory = []) {
    const { OPENAI_API_KEY } = process.env;
  
    if (!OPENAI_API_KEY) {
      // Fallback to rule-based
      return ruleBasedAssistant(question, context);
    }
  
    try {
      // Use OpenAI SDK v4 (new format)
      const OpenAI = require('openai');
      
      const openai = new OpenAI({
        apiKey: OPENAI_API_KEY,
      });

      const { childUsername, gameState, recentEvents, earnedBadges, learningFocus } = context;

      // Build context prompt with safe data extraction
      const recentEventsData = Array.isArray(recentEvents) ? recentEvents.slice(0, 3) : [];
      const earnedBadgesData = Array.isArray(earnedBadges) ? earnedBadges.slice(0, 3) : [];

      const systemPrompt = `You are an AI Parent Assistant for TinyAssets, an educational game for children to learn about real-world assets.

Context about the child:
- Username: ${childUsername || 'your child'}
- Current level: ${gameState?.level || 1}
- Current XP: ${gameState?.xp || 0}
- Learning focus: ${gameState?.selected_asset || learningFocus || 'general'}
- Recent events: ${JSON.stringify(recentEventsData)}
- Earned badges: ${JSON.stringify(earnedBadgesData)}

Provide helpful, educational responses focused on the child's learning journey. Be encouraging and explain concepts in parent-friendly language. Keep responses concise (under 200 words).`;

      // Build conversation messages
      const messages = [
        { role: 'system', content: systemPrompt },
        ...(Array.isArray(conversationHistory) ? conversationHistory.slice(-5) : []).map(msg => ({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.content || msg.question || msg.answer || ''
        })),
        { role: 'user', content: question }
      ];

      // Use new OpenAI v4 API format
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: messages,
        temperature: 0.7,
        max_tokens: 500  // Increased to allow longer, more detailed responses
      });

      const answer = completion.choices[0]?.message?.content || 'I apologize, but I couldn\'t generate a response. Please try again.';

      return {
        answer,
        confidence: 0.95,
        suggestions: [
          'Ask about badges',
          'Check learning focus',
          'View recent events'
        ]
      };
    } catch (error) {
      console.error('[AI Service] OpenAI API error:', error);
      // Fallback to rule-based on any error
      return ruleBasedAssistant(question, context);
    }
  }
  
  /**
   * Main AI Assistant function
   * Tries OpenAI first, falls back to rule-based
   */
  async function getAIResponse(question, context, conversationHistory = []) {
    try {
      // Try OpenAI if available
      if (process.env.OPENAI_API_KEY) {
        return await openAIAssistant(question, context, conversationHistory);
      }
      
      // Fallback to rule-based
      return ruleBasedAssistant(question, context);
    } catch (error) {
      console.error('AI Service error:', error);
      // Final fallback
      return ruleBasedAssistant(question, context);
    }
  }
  
  module.exports = {
    getAIResponse,
    ruleBasedAssistant,
    openAIAssistant
  };