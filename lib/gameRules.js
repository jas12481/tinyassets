export class GameEngine {
    constructor() {
      this.xpPerEvent = 10;
      this.xpToLevel = 100;
      this.comboMultiplier = 1;
      this.lastEventTime = null;
    }
  
    calculateXP(currentXP, eventsTriggered, combo = 1) {
      return currentXP + (eventsTriggered * this.xpPerEvent * combo);
    }
  
    calculateLevel(xp) {
      return Math.floor(xp / this.xpToLevel) + 1;
    }

    calculateCombo(lastEventTime) {
      // If events happen within 30 seconds, create a combo
      if (!lastEventTime) return 1;
      const timeDiff = (new Date() - new Date(lastEventTime)) / 1000;
      if (timeDiff < 30) {
        return Math.min(3, Math.floor(30 / timeDiff)); // Max 3x combo
      }
      return 1;
    }
  
    triggerRandomEvent(asset) {
      const events = asset.events;
      const randomEvent = events[Math.floor(Math.random() * events.length)];
      const timestamp = new Date().toISOString();
      
      // Format event to match database schema: event_history table
      return {
        type: randomEvent.type,
        event_name: randomEvent.type, // matches DB: event_name
        effect: randomEvent.effect,
        effect_value: randomEvent.effect, // matches DB: effect_value (numeric)
        effect_description: randomEvent.message, // matches DB: effect_description
        message: randomEvent.message,
        asset_type: asset.id, // matches DB: asset_type
        timestamp: timestamp
      };
    }

    // Check multiple badge types based on different achievements
    checkBadgeUnlock(assetId, gameStats) {
      const { eventsCount, currentValue, highestValue, firstEvent, streaks } = gameStats;
      const badges = [];

      // Event-based badges (matches DB: earned_badges table)
      if (eventsCount === 1 && !firstEvent) {
        badges.push({ 
          badge_id: `${assetId}_first_event`,
          badge_name: 'First Event Explorer',
          emoji: '🌱',
          asset_type: assetId,
          unlocked_at: new Date().toISOString()
        });
      }
      if (eventsCount === 5) {
        badges.push({ 
          badge_id: `${assetId}_five_events`,
          badge_name: 'Getting Started',
          emoji: '⭐',
          asset_type: assetId,
          unlocked_at: new Date().toISOString()
        });
      }
      if (eventsCount === 10) {
        badges.push({ 
          badge_id: `${assetId}_ten_events`,
          badge_name: 'Learning Pro',
          emoji: '🎓',
          asset_type: assetId,
          unlocked_at: new Date().toISOString()
        });
      }
      if (eventsCount === 20) {
        badges.push({ 
          badge_id: `${assetId}_expert`,
          badge_name: 'Asset Expert',
          emoji: '🏆',
          asset_type: assetId,
          unlocked_at: new Date().toISOString()
        });
      }
      if (eventsCount === 50) {
        badges.push({ 
          badge_id: `${assetId}_master`,
          badge_name: 'Master Explorer',
          emoji: '👑',
          asset_type: assetId,
          unlocked_at: new Date().toISOString()
        });
      }

      // Value milestone badges
      if (currentValue >= 150 && highestValue < 150) {
        badges.push({ 
          badge_id: `${assetId}_value_150`,
          badge_name: 'Value Riser',
          emoji: '📈',
          asset_type: assetId,
          unlocked_at: new Date().toISOString()
        });
      }
      if (currentValue >= 200 && highestValue < 200) {
        badges.push({ 
          badge_id: `${assetId}_value_200`,
          badge_name: 'Value Champion',
          emoji: '💎',
          asset_type: assetId,
          unlocked_at: new Date().toISOString()
        });
      }
      if (currentValue >= 300 && highestValue < 300) {
        badges.push({ 
          badge_id: `${assetId}_value_300`,
          badge_name: 'Super Value',
          emoji: '🚀',
          asset_type: assetId,
          unlocked_at: new Date().toISOString()
        });
      }

      // Streak badges
      if (streaks && streaks.currentStreak >= 5) {
        badges.push({ 
          badge_id: `${assetId}_streak_5`,
          badge_name: 'Hot Streak!',
          emoji: '🔥',
          asset_type: assetId,
          unlocked_at: new Date().toISOString()
        });
      }

      return badges.length > 0 ? badges : null;
    }

    // Format game state for database: game_state table
    formatGameStateForDB(userId, selectedAsset, xp, level) {
      return {
        user_id: userId, // matches DB: user_id
        selected_asset: selectedAsset, // matches DB: selected_asset
        xp: xp, // matches DB: xp (int4)
        level: level, // matches DB: level (int4)
        updated_at: new Date().toISOString() // matches DB: updated_at (timestamptz)
      };
    }

    // Format event for database: event_history table
    formatEventForDB(userId, event) {
      return {
        user_id: userId, // matches DB: user_id
        asset_type: event.asset_type, // matches DB: asset_type
        event_name: event.event_name, // matches DB: event_name
        effect_description: event.effect_description, // matches DB: effect_description
        effect_value: event.effect_value, // matches DB: effect_value (numeric)
        timestamp: event.timestamp // matches DB: timestamp (timestamptz)
      };
    }

    // Format badge for database: earned_badges table
    formatBadgeForDB(userId, badge) {
      return {
        user_id: userId, // matches DB: user_id
        badge_id: badge.badge_id, // matches DB: badge_id
        badge_name: badge.badge_name, // matches DB: badge_name
        asset_type: badge.asset_type, // matches DB: asset_type
        unlocked_at: badge.unlocked_at // matches DB: unlocked_at (timestamptz)
      };
    }
  }