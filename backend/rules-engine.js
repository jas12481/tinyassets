/**
 * TinyAssets Rules Engine
 * Share-Based Fractional Ownership Game Mechanics
 */

// ============================================
// XP & Level Configuration
// ============================================

const XP_THRESHOLDS = {
    1: 0,      // Level 1 at 0 XP
    2: 50,     // Level 2 at 50 XP
    3: 120,    // Level 3 at 120 XP
    4: 250,    // Level 4 at 250 XP
    5: 500,    // Level 5 at 500 XP
};

// XP rewards
const XP_REWARDS = {
    ASSET_SELECTED: 10,
    EVENT_TRIGGERED: 25,
    BADGE_EARNED: 50,
};

// ============================================
// SHARE-BASED OWNERSHIP CONFIGURATION
// ============================================

const MAX_SHARES = 4; // 100% ownership = 4 shares

const SHARE_COSTS = {
    property: 5,   // 5 tokens per share
    solar: 5,      // 5 tokens per share
    gold: 10,      // 10 tokens per share
};

// Daily production per share (base rate)
const PRODUCTION_PER_SHARE = {
    property: 1,    // 1 token/day per share
    solar: 0.5,     // 0.5 tokens/day per share
    gold: 0,        // 0 tokens/day (no daily production)
};

// Gold crisis tokens per share
const GOLD_CRISIS_PER_SHARE = 4; // 4 tokens per share during crisis
const GOLD_MILD_UNCERTAINTY_PER_SHARE = 2; // 2 tokens per share during economic events

// Sell return rate
const SELL_RETURN_RATE = 0.6; // 60% of purchase price

// Calculate asset purchase cost
function getShareCost(assetType, numShares) {
    const costPerShare = SHARE_COSTS[assetType];
    return costPerShare * numShares;
}

// Calculate sell return
function calculateShareSaleReturn(assetType, numShares) {
    const costPerShare = SHARE_COSTS[assetType];
    const totalPaid = costPerShare * numShares;
    return Math.floor(totalPaid * SELL_RETURN_RATE);
}

// Calculate ownership percentage
function getOwnershipPercentage(shares) {
    return (shares / MAX_SHARES) * 100;
}

// Calculate daily production based on shares
function calculateDailyProduction(assetType, shares) {
    const baseProduction = PRODUCTION_PER_SHARE[assetType] * shares;
    return Math.floor(baseProduction); // Floor to handle Solar 0.5/share
}

// Calculate Gold crisis tokens
function calculateGoldCrisisTokens(shares) {
    return shares * GOLD_CRISIS_PER_SHARE;
}

// Calculate Gold mild uncertainty tokens
function calculateGoldMildUncertaintyTokens(shares) {
    return shares * GOLD_MILD_UNCERTAINTY_PER_SHARE;
}

// ============================================
// ASSET EVENTS CONFIGURATION (Scaled Per Share)
// ============================================

