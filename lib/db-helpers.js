/**
 * Database Helper Functions
 * Share-Based Fractional Ownership System
 */

import { supabase, createServerClient } from './supabase';
import {
    processEvent,
    checkBadgeUnlocks,
    checkMissionCompletion,
    addXP,
    getShareCost,
    calculateShareSaleReturn,
    calculateDailyProduction,
    shouldTriggerEvent,
    XP_REWARDS,
    MISSIONS,
    BADGES,
    DAILY_MISSIONS,
    getDailyMission,
    checkDailyMissionCompletion,
} from '../backend/rules-engine';

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
                tokens: 15, // Start with 15 tokens
                current_day: 1,
                tutorial_complete: false, // Tutorial not completed yet
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
 * Get user's owned assets
 */
export async function getUserAssets(userId) {
    const { data, error } = await supabase
        .from('user_assets')
        .select('*')
        .eq('user_id', userId)
        .order('purchased_at', { ascending: true });

    if (error) {
        throw error;
    }

    return data || [];
}

/**
 * Buy shares of an asset (supports multiple shares)
 */
export async function buyAssetShares(userId, assetType, sharesToBuy = 1) {
    const gameState = await getOrCreateGameState(userId);
    const userAssets = await getUserAssets(userId);
    
    // Validate shares
    if (sharesToBuy < 1 || sharesToBuy > 4) {
        throw new Error('Must buy between 1 and 4 shares');
    }
    
    // Calculate cost
    const totalCost = getShareCost(assetType, sharesToBuy);
    
    // Check if user has enough tokens
    if (gameState.tokens < totalCost) {
        throw new Error(`Not enough tokens. Need ${totalCost}, have ${gameState.tokens}`);
    }
    
    // Check existing ownership
    const existingAsset = userAssets.find(a => a.asset_type === assetType);
    
    if (existingAsset) {
        // Already owns this asset - add shares
        const newTotalShares = existingAsset.shares + sharesToBuy;
        
        if (newTotalShares > 4) {
            throw new Error(`Cannot buy ${sharesToBuy} shares. Would exceed 100% ownership (max 4 shares). Currently own ${existingAsset.shares} shares.`);
        }
        
        // Deduct tokens
        const newTokens = gameState.tokens - totalCost;
        await updateGameState(userId, { tokens: newTokens });
        
        // Update asset shares
        const { data: updatedAsset, error: updateError } = await supabase
            .from('user_assets')
            .update({ shares: newTotalShares })
            .eq('id', existingAsset.id)
            .select()
            .single();
        
        if (updateError) {
            throw updateError;
        }
        
        // Record transaction
        await supabase
            .from('transactions')
            .insert({
                user_id: userId,
                transaction_type: 'buy',
                asset_type: assetType,
                shares: sharesToBuy,
                amount: -totalCost,
                details: { 
                    shares_bought: sharesToBuy,
                    new_total_shares: newTotalShares,
                    ownership_percentage: (newTotalShares / 4) * 100
                },
                day_number: gameState.current_day,
            });
        
        return { 
            asset: updatedAsset, 
            newTokens,
            sharesOwned: newTotalShares,
            ownershipPercentage: (newTotalShares / 4) * 100
        };
    } else {
        // First time buying this asset
        // Deduct tokens
        const newTokens = gameState.tokens - totalCost;
        await updateGameState(userId, { tokens: newTokens });
        
        // Create asset record
        const { data: asset, error: assetError } = await supabase
            .from('user_assets')
            .insert({
                user_id: userId,
                asset_type: assetType,
                shares: sharesToBuy,
                purchase_price: totalCost,
            })
            .select()
            .single();
        
        if (assetError) {
            throw assetError;
        }
        
        // Record transaction
        await supabase
            .from('transactions')
            .insert({
                user_id: userId,
                transaction_type: 'buy',
                asset_type: assetType,
                shares: sharesToBuy,
                amount: -totalCost,
                details: { 
                    shares_bought: sharesToBuy,
                    ownership_percentage: (sharesToBuy / 4) * 100
                },
                day_number: gameState.current_day,
            });
        
        return { 
            asset, 
            newTokens,
            sharesOwned: sharesToBuy,
            ownershipPercentage: (sharesToBuy / 4) * 100
        };
    }
}

/**
 * Sell shares of an asset
 */
