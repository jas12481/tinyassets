import { ASSETS, GAME_CONFIG } from './mockAssets';

export class RWATycoonEngine {
  constructor() {
    this.gameState = this.initializeGame();
  }

  initializeGame() {
    return {
      // Tokens
      tokens: GAME_CONFIG.startingTokens,
      totalEarned: 0,
      
      // Portfolio (shares owned)
      portfolio: {
        property: 0,
        solar: 0,
        gold: 0
      },
      
      // Progression
      xp: 0,
      level: 1,
      day: 1,
      
      // Tracking
      completedMissions: [],
      unlockedBadges: [],
      eventHistory: [],
      tutorialComplete: false,
      
      // Stats
      dailyProduction: 0,
      experiencedCrisis: false,
      crisisSurvived: 0,
      daysDiversified: 0
    };
  }

  // Calculate daily production
  calculateDailyProduction(portfolio) {
    let total = 0;
    
    // Property: +1 per share
    total += portfolio.property * ASSETS.property.productionPerShare;
    
    // Solar: +0.5 per share
    total += portfolio.solar * ASSETS.solar.productionPerShare;
    
    // Gold: 0 (only during events)
    
    return total;
  }

  // Buy shares
  buyShares(assetId, numShares) {
    const asset = ASSETS[assetId];
    const cost = asset.costPerShare * numShares;
    const currentShares = this.gameState.portfolio[assetId];
    
    // Check if can afford
    if (this.gameState.tokens < cost) {
      return { success: false, message: 'Not enough tokens!' };
    }
    
    // Check if exceeds max
    if (currentShares + numShares > asset.maxShares) {
      return { success: false, message: `Max ${asset.maxShares} shares allowed!` };
    }
    
    // Execute purchase
    this.gameState.tokens -= cost;
    this.gameState.portfolio[assetId] += numShares;
    this.gameState.dailyProduction = this.calculateDailyProduction(this.gameState.portfolio);
    
    return {
      success: true,
      message: `Bought ${numShares} share(s) of ${asset.name}!`,
      newOwnership: (this.gameState.portfolio[assetId] / asset.maxShares) * 100
    };
  }

  // Sell shares
  sellShares(assetId, numShares) {
    const asset = ASSETS[assetId];
    const currentShares = this.gameState.portfolio[assetId];
    
    // Check if owns enough
    if (currentShares < numShares) {
      return { success: false, message: 'You don\'t own that many shares!' };
    }
    
    // Calculate return (60% of purchase price)
    const returnAmount = Math.floor(asset.costPerShare * numShares * GAME_CONFIG.sellValuePercent);
    
    // Execute sale
    this.gameState.tokens += returnAmount;
    this.gameState.portfolio[assetId] -= numShares;
    this.gameState.dailyProduction = this.calculateDailyProduction(this.gameState.portfolio);
    
    return {
      success: true,
      message: `Sold ${numShares} share(s) for ${returnAmount} tokens`,
      lostValue: (asset.costPerShare * numShares) - returnAmount
    };
  }

  // Process day
  processDay() {
    const results = {
      production: 0,
      event: null,
      eventEffect: 0
    };
    
    // Daily production
    results.production = this.gameState.dailyProduction;
    this.gameState.tokens += results.production;
    this.gameState.totalEarned += results.production;
    
    // Random event (30% chance)
    if (Math.random() < GAME_CONFIG.eventProbability) {
      results.event = this.triggerRandomEvent();
      results.eventEffect = results.event.totalEffect;
    }
    
    // Increment day
    this.gameState.day++;
    
    // Track diversification
    const ownedAssets = Object.values(this.gameState.portfolio).filter(s => s >= 2).length;
    if (ownedAssets >= 3) {
      this.gameState.daysDiversified++;
    }
    
    return results;
  }

  // Trigger random event
  triggerRandomEvent() {
    // Collect all possible events
    const allEvents = [];
    
    Object.entries(ASSETS).forEach(([assetId, asset]) => {
      asset.events.forEach(event => {
        allEvents.push({
          ...event,
          assetId,
          assetName: asset.name
        });
      });
    });
    
    // Pick random event
    const chosenEvent = allEvents[Math.floor(Math.random() * allEvents.length)];
    
    // Calculate effect based on shares owned
    const sharesOwned = this.gameState.portfolio[chosenEvent.assetId];
    const totalEffect = Math.floor(chosenEvent.effectPerShare * sharesOwned);
    
    // Apply effect
    this.gameState.tokens += totalEffect;
    
    // Track crisis
    if (chosenEvent.crisisEvent) {
      this.gameState.experiencedCrisis = true;
      if (this.gameState.portfolio.gold > 0) {
        this.gameState.crisisSurvived++;
      }
    }
    
    // Add to history
    this.gameState.eventHistory.push({
      day: this.gameState.day,
      event: chosenEvent.name,
      message: chosenEvent.message,
      effect: totalEffect
    });
    
    return {
      ...chosenEvent,
      sharesOwned,
      totalEffect,
      lesson: chosenEvent.lesson
    };
  }

  // Add XP and check level up
  addXP(amount) {
    this.gameState.xp += amount;
    
    // Check for level up
    const newLevel = this.calculateLevel(this.gameState.xp);
    if (newLevel > this.gameState.level) {
      this.gameState.level = newLevel;
      return { leveledUp: true, newLevel };
    }
    
    return { leveledUp: false };
  }

  calculateLevel(xp) {
    if (xp >= 500) return 5;
    if (xp >= 250) return 4;
    if (xp >= 120) return 3;
    if (xp >= 50) return 2;
    return 1;
  }

  getGameState() {
    return this.gameState;
  }
}