const ASSET_EVENTS = {
    // ENVIRONMENTAL EVENTS (40% of events)
    solar: [
        {
            name: "Heatwave",
            description: "Extreme heat! Solar farms working at maximum capacity.",
            eventType: "environmental",
            probability: 0.15,
            effects: {
                solar: { tokensPerShare: 2, xp: 30 }, // +2 tokens per share
                property: { tokensPerShare: 0, xp: 0 },
                gold: { tokensPerShare: 0, xp: 0 },
            },
        },
        {
            name: "Cloudy Week",
            description: "Limited sunlight this week. Solar output reduced.",
            eventType: "environmental",
            probability: 0.12,
            effects: {
                solar: { tokensPerShare: -0.5, xp: 15 },
                property: { tokensPerShare: 0, xp: 0 },
                gold: { tokensPerShare: 0, xp: 0 },
            },
        },
        {
            name: "Perfect Weather",
            description: "Ideal conditions for solar energy production.",
            eventType: "environmental",
            probability: 0.08,
            effects: {
                solar: { tokensPerShare: 1.5, xp: 20 },
                property: { tokensPerShare: 0, xp: 0 },
                gold: { tokensPerShare: 0, xp: 0 },
            },
        },
        {
            name: "Storm",
            description: "Severe weather damages infrastructure.",
            eventType: "environmental",
            probability: 0.05,
            effects: {
                solar: { tokensPerShare: -1, xp: 20 },
                property: { tokensPerShare: -0.5, xp: 15 },
                gold: { tokensPerShare: 0, xp: 0 },
            },
        },
    ],
    
    // ECONOMIC EVENTS (40% of events)
    property: [
        {
            name: "Housing Boom",
            description: "Strong demand for housing! Property values rising.",
            eventType: "economic",
            probability: 0.12,
            effects: {
                property: { tokensPerShare: 1.5, xp: 30 },
                solar: { tokensPerShare: 0, xp: 0 },
                gold: { tokensPerShare: 0, xp: 0 },
            },
        },
        {
            name: "Recession",
            description: "Economic downturn. Property demand falls, unemployment rises.",
            eventType: "economic",
            probability: 0.10,
            effects: {
                property: { tokensPerShare: -1, xp: 25 },
                solar: { tokensPerShare: -0.5, xp: 15 },
                gold: { tokensPerShare: 1.5, xp: 20, isMildUncertainty: true }, // Gold mild uncertainty
            },
        },
        {
            name: "New Jobs Created",
            description: "Major employer opens! Housing demand increases.",
            eventType: "economic",
            probability: 0.10,
            effects: {
                property: { tokensPerShare: 1.25, xp: 25 },
                solar: { tokensPerShare: 0, xp: 0 },
                gold: { tokensPerShare: 0, xp: 0 },
            },
        },
        {
            name: "Factory Closures",
            description: "Job losses in the area. Property market softens.",
            eventType: "economic",
            probability: 0.08,
            effects: {
                property: { tokensPerShare: -0.75, xp: 20 },
                solar: { tokensPerShare: 0, xp: 0 },
                gold: { tokensPerShare: 1, xp: 15, isMildUncertainty: true }, // Gold mild uncertainty
            },
        },
    ],
    
    // CRISIS EVENTS (20% of events)
    gold: [
        {
            name: "Market Crash",
            description: "Stock markets plunge! Investors flee to safe assets.",
            eventType: "crisis",
            probability: 0.07,
            effects: {
                gold: { tokensPerShare: 4, xp: 35 },
                property: { tokensPerShare: -1.5, xp: 25 },
                solar: { tokensPerShare: -1, xp: 20 },
            },
        },
        {
            name: "Global Panic",
            description: "Worldwide uncertainty! Safe haven demand spikes.",
            eventType: "crisis",
            probability: 0.05,
            effects: {
                gold: { tokensPerShare: 5, xp: 40 },
                property: { tokensPerShare: -1.25, xp: 25 },
                solar: { tokensPerShare: -1, xp: 20 },
            },
        },
        {
            name: "War News",
            description: "Geopolitical tensions rise. Safe haven demand increases.",
            eventType: "crisis",
            probability: 0.04,
            effects: {
                gold: { tokensPerShare: 3, xp: 30 },
                property: { tokensPerShare: -1, xp: 20 },
                solar: { tokensPerShare: 0, xp: 0 },
            },
        },
        {
            name: "Recovery Announcement",
            description: "Crisis over! Markets stabilizing, confidence returns.",
            eventType: "crisis",
            probability: 0.04,
            effects: {
                property: { tokensPerShare: 2, xp: 25 },
                solar: { tokensPerShare: 1, xp: 20 },
                gold: { tokensPerShare: -1, xp: 20 }, // Loses safe haven premium
            },
        },
    ],
};

// Get random event (can be for any asset type)
function getRandomEvent() {
    const assetTypes = ['property', 'solar', 'gold'];
    const selectedType = assetTypes[Math.floor(Math.random() * assetTypes.length)];
    
    const events = ASSET_EVENTS[selectedType];
    if (!events || events.length === 0) {
        return null;
    }
    
    // Weight by probability
    const random = Math.random();
    let cumulative = 0;
    
    for (const event of events) {
        cumulative += event.probability;
        if (random < cumulative) {
            return event;
        }
    }
    
    // Fallback to last event
    return events[events.length - 1];
}

