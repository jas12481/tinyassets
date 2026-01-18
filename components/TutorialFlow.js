'use client';
import { useState } from 'react';
import { ASSETS } from '@/lib/mockAssets';

export default function TutorialFlow({ onComplete }) {
  const [currentStep, setCurrentStep] = useState(0);
  
  const steps = [
    {
      title: 'Welcome to RWA Tycoon!',
      emoji: '🎮',
      content: (
        <div className="text-center space-y-4">
          <p className="text-2xl font-bold">You are a Junior Asset Manager!</p>
          <p className="text-lg text-gray-700">
            Learn how real-world assets work by managing a portfolio.
          </p>
          <p className="text-lg text-gray-700">
            Let's start by watching how each asset works!
          </p>
        </div>
      ),
    },
    {
      title: '🏠 Property - Steady Income',
      emoji: '🏠',
      asset: ASSETS.property,
      content: (
        <div className="space-y-4">
          <div className="bg-blue-100 p-6 rounded-2xl">
            <p className="text-xl font-bold mb-2">What is Property?</p>
            <p className="text-lg">{ASSETS.property.realWorldInfo.whatItIs}</p>
          </div>
          <div className="bg-green-100 p-6 rounded-2xl">
            <p className="text-xl font-bold mb-2">How does it work?</p>
            <p className="text-lg">{ASSETS.property.realWorldInfo.howItWorks}</p>
          </div>
          <div className="bg-yellow-100 p-6 rounded-2xl">
            <p className="text-xl font-bold mb-2">Daily Production:</p>
            <p className="text-2xl font-bold text-green-600">
              +{ASSETS.property.productionPerShare} token per share per day
            </p>
            <p className="text-sm text-gray-600 mt-2">
              Example: 2 shares (50% ownership) = +2 tokens/day
            </p>
          </div>
          <div className="bg-purple-100 p-6 rounded-2xl">
            <p className="text-xl font-bold mb-2">Key Learning:</p>
            <p className="text-lg">Property is the MOST STABLE asset. It produces steady income every day, no matter what!</p>
          </div>
        </div>
      ),
    },
    {
      title: '☀️ Solar - Weather Dependent',
      emoji: '☀️',
      asset: ASSETS.solar,
      content: (
        <div className="space-y-4">
          <div className="bg-blue-100 p-6 rounded-2xl">
            <p className="text-xl font-bold mb-2">What is Solar?</p>
            <p className="text-lg">{ASSETS.solar.realWorldInfo.whatItIs}</p>
          </div>
          <div className="bg-green-100 p-6 rounded-2xl">
            <p className="text-xl font-bold mb-2">How does it work?</p>
            <p className="text-lg">{ASSETS.solar.realWorldInfo.howItWorks}</p>
          </div>
          <div className="bg-yellow-100 p-6 rounded-2xl">
            <p className="text-xl font-bold mb-2">Daily Production:</p>
            <p className="text-2xl font-bold text-green-600">
              +{ASSETS.solar.productionPerShare} token per share per day (base)
            </p>
            <p className="text-sm text-gray-600 mt-2">
              Example: 2 shares (50% ownership) = +1 token/day normally
            </p>
            <p className="text-sm text-orange-600 mt-2 font-bold">
              ⚠️ But production depends on weather! Sunny = more, Cloudy = less
            </p>
          </div>
          <div className="bg-orange-100 p-6 rounded-2xl">
            <p className="text-xl font-bold mb-2">Key Learning:</p>
            <p className="text-lg">Solar is VARIABLE. Weather affects how much it produces. More risk, but can earn more in good weather!</p>
          </div>
        </div>
      ),
    },
    {
      title: '🪙 Gold - Crisis Protection',
      emoji: '🪙',
      asset: ASSETS.gold,
      content: (
        <div className="space-y-4">
          <div className="bg-blue-100 p-6 rounded-2xl">
            <p className="text-xl font-bold mb-2">What is Gold?</p>
            <p className="text-lg">{ASSETS.gold.realWorldInfo.whatItIs}</p>
          </div>
          <div className="bg-green-100 p-6 rounded-2xl">
            <p className="text-xl font-bold mb-2">How does it work?</p>
            <p className="text-lg">{ASSETS.gold.realWorldInfo.howItWorks}</p>
          </div>
          <div className="bg-yellow-100 p-6 rounded-2xl">
            <p className="text-xl font-bold mb-2">Daily Production:</p>
            <p className="text-2xl font-bold text-gray-600">
              +0 tokens per day (normally)
            </p>
            <p className="text-sm text-gray-600 mt-2">
              Gold doesn't produce daily income. It's PROTECTION, not production!
            </p>
            <p className="text-sm text-green-600 mt-2 font-bold">
              💡 During CRISES, Gold can earn +4 to +5 tokens per share!
            </p>
          </div>
          <div className="bg-red-100 p-6 rounded-2xl">
            <p className="text-xl font-bold mb-2">Key Learning:</p>
            <p className="text-lg">Gold is like INSURANCE. It costs more (10 tokens/share), doesn't produce daily, but PROTECTS your portfolio during scary times (market crashes, panics).</p>
          </div>
        </div>
      ),
    },
    {
      title: '✅ Tutorial Complete!',
      emoji: '🎉',
      content: (
        <div className="text-center space-y-4">
          <p className="text-2xl font-bold">Great job!</p>
          <p className="text-lg text-gray-700">
            You've learned about all three assets!
          </p>
          <div className="bg-green-100 p-6 rounded-2xl mt-4">
            <p className="text-xl font-bold mb-2">✅ Mission Complete!</p>
            <p className="text-lg">"Asset Detective"</p>
            <p className="text-sm text-gray-600">+5 tokens, +10 XP</p>
          </div>
          <p className="text-lg text-gray-700 mt-4">
            Ready to start managing your portfolio?
          </p>
        </div>
      ),
    },
  ];

  const currentStepData = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      onComplete();
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-400 via-pink-500 to-orange-500 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between text-white mb-2">
            <span className="text-sm font-bold">Step {currentStep + 1} of {steps.length}</span>
            <span className="text-sm font-bold">Tutorial</span>
          </div>
          <div className="w-full bg-white/30 rounded-full h-3">
            <div
              className="bg-white rounded-full h-3 transition-all duration-300"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-3xl p-8 shadow-2xl mb-8">
          <div className="text-center mb-6">
            <div className="text-8xl mb-4">{currentStepData.emoji}</div>
            <h1 className="text-4xl font-bold text-gray-800 mb-4">
              {currentStepData.title}
            </h1>
          </div>

          <div className="text-lg text-gray-700">
            {currentStepData.content}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center">
          {currentStep > 0 ? (
            <button
              onClick={() => setCurrentStep(currentStep - 1)}
              className="bg-gray-500 text-white px-8 py-4 rounded-2xl text-xl font-bold hover:scale-105 transition-transform"
            >
              ← Previous
            </button>
          ) : (
            <div></div>
          )}

          <div className="flex gap-4">
            {!isLastStep && (
              <button
                onClick={handleSkip}
                className="bg-gray-400 text-white px-8 py-4 rounded-2xl text-xl font-bold hover:scale-105 transition-transform"
              >
                Skip Tutorial
              </button>
            )}
            <button
              onClick={handleNext}
              className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-12 py-4 rounded-2xl text-xl font-bold hover:scale-105 transition-transform shadow-lg"
            >
              {isLastStep ? 'Start Game! →' : 'Next →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