export async function sellAssetShares(userId, assetId, sharesToSell = 1) {
    const gameState = await getOrCreateGameState(userId);
    
    // Get asset
    const { data: asset, error: assetError } = await supabase
        .from('user_assets')
        .select('*')
        .eq('id', assetId)
        .eq('user_id', userId)
        .single();
    
    if (assetError || !asset) {
        throw new Error('Asset not found');
    }
    
    if (sharesToSell < 1 || sharesToSell > asset.shares) {
        throw new Error(`Cannot sell ${sharesToSell} shares. You only own ${asset.shares} shares`);
    }
    
    // Calculate return (60% of purchase price per share)
    const returnAmount = calculateShareSaleReturn(asset.asset_type, sharesToSell);
    
    // Add tokens
    const newTokens = gameState.tokens + returnAmount;
    await updateGameState(userId, { tokens: newTokens });
    
    const newTotalShares = asset.shares - sharesToSell;
    
    if (newTotalShares === 0) {
        // Selling all shares - delete asset
        await supabase
            .from('user_assets')
            .delete()
            .eq('id', assetId);
    } else {
        // Update shares
        await supabase
            .from('user_assets')
            .update({ shares: newTotalShares })
            .eq('id', assetId);
    }
    
        // Record transaction
        await supabase
            .from('transactions')
            .insert({
                user_id: userId,
                transaction_type: 'sell',
                asset_type: asset.asset_type,
                shares: sharesToSell,
                amount: returnAmount,
                details: { 
                    shares_sold: sharesToSell,
                    return_percentage: 60,
                    ownership_percentage: newTotalShares > 0 ? (newTotalShares / 4) * 100 : 0
                },
                day_number: gameState.current_day,
            });
        
        // Update daily mission progress (for "Steady Holder" mission)
        // Track last sell day
        const { data: dailyMission } = await supabase
            .from('missions')
            .select('*')
            .eq('user_id', userId)
            .eq('mission_id', 'steady-holder')
            .eq('status', 'in_progress')
            .single();
        
        if (dailyMission) {
            await supabase
                .from('missions')
                .update({
                    progress: {
                        ...dailyMission.progress,
                        lastSellDay: gameState.current_day,
                    }
                })
                .eq('id', dailyMission.id);
        }
    
    return { 
        returnAmount, 
        newTokens,
        sharesRemaining: newTotalShares,
        ownershipPercentage: newTotalShares > 0 ? (newTotalShares / 4) * 100 : 0
    };
}

/**
 * Process daily production - scales with shares
 */
export async function processDailyProduction(userId) {
    const userAssets = await getUserAssets(userId);
    const gameState = await getOrCreateGameState(userId);
    
    const today = new Date().toISOString().split('T')[0];
    let totalEarned = 0;
    const productions = [];
    
    for (const asset of userAssets) {
        if (asset.shares === 0) continue; // Skip assets with no shares
        
        // Check if already produced for THIS game day (not calendar day)
        const { data: existing } = await supabase
            .from('daily_production')
            .select('*')
            .eq('asset_id', asset.id)
            .eq('day_number', gameState.current_day)
            .single();
        
        if (existing) continue; // Already produced for this game day
        
        // Calculate production based on shares
        const tokensEarned = calculateDailyProduction(asset.asset_type, asset.shares);
        
        if (tokensEarned > 0) {
            totalEarned += tokensEarned;
            
            // Record production
            const { data: production } = await supabase
                .from('daily_production')
                .insert({
                    user_id: userId,
                    asset_id: asset.id,
                    tokens_earned: tokensEarned,
                    production_date: today,
                    day_number: gameState.current_day,
                })
                .select()
                .single();
            
            productions.push(production);
        }
        
        // Update last_production_at
        await supabase
            .from('user_assets')
            .update({ last_production_at: new Date().toISOString() })
            .eq('id', asset.id);
    }
    
    // Add tokens to game state
    if (totalEarned > 0) {
        const newTokens = gameState.tokens + totalEarned;
        await updateGameState(userId, { tokens: newTokens });
    }
    
    return { totalEarned, productions, newTokens: gameState.tokens + totalEarned };
}

/**
 * Trigger a random event - affects ALL owned assets, scaled by shares
 */