// Calculate level from XP
function calculateLevel(xp) {
    let level = 1;
    for (let lvl = 5; lvl >= 1; lvl--) {
        if (xp >= XP_THRESHOLDS[lvl]) {
            level = lvl;
            break;
        }
    }
    return level;
}

// Add XP and recalculate level
function addXP(currentXP, xpAmount) {
    const newXP = currentXP + xpAmount;
    const newLevel = calculateLevel(newXP);
    return { xp: newXP, level: newLevel };
}

// Process event - affects all owned assets, scaled by shares
function processEvent(userAssets, gameState) {
    const event = getRandomEvent();
    if (!event) {
        return null;
    }

    let totalTokenEffect = 0;
    let totalXP = 0;
    const assetEffects = [];

    for (const asset of userAssets || []) {
        if (asset.shares === 0) continue; // Skip assets with no shares
        
        const effect = event.effects[asset.asset_type];
        if (effect) {
            let tokenEffect = effect.tokensPerShare * asset.shares;
            
            // Special handling for Gold
            if (asset.asset_type === 'gold') {
                if (event.eventType === 'crisis') {
                    tokenEffect = calculateGoldCrisisTokens(asset.shares);
                } else if (effect.isMildUncertainty) {
                    tokenEffect = calculateGoldMildUncertaintyTokens(asset.shares);
                }
            }
            
            totalTokenEffect += Math.floor(tokenEffect);
            totalXP += effect.xp; // XP not scaled
            
            assetEffects.push({
                assetType: asset.asset_type,
                shares: asset.shares,
                ownershipPercentage: getOwnershipPercentage(asset.shares),
                tokens: Math.floor(tokenEffect),
                xp: effect.xp,
                maxPossibleTokens: effect.tokensPerShare * MAX_SHARES, // Show what 100% would earn
            });
        }
    }

    const { xp: newXP, level: newLevel } = addXP(gameState.xp, totalXP);
    const newTokens = Math.max(0, gameState.tokens + totalTokenEffect);

    return {
        event: {
            name: event.name,
            description: event.description,
            eventType: event.eventType,
            effects: event.effects,
        },
        assetEffects,
        tokenEffect: totalTokenEffect,
        updatedGameState: {
            ...gameState,
            xp: newXP,
            level: newLevel,
            tokens: newTokens,
        },
    };
}

// Check if event should trigger (30% chance base, scales with progression)
function shouldTriggerEvent(dayNumber) {
    let probability = 0.30; // Base 30%
    
    if (dayNumber <= 5) {
        probability = 0.20; // Days 1-5: 20%
    } else if (dayNumber <= 15) {
        probability = 0.30; // Days 6-15: 30%
    } else {
        probability = 0.40; // Days 16+: 40%
    }
    
    return Math.random() < probability;
}

// ============================================
// MISSIONS CONFIGURATION
// ============================================

