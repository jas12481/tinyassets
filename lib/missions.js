export const MISSIONS = {
  // Tutorial (Level 1)
  tutorial_1: {
    id: 'tutorial_1',
    name: 'Asset Detective',
    description: 'Complete the tutorial',
    level: 1,
    reward: { tokens: 5, xp: 10 },
    autoComplete: true, // Completes during tutorial
    checkComplete: (gameState) => gameState.tutorialComplete
  },
  
  tutorial_2: {
    id: 'tutorial_2',
    name: 'First Share',
    description: 'Buy your first share of any asset',
    level: 1,
    reward: { tokens: 5, xp: 10 },
    checkComplete: (gameState) => {
      return Object.values(gameState.portfolio).some(shares => shares > 0);
    }
  },

  // Beginner (Level 1-2)
  beginner_1: {
    id: 'beginner_1',
    name: 'Scale Up',
    description: 'Reach 50% ownership (2 shares) in any asset',
    level: 1,
    reward: { tokens: 10, xp: 15 },
    checkComplete: (gameState) => {
      return Object.values(gameState.portfolio).some(shares => shares >= 2);
    }
  },
  
  beginner_2: {
    id: 'beginner_2',
    name: 'Steady Earner',
    description: 'Earn 20+ tokens total from assets',
    level: 1,
    reward: { tokens: 5, xp: 10 },
    checkComplete: (gameState) => gameState.totalEarned >= 20
  },

  // Intermediate (Level 2-3)
  intermediate_1: {
    id: 'intermediate_1',
    name: 'Diversification',
    description: 'Own shares in 2 different assets',
    level: 2,
    reward: { tokens: 10, xp: 20 },
    checkComplete: (gameState) => {
      const ownedAssets = Object.values(gameState.portfolio).filter(shares => shares > 0);
      return ownedAssets.length >= 2;
    }
  },

  intermediate_2: {
    id: 'intermediate_2',
    name: 'Crisis Prepared',
    description: 'Own Gold when a crisis event happens',
    level: 2,
    reward: { tokens: 15, xp: 25 },
    checkComplete: (gameState) => {
      return gameState.portfolio.gold > 0 && gameState.experiencedCrisis;
    }
  },

  // Advanced (Level 3-4)
  advanced_1: {
    id: 'advanced_1',
    name: 'Full Ownership',
    description: 'Reach 100% ownership (4 shares) of any asset',
    level: 3,
    reward: { tokens: 20, xp: 30 },
    checkComplete: (gameState) => {
      return Object.values(gameState.portfolio).some(shares => shares >= 4);
    }
  },

  advanced_2: {
    id: 'advanced_2',
    name: 'Portfolio Master',
    description: 'Own 100% of all 3 assets simultaneously',
    level: 3,
    reward: { tokens: 30, xp: 40 },
    checkComplete: (gameState) => {
      return gameState.portfolio.property >= 4 && 
             gameState.portfolio.solar >= 4 && 
             gameState.portfolio.gold >= 4;
    }
  },

  // Expert (Level 4-5)
  expert_1: {
    id: 'expert_1',
    name: 'Efficiency King',
    description: 'Reach 10+ tokens/day production',
    level: 4,
    reward: { tokens: 25, xp: 40 },
    checkComplete: (gameState) => gameState.dailyProduction >= 10
  }
};

// Helper to check all missions
export function checkMissions(gameState, completedMissions) {
  const newlyCompleted = [];
  
  Object.values(MISSIONS).forEach(mission => {
    // Skip if already completed
    if (completedMissions.includes(mission.id)) return;
    
    // Skip if level too low
    if (gameState.level < mission.level) return;
    
    // Check if complete
    if (mission.checkComplete(gameState)) {
      newlyCompleted.push(mission);
    }
  });
  
  return newlyCompleted;
}