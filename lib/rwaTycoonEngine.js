// RWA Tycoon Game Engine
// Complete game logic matching the RWA Tycoon design document

export class RWATycoonEngine {
  constructor() {
    this.levels = {
      1: { xp: 0, unlocks: ['Tutorial missions'] },
      2: { xp: 50, unlocks: ['Can buy 2nd asset'] },
      3: { xp: 120, unlocks: ['Asset upgrades available'] },
      4: { xp: 250, unlocks: ['Advanced missions'] },
      5: { xp: 500, unlocks: ['WIN + Sandbox Mode'] }
    };
    this.eventProbability = 0.30; // 30% chance per day
  }

  // Calculate level from XP
  calculateLevel(xp) {
    if (xp >= 500) return 5;
    if (xp >= 250) return 4;
    if (xp >= 120) return 3;
    if (xp >= 50) return 2;
    return 1;
  }

  // Daily production rates (scaled by shares)
  // Property: +1 token per share per day
  // Solar: +0.5 tokens per share per day (base)
  // Gold: 0 tokens per share per day (only during events)
  getDailyProduction(assetId, shares) {
    if (!shares || shares === 0) return 0;
    
    switch (assetId) {
      case 'property':
        return shares * 1; // +1 per share
      case 'solar':
        return shares * 0.5; // +0.5 per share
      case 'gold':
        return 0; // Only during events
      default:
        return 0;
    }
  }

  // Get event effect scaled by shares
  getEventEffect(assetId, shares, eventEffect) {
    if (!shares || shares === 0) return 0;
    
    // Effects are per share
    switch (assetId) {
      case 'solar':
        if (eventEffect.includes('Heatwave')) return shares * 2; // +2 per share
        if (eventEffect.includes('Cloudy')) return shares * -0.5; // -0.5 per share
        if (eventEffect.includes('Perfect')) return shares * 1.5; // +1.5 per share
        if (eventEffect.includes('Storm')) return shares * -1; // -1 per share
        break;
      case 'property':
        if (eventEffect.includes('Housing Boom')) return shares * 1.5; // +1.5 per share
        if (eventEffect.includes('Recession')) return shares * -1; // -1 per share
        if (eventEffect.includes('New Jobs')) return shares * 1.25; // +1.25 per share
        if (eventEffect.includes('Factory')) return shares * -0.75; // -0.75 per share
        if (eventEffect.includes('Storm')) return shares * -0.5; // -0.5 per share
        if (eventEffect.includes('Recovery')) return shares * 2; // +2 per share
        break;
      case 'gold':
        if (eventEffect.includes('Market Crash')) return shares * 4; // +4 per share
        if (eventEffect.includes('Global Panic')) return shares * 5; // +5 per share
        if (eventEffect.includes('War')) return shares * 3; // +3 per share
        if (eventEffect.includes('Recovery')) return shares * -1; // -1 per share
        if (eventEffect.includes('Recession')) return shares * 1.5; // +1.5 per share (mild uncertainty)
        if (eventEffect.includes('Factory')) return shares * 1; // +1 per share (mild uncertainty)
        break;
    }
    return 0;
  }

  // Trigger random event (scales with days: 20% → 30% → 40%)
  triggerEvent(day) {
    let probability = this.eventProbability;
    if (day <= 5) probability = 0.20; // 20% early game
    else if (day <= 15) probability = 0.30; // 30% mid game
    else probability = 0.40; // 40% late game
    return Math.random() < probability;
  }

  // Get event type based on categories
  getRandomEvent() {
    const random = Math.random();
    
    if (random < 0.4) {
      // Environmental Events (40% of events)
      return this.getEnvironmentalEvent();
    } else if (random < 0.7) {
      // Economic Events (30% of events)
      return this.getEconomicEvent();
    } else {
      // Crisis Events (30% of events)
      return this.getCrisisEvent();
    }
  }

  getEnvironmentalEvent() {
    const random = Math.random();
    // Heatwave 15%, Cloudy 12%, Perfect Weather 8%, Storm 5%
    if (random < 0.375) { // 15/40
      return {
        type: 'environmental',
        name: 'Heatwave',
        description: 'Super sunny weather!',
        effectType: 'Heatwave'
      };
    } else if (random < 0.675) { // 12/40
      return {
        type: 'environmental',
        name: 'Cloudy Week',
        description: 'Many cloudy days this week',
        effectType: 'Cloudy'
      };
    } else if (random < 0.875) { // 8/40
      return {
        type: 'environmental',
        name: 'Perfect Weather',
        description: 'Ideal sunny conditions!',
        effectType: 'Perfect'
      };
    } else { // 5/40
      return {
        type: 'environmental',
        name: 'Storm',
        description: 'Severe weather conditions',
        effectType: 'Storm'
      };
    }
  }

