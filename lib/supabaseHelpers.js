// Helper functions for Supabase integration
// These functions are ready to be connected when Supabase client is set up
// Match the database schema: game_state, event_history, earned_badges tables

/**
 * Save/Update game state to Supabase
 * Matches: game_state table schema
 * 
 * @param {string} userId - User identifier
 * @param {object} gameStateData - Formatted game state (from GameEngine.formatGameStateForDB)
 * @param {object} supabaseClient - Supabase client instance
 */
export async function saveGameState(userId, gameStateData, supabaseClient) {
  // TODO: Implement when Supabase is connected
  // Example:
  // const { data, error } = await supabaseClient
  //   .from('game_state')
  //   .upsert({
  //     user_id: userId,
  //     selected_asset: gameStateData.selected_asset,
  //     xp: gameStateData.xp,
  //     level: gameStateData.level,
  //     updated_at: gameStateData.updated_at
  //   }, {
  //     onConflict: 'user_id'
  //   });
  // return { data, error };
}

/**
 * Load game state from Supabase
 * Matches: game_state table schema
 */
export async function loadGameState(userId, supabaseClient) {
  // TODO: Implement when Supabase is connected
  // Example:
  // const { data, error } = await supabaseClient
  //   .from('game_state')
  //   .select('*')
  //   .eq('user_id', userId)
  //   .single();
  // return { data, error };
}

/**
 * Save event to Supabase
 * Matches: event_history table schema
 * 
 * @param {string} userId - User identifier
 * @param {object} eventData - Formatted event (from GameEngine.formatEventForDB)
 * @param {object} supabaseClient - Supabase client instance
 */
export async function saveEvent(userId, eventData, supabaseClient) {
  // TODO: Implement when Supabase is connected
  // Example:
  // const { data, error } = await supabaseClient
  //   .from('event_history')
  //   .insert({
  //     user_id: userId,
  //     asset_type: eventData.asset_type,
  //     event_name: eventData.event_name,
  //     effect_description: eventData.effect_description,
  //     effect_value: eventData.effect_value,
  //     timestamp: eventData.timestamp
  //   });
  // return { data, error };
}

/**
 * Load event history from Supabase
 * Matches: event_history table schema
 */
export async function loadEventHistory(userId, assetType, supabaseClient, limit = 10) {
  // TODO: Implement when Supabase is connected
  // Example:
  // const { data, error } = await supabaseClient
  //   .from('event_history')
  //   .select('*')
  //   .eq('user_id', userId)
  //   .eq('asset_type', assetType)
  //   .order('timestamp', { ascending: false })
  //   .limit(limit);
  // return { data, error };
}

/**
 * Save earned badge to Supabase
 * Matches: earned_badges table schema
 * 
 * @param {string} userId - User identifier
 * @param {object} badgeData - Formatted badge (from GameEngine.formatBadgeForDB)
 * @param {object} supabaseClient - Supabase client instance
 */
export async function saveBadge(userId, badgeData, supabaseClient) {
  // TODO: Implement when Supabase is connected
  // Example:
  // const { data, error } = await supabaseClient
  //   .from('earned_badges')
  //   .insert({
  //     user_id: userId,
  //     badge_id: badgeData.badge_id,
  //     badge_name: badgeData.badge_name,
  //     asset_type: badgeData.asset_type,
  //     unlocked_at: badgeData.unlocked_at
  //   });
  // return { data, error };
}

/**
 * Load earned badges from Supabase
 * Matches: earned_badges table schema
 */
export async function loadBadges(userId, supabaseClient) {
  // TODO: Implement when Supabase is connected
  // Example:
  // const { data, error } = await supabaseClient
  //   .from('earned_badges')
  //   .select('*')
  //   .eq('user_id', userId)
  //   .order('unlocked_at', { ascending: false });
  // return { data, error };
}

/**
 * Check if badge already exists (prevent duplicates)
 */
export async function badgeExists(userId, badgeId, supabaseClient) {
  // TODO: Implement when Supabase is connected
  // Example:
  // const { data, error } = await supabaseClient
  //   .from('earned_badges')
  //   .select('id')
  //   .eq('user_id', userId)
  //   .eq('badge_id', badgeId)
  //   .single();
  // return !!data && !error;
}

