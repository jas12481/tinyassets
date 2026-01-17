'use client';
import { useState } from 'react';
import { useParams } from 'next/navigation';
import { ASSETS } from '@/lib/mockAssets';
import { GameEngine } from '@/lib/gameRules';

export default function AssetDetail() {
  const params = useParams();
  const assetId = params.assetId;
  const asset = ASSETS[assetId];
  
  // Initialize state first (before any conditional returns)
  const [gameState, setGameState] = useState({
    value: asset?.baseValue || 100,
    xp: 0,
    level: 1,
    events: [],
    badges: [],
    highestValue: asset?.baseValue || 100,
    eventsTriggered: 0,
    firstEvent: false,
    valueHistory: [{ value: asset?.baseValue || 100, timestamp: new Date().toISOString() }],
    streaks: {
      currentStreak: 0,
      lastEventTime: null
    },
    combo: 1
  });
  const [showEvent, setShowEvent] = useState(false);
  const [currentEvent, setCurrentEvent] = useState(null);
  const [showBadge, setShowBadge] = useState(false);
  const [newBadges, setNewBadges] = useState([]);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [valueChange, setValueChange] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [showCombo, setShowCombo] = useState(false);

  const gameEngine = new GameEngine();

  // NOW we can check if asset doesn't exist
  if (!asset) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-400 to-pink-500 p-8 flex items-center justify-center">
        <div className="text-white text-2xl">Asset not found!</div>
      </div>
    );
  }

  const triggerEvent = () => {
    const event = gameEngine.triggerRandomEvent(asset);
    const newValue = Math.max(0, gameState.value + event.effect);
    const newEventsCount = gameState.eventsTriggered + 1;
    const now = new Date().toISOString();

    // Calculate combo multiplier (events within 30 seconds)
    const combo = gameEngine.calculateCombo(gameState.streaks.lastEventTime);
    const xpEarned = combo > 1 ? 10 * combo : 10;
    const newXP = gameEngine.calculateXP(gameState.xp, 1, combo);
    const newLevel = gameEngine.calculateLevel(newXP);

    // Update streak
    const timeDiff = gameState.streaks.lastEventTime 
      ? (new Date() - new Date(gameState.streaks.lastEventTime)) / 1000 
      : 999;
    const newStreak = timeDiff < 60 ? gameState.streaks.currentStreak + 1 : 1;

    // Check for level up
    if (newLevel > gameState.level) {
      setShowLevelUp(true);
      setTimeout(() => setShowLevelUp(false), 3000);
    }

    // Check for badges (enhanced system)
    const badges = gameEngine.checkBadgeUnlock(assetId, {
      eventsCount: newEventsCount,
      currentValue: newValue,
      highestValue: gameState.highestValue,
      firstEvent: gameState.firstEvent,
      streaks: { currentStreak: newStreak }
    });

    const newBadgesEarned = badges ? badges.filter(b => 
      !gameState.badges.some(existing => existing.badge_id === b.badge_id)
    ) : [];

    if (newBadgesEarned.length > 0) {
      setNewBadges(newBadgesEarned);
      setShowBadge(true);
      setTimeout(() => setShowBadge(false), 4000);
    }

    // Show combo notification
    if (combo > 1) {
      setShowCombo(true);
      setTimeout(() => setShowCombo(false), 2000);
    }

    // Show value change animation
    setValueChange(event.effect);
    setTimeout(() => setValueChange(null), 1000);

    setCurrentEvent({ ...event, xpEarned, combo });
    setShowEvent(true);

    // Add to value history (for potential chart visualization)
    const newValueHistory = [...gameState.valueHistory, { value: newValue, timestamp: now }].slice(-20);

    setGameState({
      ...gameState,
      value: newValue,
      xp: newXP,
      level: newLevel,
      events: [...gameState.events, event].slice(-10), // Keep last 10 events
      badges: [...gameState.badges, ...newBadgesEarned],
      highestValue: Math.max(gameState.highestValue, newValue),
      eventsTriggered: newEventsCount,
      firstEvent: true,
      valueHistory: newValueHistory,
      streaks: {
        currentStreak: newStreak,
        lastEventTime: now
      },
      combo: combo
    });

    // TODO: Save to Supabase when backend is connected
    // await saveEventToDB(userId, gameEngine.formatEventForDB(userId, event));
    // await updateGameStateDB(userId, gameEngine.formatGameStateForDB(userId, assetId, newXP, newLevel));
    // if (newBadgesEarned.length > 0) {
    //   newBadgesEarned.forEach(badge => {
    //     saveBadgeToDB(userId, gameEngine.formatBadgeForDB(userId, badge));
    //   });
    // }

    setTimeout(() => setShowEvent(false), 3000);
  };

  const xpForCurrentLevel = (gameState.level - 1) * 100;
  const xpForNextLevel = gameState.level * 100;
  const xpProgress = gameState.xp - xpForCurrentLevel;
  const xpNeeded = xpForNextLevel - xpForCurrentLevel;
  const xpPercentage = (xpProgress / xpNeeded) * 100;

  const gradientClass = asset?.color || 'from-purple-400 to-pink-500';

  return (
    <div className={`min-h-screen bg-gradient-to-b ${gradientClass} p-8`}>
      {/* Header with Stats */}
      <div className="max-w-4xl mx-auto mb-6">
        <div className="flex justify-between items-center text-white mb-4">
          <div className="text-left">
            <p className="text-sm opacity-80">Events: {gameState.eventsTriggered}</p>
            <p className="text-sm opacity-80">Badges: {gameState.badges.length}</p>
          </div>
          <div className="text-right">
            <p className="text-sm opacity-80">Highest Value: {gameState.highestValue}</p>
            {gameState.streaks.currentStreak > 0 && (
              <p className="text-sm font-bold text-yellow-300">
                🔥 Streak: {gameState.streaks.currentStreak}!
              </p>
            )}
          </div>
        </div>
      </div>

      {/* XP Bar */}
      <div className="max-w-4xl mx-auto mb-8">
        <div className="bg-white rounded-full h-8 overflow-hidden shadow-lg">
          <div 
            className="bg-gradient-to-r from-yellow-400 to-orange-400 h-full transition-all duration-500 relative"
            style={{ width: `${Math.min(xpPercentage, 100)}%` }}
          >
            {xpPercentage > 10 && (
              <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-gray-800">
                {Math.round(xpPercentage)}%
              </span>
            )}
          </div>
        </div>
        <p className="text-white text-center mt-2 font-semibold">
          Level {gameState.level} • {gameState.xp} XP • {xpNeeded - xpProgress} XP to next level
        </p>
      </div>

      {/* Asset Display */}
      <div className="bg-white rounded-3xl p-8 max-w-2xl mx-auto shadow-2xl mb-6">
        <div className="text-9xl text-center mb-4">{asset.emoji}</div>
        <h1 className="text-3xl font-bold text-center mb-4">{asset.name}</h1>
        
        <div className="text-center mb-8 relative">
          <p className="text-gray-600 mb-2">Current Value</p>
          <div className="relative">
            <p className={`text-5xl font-bold ${gameState.value >= gameState.highestValue && gameState.eventsTriggered > 0 ? 'text-green-600' : 'text-gray-800'} transition-all duration-300 ${valueChange ? 'scale-125' : ''}`}>
              {gameState.value}
            </p>
            {valueChange && (
              <p className={`absolute -right-16 top-1/2 transform -translate-y-1/2 text-3xl font-bold animate-pulse ${valueChange > 0 ? 'text-green-500' : valueChange < 0 ? 'text-red-500' : 'text-gray-500'}`}>
                {valueChange > 0 ? '+' : ''}{valueChange}
              </p>
            )}
          </div>
        </div>

        <button
          onClick={triggerEvent}
          className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-4 rounded-2xl text-xl font-bold hover:scale-105 active:scale-95 transition-transform shadow-lg hover:shadow-xl relative overflow-hidden"
        >
          See What Happens!
          {gameState.streaks.currentStreak >= 3 && (
            <span className="absolute top-2 right-2 text-yellow-300 text-sm animate-pulse">
              🔥 {gameState.streaks.currentStreak}
            </span>
          )}
        </button>
        
        {/* Value History Mini Chart */}
        {gameState.valueHistory.length > 1 && (
          <div className="mt-6 bg-gray-50 rounded-xl p-4">
            <p className="text-sm text-gray-600 mb-2 text-center">Value Over Time</p>
            <div className="flex items-end justify-center h-20 gap-1">
              {gameState.valueHistory.slice(-10).map((point, idx) => {
                const maxValue = Math.max(...gameState.valueHistory.map(p => p.value));
                const height = (point.value / maxValue) * 100;
                return (
                  <div
                    key={idx}
                    className="bg-gradient-to-t from-purple-400 to-purple-200 rounded-t flex-1 min-w-[8px] transition-all"
                    style={{ height: `${Math.max(height, 10)}%` }}
                    title={`${point.value}`}
                  />
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Badges Display */}
      {gameState.badges.length > 0 && (
        <div className="bg-white rounded-3xl p-6 max-w-2xl mx-auto shadow-2xl mb-6">
          <h2 className="text-2xl font-bold text-center mb-4">
            Badges Earned ({gameState.badges.length})
          </h2>
          <div className="flex flex-wrap justify-center gap-4">
            {gameState.badges.map((badge, idx) => (
              <div key={badge.badge_id || idx} className="bg-gradient-to-br from-yellow-100 to-orange-100 rounded-2xl p-4 text-center min-w-[120px] transform hover:scale-110 transition-transform">
                <div className="text-4xl mb-2">{badge.emoji}</div>
                <p className="font-semibold text-sm">{badge.badge_name || badge.name}</p>
                {badge.unlocked_at && (
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(badge.unlocked_at).toLocaleDateString()}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Event History Toggle */}
      <div className="max-w-2xl mx-auto mb-6">
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="w-full bg-white/20 backdrop-blur-sm text-white py-3 rounded-2xl font-semibold hover:bg-white/30 transition-all"
        >
          {showHistory ? 'Hide' : 'Show'} Event History ({gameState.events.length})
        </button>
      </div>

      {/* Event History */}
      {showHistory && gameState.events.length > 0 && (
        <div className="bg-white/20 backdrop-blur-sm rounded-3xl p-6 max-w-2xl mx-auto shadow-2xl">
          <h2 className="text-2xl font-bold text-white text-center mb-4">Recent Events</h2>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {[...gameState.events].reverse().map((event, idx) => (
              <div key={idx} className="bg-white/90 rounded-xl p-4 flex justify-between items-center">
                <p className="text-gray-800 font-medium">{event.message}</p>
                <p className={`font-bold ${event.effect > 0 ? 'text-green-600' : event.effect < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                  {event.effect > 0 ? '+' : ''}{event.effect}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Event Popup */}
      {showEvent && currentEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl p-8 max-w-md shadow-2xl animate-bounce">
            <p className="text-2xl text-center mb-4 font-semibold">{currentEvent.message}</p>
            <p className={`text-4xl font-bold text-center ${currentEvent.effect > 0 ? 'text-green-600' : currentEvent.effect < 0 ? 'text-red-600' : 'text-gray-600'}`}>
              {currentEvent.effect > 0 ? '+' : ''}{currentEvent.effect}
            </p>
            <p className="text-center text-sm text-gray-500 mt-2">
              +{currentEvent.xpEarned} XP earned!
              {currentEvent.combo > 1 && (
                <span className="block text-orange-500 font-bold text-lg mt-1">
                  {currentEvent.combo}x COMBO!
                </span>
              )}
            </p>
          </div>
        </div>
      )}

      {/* Level Up Popup */}
      {showLevelUp && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-3xl p-12 max-w-md shadow-2xl animate-pulse text-center">
            <div className="text-7xl mb-4">🎉</div>
            <p className="text-4xl font-bold text-white mb-2">Level Up!</p>
            <p className="text-2xl text-white font-semibold">You're now Level {gameState.level}!</p>
          </div>
        </div>
      )}

      {/* Badge Unlocked Popup */}
      {showBadge && newBadges.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-gradient-to-br from-purple-400 to-pink-500 rounded-3xl p-12 max-w-md shadow-2xl animate-pulse text-center">
            <div className="text-7xl mb-4">
              {newBadges.length === 1 ? newBadges[0].emoji : '🏅'}
            </div>
            <p className="text-3xl font-bold text-white mb-2">
              {newBadges.length === 1 ? 'Badge Unlocked!' : `${newBadges.length} Badges Unlocked!`}
            </p>
            {newBadges.map((badge, idx) => (
              <div key={idx} className="mb-2">
                <p className="text-2xl text-white font-semibold">{badge.badge_name}</p>
                {badge.asset_type && (
                  <p className="text-sm text-white opacity-75">Asset: {badge.asset_type}</p>
                )}
              </div>
            ))}
            <p className="text-white mt-4 opacity-90">Keep learning to earn more badges!</p>
          </div>
        </div>
      )}

      {/* Combo Popup */}
      {showCombo && gameState.combo > 1 && (
        <div className="fixed top-20 right-8 bg-gradient-to-r from-orange-400 to-red-500 rounded-2xl p-6 shadow-2xl z-40 animate-bounce">
          <p className="text-4xl font-bold text-white text-center">
            {gameState.combo}x COMBO!
          </p>
          <p className="text-white text-center text-sm mt-1">Keep going!</p>
        </div>
      )}
    </div>
  );
}