export async function triggerEvent(userId) {
    const gameState = await getOrCreateGameState(userId);
    const userAssets = await getUserAssets(userId);
    
    if (userAssets.length === 0 || userAssets.every(a => a.shares === 0)) {
        throw new Error('No assets owned. Buy shares first!');
    }

    // Check if event should trigger
    if (!shouldTriggerEvent(gameState.current_day)) {
        return null; // No event this day
    }

    // Process event using rules engine
    const eventResult = processEvent(userAssets, gameState);
    
    if (!eventResult) {
        return null;
    }

    // Update game state with new XP/level/tokens
    await updateGameState(userId, {
        xp: eventResult.updatedGameState.xp,
        level: eventResult.updatedGameState.level,
        tokens: eventResult.updatedGameState.tokens,
    });

    // Log event to history
    const { data: eventRecord, error: eventError } = await supabase
        .from('event_history')
        .insert({
            user_id: userId,
            asset_type: eventResult.assetEffects[0]?.assetType || 'property', // Primary affected asset
            event_name: eventResult.event.name,
            event_type: eventResult.event.eventType,
            effect_description: eventResult.event.description,
            token_effect: eventResult.tokenEffect,
            shares_affected: eventResult.assetEffects.reduce((sum, ae) => sum + ae.shares, 0),
            day_number: gameState.current_day,
        })
        .select()
        .single();

    if (eventError) {
        throw eventError;
    }

    return {
        event: eventResult.event,
        assetEffects: eventResult.assetEffects,
        tokenEffect: eventResult.tokenEffect,
        newTokens: eventResult.updatedGameState.tokens,
        eventRecord,
    };
}

/**
 * Unlock badges and insert into database
 */
export async function unlockBadges(userId, badges, dayNumber) {
    if (!badges || badges.length === 0) {
        return [];
    }

    const gameState = await getOrCreateGameState(userId);
    let totalBadgeXP = 0;

    // Insert badges into database
    const badgeInserts = badges.map(badge => ({
        user_id: userId,
        badge_id: badge.id,
        badge_name: badge.name,
        asset_type: badge.assetType,
        day_number: dayNumber,
    }));

    const { error: insertError } = await supabase
        .from('earned_badges')
        .insert(badgeInserts);

    if (insertError) {
        throw insertError;
    }

    // Calculate total XP from badges
    totalBadgeXP = badges.reduce((sum, badge) => sum + (badge.reward_xp || 0), 0);

    // Add XP for badges
    if (totalBadgeXP > 0) {
        const { xp: newXP, level: newLevel } = addXP(gameState.xp, totalBadgeXP);
        await updateGameState(userId, {
            xp: newXP,
            level: newLevel,
        });
    }

    return badges;
}

/**
 * Create or update mission records
 */
export async function createOrUpdateMissions(userId, completedMissions) {
    if (!completedMissions || completedMissions.length === 0) {
        return [];
    }

    const gameState = await getOrCreateGameState(userId);
    const existingMissions = await getUserMissions(userId);
    const existingMissionIds = existingMissions.map(m => m.mission_id);

    const newMissions = [];
    const updatedMissions = [];

    for (const mission of completedMissions) {
        const existing = existingMissions.find(m => m.mission_id === mission.id);

        if (existing) {
            // Update existing mission to completed
            if (existing.status !== 'completed') {
                const { error: updateError } = await supabase
                    .from('missions')
                    .update({
                        status: 'completed',
                        completed_at: new Date().toISOString(),
                    })
                    .eq('id', existing.id);

                if (!updateError) {
                    updatedMissions.push(mission);
                }
            }
        } else {
            // Create new mission record
            const { data: newMission, error: insertError } = await supabase
                .from('missions')
                .insert({
                    user_id: userId,
                    mission_id: mission.id,
                    mission_name: mission.name,
                    status: 'completed',
                    completed_at: new Date().toISOString(),
                })
                .select()
                .single();

            if (!insertError) {
                newMissions.push(mission);
            }
        }
    }

    return [...newMissions, ...updatedMissions];
}

/**
 * Get or create active daily mission for user (Level 2+ only)
 */
