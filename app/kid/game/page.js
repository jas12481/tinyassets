'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { RWATycoonEngine } from '@/lib/gameEngine';
import { ASSETS } from '@/lib/mockAssets';
import { checkMissions, MISSIONS } from '@/lib/missions';
import { checkBadges, BADGES } from '@/lib/badges';

export default function GamePage() {
  const router = useRouter();
  const [gameEngine] = useState(() => new RWATycoonEngine());
  const [gameState, setGameState] = useState(gameEngine.getGameState());
  const [phase, setPhase] = useState('morning'); // morning, midday, evening, night
  const [selectedAction, setSelectedAction] = useState(null);
  const [dayResults, setDayResults] = useState(null);
  const [newBadges, setNewBadges] = useState([]);
  const [newMissions, setNewMissions] = useState([]);

  // Weather/Economy/Crisis indicators (random for now)
  const [indicators] = useState({
    weather: ['☀️ Sunny', '☁️ Cloudy', '⛈️ Stormy'][Math.floor(Math.random() * 3)],
    economy: ['📈 Boom', '📊 Stable', '📉 Recession'][Math.floor(Math.random() * 3)],
    crisis: ['🟢 Low', '🟡 Medium', '🔴 High'][Math.floor(Math.random() * 3)]
  });

  const refreshGameState = () => {
    setGameState({...gameEngine.getGameState()});
  };

  // MORNING PHASE
  const MorningPhase = () => (
    <div className="min-h-screen bg-gradient-to-b from-yellow-400 to-orange-500 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Day Counter */}
        <div className="text-center mb-8">
          <h1 className="text-6xl font-bold text-white mb-4">
            ☀️ MORNING - Day {gameState.day}
          </h1>
          <div className="bg-white rounded-3xl p-6 inline-block shadow-2xl">
            <p className="text-3xl font-bold">💰 {gameState.tokens} tokens</p>
            <p className="text-lg text-gray-600">Level {gameState.level} | {gameState.xp} XP</p>
          </div>
        </div>

        {/* Risk Assessment */}
        <div className="bg-white rounded-3xl p-8 shadow-2xl mb-8">
          <h2 className="text-3xl font-bold mb-6 text-center">📊 Today's Outlook</h2>
          
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-yellow-100 p-6 rounded-2xl text-center">
              <p className="text-2xl mb-2">{indicators.weather}</p>
              <p className="font-bold">Weather</p>
              <p className="text-sm text-gray-600">Affects Solar</p>
            </div>
            
            <div className="bg-blue-100 p-6 rounded-2xl text-center">
              <p className="text-2xl mb-2">{indicators.economy}</p>
              <p className="font-bold">Economy</p>
              <p className="text-sm text-gray-600">Affects Property</p>
            </div>
            
            <div className="bg-red-100 p-6 rounded-2xl text-center">
              <p className="text-2xl mb-2">{indicators.crisis}</p>
              <p className="font-bold">Crisis Risk</p>
              <p className="text-sm text-gray-600">Affects Gold</p>
            </div>
          </div>
        </div>

        {/* Portfolio Status */}
        <div className="bg-white rounded-3xl p-8 shadow-2xl mb-8">
          <h2 className="text-3xl font-bold mb-6 text-center">📈 Your Portfolio</h2>
          
          <div className="grid grid-cols-3 gap-4">
            {Object.entries(ASSETS).map(([assetId, asset]) => {
              const shares = gameState.portfolio[assetId];
              const production = shares * asset.productionPerShare;
              const ownership = (shares / asset.maxShares) * 100;
              
              return (
                <div key={assetId} className="bg-purple-100 p-6 rounded-2xl">
                  <p className="text-4xl text-center mb-2">{asset.emoji}</p>
                  <p className="font-bold text-center">{asset.name}</p>
                  <p className="text-center text-sm">
                    {shares}/{asset.maxShares} shares ({ownership}%)
                  </p>
                  <p className="text-center text-lg font-bold text-green-600">
                    +{production} tokens/day
                  </p>
                </div>
              );
            })}
          </div>
          
          <div className="mt-6 text-center">
            <p className="text-2xl font-bold">
              Total: +{gameState.dailyProduction} tokens/day
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="text-center space-x-4">
          <button
            onClick={() => setPhase('midday')}
            className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-12 py-6 rounded-3xl text-2xl font-bold hover:scale-105 transition-transform shadow-lg"
          >
            Continue to Midday →
          </button>
          
          <button
            onClick={handleSkipDay}
            className="bg-gray-500 text-white px-8 py-6 rounded-3xl text-xl font-bold hover:scale-105 transition-transform"
          >
            ⏭️ Skip Day
          </button>
        </div>
      </div>
    </div>
  );

  // MIDDAY PHASE
  const MiddayPhase = () => (
    <div className="min-h-screen bg-gradient-to-b from-blue-400 to-purple-500 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-6xl font-bold text-white text-center mb-8">
          🌤️ MIDDAY - Day {gameState.day}
        </h1>

        <div className="bg-white rounded-3xl p-8 shadow-2xl mb-8">
          <h2 className="text-3xl font-bold mb-6 text-center">Make Your Decision</h2>
          <p className="text-center text-gray-600 mb-6">Choose ONE action for today</p>

          {/* Buy Options */}
          <div className="mb-8">
            <h3 className="text-2xl font-bold mb-4">💰 Buy Shares</h3>
            <div className="space-y-4">
              {Object.entries(ASSETS).map(([assetId, asset]) => {
                const owned = gameState.portfolio[assetId];
                const canBuy = owned < asset.maxShares;
                
                return (
                  <div key={assetId} className="bg-green-50 p-4 rounded-xl">
                    <p className="font-bold mb-2">{asset.emoji} {asset.name}</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSelectedAction({type: 'buy', asset: assetId, shares: 1})}
                        disabled={!canBuy || gameState.tokens < asset.costPerShare}
                        className={`px-6 py-3 rounded-xl font-bold ${
                          selectedAction?.type === 'buy' && selectedAction?.asset === assetId && selectedAction?.shares === 1
                            ? 'bg-blue-600 text-white'
                            : 'bg-blue-500 text-white hover:bg-blue-600'
                        } disabled:bg-gray-300 disabled:cursor-not-allowed`}
                      >
                        Buy 1 share ({asset.costPerShare} tokens)
                      </button>
                      
                      {canBuy && owned < asset.maxShares - 1 && (
                        <button
                          onClick={() => setSelectedAction({type: 'buy', asset: assetId, shares: 2})}
                          disabled={gameState.tokens < asset.costPerShare * 2}
                          className={`px-6 py-3 rounded-xl font-bold ${
                            selectedAction?.type === 'buy' && selectedAction?.asset === assetId && selectedAction?.shares === 2
                              ? 'bg-purple-600 text-white'
                              : 'bg-purple-500 text-white hover:bg-purple-600'
                          } disabled:bg-gray-300`}
                        >
                          Buy 2 shares ({asset.costPerShare * 2} tokens)
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sell Options */}
          <div className="mb-8">
            <h3 className="text-2xl font-bold mb-4">💸 Sell Shares</h3>
            <div className="space-y-4">
              {Object.entries(ASSETS).map(([assetId, asset]) => {
                const owned = gameState.portfolio[assetId];
                
                if (owned === 0) return null;
                
                return (
                  <div key={assetId} className="bg-red-50 p-4 rounded-xl">
                    <p className="font-bold mb-2">{asset.emoji} {asset.name} (Own {owned} shares)</p>
                    <button
                      onClick={() => setSelectedAction({type: 'sell', asset: assetId, shares: 1})}
                      className={`px-6 py-3 rounded-xl font-bold ${
                        selectedAction?.type === 'sell' && selectedAction?.asset === assetId
                          ? 'bg-red-600 text-white'
                          : 'bg-red-500 text-white hover:bg-red-600'
                      }`}
                    >
                      Sell 1 share (get {Math.floor(asset.costPerShare * 0.6)} tokens)
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Hold Option */}
          <div className="mb-8">
            <button
              onClick={() => setSelectedAction({type: 'hold'})}
              className={`w-full py-4 rounded-xl font-bold text-xl ${
                selectedAction?.type === 'hold'
                  ? 'bg-yellow-600 text-white'
                  : 'bg-yellow-500 text-white hover:bg-yellow-600'
              }`}
            >
              💰 Hold Cash (Do Nothing)
            </button>
          </div>

          {/* Execute Button */}
          <button
            onClick={handleExecuteDecision}
            disabled={!selectedAction}
            className="w-full bg-gradient-to-r from-green-500 to-blue-600 text-white py-6 rounded-3xl text-2xl font-bold hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Execute Decision & Continue →
          </button>
        </div>
      </div>
    </div>
  );

  // EVENING PHASE
  const EveningPhase = () => (
    <div className="min-h-screen bg-gradient-to-b from-purple-400 to-pink-500 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-6xl font-bold text-white text-center mb-8">
          🌆 EVENING - Day {gameState.day}
        </h1>

        <div className="bg-white rounded-3xl p-8 shadow-2xl mb-8">
          <h2 className="text-3xl font-bold mb-6 text-center">Today's Results</h2>

          {/* Production */}
          <div className="bg-green-100 p-6 rounded-2xl mb-6">
            <p className="text-2xl font-bold text-center mb-2">📈 Daily Production</p>
            <p className="text-5xl font-bold text-green-600 text-center">
              +{dayResults?.production || 0} tokens
            </p>
          </div>

          {/* Event */}
          {dayResults?.event && (
            <div className={`p-6 rounded-2xl mb-6 ${
              dayResults.event.totalEffect > 0 ? 'bg-blue-100' : 'bg-red-100'
            }`}>
              <p className="text-4xl text-center mb-4">{dayResults.event.emoji}</p>
              <p className="text-2xl font-bold text-center mb-2">Event!</p>
              <p className="text-xl text-center mb-4">{dayResults.event.message}</p>
              <p className={`text-4xl font-bold text-center ${
                dayResults.event.totalEffect > 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {dayResults.event.totalEffect > 0 ? '+' : ''}{dayResults.event.totalEffect} tokens
              </p>
              <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
                <p className="font-bold">💡 Lesson:</p>
                <p>{dayResults.event.lesson}</p>
              </div>
            </div>
          )}

          {/* Total */}
          <div className="bg-purple-100 p-6 rounded-2xl">
            <p className="text-2xl font-bold text-center mb-2">📊 Net Change</p>
            <p className="text-5xl font-bold text-purple-600 text-center">
              {dayResults ? (dayResults.production + (dayResults.eventEffect || 0)) : 0} tokens
            </p>
          </div>
        </div>

        <button
          onClick={() => setPhase('night')}
          className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-6 rounded-3xl text-2xl font-bold hover:scale-105 transition-transform"
        >
          Continue to Night →
        </button>
      </div>
    </div>
  );

  // NIGHT PHASE
  const NightPhase = () => (
    <div className="min-h-screen bg-gradient-to-b from-indigo-900 to-purple-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-6xl font-bold text-white text-center mb-8">
          🌙 NIGHT - Day {gameState.day - 1}
        </h1>

        {/* New Badges */}
        {newBadges.length > 0 && (
          <div className="bg-yellow-100 border-4 border-yellow-400 rounded-3xl p-8 shadow-2xl mb-8">
            <h2 className="text-4xl font-bold text-center mb-6">🏆 NEW BADGE UNLOCKED!</h2>
            {newBadges.map(badge => (
              <div key={badge.id} className="mb-4">
                <p className="text-6xl text-center mb-2">{badge.emoji}</p>
                <p className="text-3xl font-bold text-center mb-2">{badge.name}</p>
                <p className="text-xl text-center mb-2">{badge.description}</p>
                <p className="text-center text-gray-600">Bonus: {badge.bonus}</p>
                <p className="text-center font-bold text-green-600">+{badge.xp} XP</p>
              </div>
            ))}
          </div>
        )}

        {/* New Missions */}
        {newMissions.length > 0 && (
          <div className="bg-green-100 border-4 border-green-400 rounded-3xl p-8 shadow-2xl mb-8">
            <h2 className="text-4xl font-bold text-center mb-6">✅ MISSION COMPLETE!</h2>
            {newMissions.map(mission => (
              <div key={mission.id} className="mb-4">
                <p className="text-3xl font-bold text-center mb-2">{mission.name}</p>
                <p className="text-xl text-center mb-2">{mission.description}</p>
                <p className="text-center font-bold">
                  Reward: +{mission.reward.tokens} tokens, +{mission.reward.xp} XP
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Daily Summary */}
        <div className="bg-white rounded-3xl p-8 shadow-2xl mb-8">
          <h2 className="text-3xl font-bold mb-6 text-center">📋 Daily Summary</h2>
          <div className="space-y-4">
            <p className="text-xl">💰 Tokens: {gameState.tokens}</p>
            <p className="text-xl">⭐ XP: {gameState.xp} (Level {gameState.level})</p>
            <p className="text-xl">📈 Daily Production: {gameState.dailyProduction} tokens/day</p>
            <p className="text-xl">🏆 Badges: {gameState.unlockedBadges.length}</p>
          </div>
        </div>

        <button
          onClick={handleNextDay}
          className="w-full bg-gradient-to-r from-orange-500 to-yellow-600 text-white py-6 rounded-3xl text-2xl font-bold hover:scale-105 transition-transform"
        >
          ☀️ Start Day {gameState.day} →
        </button>
      </div>
    </div>
  );

  // Handle decision execution
  const handleExecuteDecision = () => {
    if (!selectedAction) return;

    // Execute the action
    if (selectedAction.type === 'buy') {
      gameEngine.buyShares(selectedAction.asset, selectedAction.shares);
    } else if (selectedAction.type === 'sell') {
      gameEngine.sellShares(selectedAction.asset, selectedAction.shares);
    }
    // 'hold' does nothing

    // Process the day
    const results = gameEngine.processDay();
    setDayResults(results);

    // Check for badges and missions
    const badges = checkBadges(gameEngine.getGameState(), gameState.unlockedBadges);
    const missions = checkMissions(gameEngine.getGameState(), gameState.completedMissions);

    badges.forEach(badge => {
      gameEngine.addXP(badge.xp);
      gameState.unlockedBadges.push(badge.id);
    });

    missions.forEach(mission => {
      gameEngine.addXP(mission.reward.xp);
      gameEngine.getGameState().tokens += mission.reward.tokens;
      gameState.completedMissions.push(mission.id);
    });

    setNewBadges(badges);
    setNewMissions(missions);
    
    refreshGameState();
    setPhase('evening');
  };

  // Handle skip day
  const handleSkipDay = () => {
    const results = gameEngine.processDay();
    refreshGameState();
    setPhase('morning');
  };

  // Handle next day
  const handleNextDay = () => {
    setPhase('morning');
    setSelectedAction(null);
    setDayResults(null);
    setNewBadges([]);
    setNewMissions([]);
  };

  // Render current phase
  return (
    <>
      {phase === 'morning' && <MorningPhase />}
      {phase === 'midday' && <MiddayPhase />}
      {phase === 'evening' && <EveningPhase />}
      {phase === 'night' && <NightPhase />}
    </>
  );
}