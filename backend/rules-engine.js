/**
 * TinyAssets Rules Engine
 * Handles asset behavior, events, XP calculation, and badge unlocking
 */

// ============================================
// XP & Level Configuration
// ============================================

const XP_THRESHOLDS = {
    1: 0,      // Level 1 starts at 0 XP
    2: 100,    // Level 2 at 100 XP
    3: 300,    // Level 3 at 300 XP
    4: 600,    // Level 4 at 600 XP
    5: 1000,   // Level 5 at 1000 XP
    6: 1500,   // Level 6 at 1500 XP
    7: 2100,   // Level 7 at 2100 XP
    8: 2800,   // Level 8 at 2800 XP
    9: 3600,   // Level 9 at 3600 XP
    10: 4500,  // Level 10 at 4500 XP
};

// XP rewards
const XP_REWARDS = {
    ASSET_SELECTED: 10,
    EVENT_TRIGGERED: 25,
    DAILY_LOGIN: 15,
    BADGE_EARNED: 50,
};

// ============================================
// Asset Events Configuration
// ============================================

const ASSET_EVENTS = {
    property: [
        {
            name: "New Park Built Nearby",
            description: "A beautiful park opens in your neighborhood!",
            effect: +15, // Percentage
            xpReward: 25,
        },
        {
            name: "New School Opens",
            description: "A top-rated school opens nearby!",
            effect: +20,
            xpReward: 30,
        },
        {
            name: "Neighborhood Improvement",
            description: "The area gets a major upgrade!",
            effect: +10,
            xpReward: 20,
        },
    ],
    solar: [
        {
            name: "Heatwave",
            description: "Extended sunny days boost solar output!",
            effect: +25,
            xpReward: 30,
        },
        {
            name: "Government Incentive",
            description: "New solar incentives announced!",
            effect: +15,
            xpReward: 25,
        },
        {
            name: "Cloudy Week",
            description: "Overcast weather reduces output slightly.",
            effect: -10,
            xpReward: 15, // Still learn from negative events
        },
    ],
    gold: [
        {
            name: "Economic Uncertainty",
            description: "Markets seek safe investments!",
            effect: +10,
            xpReward: 25,
        },
        {
            name: "Inflation Concerns",
            description: "People buy gold as a hedge!",
            effect: +15,
            xpReward: 30,
        },
        {
            name: "Strong Dollar",
            description: "Currency strength affects gold prices.",
            effect: -5,
            xpReward: 15,
        },
    ],
};

// ============================================
// Badge Configuration
// ============================================

const BADGES = {
    FIRST_ASSET_EXPLORED: {
        id: "first-asset-explored",
        name: "First Steps",
        description: "You explored your first asset!",
        assetType: null, // Global badge
        condition: (gameState, eventHistory) => {
            return eventHistory.length === 0 && gameState.selected_asset !== null;
        },
    },
    EVENT_SURVIVOR: {
        id: "event-survivor",
        name: "Event Survivor",
        description: "You experienced your first real-world event!",
        assetType: null,
        condition: (gameState, eventHistory) => {
            return eventHistory.length >= 1;
        },
    },
    LEVEL_5_LEARNER: {
        id: "level-5-learner",
        name: "Level 5 Learner",
        description: "You reached level 5! Keep learning!",
        assetType: null,
        condition: (gameState, eventHistory) => {
            return gameState.level >= 5;
        },
    },
    PROPERTY_MASTER: {
        id: "property-master",
        name: "Property Master",
        description: "You're a property expert!",
        assetType: "property",
        condition: (gameState, eventHistory) => {
            const propertyEvents = eventHistory.filter(e => e.asset_type === 'property');
            return propertyEvents.length >= 3;
        },
    },
    SOLAR_MASTER: {
        id: "solar-master",
        name: "Solar Master",
        description: "You understand solar energy!",
        assetType: "solar",
        condition: (gameState, eventHistory) => {
            const solarEvents = eventHistory.filter(e => e.asset_type === 'solar');
            return solarEvents.length >= 3;
        },
    },
    GOLD_MASTER: {
        id: "gold-master",
        name: "Gold Master",
        description: "You understand gold investments!",
        assetType: "gold",
        condition: (gameState, eventHistory) => {
            const goldEvents = eventHistory.filter(e => e.asset_type === 'gold');
            return goldEvents.length >= 3;
        },
    },
};

// ============================================
// Core Functions
// ============================================

/**
 * Calculate level from XP
 */
function calculateLevel(xp) {
    let level = 1;
    for (let lvl = 10; lvl >= 1; lvl--) {
        if (xp >= XP_THRESHOLDS[lvl]) {
            level = lvl;
            break;
        }
    }
    return level;
}

/**
 * Get random event for an asset
 */
function getRandomEvent(assetType) {
    const events = ASSET_EVENTS[assetType];
    if (!events || events.length === 0) {
        return null;
    }
    const randomIndex = Math.floor(Math.random() * events.length);
    return events[randomIndex];
}

/**
 * Calculate new XP after an action
 */
function addXP(currentXP, xpAmount) {
    const newXP = currentXP + xpAmount;
    const newLevel = calculateLevel(newXP);
    return { xp: newXP, level: newLevel };
}

/**
 * Check which badges should be unlocked
 */
function checkBadgeUnlocks(gameState, eventHistory, existingBadges) {
    const unlockedBadgeIds = existingBadges.map(b => b.badge_id);
    const newBadges = [];

    for (const [key, badge] of Object.entries(BADGES)) {
        // Skip if already unlocked
        if (unlockedBadgeIds.includes(badge.id)) {
            continue;
        }

        // Check condition
        if (badge.condition(gameState, eventHistory)) {
            newBadges.push(badge);
        }
    }

    return newBadges;
}

/**
 * Process event trigger
 */
function processEvent(userId, assetType, gameState) {
    const event = getRandomEvent(assetType);
    if (!event) {
        return null;
    }

    // Add XP for event
    const { xp: newXP, level: newLevel } = addXP(
        gameState.xp,
        event.xpReward
    );

    return {
        event: {
            name: event.name,
            description: event.description,
            effect: event.effect,
        },
        updatedGameState: {
            ...gameState,
            xp: newXP,
            level: newLevel,
        },
    };
}

// ============================================
// Export for use in Next.js API routes
// ============================================

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        XP_THRESHOLDS,
        XP_REWARDS,
        ASSET_EVENTS,
        BADGES,
        calculateLevel,
        getRandomEvent,
        addXP,
        checkBadgeUnlocks,
        processEvent,
    };
}