export async function getOrCreateDailyMission(userId) {
    const gameState = await getOrCreateGameState(userId);
    
    // Daily missions only available from Level 2+
    if (gameState.level < 2) {
        return null;
    }
    
    // Get today's daily mission based on day number (rotates consistently)
    const dailyMission = getDailyMission(gameState.current_day);
    if (!dailyMission) {
        return null;
    }
    
    // Check if user already has this daily mission active
    const { data: existingMission, error: fetchError } = await supabase
        .from('missions')
        .select('*')
        .eq('user_id', userId)
        .eq('mission_id', dailyMission.id)
        .eq('status', 'in_progress')
        .single();
    
    if (existingMission && !fetchError) {
        // Mission already exists and is active
        return {
            ...dailyMission,
            ...existingMission,
        };
    }
    
    // Check if this mission was already completed/claimed today (avoid duplicates)
    const today = new Date().toISOString().split('T')[0];
    const { data: todayMission } = await supabase
        .from('missions')
        .select('*')
        .eq('user_id', userId)
        .eq('mission_id', dailyMission.id)
        .gte('completed_at', `${today}T00:00:00`)
        .maybeSingle();
    
    if (todayMission && todayMission.status === 'claimed') {
        // Already claimed today, will create new one tomorrow
        return null;
    }
    
    // Create new daily mission
    const { data: newMission, error: createError } = await supabase
        .from('missions')
        .insert({
            user_id: userId,
            mission_id: dailyMission.id,
            mission_name: dailyMission.name,
            status: 'in_progress',
            progress: {
                dayNumber: gameState.current_day,
                lastSellDay: 0,
            },
        })
        .select()
        .single();
    
    if (createError) {
        console.error('Error creating daily mission:', createError);
        return null;
    }
    
    return {
        ...dailyMission,
        ...newMission,
    };
}

/**
 * Check and update daily mission completion
 */
export async function checkAndUpdateDailyMission(userId, todayProduction, todayEvent) {
    const gameState = await getOrCreateGameState(userId);
    
    // Daily missions only available from Level 2+
    if (gameState.level < 2) {
        return null;
    }
    
    const dailyMissionRecord = await getOrCreateDailyMission(userId);
    if (!dailyMissionRecord || dailyMissionRecord.status !== 'in_progress') {
        return null;
    }
    
    // Get all data needed for mission check
    const userAssets = await getUserAssets(userId);
    const eventHistory = await getEventHistory(userId);
    const dailyProduction = await getDailyProduction(userId);
    const transactions = await getTransactions(userId);
    
    // Get mission config
    const dailyMission = DAILY_MISSIONS[dailyMissionRecord.mission_id];
    if (!dailyMission) {
        return null;
    }
    
    // Check if mission is complete
    const isComplete = checkDailyMissionCompletion(
        dailyMission,
        gameState,
        userAssets,
        eventHistory,
        dailyProduction,
        transactions,
        todayProduction,
        dailyMissionRecord.progress || {},
        null, // indicators (can be enhanced later)
        todayEvent
    );
    
    if (isComplete && dailyMissionRecord.status === 'in_progress') {
        // Update mission to completed
        const { data: updatedMission } = await supabase
            .from('missions')
            .update({
                status: 'completed',
                completed_at: new Date().toISOString(),
            })
            .eq('id', dailyMissionRecord.id)
            .select()
            .single();
        
        return {
            ...dailyMission,
            ...updatedMission,
        };
    }
    
    return null;
}

/**
 * Execute a day (process production + possibly event)
 */