  getEconomicEvent() {
    const random = Math.random();
    // Housing Boom 12%, Recession 10%, New Jobs 10%, Factory Closures 8%
    if (random < 0.30) { // 12/40
      return {
        type: 'economic',
        name: 'Housing Boom',
        description: 'Real estate market is booming!',
        effectType: 'Housing Boom'
      };
    } else if (random < 0.55) { // 10/40
      return {
        type: 'economic',
        name: 'Recession',
        description: 'Economic downturn affects markets',
        effectType: 'Recession'
      };
    } else if (random < 0.80) { // 10/40
      return {
        type: 'economic',
        name: 'New Jobs Created',
        description: 'New businesses bring opportunities',
        effectType: 'New Jobs'
      };
    } else { // 8/40
      return {
        type: 'economic',
        name: 'Factory Closures',
        description: 'Economic uncertainty rises',
        effectType: 'Factory'
      };
    }
  }

  getCrisisEvent() {
    const random = Math.random();
    // Market Crash 7%, Global Panic 5%, War News 4%, Recovery 4%
    if (random < 0.35) { // 7/20
      return {
        type: 'crisis',
        name: 'Market Crash',
        description: 'Stock market crashes!',
        effectType: 'Market Crash'
      };
    } else if (random < 0.60) { // 5/20
      return {
        type: 'crisis',
        name: 'Global Panic',
        description: 'Uncertainty causes panic',
        effectType: 'Global Panic'
      };
    } else if (random < 0.80) { // 4/20
      return {
        type: 'crisis',
        name: 'War News',
        description: 'Geopolitical tensions rise',
        effectType: 'War'
      };
    } else { // 4/20
      return {
        type: 'crisis',
        name: 'Recovery Announcement',
        description: 'Markets recovering!',
        effectType: 'Recovery'
      };
    }
  }

  // Generate morning indicators (Weather, Economy, Crisis Risk)
  generateMorningIndicators() {
    return {
      weather: this.getRandomWeather(),
      economy: this.getRandomEconomy(),
      crisisRisk: this.getRandomCrisisRisk()
    };
  }

  getRandomWeather() {
    const rand = Math.random();
    if (rand < 0.4) return { type: 'sunny', emoji: '☀️', label: 'Sunny' };
    if (rand < 0.7) return { type: 'cloudy', emoji: '☁️', label: 'Cloudy' };
    return { type: 'stormy', emoji: '⛈️', label: 'Stormy' };
  }

  getRandomEconomy() {
    const rand = Math.random();
    if (rand < 0.3) return { type: 'boom', emoji: '📈', label: 'Boom' };
    if (rand < 0.7) return { type: 'stable', emoji: '📊', label: 'Stable' };
    return { type: 'recession', emoji: '📉', label: 'Recession' };
  }

  getRandomCrisisRisk() {
    const rand = Math.random();
    if (rand < 0.6) return { level: 'low', percent: Math.floor(Math.random() * 15), emoji: '🟢', label: 'Low' };
    if (rand < 0.85) return { level: 'medium', percent: 15 + Math.floor(Math.random() * 25), emoji: '🟡', label: 'Medium' };
    return { level: 'high', percent: 40 + Math.floor(Math.random() * 60), emoji: '🔴', label: 'High' };
  }

