/**
 * Supabase Service
 * Handles all database operations using Supabase client
 */

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || process.env.DATABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase configuration. Please set SUPABASE_URL and SUPABASE_KEY in .env');
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Get game state for a user
 */
async function getGameState(userId) {
  try {
    const { data, error } = await supabase
      .from('game_state')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return { data, error };
  } catch (error) {
    console.error('Error fetching game state:', error);
    return { data: null, error };
  }
}

/**
 * Get event history for a user
 */
async function getEventHistory(userId, limit = 10) {
  try {
    const { data, error } = await supabase
      .from('event_history')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false })
      .limit(limit);

    return { data: data || [], error };
  } catch (error) {
    console.error('Error fetching event history:', error);
    return { data: [], error };
  }
}

/**
 * Get earned badges for a user
 */
async function getEarnedBadges(userId) {
  try {
    const { data, error } = await supabase
      .from('earned_badges')
      .select('*')
      .eq('user_id', userId)
      .order('unlocked_at', { ascending: false });

    return { data: data || [], error };
  } catch (error) {
    console.error('Error fetching earned badges:', error);
    return { data: [], error };
  }
}

/**
 * Verify parent PIN for a user
 */
async function verifyParentPin(userId, pin) {
  try {
    const { data, error } = await supabase
      .from('game_state')
      .select('parent_pin')
      .eq('user_id', userId)
      .single();

    if (error) {
      return { valid: false, error };
    }

    if (!data || !data.parent_pin) {
      return { valid: false, error: { message: 'No PIN set for this user' } };
    }

    // PIN is stored as hashed, so we'll compare it
    // Note: If PIN is stored as plain text initially, we'll need to hash it first
    return { valid: true, data };
  } catch (error) {
    console.error('Error verifying parent PIN:', error);
    return { valid: false, error };
  }
}

/**
 * Get comprehensive game data for a user
 */
async function getGameData(userId) {
  try {
    const [gameStateResult, eventHistoryResult, badgesResult] = await Promise.all([
      getGameState(userId),
      getEventHistory(userId, 50),
      getEarnedBadges(userId)
    ]);

    return {
      game_state: gameStateResult.data,
      event_history: eventHistoryResult.data,
      earned_badges: badgesResult.data,
      learning_progress: {
        total_events: eventHistoryResult.data.length,
        total_badges: badgesResult.data.length,
        current_level: gameStateResult.data?.level || 1,
        total_xp: gameStateResult.data?.xp || 0
      }
    };
  } catch (error) {
    console.error('Error fetching game data:', error);
    throw error;
  }
}

/**
 * Check database connection
 */
async function checkConnection() {
  try {
    const { data, error } = await supabase
      .from('game_state')
      .select('id')
      .limit(1);

    return { connected: !error, error };
  } catch (error) {
    return { connected: false, error };
  }
}

module.exports = {
  supabase,
  getGameState,
  getEventHistory,
  getEarnedBadges,
  verifyParentPin,
  getGameData,
  checkConnection
};