export async function executeDay(userId, skipEventCheck = false) {
    const gameState = await getOrCreateGameState(userId);
    const userAssets = await getUserAssets(userId);
    
    // Process daily production
    const productionResult = await processDailyProduction(userId);
    
    // Check for event (if not skipping)
    let eventResult = null;
    if (!skipEventCheck) {
        try {
            eventResult = await triggerEvent(userId);
        } catch (error) {
            // Event might fail if no assets, but that's okay
            if (error.message !== 'No assets owned. Buy shares first!') {
                throw error;
            }
        }
    }
    
    // Get updated game state after production/event
    const updatedGameState = await getOrCreateGameState(userId);
    
    // Check for mission completion
    const eventHistory = await getEventHistory(userId);
    const dailyProduction = await getDailyProduction(userId);
    const transactions = await getTransactions(userId);
    
    const completedMissions = checkMissionCompletion(
        updatedGameState,
        userAssets,
        eventHistory,
        dailyProduction,
        transactions
    );
    
    // Create/update mission records
    if (completedMissions.length > 0) {
        await createOrUpdateMissions(userId, completedMissions);
    }
    
    // Check daily mission completion (Level 2+ only)
    const completedDailyMission = await checkAndUpdateDailyMission(
        userId,
        productionResult.totalEarned || 0,
        eventResult?.eventRecord || null
    );
    
    // Add daily mission to completed missions if it completed
    if (completedDailyMission) {
        completedMissions.push(completedDailyMission);
    }
    
    // Check for badge unlocks
    const existingBadges = await getEarnedBadges(userId);
    const newBadges = checkBadgeUnlocks(updatedGameState, userAssets, eventHistory, existingBadges);
    
    // Unlock new badges
    let unlockedBadges = [];
    if (newBadges.length > 0) {
        unlockedBadges = await unlockBadges(userId, newBadges, updatedGameState.current_day);
    }
    
    // Update day number (increment)
    const finalGameState = await updateGameState(userId, {
        current_day: updatedGameState.current_day + 1,
    });
    
    return {
        production: productionResult,
        event: eventResult,
        newDay: finalGameState.current_day,
        newMissions: completedMissions,
        dailyMission: completedDailyMission,
        newBadges: unlockedBadges,
        updatedGameState: finalGameState,
    };
}

/**
 * Get event history for a user
 */
export async function getEventHistory(userId, limit = 100) {
    const { data, error } = await supabase
        .from('event_history')
        .select('*')
        .eq('user_id', userId)
        .order('timestamp', { ascending: false })
        .limit(limit);

    if (error) {
        throw error;
    }

    return data || [];
}

/**
 * Get daily production history
 */
export async function getDailyProduction(userId, limit = 100) {
    const { data, error } = await supabase
        .from('daily_production')
        .select('*, user_assets(asset_type, shares)')
        .eq('user_id', userId)
        .order('production_date', { ascending: false })
        .limit(limit);

    if (error) {
        throw error;
    }

    return data || [];
}

/**
 * Get transactions for a user
 */
export async function getTransactions(userId, limit = 100) {
    const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('timestamp', { ascending: false })
        .limit(limit);

    if (error) {
        throw error;
    }

    return data || [];
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

    return data || [];
}

/**
 * Get user missions
 */
