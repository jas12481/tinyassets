/**
 * Database Helper Functions
 * Wrapper functions for common database operations
 */

import { supabase, createServerClient } from './supabase';
import { processEvent, checkBadgeUnlocks, addXP, XP_REWARDS } from '../backend/rules-engine';

/**
 * Get or create game state for a user
 */
export async function getOrCreateGameState(userId) {
    const { data, error } = await supabase
        .from('game_state')
        .select('*')
        .eq('user_id', userId)
        .single();

    if (error && error.code === 'PGRST116') {
        // No game state exists, create one
        const { data: newState, error: createError } = await supabase
            .from('game_state')
            .insert({
                user_id: userId,
                selected_asset: null,
                xp: 0,
                level: 1,
            })
            .select()
            .single();

        if (createError) {
            throw createError;
        }
        return newState;
    }

    if (error) {
        throw error;
    }

    return data;
}

/**
 * Update game state
 */
export async function updateGameState(userId, updates) {
    const { data, error } = await supabase
        .from('game_state')
        .update(updates)
        .eq('user_id', userId)
        .select()
        .single();

    if (error) {
        throw error;
    }

    return data;
}

/**
 * Select an asset (first selection)
 */
export async function selectAsset(userId, assetType) {
    const gameState = await getOrCreateGameState(userId);
    
    // Add XP for selecting asset
    const { xp: newXP, level: newLevel } = addXP(gameState.xp, XP_REWARDS.ASSET_SELECTED);

    const updatedState = await updateGameState(userId, {
        selected_asset: assetType,
        xp: newXP,
        level: newLevel,
    });

    return updatedState;
}

/**
 * Trigger a random event for the user's asset
 */
export async function triggerEvent(userId) {
    const gameState = await getOrCreateGameState(userId);
    
    if (!gameState.selected_asset) {
        throw new Error('No asset selected');
    }

    // Process event using rules engine
    const eventResult = processEvent(userId, gameState.selected_asset, gameState);
    
    if (!eventResult) {
        throw new Error('Failed to process event');
    }

    // Update game state with new XP/level
    await updateGameState(userId, {
        xp: eventResult.updatedGameState.xp,
        level: eventResult.updatedGameState.level,
    });

    // Log event to history
    const { data: eventRecord, error: eventError } = await supabase
        .from('event_history')
        .insert({
            user_id: userId,
            asset_type: gameState.selected_asset,
            event_name: eventResult.event.name,
            effect_description: eventResult.event.description,
            effect_value: eventResult.event.effect,
        })
        .select()
        .single();

    if (eventError) {
        throw eventError;
    }

    // Check for badge unlocks
    const badges = await checkAndUnlockBadges(userId);

    return {
        event: eventResult.event,
        eventRecord,
        newBadges: badges,
    };
}

/**
 * Check and unlock any new badges
 */
export async function checkAndUnlockBadges(userId) {
    const gameState = await getOrCreateGameState(userId);

    // Get event history
    const { data: eventHistory, error: historyError } = await supabase
        .from('event_history')
        .select('*')
        .eq('user_id', userId)
        .order('timestamp', { ascending: true });

    if (historyError) {
        throw historyError;
    }

    // Get existing badges
    const { data: existingBadges, error: badgesError } = await supabase
        .from('earned_badges')
        .select('*')
        .eq('user_id', userId);

    if (badgesError) {
        throw badgesError;
    }

    // Check for new badges using rules engine
    const newBadges = checkBadgeUnlocks(
        gameState,
        eventHistory || [],
        existingBadges || []
    );

    // Insert new badges
    if (newBadges.length > 0) {
        const badgeInserts = newBadges.map(badge => ({
            user_id: userId,
            badge_id: badge.id,
            badge_name: badge.name,
            asset_type: badge.assetType,
        }));

        const { error: insertError } = await supabase
            .from('earned_badges')
            .insert(badgeInserts);

        if (insertError) {
            throw insertError;
        }

        // Add XP for earning badges
        const totalBadgeXP = newBadges.length * XP_REWARDS.BADGE_EARNED;
        const { xp: newXP, level: newLevel } = addXP(gameState.xp, totalBadgeXP);
        
        await updateGameState(userId, {
            xp: newXP,
            level: newLevel,
        });
    }

    return newBadges;
}

/**
 * Get event history for a user
 */
export async function getEventHistory(userId, limit = 10) {
    const { data, error } = await supabase
        .from('event_history')
        .select('*')
        .eq('user_id', userId)
        .order('timestamp', { ascending: false })
        .limit(limit);

    if (error) {
        throw error;
    }

    return data;
}

/**
 * Get earned badges for a user
 */
export async function getEarnedBadges(userId) {
    const { data, error } = await supabase
        .from('earned_badges')
        .select('*')
        .eq('user_id', userId)
        .order('unlocked_at', { ascending: false });

    if (error) {
        throw error;
    }

    return data;
}

/**
 * Get complete user profile (game state + badges + events)
 * Useful for parent dashboard
 */
export async function getUserProfile(userId) {
    const [gameState, badges, events] = await Promise.all([
        getOrCreateGameState(userId),
        getEarnedBadges(userId),
        getEventHistory(userId, 50), // Get last 50 events
    ]);

    return {
        gameState,
        badges,
        events,
    };
}
