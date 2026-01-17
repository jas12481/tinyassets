export const BADGES = {
    first_steps: {
      id: 'first_steps',
      name: 'First Steps',
      emoji: '🌱',
      description: 'Bought your first share!',
      lesson: 'You understand fractional ownership!',
      bonus: '+5 token storage',
      xp: 10,
      checkUnlock: (gameState) => {
        return Object.values(gameState.portfolio).some(shares => shares > 0);
      }
    },
  
    solar_pioneer: {
      id: 'solar_pioneer',
      name: 'Solar Pioneer',
      emoji: '☀️',
      description: 'Reached 100% Solar ownership',
      lesson: 'You understand renewable energy assets!',
      bonus: 'See 1-day weather forecast',
      xp: 10,
      checkUnlock: (gameState) => gameState.portfolio.solar >= 4
    },
  
    property_mogul: {
      id: 'property_mogul',
      name: 'Property Mogul',
      emoji: '🏠',
      description: 'Reached 100% Property ownership',
      lesson: 'You understand steady income generation!',
      bonus: '+1 token/day passive',
      xp: 10,
      checkUnlock: (gameState) => gameState.portfolio.property >= 4
    },
  
    gold_guardian: {
      id: 'gold_guardian',
      name: 'Gold Guardian',
      emoji: '🪙',
      description: 'Reached 100% Gold ownership',
      lesson: 'You understand protective assets!',
      bonus: 'Crisis warning 1 day early',
      xp: 10,
      checkUnlock: (gameState) => gameState.portfolio.gold >= 4
    },
  
    diversified: {
      id: 'diversified',
      name: 'Diversified Portfolio',
      emoji: '🎯',
      description: 'Own 50%+ of all 3 assets for 5 days',
      lesson: 'Diversification reduces risk!',
      bonus: '+10% production on all assets',
      xp: 25,
      checkUnlock: (gameState) => {
        return gameState.portfolio.property >= 2 &&
               gameState.portfolio.solar >= 2 &&
               gameState.portfolio.gold >= 2 &&
               gameState.daysDiversified >= 5;
      }
    },
  
    crisis_survivor: {
      id: 'crisis_survivor',
      name: 'Crisis Survivor',
      emoji: '🛡️',
      description: 'Owned Gold during 3 crisis events',
      lesson: 'Gold protects during bad times!',
      bonus: 'Crisis events -25% impact',
      xp: 30,
      checkUnlock: (gameState) => gameState.crisisSurvived >= 3
    }
  };
  
  // Check for newly unlocked badges
  export function checkBadges(gameState, unlockedBadges) {
    const newlyUnlocked = [];
    
    Object.values(BADGES).forEach(badge => {
      // Skip if already unlocked
      if (unlockedBadges.includes(badge.id)) return;
      
      // Check if unlocked
      if (badge.checkUnlock(gameState)) {
        newlyUnlocked.push(badge);
      }
    });
    
    return newlyUnlocked;
  }