'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ASSETS } from '@/lib/mockAssets';
import * as gameAPI from '@/lib/gameAPI';
import TutorialFlow from '@/components/TutorialFlow';

export default function GamePage() {
  const router = useRouter();
  
  // Login state
  const [kidUsername, setKidUsername] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginError, setLoginError] = useState(null);
  const [mounted, setMounted] = useState(false); // Track if component has mounted (for hydration)
  const [parentPin, setParentPin] = useState(null);
  const [showNewUserPopup, setShowNewUserPopup] = useState(false);
  
  // Game state
  const [gameState, setGameState] = useState(null);
  const [portfolio, setPortfolio] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showTutorial, setShowTutorial] = useState(false);
  const [hasWon, setHasWon] = useState(false);
  const [winCondition, setWinCondition] = useState(null); // 'level5', 'tokens100', 'allShares'
  const [winAcknowledged, setWinAcknowledged] = useState(false); // Track if user clicked "Keep Playing"
  
  // Reset win state on logout
  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('tinyassets_user_id');
      setIsLoggedIn(false);
      setKidUsername('');
      setGameState(null);
      setPortfolio({});
      setLoading(false);
      setHasWon(false);
      setWinCondition(null);
      setWinAcknowledged(false); // Reset win acknowledgment on logout
      setParentPin(null); // Reset parent pin
      setShowNewUserPopup(false); // Reset new user popup
    }
  };
  
  // UI state
  const [phase, setPhase] = useState('morning'); // morning, midday, evening, night
  const [selectedAction, setSelectedAction] = useState(null);
  const [dayResults, setDayResults] = useState(null);
  const [newBadges, setNewBadges] = useState([]);
  const [newMissions, setNewMissions] = useState([]);
  const [indicators, setIndicators] = useState({
    weather: '☀️ Sunny',
    economy: '📊 Stable',
    crisis: '🟢 Low (0-15%)'
  });

  // Load parent code for a username
  const loadParentCodeForUsername = async (username) => {
    if (!username || username.startsWith('user_')) return; // Skip auto-generated IDs
    
    try {
      const tempUserId = localStorage.getItem('tinyassets_user_id');
      gameAPI.setUserId(username); // Temporarily set to fetch parent code
      const parentCodeData = await gameAPI.getParentCode();
      if (parentCodeData && parentCodeData.parent_pin) {
        setParentPin(parentCodeData.parent_pin);
      }
      // Restore original userId
      if (tempUserId) gameAPI.setUserId(tempUserId);
    } catch (err) {
      // Parent code doesn't exist yet, that's fine
      console.log('No parent code found for user');
    }
  };

  // Check for saved username on mount (but always show login first)
  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      const storedUserId = localStorage.getItem('tinyassets_user_id');
      if (storedUserId) {
        // Pre-fill username but don't auto-login
        setKidUsername(storedUserId);
        // Load parent code if user exists
        loadParentCodeForUsername(storedUserId);
      }
      setLoading(false);
    }
  }, []);

  // Handle login
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError(null);
    
    if (!kidUsername.trim()) {
      setLoginError('Please enter your username');
      return;
    }

    // Validate username format (alphanumeric, 3-50 chars)
    const usernameRegex = /^[a-zA-Z0-9_]{3,50}$/;
    if (!usernameRegex.test(kidUsername.trim())) {
      setLoginError('Username must be 3-50 characters, alphanumeric and underscores only');
      return;
    }

    try {
      // Store the userId
      const trimmedUsername = kidUsername.trim();
      gameAPI.setUserId(trimmedUsername);
      
      // Fetch parent code
      let parentCodeData;
      try {
        parentCodeData = await gameAPI.getParentCode();
      } catch (err) {
        // If parent code endpoint fails, treat as new user
        parentCodeData = { isNew: true, parent_pin: null };
      }
      
      // If no parent code exists, create account (which creates parent code)
      if (parentCodeData.isNew || !parentCodeData.parent_pin) {
        // Call setup API to create account and parent code
        const setupResponse = await fetch('/api/kid/setup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ kid_username: trimmedUsername }),
        });
        const setupData = await setupResponse.json();
        
        if (setupData.success) {
          setParentPin(setupData.parent_pin);
          setShowNewUserPopup(true); // Show pop-up for new user
        } else {
          throw new Error(setupData.error || 'Failed to set up account');
        }
      } else {
        // Existing user - just set parent pin
        setParentPin(parentCodeData.parent_pin);
      }
      
      setIsLoggedIn(true);
      setLoading(true);
      await loadGameState();
      generateIndicators();
    } catch (err) {
      console.error('Login error:', err);
      setLoginError(err.message || 'Failed to load game. Make sure your account is set up.');
    }
  };

  // Check if tutorial should be shown
  useEffect(() => {
    if (gameState && !gameState.tutorial_complete) {
      setShowTutorial(true);
    }
  }, [gameState]);

  // Load game state from backend
  const loadGameState = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [gameStateData, portfolioData] = await Promise.all([
        gameAPI.getGameState(),
        gameAPI.getPortfolio(),
      ]);
      
      setGameState(gameStateData);
      
      // Transform portfolio array to object format expected by frontend
      const portfolioObj = {};
      portfolioData.assets.forEach(asset => {
        portfolioObj[asset.asset_type] = asset.shares || 0;
      });
      
      // Initialize all assets with 0 if not present
      Object.keys(ASSETS).forEach(assetId => {
        if (!(assetId in portfolioObj)) {
          portfolioObj[assetId] = 0;
        }
      });
      
      setPortfolio(portfolioObj);
      
      // Calculate daily production
      const dailyProduction = portfolioData.summary?.totalDailyProduction || 0;
      setGameState(prev => ({
        ...prev,
        dailyProduction,
      }));
      
      // Check win conditions - only set hasWon if not already acknowledged
      const won = checkWinConditions(gameStateData, portfolioObj);
      if (!winAcknowledged) {
        setHasWon(won);
      }
      
      // Check if tutorial should be shown
      if (!gameStateData.tutorial_complete) {
        setShowTutorial(true);
      }
      
    } catch (err) {
      console.error('Error loading game state:', err);
      setError(err.message || 'Failed to load game');
    } finally {
      setLoading(false);
    }
  };

  // Handle tutorial completion
  const handleTutorialComplete = async () => {
    try {
      setError(null);
      
      // Mark tutorial as complete via API
      // For now, we'll update the game state locally and let executeDay handle it
      // We need to create an API endpoint to complete tutorial
      await gameAPI.completeTutorial();
      
      // Reload game state
      await loadGameState();
      
      // Auto-complete "Asset Detective" mission
      // This will be handled by the backend when tutorial is marked complete
      
      setShowTutorial(false);
    } catch (err) {
      console.error('Error completing tutorial:', err);
      setError(err.message || 'Failed to complete tutorial');
    }
  };

  // Check win conditions
  const checkWinConditions = (gameStateData, portfolioData) => {
    if (!gameStateData) {
      setWinCondition(null);
      return false;
    }

    // Condition 1: Level 5
    if (gameStateData.level >= 5) {
      setWinCondition('level5');
      return true;
    }

    // Condition 2: 100 tokens
    if (gameStateData.tokens >= 100) {
      setWinCondition('tokens100');
      return true;
    }

    // Condition 3: All assets at 100% ownership (4 shares each)
    const propertyShares = portfolioData?.property || 0;
    const solarShares = portfolioData?.solar || 0;
    const goldShares = portfolioData?.gold || 0;
    const totalShares = propertyShares + solarShares + goldShares;
    
    if (totalShares >= 12) { // 4 + 4 + 4 = 12 shares
      // Verify all three assets have 4 shares each
      if (propertyShares === 4 && solarShares === 4 && goldShares === 4) {
        setWinCondition('allShares');
        return true;
      }
    }

    // No win conditions met - reset
    setWinCondition(null);
    return false;
  };

  // Generate random indicators for morning phase
  const generateIndicators = () => {
    const weatherOptions = ['☀️ Sunny', '☁️ Cloudy', '⛈️ Stormy'];
    const economyOptions = ['📈 Boom', '📊 Stable', '📉 Recession'];
    const crisisRisk = Math.random() * 100;
    
    setIndicators({
      weather: weatherOptions[Math.floor(Math.random() * weatherOptions.length)],
      economy: economyOptions[Math.floor(Math.random() * economyOptions.length)],
      crisis: crisisRisk < 15 ? '🟢 Low (0-15%)' : 
              crisisRisk < 40 ? '🟡 Medium (15-40%)' : 
              '🔴 High (40%+)'
    });
  };

  // Handle buy shares
  const handleBuyShares = async (assetType, shares) => {
    try {
      setError(null);
      const response = await gameAPI.buyShares(assetType, shares);
      
      // Reload game state and portfolio
      await loadGameState();
      
      return { success: true, message: response.message };
    } catch (err) {
      setError(err.message || 'Failed to buy shares');
      return { success: false, message: err.message };
    }
  };

  // Handle sell shares
  const handleSellShares = async (assetType, shares) => {
    try {
      setError(null);
      const response = await gameAPI.sellShares(assetType, shares);
      
      // Reload game state and portfolio
      await loadGameState();
      
      return { success: true, message: response.message };
    } catch (err) {
      setError(err.message || 'Failed to sell shares');
      return { success: false, message: err.message };
    }
  };

  // Handle decision execution
  const handleExecuteDecision = async () => {
    if (!selectedAction) return;
    
    try {
      setError(null);
      
      // Execute buy/sell action first
      if (selectedAction.type === 'buy') {
        await handleBuyShares(selectedAction.asset, selectedAction.shares);
      } else if (selectedAction.type === 'sell') {
        await handleSellShares(selectedAction.asset, selectedAction.shares);
      }
      // 'hold' does nothing
      
      // Execute day (process production + events)
      const dayResult = await gameAPI.executeDay();
      
      // Transform day results for frontend
      const transformedResults = {
        production: dayResult.production?.totalEarned || 0,
        event: dayResult.event ? {
          name: dayResult.event.event?.name || 'Unknown Event',
          description: dayResult.event.event?.description || '',
          emoji: getEventEmoji(dayResult.event.event?.eventType),
          totalEffect: dayResult.event.tokenEffect || 0,
          message: dayResult.event.event?.description || '',
          lesson: `This event shows how ${dayResult.event.event?.eventType} factors affect assets!`
        } : null,
        eventEffect: dayResult.event?.tokenEffect || 0,
        newBadges: dayResult.newBadges || [],
        newMissions: dayResult.newMissions || [],
      };
      
      setDayResults(transformedResults);
      setNewBadges(transformedResults.newBadges || []);
      setNewMissions(transformedResults.newMissions || []);
      
      // Reload game state
      await loadGameState();
      generateIndicators(); // New indicators for next day
      
      setPhase('evening');
    } catch (err) {
      console.error('Error executing decision:', err);
      setError(err.message || 'Failed to execute day');
    }
  };

  // Handle skip day
  const handleSkipDay = async () => {
    try {
      setError(null);
      
      // Skip day (auto-hold + process)
      const dayResult = await gameAPI.skipDay();
      
      // Transform day results
      const transformedResults = {
        production: dayResult.production?.totalEarned || 0,
        event: dayResult.event ? {
          name: dayResult.event.event?.name || 'Unknown Event',
          description: dayResult.event.event?.description || '',
          emoji: getEventEmoji(dayResult.event.event?.eventType),
          totalEffect: dayResult.event.tokenEffect || 0,
          message: dayResult.event.event?.description || '',
          lesson: `This event shows how ${dayResult.event.event?.eventType} factors affect assets!`
        } : null,
        eventEffect: dayResult.event?.tokenEffect || 0,
        newBadges: dayResult.newBadges || [],
        newMissions: dayResult.newMissions || [],
      };
      
      // Update state
      await loadGameState();
      generateIndicators();
      
      // Show brief notification if event happened
      if (dayResult.event) {
        const eventName = dayResult.event.event?.name || 'Event';
        const tokenEffect = dayResult.event.tokenEffect || 0;
        const productionEarned = dayResult.production?.totalEarned || 0;
        const totalChange = productionEarned + tokenEffect;
        
        let message = `⏭️ While skipping:\n${eventName} occurred!`;
        
        if (tokenEffect !== 0) {
          const sign = tokenEffect > 0 ? '+' : '';
          message += `\n\nEvent effect: ${sign}${tokenEffect} tokens`;
        }
        
        if (productionEarned > 0) {
          message += `\nDaily production: +${productionEarned} tokens`;
        }
        
        if (totalChange !== 0) {
          const sign = totalChange > 0 ? '+' : '';
          message += `\n\nTotal change: ${sign}${totalChange} tokens`;
        }
        
        alert(message);
      }
      
      setPhase('morning');
    } catch (err) {
      console.error('Error skipping day:', err);
      setError(err.message || 'Failed to skip day');
    }
  };

  // Handle next day
  const handleNextDay = () => {
    setPhase('morning');
    setSelectedAction(null);
    setDayResults(null);
    setNewBadges([]);
    setNewMissions([]);
  };

  // Helper: Get event emoji based on type
  const getEventEmoji = (eventType) => {
    const emojiMap = {
      'environmental': '☀️',
      'economic': '📈',
      'crisis': '🚨'
    };
    return emojiMap[eventType] || '📊';
  };


  // Prevent hydration mismatch - wait for mount before accessing localStorage
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-slate-700 text-xl font-semibold">Loading...</div>
      </div>
    );
  }

  // Show new user pop-up before game starts
  if (showNewUserPopup && parentPin) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-pink-200 via-yellow-200 to-orange-200 flex items-center justify-center p-8">
        <div className="bg-yellow-100 rounded-xl p-8 max-w-md w-full shadow-lg border-4 border-yellow-400">
          <h2 className="text-3xl font-bold text-center mb-4 text-orange-900">🎉 Welcome to TinyAssets!</h2>
          <div className="bg-pink-200 border-4 border-pink-400 rounded-xl p-6 mb-6">
            <p className="text-pink-900 font-bold text-center mb-2 text-lg">Your Parent Code:</p>
            <p className="text-pink-900 text-4xl font-bold text-center mb-4">{parentPin}</p>
            <p className="text-pink-800 text-base text-center font-semibold">
              Share this code with your parent so they can view your progress!
            </p>
          </div>
          <button
            onClick={() => setShowNewUserPopup(false)}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white py-4 rounded-xl text-xl font-bold transition-colors shadow-lg border-4 border-blue-700"
          >
            Start Playing →
          </button>
        </div>
      </div>
    );
  }

  // Always show login screen first (never auto-login)
  if (!isLoggedIn) {
    const storedUserId = typeof window !== 'undefined' ? localStorage.getItem('tinyassets_user_id') : null;
    const hasStoredUserId = storedUserId && storedUserId.startsWith('user_'); // Auto-generated format
    const hasValidStoredUserId = storedUserId && !storedUserId.startsWith('user_'); // Real username
    
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-200 via-cyan-200 to-green-200 flex items-center justify-center p-8">
        <div className="bg-yellow-100 rounded-xl p-8 max-w-md w-full shadow-lg border-4 border-yellow-400">
          <h1 className="text-3xl font-bold text-center mb-2 text-orange-900">Welcome to TinyAssets</h1>
          <p className="text-center text-orange-700 mb-6 text-base font-semibold">Enter your username to start playing</p>
          
          {hasValidStoredUserId && (
            <div className="bg-blue-200 border-4 border-blue-400 rounded-xl p-3 mb-4">
              <p className="text-blue-900 text-base mb-1 font-bold">
                💾 Last played as: <strong>{storedUserId}</strong>
              </p>
              <p className="text-blue-800 text-sm font-semibold">
                You can continue as this user or enter a different username
              </p>
            </div>
          )}
          
          {hasStoredUserId && (
            <div className="bg-yellow-200 border-4 border-yellow-400 rounded-xl p-3 mb-4">
              <p className="text-yellow-900 text-base mb-1 font-bold">
                ⚠️ Found an old session. Please enter your username.
              </p>
              <button
                type="button"
                onClick={handleLogout}
                className="text-yellow-800 underline text-sm font-semibold"
              >
                Clear and start fresh
              </button>
            </div>
          )}
          
          {parentPin && (
            <div className="bg-green-200 border-4 border-green-400 rounded-xl p-4 mb-4">
              <p className="text-green-900 text-base font-bold mb-1">
                🔑 Parent Code:
              </p>
              <p className="text-green-900 text-3xl font-bold text-center">
                {parentPin}
              </p>
              <p className="text-green-800 text-sm mt-1 text-center font-semibold">
                Share this code with your parent to view your progress
              </p>
            </div>
          )}
          
          <form onSubmit={handleLogin}>
            <div className="mb-4">
              <label htmlFor="username" className="block text-base font-bold text-orange-800 mb-2">
                Username
              </label>
              <input
                id="username"
                type="text"
                value={kidUsername}
                onChange={(e) => setKidUsername(e.target.value)}
                placeholder="Enter your username"
                className="w-full px-4 py-3 border-4 border-orange-300 rounded-xl text-lg focus:outline-none focus:border-blue-500 font-semibold"
                autoFocus={!hasValidStoredUserId}
              />
            </div>
            
            {loginError && (
              <div className="bg-red-200 border-4 border-red-400 rounded-xl p-3 mb-4">
                <p className="text-red-900 text-base font-bold">{loginError}</p>
              </div>
            )}
            
            <button
              type="submit"
              className="w-full bg-blue-500 hover:bg-blue-600 text-white py-4 rounded-xl text-xl font-bold transition-colors shadow-lg border-4 border-blue-700"
            >
              Start Playing →
            </button>
          </form>
          
          <p className="text-center text-sm text-orange-700 mt-4 font-semibold">
            Don't have an account? Ask your parent to set one up for you!
          </p>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-yellow-200 via-pink-200 to-blue-200 flex items-center justify-center">
        <div className="text-orange-900 text-2xl font-bold">Loading game...</div>
      </div>
    );
  }

  // Error state
  if (error && !gameState) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-red-200 via-pink-200 to-orange-200 flex items-center justify-center p-8">
        <div className="bg-yellow-100 rounded-xl p-8 max-w-md shadow-lg border-4 border-yellow-400">
          <h2 className="text-2xl font-bold mb-4 text-red-900">Error</h2>
          <p className="text-red-800 mb-4 font-semibold">{error}</p>
          <button
            onClick={loadGameState}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-bold transition-colors border-4 border-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Show tutorial if not completed
  if (showTutorial && !loading && gameState) {
    return <TutorialFlow onComplete={handleTutorialComplete} />;
  }

  // Ensure gameState exists
  if (!gameState) {
    return null;
  }

  // Calculate daily production from portfolio
  const dailyProduction = Object.entries(portfolio).reduce((sum, [assetId, shares]) => {
    const asset = ASSETS[assetId];
    if (!asset || !shares) return sum;
    return sum + (asset.productionPerShare * shares);
  }, 0);

  // MORNING PHASE
  const MorningPhase = () => (
    <div className="min-h-screen bg-gradient-to-b from-yellow-100 via-yellow-50 to-orange-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Day Counter */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-yellow-800 mb-4 drop-shadow-lg">
            ☀️ MORNING - Day {gameState?.current_day ?? 1}
          </h1>
          <div className="bg-yellow-200 rounded-xl p-6 inline-block shadow-lg border-4 border-yellow-400">
            <p className="text-3xl font-bold text-yellow-900">💰 {gameState?.tokens ?? 0} tokens</p>
            <p className="text-base font-semibold text-orange-700">Level {gameState?.level ?? 1} | {gameState?.xp ?? 0} XP</p>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-200 border-4 border-red-400 rounded-xl p-4 mb-4 text-center">
            <p className="text-red-900 font-bold text-lg">⚠️ {error}</p>
          </div>
        )}

        {/* Risk Assessment */}
        <div className="bg-orange-100 rounded-xl p-6 shadow-lg border-4 border-orange-300 mb-6">
          <h2 className="text-3xl font-bold mb-4 text-orange-900">📊 Today's Market Outlook</h2>
          
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-blue-200 border-4 border-blue-400 p-4 rounded-xl text-center">
              <p className="text-3xl mb-2">{indicators.weather}</p>
              <p className="font-bold text-blue-800">Weather</p>
              <p className="text-xs font-semibold text-blue-600">Affects Solar</p>
            </div>
            
            <div className="bg-green-200 border-4 border-green-400 p-4 rounded-xl text-center">
              <p className="text-3xl mb-2">{indicators.economy}</p>
              <p className="font-bold text-green-800">Economy</p>
              <p className="text-xs font-semibold text-green-600">Affects Property</p>
            </div>
            
            <div className="bg-purple-200 border-4 border-purple-400 p-4 rounded-xl text-center">
              <p className="text-3xl mb-2">{indicators.crisis}</p>
              <p className="font-bold text-purple-800">Crisis Risk</p>
              <p className="text-xs font-semibold text-purple-600">Affects Gold</p>
            </div>
          </div>
        </div>

        {/* Portfolio Status */}
        <div className="bg-pink-100 rounded-xl p-6 shadow-lg border-4 border-pink-300 mb-6">
          <h2 className="text-3xl font-bold mb-4 text-pink-900">📈 Your Portfolio</h2>
          
          <div className="grid grid-cols-3 gap-4">
            {Object.entries(ASSETS).map(([assetId, asset]) => {
              const shares = portfolio[assetId] || 0;
              const production = shares * asset.productionPerShare;
              const ownership = (shares / asset.maxShares) * 100;
              
              return (
                <div key={assetId} className="bg-cyan-200 border-4 border-cyan-400 p-4 rounded-xl">
                  <p className="text-4xl text-center mb-2">{asset.emoji}</p>
                  <p className="font-bold text-center text-cyan-900">{asset.name}</p>
                  <p className="text-center text-sm font-semibold text-cyan-700 mt-1">
                    {shares}/{asset.maxShares} shares ({ownership}%)
                  </p>
                  <p className="text-center text-lg font-bold text-green-700 mt-2">
                    +{production} tok/day
                  </p>
                </div>
              );
            })}
          </div>
          
          <div className="mt-4 pt-4 border-t-4 border-pink-400 text-center">
            <p className="text-xl font-bold text-pink-900">
              Total Daily Income: <span className="text-green-700 text-2xl">+{dailyProduction} tokens/day</span>
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="text-center space-x-4">
          <button
            onClick={() => setPhase('midday')}
            className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-4 rounded-xl text-xl font-bold transition-colors shadow-lg border-4 border-blue-700"
          >
            Continue to Midday →
          </button>
          
          <button
            onClick={handleSkipDay}
            className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-3 rounded-xl text-lg font-bold transition-colors border-4 border-purple-700"
          >
            ⏭️ Skip Day
          </button>
        </div>
      </div>
    </div>
  );

  // MIDDAY PHASE
  const MiddayPhase = () => {
    // Safely get tokens with fallback
    const currentTokens = gameState?.tokens ?? 0;
    const minShareCost = Math.min(
      ASSETS.property.costPerShare,
      ASSETS.solar.costPerShare,
      ASSETS.gold.costPerShare
    );
    const hasLowTokens = currentTokens < minShareCost;
    
    return (
    <div className="min-h-screen bg-gradient-to-b from-blue-200 via-sky-100 to-blue-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-5xl font-bold text-blue-800 text-center mb-6 drop-shadow-lg">
            🌤️ MIDDAY - Day {gameState?.current_day || 1}
        </h1>

        <div className="bg-cyan-100 rounded-xl p-6 shadow-lg border-4 border-cyan-300 mb-6">
          <h2 className="text-3xl font-bold mb-4 text-cyan-900">Make Your Investment Decision</h2>
            
            {/* Low Token Warning */}
            {hasLowTokens && (
              <div className="bg-yellow-200 border-4 border-yellow-400 rounded-xl p-4 mb-4">
                <p className="font-bold text-yellow-900 mb-1 text-lg">⚠️ Insufficient Funds</p>
                <p className="text-yellow-800 text-base">
                  TIP: Your assets are earning {dailyProduction} tokens/day. 
                  {dailyProduction > 0 ? (
                    <> In {Math.ceil((minShareCost - currentTokens) / dailyProduction)} more days, you'll have enough to buy!</>
                  ) : (
                    <> Keep playing to earn tokens!</>
                  )}
                </p>
              </div>
            )}

          <p className="text-center text-cyan-800 mb-4 text-base font-semibold">Choose ONE action for today</p>
            <div className="bg-green-200 border-4 border-green-400 rounded-xl p-4 mb-4">
              <p className="text-center text-2xl font-bold text-green-900">Balance: {currentTokens} tokens</p>
            </div>

          {/* Buy Options */}
          <div className="mb-6">
            <h3 className="text-2xl font-bold mb-3 text-cyan-900">💰 Buy Shares</h3>
            <div className="space-y-3">
              {Object.entries(ASSETS).map(([assetId, asset]) => {
                  const owned = portfolio[assetId] || 0;
                const canBuy = owned < asset.maxShares;
                
                return (
                  <div key={assetId} className="bg-blue-200 border-4 border-blue-400 p-4 rounded-xl">
                    <p className="font-bold mb-1 text-blue-900 text-lg">{asset.emoji} {asset.name}</p>
                      <p className="text-sm font-semibold text-blue-700 mb-1">Owned: {owned}/{asset.maxShares} shares</p>
                      <p className="text-sm text-purple-700 mb-2 font-semibold italic">
                        {asset.productionPerShare > 0 
                          ? `1 share earns ${asset.productionPerShare} token${asset.productionPerShare !== 1 ? 's' : ''} daily`
                          : '1 share protects during crisis events (no daily income)'
                        }
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {[1, 2, 3, 4].map(numShares => {
                          const canBuyThis = owned + numShares <= asset.maxShares;
                          const cost = asset.costPerShare * numShares;
                          const canAfford = currentTokens >= cost;
                          
                          return (
                      <button
                              key={numShares}
                              onClick={() => setSelectedAction({type: 'buy', asset: assetId, shares: numShares})}
                              disabled={!canBuyThis || !canAfford}
                              className={`px-4 py-2 rounded-xl font-bold text-base border-4 ${
                                selectedAction?.type === 'buy' && selectedAction?.asset === assetId && selectedAction?.shares === numShares
                            ? 'bg-green-600 text-white border-green-800'
                            : 'bg-green-500 text-white hover:bg-green-600 border-green-700'
                        } disabled:bg-gray-300 disabled:text-gray-500 disabled:border-gray-400 disabled:cursor-not-allowed`}
                      >
                              Buy {numShares} share{numShares > 1 ? 's' : ''} ({cost} tok)
                      </button>
                          );
                        })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sell Options */}
          <div className="mb-6">
            <h3 className="text-2xl font-bold mb-3 text-cyan-900">💸 Sell Shares</h3>
            <div className="space-y-3">
              {Object.entries(ASSETS).map(([assetId, asset]) => {
                  const owned = portfolio[assetId] || 0;
                
                if (owned === 0) return null;
                  
                  const sellPrice = Math.floor(asset.costPerShare * 0.6);
                
                return (
                  <div key={assetId} className="bg-pink-200 border-4 border-pink-400 p-4 rounded-xl">
                    <p className="font-bold mb-2 text-pink-900 text-lg">{asset.emoji} {asset.name} (Own {owned} shares)</p>
                    <button
                      onClick={() => setSelectedAction({type: 'sell', asset: assetId, shares: 1})}
                      className={`px-4 py-2 rounded-xl font-bold border-4 ${
                        selectedAction?.type === 'sell' && selectedAction?.asset === assetId
                          ? 'bg-red-600 text-white border-red-800'
                          : 'bg-red-500 text-white hover:bg-red-600 border-red-700'
                      }`}
                    >
                        Sell 1 share (get {sellPrice} tokens)
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Hold Option */}
          <div className="mb-4">
            <button
              onClick={() => setSelectedAction({type: 'hold'})}
              className={`w-full py-4 rounded-xl font-bold text-lg border-4 ${
                selectedAction?.type === 'hold'
                  ? 'bg-purple-600 text-white border-purple-800'
                  : 'bg-purple-500 text-white hover:bg-purple-600 border-purple-700'
              }`}
            >
              💰 Hold Cash (Do Nothing)
            </button>
          </div>

          {/* Execute Button */}
          <button
            onClick={handleExecuteDecision}
            disabled={!selectedAction}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-4 rounded-xl text-xl font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg border-4 border-green-800"
          >
            Execute Decision & Continue →
          </button>
            
            {/* Skip Button */}
            <button
              onClick={handleSkipDay}
              className="w-full mt-3 bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-xl text-lg font-bold transition-colors border-4 border-orange-700"
            >
              ⏭️ Skip Day
          </button>
        </div>
      </div>
    </div>
  );
  };

  // EVENING PHASE
  const EveningPhase = () => (
    <div className="min-h-screen bg-gradient-to-b from-amber-300 via-orange-200 to-amber-200 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-5xl font-bold text-orange-900 text-center mb-6 drop-shadow-lg">
          🌆 EVENING - Day {gameState.current_day || 1}
        </h1>

        <div className="bg-yellow-100 rounded-xl p-6 shadow-lg border-4 border-yellow-400 mb-6">
          <h2 className="text-3xl font-bold mb-4 text-orange-900">Today's Results</h2>

          {/* Production */}
          <div className="bg-green-200 border-4 border-green-400 p-4 rounded-xl mb-4">
            <p className="text-xl font-bold text-center mb-2 text-green-900">📈 Daily Production</p>
            <p className="text-4xl font-bold text-green-700 text-center">
              +{dayResults?.production || 0} tokens
            </p>
          </div>

          {/* Event */}
          {dayResults?.event && (
            <div className={`p-4 rounded-xl mb-4 border-4 ${
              dayResults.event.totalEffect > 0 ? 'bg-blue-200 border-blue-400' : 'bg-red-200 border-red-400'
            }`}>
              <p className="text-4xl text-center mb-3">{dayResults.event.emoji}</p>
              <p className="text-2xl font-bold text-center mb-2 text-gray-900">{dayResults.event.name}</p>
              <p className="text-base text-center mb-3 text-gray-800 font-semibold">{dayResults.event.description}</p>
              <p className={`text-4xl font-bold text-center ${
                dayResults.event.totalEffect > 0 ? 'text-green-700' : 'text-red-700'
              }`}>
                {dayResults.event.totalEffect > 0 ? '+' : ''}{dayResults.event.totalEffect} tokens
              </p>
              <div className="mt-3 p-3 bg-yellow-200 border-4 border-yellow-400 rounded-xl">
                <p className="font-bold text-yellow-900 text-base">💡 Lesson:</p>
                <p className="text-sm text-yellow-800 font-semibold">{dayResults.event.lesson}</p>
              </div>
            </div>
          )}

          {/* Total */}
          <div className="bg-cyan-200 border-4 border-cyan-400 p-4 rounded-xl">
            <p className="text-xl font-bold text-center mb-2 text-cyan-900">📊 Net Change</p>
            <p className="text-4xl font-bold text-blue-700 text-center">
              +{dayResults ? ((dayResults.production || 0) + (dayResults.eventEffect || 0)) : 0} tokens
            </p>
            <p className="text-center mt-2 text-base font-semibold text-cyan-800">New Balance: {gameState.tokens} tokens</p>
          </div>
        </div>

        <button
          onClick={() => setPhase('night')}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white py-4 rounded-xl text-xl font-bold transition-colors shadow-lg border-4 border-blue-700"
        >
          Continue to Night →
        </button>
        
        <button
          onClick={handleSkipDay}
          className="w-full mt-3 bg-purple-500 hover:bg-purple-600 text-white py-3 rounded-xl text-lg font-bold transition-colors border-4 border-purple-700"
        >
          ⏭️ Skip Day
        </button>
      </div>
    </div>
  );

  // NIGHT PHASE
  const NightPhase = () => (
    <div className="min-h-screen bg-gradient-to-b from-blue-800 via-indigo-700 to-blue-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-5xl font-bold text-yellow-200 text-center mb-6 drop-shadow-lg">
          🌙 NIGHT - Day {gameState.current_day || 1}
        </h1>

        {/* New Badges */}
        {newBadges.length > 0 && (
          <div className="bg-yellow-200 border-4 border-yellow-400 rounded-xl p-6 shadow-lg mb-6">
            <h2 className="text-2xl font-bold text-center mb-4 text-yellow-900">🏆 NEW BADGE UNLOCKED!</h2>
            {newBadges.map((badge, idx) => (
              <div key={idx} className="mb-4">
                <p className="text-5xl text-center mb-2">🏆</p>
                <p className="text-2xl font-bold text-center mb-2 text-yellow-900">{badge.badge_name || badge.name}</p>
                <p className="text-lg text-center mb-2 text-yellow-800 font-semibold">{badge.description || ''}</p>
                <p className="text-center text-base font-bold text-yellow-700">Learning: {badge.learning || 'Great job!'}</p>
              </div>
            ))}
          </div>
        )}

        {/* New Missions */}
        {newMissions.length > 0 && (
          <div className="bg-green-200 border-4 border-green-400 rounded-xl p-6 shadow-lg mb-6">
            <h2 className="text-2xl font-bold text-center mb-4 text-green-900">✅ MISSION COMPLETE!</h2>
            {newMissions.map((mission, idx) => {
              const missionInfo = mission.mission_name || mission.name || 'Mission';
              return (
                <div key={idx} className="mb-4">
                  <p className="text-2xl font-bold text-center mb-2 text-green-900">{missionInfo}</p>
                  <p className="text-lg text-center mb-2 text-green-800 font-semibold">{mission.description || ''}</p>
                <p className="text-center font-bold text-green-700 text-xl">
                    Reward: +{mission.reward_xp || 0} XP
                </p>
              </div>
              );
            })}
          </div>
        )}

        {/* Daily Summary */}
        <div className="bg-purple-300 rounded-xl p-6 shadow-lg border-4 border-purple-500 mb-6">
          <h2 className="text-2xl font-bold mb-4 text-purple-900">📋 Daily Summary</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-pink-200 border-4 border-pink-400 rounded-xl p-3">
              <p className="text-sm font-semibold text-pink-800">💰 Tokens</p>
              <p className="text-2xl font-bold text-pink-900">{gameState.tokens}</p>
            </div>
            <div className="bg-blue-200 border-4 border-blue-400 rounded-xl p-3">
              <p className="text-sm font-semibold text-blue-800">⭐ XP</p>
              <p className="text-2xl font-bold text-blue-900">{gameState.xp} (Lv {gameState.level})</p>
            </div>
            <div className="bg-cyan-200 border-4 border-cyan-400 rounded-xl p-3">
              <p className="text-sm font-semibold text-cyan-800">📈 Daily Production</p>
              <p className="text-2xl font-bold text-cyan-900">{dailyProduction} tok/day</p>
            </div>
            <div className="bg-yellow-200 border-4 border-yellow-400 rounded-xl p-3">
              <p className="text-sm font-semibold text-yellow-800">📅 Day</p>
              <p className="text-2xl font-bold text-yellow-900">{gameState.current_day}</p>
            </div>
          </div>
        </div>

        <button
          onClick={handleNextDay}
          className="w-full bg-yellow-500 hover:bg-yellow-600 text-yellow-900 py-4 rounded-xl text-xl font-bold transition-colors shadow-lg border-4 border-yellow-700"
        >
          ☀️ Start Day {(gameState.current_day || 1) + 1} →
        </button>
        
        <button
          onClick={handleSkipDay}
          className="w-full mt-3 bg-purple-500 hover:bg-purple-600 text-white py-3 rounded-xl text-lg font-bold transition-colors border-4 border-purple-700"
        >
          ⏭️ Skip Day
        </button>
      </div>
    </div>
  );

  // WIN SCREEN
  const WinScreen = () => {
    const [stats, setStats] = useState(null);
    const [loadingStats, setLoadingStats] = useState(true);

    useEffect(() => {
      const loadWinStats = async () => {
        try {
          const [badges, events] = await Promise.all([
            gameAPI.getBadges(),
            gameAPI.getEvents(),
          ]);
          setStats({ badges, events });
        } catch (err) {
          console.error('Error loading win stats:', err);
        } finally {
          setLoadingStats(false);
        }
      };
      loadWinStats();
    }, []);

    const winMessages = {
      level5: "🎓 You reached Level 5! You're a TinyAssets Master!",
      tokens100: "💰 You earned 100 tokens! You're a token tycoon!",
      allShares: "🏆 You own 100% of all assets! Complete portfolio ownership achieved!",
    };

    const totalShares = (portfolio.property || 0) + (portfolio.solar || 0) + (portfolio.gold || 0);
    const dailyProduction = Object.entries(portfolio).reduce((sum, [assetId, shares]) => {
      const asset = ASSETS[assetId];
      if (!asset || !shares) return sum;
      return sum + (asset.productionPerShare * shares);
    }, 0);

    return (
      <div className="min-h-screen bg-gradient-to-b from-pink-400 via-purple-500 to-blue-500 p-8">
        <div className="max-w-4xl mx-auto">
          {/* Celebration Header */}
          <div className="text-center mb-8">
            <h1 className="text-6xl font-bold text-yellow-200 mb-4 drop-shadow-lg">🎉 YOU WIN! 🎉</h1>
            <p className="text-2xl text-yellow-100 mb-2 font-bold">{winMessages[winCondition] || 'Congratulations!'}</p>
          </div>

          {/* Win Stats Card */}
          <div className="bg-yellow-100 rounded-xl p-6 shadow-lg border-4 border-yellow-400 mb-6">
            <h2 className="text-3xl font-bold text-center mb-4 text-orange-900">📊 Your Final Stats</h2>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-pink-200 border-4 border-pink-400 p-4 rounded-xl text-center">
                <p className="text-4xl mb-2">⭐</p>
                <p className="text-2xl font-bold text-pink-900">{gameState?.xp || 0} XP</p>
                <p className="text-sm font-semibold text-pink-700">Level {gameState?.level || 1}</p>
              </div>
              
              <div className="bg-green-200 border-4 border-green-400 p-4 rounded-xl text-center">
                <p className="text-4xl mb-2">💰</p>
                <p className="text-2xl font-bold text-green-900">{gameState?.tokens || 0} tokens</p>
                <p className="text-sm font-semibold text-green-700">Current Balance</p>
              </div>
              
              <div className="bg-blue-200 border-4 border-blue-400 p-4 rounded-xl text-center">
                <p className="text-4xl mb-2">📅</p>
                <p className="text-2xl font-bold text-blue-900">Day {gameState?.current_day || 1}</p>
                <p className="text-sm font-semibold text-blue-700">Days Played</p>
              </div>
              
              <div className="bg-cyan-200 border-4 border-cyan-400 p-4 rounded-xl text-center">
                <p className="text-4xl mb-2">📈</p>
                <p className="text-2xl font-bold text-cyan-900">{dailyProduction} tok/day</p>
                <p className="text-sm font-semibold text-cyan-700">Daily Production</p>
              </div>
              
              <div className="bg-yellow-200 border-4 border-yellow-400 p-4 rounded-xl text-center">
                <p className="text-4xl mb-2">🏆</p>
                <p className="text-2xl font-bold text-yellow-900">{stats?.badges?.length || 0}</p>
                <p className="text-sm font-semibold text-yellow-700">Badges Earned</p>
              </div>
              
              <div className="bg-purple-200 border-4 border-purple-400 p-4 rounded-xl text-center">
                <p className="text-4xl mb-2">📊</p>
                <p className="text-2xl font-bold text-purple-900">{stats?.events?.length || 0}</p>
                <p className="text-sm font-semibold text-purple-700">Events Experienced</p>
              </div>
            </div>

            {/* Portfolio */}
            <div className="mb-4">
              <h3 className="text-2xl font-bold mb-3 text-center text-orange-900">📦 Your Portfolio</h3>
              <div className="grid grid-cols-3 gap-3">
                {Object.entries(ASSETS).map(([assetId, asset]) => {
                  const shares = portfolio[assetId] || 0;
                  const ownership = (shares / asset.maxShares) * 100;
                  const production = shares * asset.productionPerShare;
                  
                  return (
                    <div key={assetId} className="bg-orange-200 border-4 border-orange-400 p-3 rounded-xl text-center">
                      <p className="text-3xl mb-1">{asset.emoji}</p>
                      <p className="font-bold text-orange-900 text-sm">{asset.name}</p>
                      <p className="text-xs font-semibold text-orange-700 mt-1">{shares}/{asset.maxShares} shares</p>
                      <p className="text-base font-bold text-blue-700 mt-1">{ownership}% owned</p>
                      <p className="text-xs font-semibold text-green-700 mt-1">+{production} tok/day</p>
                    </div>
                  );
                })}
              </div>
              <div className="mt-3 pt-3 border-t-4 border-orange-400 text-center">
                <p className="text-lg font-bold text-orange-900">Total Shares: {totalShares}/12</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="text-center space-x-4 flex flex-col gap-3 items-center">
            <button
              onClick={() => {
                setHasWon(false);
                setWinAcknowledged(true); // Mark win as acknowledged so it won't show again
              }}
              className="bg-green-500 hover:bg-green-600 text-white px-8 py-4 rounded-xl text-xl font-bold shadow-lg w-full max-w-md transition-colors border-4 border-green-700"
            >
              🎮 Keep Playing
            </button>
            <button
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 text-white px-8 py-4 rounded-xl text-xl font-bold shadow-lg w-full max-w-md transition-colors border-4 border-red-700"
            >
              🚪 Logout & Play Again
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Render current phase
  return (
    <>
      {/* Show win screen if won */}
      {hasWon ? (
        <WinScreen />
      ) : (
        <>
          {/* Logout button - visible in all phases */}
          <div className="fixed top-4 right-4 z-50">
            <button
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl font-bold shadow-lg border-4 border-red-700"
              title={`Logged in as: ${kidUsername || 'Unknown'}`}
            >
              🚪 Logout ({kidUsername || '?'})
            </button>
          </div>
          
      {phase === 'morning' && <MorningPhase />}
      {phase === 'midday' && <MiddayPhase />}
      {phase === 'evening' && <EveningPhase />}
      {phase === 'night' && <NightPhase />}
        </>
      )}
    </>
  );
}