const MISSIONS = {
    'first-share': {
        id: 'first-share',
        name: 'First Share',
        description: 'Buy your first share of any asset (25%+ ownership)',
        category: 'tutorial',
        reward_tokens: 5,
        reward_xp: 10,
        checkComplete: (gameState, userAssets, eventHistory, dailyProduction, transactions) => {
            return userAssets.some(asset => asset.shares >= 1);
        }
    },
    'scale-up': {
        id: 'scale-up',
        name: 'Scale Up',
        description: 'Reach 50% ownership in any asset (2 shares)',
        category: 'beginner',
        reward_tokens: 10,
        reward_xp: 15,
        checkComplete: (gameState, userAssets, eventHistory, dailyProduction, transactions) => {
            return userAssets.some(asset => asset.shares >= 2);
        }
    },
    'steady-earner': {
        id: 'steady-earner',
        name: 'Steady Earner',
        description: 'Earn 20+ tokens total from asset production (cumulative)',
        category: 'beginner',
        reward_tokens: 5,
        reward_xp: 10,
        checkComplete: (gameState, userAssets, eventHistory, dailyProduction, transactions) => {
            const totalEarned = dailyProduction.reduce((sum, prod) => sum + prod.tokens_earned, 0);
            return totalEarned >= 20;
        }
    },
    'event-survivor': {
        id: 'event-survivor',
        name: 'Event Survivor',
        description: 'Experience your first event (any type)',
        category: 'beginner',
        reward_tokens: 3,
        reward_xp: 10,
        checkComplete: (gameState, userAssets, eventHistory, dailyProduction, transactions) => {
            return eventHistory.length >= 1;
        }
    },
    'diversification': {
        id: 'diversification',
        name: 'Diversification',
        description: 'Own shares in 2 different assets (25%+ each)',
        category: 'intermediate',
        reward_tokens: 10,
        reward_xp: 20,
        checkComplete: (gameState, userAssets, eventHistory, dailyProduction, transactions) => {
            const assetsWithShares = userAssets.filter(a => a.shares >= 1);
            return assetsWithShares.length >= 2;
        }
    },
    'weather-master': {
        id: 'weather-master',
        name: 'Weather Master',
        description: 'Own Solar during 3 weather events',
        category: 'intermediate',
        reward_tokens: 8,
        reward_xp: 15,
        checkComplete: (gameState, userAssets, eventHistory, dailyProduction, transactions) => {
            const hasSolar = userAssets.some(a => a.asset_type === 'solar' && a.shares > 0);
            const weatherEvents = eventHistory.filter(e => e.event_type === 'environmental');
            return hasSolar && weatherEvents.length >= 3;
        }
    },
    'smart-rebalance': {
        id: 'smart-rebalance',
        name: 'Smart Rebalance',
        description: 'Sell shares of one asset, buy shares of another',
        category: 'intermediate',
        reward_tokens: 5,
        reward_xp: 15,
        checkComplete: (gameState, userAssets, eventHistory, dailyProduction, transactions) => {
            const sells = transactions.filter(t => t.transaction_type === 'sell');
            const buys = transactions.filter(t => t.transaction_type === 'buy');
            // Check if they sold one asset and bought a different one
            if (sells.length === 0 || buys.length < 2) return false;
            
            const soldAssetTypes = [...new Set(sells.map(s => s.asset_type))];
            const boughtAssetTypes = [...new Set(buys.map(b => b.asset_type))];
            
            return soldAssetTypes.some(soldType => boughtAssetTypes.includes(soldType) === false);
        }
    },
    'crisis-prepared': {
        id: 'crisis-prepared',
        name: 'Crisis Prepared',
        description: 'Own Gold (25%+) when crisis event happens',
        category: 'advanced',
        reward_tokens: 15,
        reward_xp: 25,
        checkComplete: (gameState, userAssets, eventHistory, dailyProduction, transactions) => {
            const hasGold = userAssets.some(a => a.asset_type === 'gold' && a.shares >= 1);
            const crisisEvents = eventHistory.filter(e => e.event_type === 'crisis');
            return hasGold && crisisEvents.length >= 1;
        }
    },
    'full-ownership': {
        id: 'full-ownership',
        name: 'Full Ownership',
        description: 'Reach 100% ownership (4 shares) of any asset',
        category: 'advanced',
        reward_tokens: 20,
        reward_xp: 30,
        checkComplete: (gameState, userAssets, eventHistory, dailyProduction, transactions) => {
            return userAssets.some(asset => asset.shares >= 4);
        }
    },
    'portfolio-master': {
        id: 'portfolio-master',
        name: 'Portfolio Master',
        description: 'Own 100% (4 shares) of all 3 assets simultaneously',
        category: 'advanced',
        reward_tokens: 30,
        reward_xp: 40,
        checkComplete: (gameState, userAssets, eventHistory, dailyProduction, transactions) => {
            const property = userAssets.find(a => a.asset_type === 'property');
            const solar = userAssets.find(a => a.asset_type === 'solar');
            const gold = userAssets.find(a => a.asset_type === 'gold');
            return property?.shares >= 4 && solar?.shares >= 4 && gold?.shares >= 4;
        }
    },
    'efficiency-king': {
        id: 'efficiency-king',
        name: 'Efficiency King',
        description: 'Reach 10+ tokens/day average production',
        category: 'expert',
        reward_tokens: 25,
        reward_xp: 40,
        checkComplete: (gameState, userAssets, eventHistory, dailyProduction, transactions) => {
            // Calculate total daily production from all assets
            let totalDaily = 0;
            for (const asset of userAssets) {
                totalDaily += calculateDailyProduction(asset.asset_type, asset.shares);
            }
            return totalDaily >= 10;
        }
    },
    'timing-genius': {
        id: 'timing-genius',
        name: 'Timing Genius',
        description: 'Own shares when 3 positive events happen for that asset',
        category: 'expert',
        reward_tokens: 15,
        reward_xp: 35,
        checkComplete: (gameState, userAssets, eventHistory, dailyProduction, transactions) => {
            // Count positive events where user owned shares of that asset
            // We need to check if user owned that asset when event happened
            // For simplicity, check if user owns that asset type now and event was positive
            let positiveEventCount = 0;
            
            for (const event of eventHistory) {
                if (event.token_effect > 0) {
                    const asset = userAssets.find(a => a.asset_type === event.asset_type);
                    if (asset && asset.shares > 0) {
                        positiveEventCount++;
                    }
                }
            }
            
            return positiveEventCount >= 3;
        }
    },
    'perfect-portfolio': {
        id: 'perfect-portfolio',
        name: 'Perfect Portfolio',
        description: 'Own 75%+ of all 3 assets + have 100+ tokens saved',
        category: 'expert',
        reward_tokens: 50,
        reward_xp: 50,
        checkComplete: (gameState, userAssets, eventHistory, dailyProduction, transactions) => {
            const property = userAssets.find(a => a.asset_type === 'property');
            const solar = userAssets.find(a => a.asset_type === 'solar');
            const gold = userAssets.find(a => a.asset_type === 'gold');
            
            const hasProperty = property && property.shares >= 3;
            const hasSolar = solar && solar.shares >= 3;
            const hasGold = gold && gold.shares >= 3;
            const hasTokens = gameState.tokens >= 100;
            
            return hasProperty && hasSolar && hasGold && hasTokens;
        }
    },
};

