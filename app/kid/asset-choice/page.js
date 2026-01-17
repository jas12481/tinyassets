'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ASSETS } from '@/lib/mockAssets';
import { RWATycoonEngine } from '@/lib/gameEngine';

export default function AssetChoice() {
  const router = useRouter();
  const [gameEngine] = useState(() => new RWATycoonEngine());
  const gameState = gameEngine.getGameState();

  const handleBuyShares = (assetId, numShares) => {
    const result = gameEngine.buyShares(assetId, numShares);
    
    if (result.success) {
      // Show success
      alert(`${result.message}\nYou now own ${result.newOwnership}%!`);
      // Force re-render
      setGameEngine({...gameEngine});
    } else {
      alert(result.message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-400 to-purple-500 p-8">
      {/* Token Display */}
      <div className="text-center mb-8">
        <div className="bg-white rounded-3xl p-6 inline-block shadow-2xl">
          <p className="text-2xl font-bold">Your Wallet 💰</p>
          <p className="text-5xl font-bold text-green-600">{gameState.tokens} tokens</p>
        </div>
      </div>

      <h1 className="text-4xl font-bold text-white text-center mb-8">
        Buy Asset Shares! 📈
      </h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {Object.entries(ASSETS).map(([assetId, asset]) => {
          const owned = gameState.portfolio[assetId];
          const ownershipPercent = (owned / asset.maxShares) * 100;
          
          return (
            <div
              key={asset.id}
              className="bg-white rounded-3xl p-8 shadow-2xl"
            >
              <div className="text-7xl mb-4 text-center">{asset.emoji}</div>
              <h2 className="text-2xl font-bold mb-2 text-center">{asset.name}</h2>
              <p className="text-gray-600 mb-4 text-center">{asset.description}</p>
              
              {/* Ownership Display */}
              <div className="mb-4 p-4 bg-purple-100 rounded-xl">
                <p className="text-sm font-bold">You own: {owned}/{asset.maxShares} shares</p>
                <p className="text-2xl font-bold text-purple-600">{ownershipPercent}%</p>
                <div className="bg-gray-200 rounded-full h-4 mt-2">
                  <div 
                    className="bg-purple-600 h-4 rounded-full transition-all"
                    style={{ width: `${ownershipPercent}%` }}
                  />
                </div>
              </div>

              {/* Production Info */}
              <p className="text-center mb-4">
                Produces: <span className="font-bold">{asset.productionPerShare * owned} tokens/day</span>
              </p>

              {/* Buy Buttons */}
              <div className="space-y-2">
                <button
                  onClick={() => handleBuyShares(assetId, 1)}
                  disabled={gameState.tokens < asset.costPerShare || owned >= asset.maxShares}
                  className="w-full bg-blue-500 text-white py-3 rounded-xl font-bold hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Buy 1 share ({asset.costPerShare} tokens)
                </button>
                
                {owned < asset.maxShares - 1 && (
                  <button
                    onClick={() => handleBuyShares(assetId, 2)}
                    disabled={gameState.tokens < asset.costPerShare * 2}
                    className="w-full bg-purple-500 text-white py-3 rounded-xl font-bold hover:bg-purple-600 disabled:bg-gray-300"
                  >
                    Buy 2 shares ({asset.costPerShare * 2} tokens)
                  </button>
                )}
              </div>

              {/* Educational Info */}
              <div className="mt-4 p-3 bg-yellow-50 rounded-lg text-sm">
                <p className="font-bold">💡 Did you know?</p>
                <p>{asset.realWorldInfo.whatItIs}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Next Day Button */}
      <div className="text-center mt-8">
        <button
          onClick={() => router.push('/kid/game')}
          className="bg-gradient-to-r from-green-500 to-blue-600 text-white px-12 py-6 rounded-3xl text-2xl font-bold hover:scale-105 transition-transform shadow-lg"
        >
          Start Day {gameState.day} →
        </button>
      </div>
    </div>
  );
}