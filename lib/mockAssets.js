export const ASSETS = {
  property: {
    id: 'property',
    name: '🏠 Property',
    emoji: '🏠',
    description: 'Rental houses that earn steady income',
    
    // Share system
    costPerShare: 5,
    maxShares: 4,
    productionPerShare: 1, // +1 token per share per day
    
    // RWA Education
    realWorldInfo: {
      whatItIs: "Each share = 25% ownership of a rental house",
      howItWorks: "When tenants pay rent, you get your share of the income",
      whyTokenize: "Real houses cost $500,000! Shares let you own a piece for just $5"
    },
    
    // Events (scaled by shares owned)
    events: [
      {
        name: 'housing_boom',
        emoji: '📈',
        message: 'Housing boom! Property values rising!',
        effectPerShare: +1.5,
        probability: 0.12,
        lesson: 'Good economy = higher property values'
      },
      {
        name: 'recession',
        emoji: '📉',
        message: 'Economic recession... fewer renters',
        effectPerShare: -1,
        probability: 0.10,
        lesson: 'Bad economy hurts property income'
      },
      {
        name: 'new_jobs',
        emoji: '💼',
        message: 'New jobs created! More people need housing!',
        effectPerShare: +1.25,
        probability: 0.10,
        lesson: 'More jobs = more renters = more income'
      },
      {
        name: 'storm',
        emoji: '⛈️',
        message: 'Storm damaged the roof!',
        effectPerShare: -0.5,
        probability: 0.05,
        lesson: 'Properties need repairs sometimes'
      }
    ]
  },

  solar: {
    id: 'solar',
    name: '☀️ Solar Farm',
    emoji: '☀️',
    description: 'Solar panels that make clean electricity',
    
    costPerShare: 5,
    maxShares: 4,
    productionPerShare: 0.5, // +0.5 tokens per share per day
    
    realWorldInfo: {
      whatItIs: "Each share = 25% ownership of a solar energy farm",
      howItWorks: "Solar panels make electricity, you earn when it's sold",
      whyTokenize: "Solar farms cost millions! Shares let you support clean energy for just $5"
    },
    
    events: [
      {
        name: 'heatwave',
        emoji: '🔥',
        message: 'Heatwave! Maximum sunshine!',
        effectPerShare: +2,
        probability: 0.15,
        lesson: 'More sun = more electricity = more money!'
      },
      {
        name: 'cloudy_week',
        emoji: '☁️',
        message: 'Cloudy week... less energy produced',
        effectPerShare: -0.5,
        probability: 0.12,
        lesson: 'Solar depends on weather'
      },
      {
        name: 'perfect_weather',
        emoji: '🌞',
        message: 'Perfect sunny conditions!',
        effectPerShare: +1.5,
        probability: 0.08,
        lesson: 'Consistent sun = reliable income'
      },
      {
        name: 'storm',
        emoji: '⛈️',
        message: 'Storm damaged some panels!',
        effectPerShare: -1,
        probability: 0.05,
        lesson: 'Weather can damage solar equipment'
      }
    ]
  },

  gold: {
    id: 'gold',
    name: '🪙 Gold',
    emoji: '🪙',
    description: 'Safe precious metal for protection',
    
    costPerShare: 10, // More expensive!
    maxShares: 4,
    productionPerShare: 0, // No daily production
    
    realWorldInfo: {
      whatItIs: "Each share = 25% ownership of physical gold bars in a vault",
      howItWorks: "Gold doesn't produce income daily, but protects you during bad times",
      whyTokenize: "Gold bars are expensive and hard to store! Shares solve this"
    },
    
    events: [
      {
        name: 'market_crash',
        emoji: '💥',
        message: 'MARKET CRASH! Everyone buying gold!',
        effectPerShare: +4,
        probability: 0.07,
        lesson: 'Gold protects wealth during scary times',
        crisisEvent: true
      },
      {
        name: 'global_panic',
        emoji: '😱',
        message: 'Global panic! Gold is safety!',
        effectPerShare: +5,
        probability: 0.05,
        lesson: 'During fear, people trust gold',
        crisisEvent: true
      },
      {
        name: 'recession',
        emoji: '📉',
        message: 'Recession! People want safe assets',
        effectPerShare: +1.5,
        probability: 0.10,
        lesson: 'Gold holds value when economy struggles',
        mildUncertainty: true
      },
      {
        name: 'recovery',
        emoji: '📈',
        message: 'Economy recovering! Gold demand drops',
        effectPerShare: -1,
        probability: 0.04,
        lesson: 'When times are good, gold is less popular'
      }
    ]
  }
};

// Game configuration
export const GAME_CONFIG = {
  startingTokens: 15,
  eventProbability: 0.30, // 30% chance per day
  
  levels: {
    1: { xpRequired: 0, unlocks: 'Property & Solar available' },
    2: { xpRequired: 50, unlocks: 'Gold unlocked!' },
    3: { xpRequired: 120, unlocks: 'Expert missions' },
    4: { xpRequired: 250, unlocks: 'Master missions' },
    5: { xpRequired: 500, unlocks: 'WIN - Parent Certificate' }
  },
  
  sellValuePercent: 0.60 // Get 60% back when selling
};