// Check mission completion
function checkMissionCompletion(gameState, userAssets, eventHistory, dailyProduction, transactions) {
    const completedMissions = [];
    
    for (const [missionId, mission] of Object.entries(MISSIONS)) {
        if (mission.checkComplete(gameState, userAssets, eventHistory, dailyProduction, transactions || [])) {
            completedMissions.push({
                ...mission,
                completed: true
            });
        }
    }
    
    return completedMissions;
}

// ============================================
// BADGE CONFIGURATION
// ============================================

const BADGES = {
    FIRST_STEPS: {
        id: "first-steps",
        name: "First Steps",
        description: "You bought your first share!",
        assetType: null,
        reward_xp: 10,
        condition: (gameState, userAssets, eventHistory) => {
            return userAssets.some(asset => asset.shares >= 1);
        },
    },
    SOLAR_PIONEER: {
        id: "solar-pioneer",
        name: "Solar Pioneer",
        description: "You reached 100% Solar ownership!",
        assetType: "solar",
        reward_xp: 10,
        condition: (gameState, userAssets, eventHistory) => {
            const solar = userAssets.find(a => a.asset_type === 'solar');
            return solar && solar.shares >= 4;
        },
    },
    PROPERTY_MOGUL: {
        id: "property-mogul",
        name: "Property Mogul",
        description: "You reached 100% Property ownership!",
        assetType: "property",
        reward_xp: 10,
        condition: (gameState, userAssets, eventHistory) => {
            const property = userAssets.find(a => a.asset_type === 'property');
            return property && property.shares >= 4;
        },
    },
    GOLD_GUARDIAN: {
        id: "gold-guardian",
        name: "Gold Guardian",
        description: "You reached 100% Gold ownership!",
        assetType: "gold",
        reward_xp: 10,
        condition: (gameState, userAssets, eventHistory) => {
            const gold = userAssets.find(a => a.asset_type === 'gold');
            return gold && gold.shares >= 4;
        },
    },
    ENVIRONMENTAL_DEPENDENCY: {
        id: "environmental-dependency",
        name: "Environmental Dependency",
        description: "You experienced 5 weather events with Solar!",
        assetType: "solar",
        reward_xp: 15,
        condition: (gameState, userAssets, eventHistory) => {
            const hasSolar = userAssets.some(a => a.asset_type === 'solar' && a.shares > 0);
            const weatherEvents = eventHistory.filter(e => e.event_type === 'environmental');
            return hasSolar && weatherEvents.length >= 5;
        },
    },
    ECONOMIC_SENSITIVITY: {
        id: "economic-sensitivity",
        name: "Economic Sensitivity",
        description: "You experienced 5 economic events with Property!",
        assetType: "property",
        reward_xp: 15,
        condition: (gameState, userAssets, eventHistory) => {
            const hasProperty = userAssets.some(a => a.asset_type === 'property' && a.shares > 0);
            const economicEvents = eventHistory.filter(e => e.event_type === 'economic');
            return hasProperty && economicEvents.length >= 5;
        },
    },
    CRISIS_PROTECTION: {
        id: "crisis-protection",
        name: "Crisis Protection",
        description: "You earned tokens from Gold during 2 crisis events!",
        assetType: "gold",
        reward_xp: 20,
        condition: (gameState, userAssets, eventHistory) => {
            const hasGold = userAssets.some(a => a.asset_type === 'gold' && a.shares > 0);
            const crisisEvents = eventHistory.filter(e => e.event_type === 'crisis' && e.token_effect > 0);
            return hasGold && crisisEvents.length >= 2;
        },
    },
    DIVERSIFIED_PORTFOLIO: {
        id: "diversified-portfolio",
        name: "Diversified Portfolio",
        description: "Own 50%+ of all 3 assets for 5 days",
        assetType: null,
        reward_xp: 25,
        condition: (gameState, userAssets, eventHistory) => {
            // Simplified: check if they own 50%+ of all 3 assets
            const property = userAssets.find(a => a.asset_type === 'property');
            const solar = userAssets.find(a => a.asset_type === 'solar');
            const gold = userAssets.find(a => a.asset_type === 'gold');
            return property?.shares >= 2 && solar?.shares >= 2 && gold?.shares >= 2;
        },
    },
    RWA_TYCOON: {
        id: "rwa-tycoon",
        name: "RWA Tycoon",
        description: "Reach Level 5!",
        assetType: null,
        reward_xp: 0,
        condition: (gameState, userAssets, eventHistory) => {
            return gameState.level >= 5;
        },
    },
};

