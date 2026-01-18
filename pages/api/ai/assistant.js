/**
 * AI Assistant API Route
 * Next.js API route that handles AI assistant requests for parent dashboard
 */

import { createServerClient } from '../../../lib/supabase';
import jwt from 'jsonwebtoken';

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
    const OpenAI = (await import('openai')).default;
    
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
      model: 'gpt-3.5-turbo',
      messages: messages,
      temperature: 0.7,
      max_tokens: 300
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

/**
 * Optional JWT token verification (doesn't fail if no token)
 */
function optionalAuth(req) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      return decoded;
    } catch (error) {
      // Ignore invalid tokens for optional auth
      return null;
    }
  }

  return null;
}

/**
 * Get game data for a user (similar to backend getGameData)
 * Uses server-side Supabase client with service role key to bypass RLS
 */
async function getGameDataForAI(childUsername) {
  try {
    // Use server client with service role key for API routes (bypasses RLS)
    const supabase = createServerClient();
    
    // Fetch data directly using server client
    const [gameStateResult, eventHistoryResult, badgesResult] = await Promise.all([
      supabase
        .from('game_state')
        .select('*')
        .eq('user_id', childUsername)
        .single(),
      supabase
        .from('event_history')
        .select('*')
        .eq('user_id', childUsername)
        .order('timestamp', { ascending: false })
        .limit(50),
      supabase
        .from('earned_badges')
        .select('*')
        .eq('user_id', childUsername)
        .order('unlocked_at', { ascending: false })
    ]);

    // Handle game state - create if doesn't exist
    let gameState = gameStateResult.data;
    if (gameStateResult.error && gameStateResult.error.code === 'PGRST116') {
      // No game state exists, create one
      const { data: newState, error: createError } = await supabase
        .from('game_state')
        .insert({
          user_id: childUsername,
          selected_asset: null,
          xp: 0,
          level: 1,
          tokens: 15,
          current_day: 1,
          tutorial_complete: false,
        })
        .select()
        .single();
      
      if (createError) {
        console.error('[AI Route] Error creating game state:', createError);
        // Continue with null gameState if creation fails
        gameState = null;
      } else {
        gameState = newState;
      }
    } else if (gameStateResult.error) {
      console.error('[AI Route] Error fetching game state:', gameStateResult.error);
      // Continue with null gameState if fetch fails
      gameState = null;
    }

    return {
      game_state: gameState,
      event_history: Array.isArray(eventHistoryResult.data) ? eventHistoryResult.data : [],
      earned_badges: Array.isArray(badgesResult.data) ? badgesResult.data : [],
    };
  } catch (error) {
    console.error('[AI Route] Error fetching game data:', error);
    throw error;
  }
}

/**
 * Next.js API Route Handler
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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
    } else {
      // Try JWT token (optional auth)
      const decodedToken = optionalAuth(req);
      if (decodedToken?.kid_username) {
        childUsername = decodedToken.kid_username;
      } else if (req.body.childUsername) {
        // Fallback: check request body directly
        childUsername = req.body.childUsername;
      }
    }

    // If we have childUsername but no complete context, fetch from database
    if (childUsername && (!finalContext.gameState || !finalContext.recentEvents || !finalContext.earnedBadges)) {
      try {
        console.log(`[AI Route] Fetching game data for: ${childUsername}`);
        const gameData = await getGameDataForAI(childUsername);
        
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
        console.error('[AI Route] Error fetching game data for AI context:', error);
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
    console.error('[AI Route] AI Assistant error:', error);
    return res.status(500).json({
      success: false,
      answer: "I'm having trouble processing your question right now. Please try again in a moment.",
      confidence: 0.5,
      suggestions: ['Try rephrasing your question', 'Check your connection']
    });
  }
}