  // Check badge unlocks based on game stats
  checkBadgeUnlocks(gameStats) {
    const badges = [];
    const { 
      ownedAssets, 
      eventsExperienced, 
      totalTokens,
      daysPlayed,
      portfolioValue,
      upgradesCompleted,
      soldAssets,
      crisisEventsSurvived
    } = gameStats;

    // Starter Badges
    if (ownedAssets.length > 0 && !gameStats.badges.find(b => b.badge_id === 'first_steps')) {
      badges.push({
        badge_id: 'first_steps',
        badge_name: 'First Steps',
        emoji: '🌱',
        learning: 'I understand how to allocate capital',
        bonus: '+5 token storage capacity'
      });
    }

    if (ownedAssets.includes('solar') && !gameStats.badges.find(b => b.badge_id === 'solar_pioneer')) {
      badges.push({
        badge_id: 'solar_pioneer',
        badge_name: 'Solar Pioneer',
        emoji: '☀️',
        learning: 'I understand productive assets depend on conditions',
        bonus: 'See 1-day weather forecast'
      });
    }

    if (ownedAssets.includes('property') && !gameStats.badges.find(b => b.badge_id === 'property_mogul')) {
      badges.push({
        badge_id: 'property_mogul',
        badge_name: 'Property Mogul',
        emoji: '🏠',
        learning: 'I understand steady income generation',
        bonus: '+1 token/day passive bonus'
      });
    }

    if (ownedAssets.includes('gold') && !gameStats.badges.find(b => b.badge_id === 'gold_guardian')) {
      badges.push({
        badge_id: 'gold_guardian',
        badge_name: 'Gold Guardian',
        emoji: '🪙',
        learning: 'I understand protective assets',
        bonus: 'Get crisis event warning (1 day advance)'
      });
    }

    // Understanding Badges
    const solarEvents = eventsExperienced.filter(e => e.type === 'environmental').length;
    if (solarEvents >= 3 && !gameStats.badges.find(b => b.badge_id === 'environmental_dependency')) {
      badges.push({
        badge_id: 'environmental_dependency',
        badge_name: 'Environmental Dependency',
        emoji: '🌦️',
        learning: 'Renewable energy depends on environmental conditions',
        bonus: 'Solar never drops below 0 tokens/day'
      });
    }

    const propertyEvents = eventsExperienced.filter(e => e.type === 'economic').length;
    if (propertyEvents >= 3 && !gameStats.badges.find(b => b.badge_id === 'economic_sensitivity')) {
      badges.push({
        badge_id: 'economic_sensitivity',
        badge_name: 'Economic Sensitivity',
        emoji: '📊',
        learning: 'Real estate responds to economic cycles',
        bonus: 'Property immune to recession events'
      });
    }

    // Strategy Badges
    if (ownedAssets.length >= 2 && daysPlayed >= 5 && !gameStats.badges.find(b => b.badge_id === 'diversified_portfolio')) {
      badges.push({
        badge_id: 'diversified_portfolio',
        badge_name: 'Diversified Portfolio',
        emoji: '🎯',
        learning: 'Diversification reduces risk',
        bonus: '+10% production on all assets'
      });
    }

    if (soldAssets >= 3 && !gameStats.badges.find(b => b.badge_id === 'active_manager')) {
      badges.push({
        badge_id: 'active_manager',
        badge_name: 'Active Manager',
        emoji: '⚡',
        learning: 'Portfolio management requires active decisions',
        bonus: 'Sell assets at 75% value instead of 60%'
      });
    }

    // Mastery Badges
    if (totalTokens >= 200 && !gameStats.badges.find(b => b.badge_id === 'capital_master')) {
      badges.push({
        badge_id: 'capital_master',
        badge_name: 'Capital Master',
        emoji: '💰',
        learning: 'Capital accumulation requires strategy',
        bonus: 'All asset costs reduced by 10%'
      });
    }

    // Ultimate Badge
    const level = this.calculateLevel(gameStats.xp);
    if (level >= 5 && !gameStats.badges.find(b => b.badge_id === 'rwa_tycoon')) {
      badges.push({
        badge_id: 'rwa_tycoon',
        badge_name: 'RWA Tycoon',
        emoji: '👑',
        learning: 'I understand how real-world assets behave and interact',
        bonus: 'Unlock Sandbox Mode + Free Play'
      });
    }

    return badges;
  }

  // Check mission progress
  checkMissionProgress(missionId, gameStats) {
    const missions = {
      'asset_detective': {
        completed: gameStats.assetsViewed?.length >= 3,
        reward: { tokens: 5 }
      },
      'first_purchase': {
        completed: gameStats.ownedAssets?.length >= 1,
        reward: { xp: 10 }
      },
      'diversification': {
        completed: gameStats.ownedAssets?.length >= 2,
        reward: { tokens: 10 }
      },
      'portfolio_master': {
        completed: gameStats.ownedAssets?.length >= 3,
        reward: { tokens: 20 }
      }
    };
    return missions[missionId];
  }

  // Format for database (matches schema)
  formatGameStateForDB(userId, state) {
    return {
      user_id: userId,
      selected_asset: state.selectedAsset || null,
      xp: state.xp || 0,
      level: this.calculateLevel(state.xp || 0),
      updated_at: new Date().toISOString()
    };
  }

  formatEventForDB(userId, event, portfolio) {
    return {
      user_id: userId,
      asset_type: event.affectedAssets?.join(',') || 'none',
      event_name: event.name,
      effect_description: event.description,
      effect_value: Object.values(event.effects || {}).reduce((a, b) => a + b, 0),
      timestamp: event.timestamp || new Date().toISOString()
    };
  }
}