// Check badge unlocks
function checkBadgeUnlocks(gameState, userAssets, eventHistory, existingBadges) {
    const unlockedBadgeIds = existingBadges.map(b => b.badge_id);
    const newBadges = [];

    for (const [key, badge] of Object.entries(BADGES)) {
        if (unlockedBadgeIds.includes(badge.id)) {
            continue;
        }

        if (badge.condition(gameState, userAssets, eventHistory)) {
            newBadges.push(badge);
        }
    }

    return newBadges;
}

// ============================================
// Export for use in Next.js API routes
// ============================================

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        // XP & Levels
        XP_THRESHOLDS,
        XP_REWARDS,
        calculateLevel,
        addXP,
        
        // Share System
        MAX_SHARES,
        SHARE_COSTS,
        PRODUCTION_PER_SHARE,
        getShareCost,
        calculateShareSaleReturn,
        getOwnershipPercentage,
        calculateDailyProduction,
        calculateGoldCrisisTokens,
        calculateGoldMildUncertaintyTokens,
        
        // Events
        ASSET_EVENTS,
        getRandomEvent,
        processEvent,
        shouldTriggerEvent,
        
        // Missions
        MISSIONS,
        checkMissionCompletion,
        
        // Badges
        BADGES,
        checkBadgeUnlocks,
    };
}