export async function getUserMissions(userId) {
    const { data, error } = await supabase
        .from('missions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

    if (error) {
        throw error;
    }

    return data || [];
}

/**
 * Claim mission reward
 */
export async function claimMissionReward(userId, missionId) {
    const gameState = await getOrCreateGameState(userId);
    
    // Get mission
    const { data: mission, error: fetchError } = await supabase
        .from('missions')
        .select('*')
        .eq('user_id', userId)
        .eq('mission_id', missionId)
        .eq('status', 'completed')
        .single();
    
    if (fetchError || !mission) {
        throw new Error('Mission not found or not completed');
    }
    
    // Get mission config
    const missionConfig = MISSIONS[missionId];
    if (!missionConfig) {
        throw new Error('Mission config not found');
    }
    
    // Update mission status to claimed
    await supabase
        .from('missions')
        .update({ status: 'claimed', claimed_at: new Date().toISOString() })
        .eq('id', mission.id);
    
    // Award rewards (tokens and XP)
    const newTokens = gameState.tokens + missionConfig.reward_tokens;
    const { xp: newXP, level: newLevel } = addXP(gameState.xp, missionConfig.reward_xp);
    
    await updateGameState(userId, {
        tokens: newTokens,
        xp: newXP,
        level: newLevel,
    });
    
    return { 
        success: true,
        tokensAwarded: missionConfig.reward_tokens,
        xpAwarded: missionConfig.reward_xp,
        newTokens,
        newXP,
        newLevel,
    };
}

/**
 * Get portfolio summary
 */
export async function getPortfolioSummary(userId) {
    const userAssets = await getUserAssets(userId);
    
    let totalShares = 0;
    let totalDailyProduction = 0;
    const portfolio = [];
    
    for (const asset of userAssets) {
        if (asset.shares === 0) continue;
        
        const dailyProd = calculateDailyProduction(asset.asset_type, asset.shares);
        totalShares += asset.shares;
        totalDailyProduction += dailyProd;
        
        portfolio.push({
            ...asset,
            ownershipPercentage: (asset.shares / 4) * 100,
            dailyProduction: dailyProd,
        });
    }
    
    return {
        totalShares,
        totalDailyProduction,
        portfolio,
    };
}

/**
 * Get complete user profile (for parent dashboard)
 */
export async function getUserProfile(userId) {
    const [gameState, userAssets, badges, events, dailyProduction, transactions] = await Promise.all([
        getOrCreateGameState(userId),
        getUserAssets(userId),
        getEarnedBadges(userId),
        getEventHistory(userId, 100),
        getDailyProduction(userId, 100),
        getTransactions(userId, 100),
    ]);

    // Calculate totals
    const totalProduction = dailyProduction.reduce((sum, prod) => sum + prod.tokens_earned, 0);
    const totalGoldProtection = events
        .filter(e => e.asset_type === 'gold' && e.token_effect > 0)
        .reduce((sum, e) => sum + e.token_effect, 0);

    return {
        gameState,
        userAssets,
        badges,
        events,
        dailyProduction,
        transactions,
        summary: {
            totalEvents: events.length,
            totalBadges: badges.length,
            currentDay: gameState.current_day,
            currentLevel: gameState.level,
            currentXP: gameState.xp,
            currentTokens: gameState.tokens,
            totalProduction,
            totalGoldProtection,
        }
    };
}

// ============================================
// PARENT AUTH HELPER FUNCTIONS
// ============================================

/**
 * Check if a PIN already exists in the database
 */
async function checkPinExists(pin) {
    const { data, error } = await supabase
        .from('parent_codes')
        .select('id')
        .eq('parent_pin', pin)
        .single();

    // If error and it's "not found", PIN doesn't exist
    if (error && error.code === 'PGRST116') {
        return false;
    }

    // If error for other reasons, throw it
    if (error) {
        throw error;
    }

    // If data exists, PIN is taken
    return !!data;
}

/**
 * Generate a unique 4-digit PIN (1000-9999)
 */
export async function generateUniquePin(maxRetries = 100) {
    for (let i = 0; i < maxRetries; i++) {
        const pin = Math.floor(1000 + Math.random() * 9000).toString();
        const exists = await checkPinExists(pin);
        if (!exists) {
            return pin;
        }
    }
    throw new Error('Failed to generate unique PIN after maximum retries');
}

/**
 * Get parent code by kid username
 */
export async function getParentCodeByUsername(kidUsername) {
    const { data, error } = await supabase
        .from('parent_codes')
        .select('*')
        .eq('kid_username', kidUsername)
        .single();

    if (error && error.code === 'PGRST116') {
        return null; // Not found
    }

    if (error) {
        throw error;
    }

    return data;
}

/**
 * Create parent code record
 */
export async function createParentCode(kidUsername, parentPin, gameStateId) {
    const { data, error } = await supabase
        .from('parent_codes')
        .insert({
            kid_username: kidUsername,
            parent_pin: parentPin,
            game_state_id: gameStateId,
        })
        .select()
        .single();

    if (error) {
        throw error;
    }

    return data;
}

/**
 * Validate parent login (username + PIN)
 */
export async function validateParentLogin(kidUsername, parentPin) {
    const { data, error } = await supabase
        .from('parent_codes')
        .select('*')
        .eq('kid_username', kidUsername)
        .eq('parent_pin', parentPin)
        .single();

    if (error && error.code === 'PGRST116') {
        return null; // Invalid credentials
    }

    if (error) {
        throw error;
    }

    return data;
}

/**
 * Setup kid account (creates game_state if needed, generates PIN)
 */
export async function setupKidAccount(kidUsername) {
    // Step 1: Check if parent_code already exists
    const existingCode = await getParentCodeByUsername(kidUsername);
    if (existingCode) {
        return {
            success: true,
            parent_pin: existingCode.parent_pin,
            game_state_id: existingCode.game_state_id,
            message: "Account already set up. Here's your PIN.",
        };
    }

    // Step 2: Get or create game_state (handles both new and existing kids)
    const gameState = await getOrCreateGameState(kidUsername);

    // Step 3: Generate unique PIN
    const pin = await generateUniquePin();

    // Step 4: Create parent_code
    const parentCode = await createParentCode(kidUsername, pin, gameState.id);

    return {
        success: true,
        parent_pin: pin,
        game_state_id: gameState.id,
        message: "Account set up successfully!",
    };
}
