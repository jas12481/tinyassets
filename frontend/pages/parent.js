import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { supabase } from '../lib/supabase';
import { Bot, Send, Loader2, Brain, HelpCircle, Sparkles } from 'lucide-react';

export default function ParentDashboard() {
  // Authentication states
  const [kidUsername, setKidUsername] = useState(''); // This is the user_id
  const [parentPin, setParentPin] = useState('');
  const [authError, setAuthError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Dashboard data states
  const [gameState, setGameState] = useState(null);
  const [events, setEvents] = useState([]);
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(false);

  // Add these AI Assistant states
  const [aiMessages, setAiMessages] = useState([]);
  const [userMessage, setUserMessage] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [aiContext, setAiContext] = useState({
    childUsername: '',
    gameState: null,
    recentEvents: [],
    earnedBadges: [],
    learningFocus: ''
  });

  // Check if already authenticated on mount
  useEffect(() => {
    const authData = localStorage.getItem('parent_auth');
    if (authData) {
      try {
        const parsed = JSON.parse(authData);
        if (parsed.expiresAt > Date.now()) {
          // Still valid
          setIsAuthenticated(true);
          setKidUsername(parsed.kid_username);
          fetchParentData(parsed.kid_username); // user_id = kid_username
        } else {
          // Expired
          localStorage.removeItem('parent_auth');
        }
      } catch (e) {
        localStorage.removeItem('parent_auth');
      }
    }
  }, []);

  // Update this useEffect to set AI context when data loads
  useEffect(() => {
    if (gameState && kidUsername) {
      setAiContext({
        childUsername: kidUsername,
        gameState: gameState,
        recentEvents: events.slice(0, 3),
        earnedBadges: badges.slice(0, 3),
        learningFocus: gameState.selected_asset || 'general'
      });
      
      // Add welcome message
      setAiMessages([
        {
          id: 1,
          role: 'assistant',
          content: `Hello! I'm your AI Parent Assistant for TinyAssets. I can help you understand your child ${kidUsername}'s learning progress. Ask me anything about their XP, badges, events, or what they're learning!`,
          timestamp: new Date().toISOString()
        }
      ]);
    }
  }, [gameState, kidUsername, events, badges]);

  // Authentication handler
  const handleLogin = async () => {
    if (!kidUsername.trim() || !parentPin.trim()) {
      setAuthError('Please enter both username and PIN');
      return;
    }

    if (parentPin.length !== 4 || !/^\d+$/.test(parentPin)) {
      setAuthError('PIN must be exactly 4 digits');
      return;
    }

    setIsLoggingIn(true);
    setAuthError('');

    try {
      // Call backend API for authentication
      const response = await fetch('/api/parent/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          kid_username: kidUsername.trim(), // This is user_id
          parent_pin: parentPin 
        })
      });

      const data = await response.json();

      if (data.success) {
        // Save auth to localStorage (expires in 24 hours)
        const authData = {
          kid_username: kidUsername.trim(), // This is user_id
          expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
          authenticatedAt: new Date().toISOString()
        };
        localStorage.setItem('parent_auth', JSON.stringify(authData));
        
        setIsAuthenticated(true);
        fetchParentData(kidUsername.trim()); // user_id = kid_username
      } else {
        setAuthError(data.error || 'Invalid username or PIN');
      }
    } catch (error) {
      console.error('Login error:', error);
      setAuthError('Network error. Please try again.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('parent_auth');
    setIsAuthenticated(false);
    setGameState(null);
    setEvents([]);
    setBadges([]);
    setKidUsername('');
    setParentPin('');
  };

  // Fetch parent data after authentication - using user_id
  const fetchParentData = async (user_id) => {
    try {
      setLoading(true);
      
      // Fetch game state using user_id
      const { data: gameData, error: gameError } = await supabase
        .from('game_state')
        .select('selected_asset, xp, level, created_at, updated_at')
        .eq('user_id', user_id)
        .single();
      
      if (gameError && gameError.code !== 'PGRST116') {
        console.error('Error fetching game state:', gameError);
      }
      
      // Fetch event history using user_id - note field names match your schema
      const { data: eventData, error: eventError } = await supabase
        .from('event_history')
        .select('asset_type, event_name, effect_description, effect_value, timestamp')
        .eq('user_id', user_id)
        .order('timestamp', { ascending: false })
        .limit(10);
      
      if (eventError) {
        console.error('Error fetching events:', eventError);
      }
      
      // Fetch badges using user_id - note field names match your schema
      const { data: badgeData, error: badgeError } = await supabase
        .from('earned_badges')
        .select('badge_id, badge_name, asset_type, unlocked_at')
        .eq('user_id', user_id)
        .order('unlocked_at', { ascending: false });
      
      if (badgeError) {
        console.error('Error fetching badges:', badgeError);
      }
      
      setGameState(gameData || getDefaultGameState());
      setEvents(eventData || []);
      setBadges(badgeData || []);
    } catch (error) {
      console.error('Error fetching parent data:', error);
      setGameState(getDefaultGameState());
      setEvents([]);
      setBadges([]);
    } finally {
      setLoading(false);
    }
  };

  // Add AI Assistant functions
  const handleSendMessage = async () => {
    if (!userMessage.trim() || isAiLoading) return;
    
    // Add user message
    const newUserMessage = {
      id: aiMessages.length + 1,
      role: 'user',
      content: userMessage,
      timestamp: new Date().toISOString()
    };
    
    setAiMessages(prev => [...prev, newUserMessage]);
    setUserMessage('');
    setIsAiLoading(true);
    
    try {
      // Call your AI backend endpoint
      const response = await fetch('/api/ai/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: userMessage,
          context: aiContext,
          conversationHistory: aiMessages.slice(-5) // Last 5 messages for context
        })
      });
      
      const data = await response.json();
      
      // Add AI response
      const aiResponse = {
        id: aiMessages.length + 2,
        role: 'assistant',
        content: data.answer || "I'm here to help! Ask me about your child's progress.",
        timestamp: new Date().toISOString()
      };
      
      setAiMessages(prev => [...prev, aiResponse]);
    } catch (error) {
      console.error('AI Assistant error:', error);
      
      // Fallback response
      const fallbackResponse = {
        id: aiMessages.length + 2,
        role: 'assistant',
        content: "I'm having trouble connecting right now. You can ask me about:\n• Your child's current level and XP\n• Badges they've earned\n• Recent learning events\n• What they're currently learning",
        timestamp: new Date().toISOString()
      };
      
      setAiMessages(prev => [...prev, fallbackResponse]);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleQuickQuestion = (question) => {
    setUserMessage(question);
    // Auto-send after a brief delay
    setTimeout(() => {
      handleSendMessage();
    }, 100);
  };

  // Add AI Assistant UI component
  const AIAssistant = () => (
    <div className={`ai-assistant ${isAssistantOpen ? 'open' : ''}`}>
      {/* Assistant Header */}
      <div className="ai-header" onClick={() => setIsAssistantOpen(!isAssistantOpen)}>
        <div className="ai-header-content">
          <Brain size={20} />
          <div>
            <h4>AI Parent Assistant</h4>
            <p>Ask questions about your child's learning</p>
          </div>
          <button className="ai-toggle">
            {isAssistantOpen ? '−' : '+'}
          </button>
        </div>
      </div>
      
      {/* Assistant Body */}
      {isAssistantOpen && (
        <div className="ai-body">
          {/* Quick Questions */}
          <div className="quick-questions">
            <p className="quick-questions-label">Quick questions:</p>
            <div className="quick-buttons">
              <button onClick={() => handleQuickQuestion("What is my child's current level?")}>
                Current Level?
              </button>
              <button onClick={() => handleQuickQuestion("What badges has my child earned?")}>
                Badges Earned?
              </button>
              <button onClick={() => handleQuickQuestion("What is my child learning about?")}>
                Learning Focus?
              </button>
              <button onClick={() => handleQuickQuestion("Recent learning events?")}>
                Recent Events?
              </button>
            </div>
          </div>
          
          {/* Chat Messages */}
          <div className="chat-messages">
            {aiMessages.map((message) => (
              <div key={message.id} className={`message ${message.role}`}>
                <div className="message-content">
                  {message.content}
                </div>
                <div className="message-time">
                  {new Date(message.timestamp).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </div>
              </div>
            ))}
            {isAiLoading && (
              <div className="message assistant loading">
                <div className="message-content">
                  <Loader2 className="animate-spin" size={16} />
                  <span>Thinking...</span>
                </div>
              </div>
            )}
          </div>
          
          {/* Input Area */}
          <div className="chat-input">
            <input
              type="text"
              placeholder="Ask about your child's learning progress..."
              value={userMessage}
              onChange={(e) => setUserMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              disabled={isAiLoading}
            />
            <button 
              onClick={handleSendMessage}
              disabled={!userMessage.trim() || isAiLoading}
              className="send-button"
            >
              {isAiLoading ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <Send size={18} />
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );

  // Helper functions
  const getDefaultGameState = () => ({
    selected_asset: 'Exploring Assets',
    xp: 0,
    level: 1,
    created_at: new Date().toISOString()
  });

  const getEventIcon = (eventName) => {
    const iconMap = {
      'Heatwave': '🌡️',
      'Cold Snap': '❄️',
      'Rainy Season': '🌧️',
      'New Park': '🏗️',
      'School Built': '🏫',
      'Road Construction': '🚧',
      'Maintenance': '🔧',
      'Upgrade': '⚡',
      'Government Incentive': '🏛️',
      'Market Boom': '📈',
      'Market Slump': '📉',
      'Inflation': '💰',
      'Gold Discovery': '🌟',
      'Default': '📊'
    };
    
    return iconMap[eventName] || iconMap['Default'];
  };

  const getBadgeIcon = (badgeName) => {
    const iconMap = {
      'Event Survivor': '🛡️',
      'Quick Learner': '🚀',
      'Solar Explorer': '☀️',
      'Property Pro': '🏠',
      'Gold Guardian': '💰',
      'Risk Manager': '🎯',
      'Pattern Recognizer': '🔍',
      'Default': '🏆'
    };
    
    return iconMap[badgeName] || iconMap['Default'];
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Recently';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const calculateLevelProgress = (xp) => {
    // Assuming 1000 XP per level
    const currentLevelXP = xp % 1000;
    const progressPercentage = (currentLevelXP / 1000) * 100;
    return Math.min(progressPercentage, 100);
  };

  const getLearningMessage = (assetType) => {
    const messages = {
      'Solar': 'Your child is learning how solar energy production is affected by weather, maintenance, and government policies.',
      'Property': 'Your child is discovering how property values change based on location, amenities, and economic factors.',
      'Gold': 'Your child is exploring how gold prices respond to market conditions, inflation, and global events.'
    };
    
    return messages[assetType] || 'Your child is learning how real-world assets respond to various economic and environmental factors.';
  };

  // ============ LOGIN SCREEN ============
  if (!isAuthenticated) {
    return (
      <>
        <Head>
          <title>Parent Login - TinyAssets</title>
          <meta name="description" content="Login to view your child's learning progress" />
        </Head>
        
        <div className="auth-container">
          <header className="auth-header">
            <Link href="/" className="back-button">
              ← Back to Start
            </Link>
            <h1>🔒 Parent Dashboard Login</h1>
            <p>Enter your child's username and PIN to view their progress</p>
          </header>

          <main className="auth-main">
            <div className="login-card">
              <div className="login-icon">👨‍👦</div>
              <h2>View Child's Progress</h2>
              <p className="login-instructions">
                Enter the username your child chose and the 4-digit PIN they received.
                <br />
                <small>Ask your child for this information if you don't have it.</small>
              </p>
              
              <div className="login-form">
                <div className="form-group">
                  <label>Child's Username (user_id)</label>
                  <input
                    type="text"
                    placeholder="Enter child's username"
                    value={kidUsername}
                    onChange={(e) => setKidUsername(e.target.value)}
                    disabled={isLoggingIn}
                    onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                  />
                </div>
                
                <div className="form-group">
                  <label>4-digit PIN</label>
                  <input
                    type="password"
                    placeholder="Enter 4-digit PIN"
                    maxLength="4"
                    value={parentPin}
                    onChange={(e) => setParentPin(e.target.value.replace(/\D/g, ''))}
                    disabled={isLoggingIn}
                    onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                  />
                  <small className="pin-hint">Exactly 4 digits (numbers only)</small>
                </div>
                
                {authError && (
                  <div className="error-message">
                    ⚠️ {authError}
                  </div>
                )}
                
                <button 
                  className="login-button"
                  onClick={handleLogin}
                  disabled={isLoggingIn || !kidUsername || !parentPin}
                >
                  {isLoggingIn ? (
                    <>
                      <span className="spinner"></span>
                      Verifying...
                    </>
                  ) : 'View Dashboard'}
                </button>
              </div>
              
              <div className="login-help">
                <h3>Where to find these?</h3>
                <ul>
                  <li>📝 <strong>Username:</strong> What your child entered when starting the game</li>
                  <li>🔑 <strong>PIN:</strong> 4-digit number shown to your child when they started</li>
                  <li>💡 <strong>Tip:</strong> Ask your child to check their game screen for the "Parent Info" button</li>
                </ul>
              </div>
            </div>
            
            <div className="safety-notice">
              <h3>💡 Safety First</h3>
              <p>
                This dashboard shows your child's learning progress only. 
                No real money is involved. All data is from educational simulations.
              </p>
            </div>
          </main>
        </div>

        <style jsx>{`
          .auth-container {
            min-height: 100vh;
            background: linear-gradient(135deg, #f5f7fa 0%, #e4e8f0 100%);
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          }
          
          .auth-header {
            padding: 30px;
            text-align: center;
            background: white;
            box-shadow: 0 2px 10px rgba(0,0,0,0.05);
          }
          
          .auth-header h1 {
            margin: 20px 0 10px;
            color: #2d3748;
          }
          
          .auth-header p {
            color: #718096;
            margin: 0;
          }
          
          .back-button {
            display: inline-block;
            color: #667eea;
            text-decoration: none;
            font-weight: 500;
            margin-bottom: 10px;
          }
          
          .auth-main {
            max-width: 500px;
            margin: 0 auto;
            padding: 30px 20px;
          }
          
          .login-card {
            background: white;
            border-radius: 16px;
            padding: 40px 30px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.1);
            margin-bottom: 30px;
          }
          
          .login-icon {
            font-size: 3rem;
            text-align: center;
            margin-bottom: 20px;
          }
          
          .login-card h2 {
            text-align: center;
            margin: 0 0 10px;
            color: #2d3748;
          }
          
          .login-instructions {
            text-align: center;
            color: #718096;
            margin-bottom: 30px;
            line-height: 1.6;
          }
          
          .login-instructions small {
            color: #a0aec0;
          }
          
          .form-group {
            margin-bottom: 20px;
          }
          
          .form-group label {
            display: block;
            margin-bottom: 8px;
            font-weight: 500;
            color: #4a5568;
          }
          
          .form-group input {
            width: 100%;
            padding: 12px 16px;
            border: 2px solid #e2e8f0;
            border-radius: 8px;
            font-size: 1rem;
            transition: border-color 0.2s;
          }
          
          .form-group input:focus {
            outline: none;
            border-color: #667eea;
          }
          
          .form-group input:disabled {
            background: #f7fafc;
            cursor: not-allowed;
          }
          
          .pin-hint {
            display: block;
            margin-top: 5px;
            color: #a0aec0;
            font-size: 0.85rem;
          }
          
          .error-message {
            background: #fed7d7;
            color: #742a2a;
            padding: 12px 16px;
            border-radius: 8px;
            margin-bottom: 20px;
            font-weight: 500;
          }
          
          .login-button {
            width: 100%;
            padding: 14px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            transition: transform 0.2s, opacity 0.2s;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
          }
          
          .login-button:hover:not(:disabled) {
            transform: translateY(-2px);
          }
          
          .login-button:disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }
          
          .spinner {
            width: 16px;
            height: 16px;
            border: 2px solid rgba(255,255,255,0.3);
            border-top: 2px solid white;
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }
          
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          .login-help {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
          }
          
          .login-help h3 {
            margin: 0 0 15px;
            color: #4a5568;
            font-size: 1.1rem;
          }
          
          .login-help ul {
            margin: 0;
            padding-left: 20px;
            color: #718096;
          }
          
          .login-help li {
            margin-bottom: 8px;
            line-height: 1.5;
          }
          
          .safety-notice {
            background: #fff9db;
            border: 2px solid #ffe066;
            border-radius: 12px;
            padding: 20px;
            color: #5c3c00;
          }
          
          .safety-notice h3 {
            margin: 0 0 10px;
            color: #5c3c00;
          }
          
          .safety-notice p {
            margin: 0;
            line-height: 1.5;
          }
          
          @media (max-width: 768px) {
            .auth-header {
              padding: 20px;
            }
            
            .login-card {
              padding: 30px 20px;
            }
          }
        `}</style>
      </>
    );
  }

  // ============ DASHBOARD SCREEN ============
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading learning progress...</p>
        <style jsx>{`
          .loading-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            background: linear-gradient(135deg, #f5f7fa 0%, #e4e8f0 100%);
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          }
          .loading-spinner {
            width: 50px;
            height: 50px;
            border: 5px solid #e4e8f0;
            border-top: 5px solid #4ECDC4;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-bottom: 20px;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Parent Dashboard - TinyAssets</title>
        <meta name="description" content="View your child's learning progress on TinyAssets" />
      </Head>
      
      <div className="parent-container">
        {/* Header */}
        <header className="parent-header">
          <div className="header-top">
            <Link href="/" className="back-button">
              ← Back to Start
            </Link>
            <button className="logout-button" onClick={handleLogout}>
              🔓 Logout
            </button>
          </div>
          <div className="header-content">
            <h1>Parent Dashboard</h1>
            <p className="subtitle">Viewing progress for: <strong>{kidUsername}</strong></p>
          </div>
        </header>

        <main className="parent-main">
          {/* Learning Summary Card */}
          <section className="summary-card">
            <div className="summary-header">
              <h2>Learning Summary</h2>
              <div className="xp-display">
                <span className="xp-label">Level {gameState?.level || 1}</span>
                <div className="xp-bar">
                  <div 
                    className="xp-fill"
                    style={{ width: `${calculateLevelProgress(gameState?.xp || 0)}%` }}
                  ></div>
                </div>
                <span className="xp-points">{gameState?.xp || 0} XP</span>
              </div>
            </div>
            
            <div className="summary-content">
              <div className="summary-item">
                <div className="summary-icon">
                  {gameState?.selected_asset === 'Solar' ? '☀️' : 
                   gameState?.selected_asset === 'Property' ? '🏠' : '💰'}
                </div>
                <div>
                  <h3>Current Focus</h3>
                  <p className="asset-name">{gameState?.selected_asset || 'Exploring Assets'}</p>
                  <p className="asset-subtext">
                    {gameState?.selected_asset ? 
                      `${gameState.selected_asset} Asset` : 
                      'Learning about different assets'}
                  </p>
                </div>
              </div>
              
              <div className="summary-item">
                <div className="summary-icon">🔄</div>
                <div>
                  <h3>Events Experienced</h3>
                  <p className="count">{events.length} real-world scenarios</p>
                  <p className="asset-subtext">
                    Last event: {events[0] ? formatDate(events[0].timestamp) : 'None yet'}
                  </p>
                </div>
              </div>
              
              <div className="summary-item">
                <div className="summary-icon">🏆</div>
                <div>
                  <h3>Badges Earned</h3>
                  <p className="count">{badges.length} learning achievements</p>
                  <p className="asset-subtext">
                    Latest: {badges[0]?.badge_name || 'No badges yet'}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="learning-message">
              <p>
                <strong>Learning Progress:</strong> {getLearningMessage(gameState?.selected_asset)}
                Through interactive simulations, they're building foundational financial literacy
                without any real-world financial risk.
              </p>
            </div>
          </section>

          {/* Two-column layout for events and badges */}
          <div className="columns-container">
            {/* Events Timeline */}
            <section className="events-section">
              <h2>Events Timeline</h2>
              <p className="section-description">
                Real-world scenarios experienced ({events.length} total)
              </p>
              
              <div className="events-timeline">
                {events.length > 0 ? (
                  events.map((event, index) => (
                    <div key={index} className="event-card">
                      <div className="event-icon">
                        {getEventIcon(event.event_name)}
                      </div>
                      <div className="event-content">
                        <div className="event-header">
                          <h3>{event.event_name}</h3>
                          <span className="event-asset">{event.asset_type || gameState?.selected_asset}</span>
                        </div>
                        <p className="event-description">{event.effect_description}</p>
                        {event.effect_value && (
                          <div className="event-impact">
                            <span className={`impact-tag ${event.effect_value > 0 ? 'positive' : 'negative'}`}>
                              {event.effect_value > 0 ? '📈 Positive' : '📉 Negative'} Impact
                            </span>
                          </div>
                        )}
                        <span className="event-time">
                          {formatDate(event.timestamp)}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty-state">
                    <div className="empty-icon">📊</div>
                    <h3>No Events Yet</h3>
                    <p>Events will appear here as your child experiences different scenarios in the game.</p>
                  </div>
                )}
              </div>
              
              {events.length > 0 && (
                <div className="section-footer">
                  <p>These events simulate real-world factors that affect asset values.</p>
                </div>
              )}
            </section>

            {/* Badges Earned */}
            <section className="badges-section">
              <h2>Badges Earned</h2>
              <p className="section-description">
                Learning achievements unlocked ({badges.length} total)
              </p>
              
              <div className="badges-grid">
                {badges.length > 0 ? (
                  badges.map((badge, index) => (
                    <div key={index} className="badge-card">
                      <div className="badge-icon">
                        {getBadgeIcon(badge.badge_name)}
                      </div>
                      <div className="badge-content">
                        <h3>{badge.badge_name}</h3>
                        <p>ID: {badge.badge_id} • Asset: {badge.asset_type}</p>
                        <div className="badge-footer">
                          <span className="badge-date">
                            Earned {formatDate(badge.unlocked_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty-state">
                    <div className="empty-icon">🏆</div>
                    <h3>No Badges Yet</h3>
                    <p>Badges will appear here as your child completes learning milestones.</p>
                  </div>
                )}
              </div>
              
              {badges.length > 0 && (
                <div className="section-footer">
                  <p>Each badge represents a specific learning milestone achieved.</p>
                </div>
              )}
            </section>
          </div>

          {/* ============ AI ASSISTANT SECTION ============ */}
          <section className="ai-assistant-section">
            <div className="section-header">
              <div className="section-icon">
                <Brain size={24} />
              </div>
              <div>
                <h2>AI-Powered Parent Assistant</h2>
                <p className="section-subtitle">Get insights about your child's learning journey</p>
              </div>
              <span className="ai-badge">Level 3 Feature</span>
            </div>
            
            <div className="ai-description">
              <p>
                Ask questions about your child's progress in natural language. 
                The AI understands context about your child's learning journey and can provide 
                personalized insights.
              </p>
            </div>
            
            {/* AI Assistant Widget */}
            <AIAssistant />
            
            <div className="ai-examples">
              <h4>Try asking:</h4>
              <div className="example-questions">
                <div className="example-card" onClick={() => handleQuickQuestion("What's my child's current progress?")}>
                  <HelpCircle size={16} />
                  <span>What's my child's current progress?</span>
                </div>
                <div className="example-card" onClick={() => handleQuickQuestion("Which asset is my child learning about?")}>
                  <HelpCircle size={16} />
                  <span>Which asset is my child learning about?</span>
                </div>
                <div className="example-card" onClick={() => handleQuickQuestion("Explain the badges my child earned")}>
                  <HelpCircle size={16} />
                  <span>Explain the badges my child earned</span>
                </div>
                <div className="example-card" onClick={() => handleQuickQuestion("What does the solar asset teach?")}>
                  <HelpCircle size={16} />
                  <span>What does the solar asset teach?</span>
                </div>
              </div>
            </div>
            
            <div className="ai-features">
              <div className="feature">
                <div className="feature-icon">🎯</div>
                <div>
                  <h4>Personalized Insights</h4>
                  <p>Answers based on your child's specific learning journey</p>
                </div>
              </div>
              <div className="feature">
                <div className="feature-icon">🤖</div>
                <div>
                  <h4>Smart Understanding</h4>
                  <p>Understands questions about XP, levels, badges, and learning concepts</p>
                </div>
              </div>
              <div className="feature">
                <div className="feature-icon">🔒</div>
                <div>
                  <h4>Private & Secure</h4>
                  <p>All conversations are private and data stays within the app</p>
                </div>
              </div>
            </div>
          </section>

          {/* Safety Information */}
          <section className="safety-section">
            <div className="safety-header">
              <div className="safety-icon">🛡️</div>
              <div>
                <h2>Safety & Educational Focus</h2>
                <p className="safety-subtitle">TinyAssets is designed with child safety as the top priority</p>
              </div>
            </div>
            
            <div className="safety-points">
              <div className="safety-point">
                <div className="point-icon">💰</div>
                <div>
                  <h3>No Real Money Involved</h3>
                  <p>All assets are simulated using virtual currency. No real money is required or involved in any part of the experience.</p>
                </div>
              </div>
              
              <div className="safety-point">
                <div className="point-icon">🔄</div>
                <div>
                  <h3>No Trading or Transactions</h3>
                  <p>This is purely an educational simulation. There is no buying, selling, or trading of any real or virtual assets.</p>
                </div>
              </div>
              
              <div className="safety-point">
                <div className="point-icon">📚</div>
                <div>
                  <h3>Education-First Approach</h3>
                  <p>Every game element is designed to teach financial literacy concepts, not investment strategies.</p>
                </div>
              </div>
              
              <div className="safety-point">
                <div className="point-icon">👶</div>
                <div>
                  <h3>Age-Appropriate Content</h3>
                  <p>All content is designed for children and focuses on basic economic concepts without complex financial jargon.</p>
                </div>
              </div>
            </div>
            
            <div className="educational-note">
              <h3>Educational Value</h3>
              <p>
                TinyAssets helps children understand fundamental economic concepts like supply and demand, 
                value appreciation/depreciation, and how external events affect different types of assets. 
                This foundational knowledge builds financial literacy in a completely safe, gamified environment.
              </p>
            </div>
          </section>
        </main>

        <footer className="parent-footer">
          <p>TinyAssets • Educational Simulation Only • Designed for Learning</p>
          <p className="footer-note">
            Viewing progress for: <strong>{kidUsername}</strong> (user_id)
            <br />
            Last updated: {new Date().toLocaleDateString('en-US', { 
              month: 'long', 
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
        </footer>
      </div>

      <style jsx>{`
        /* Main Container */
        .parent-container {
          min-height: 100vh;
          background: linear-gradient(135deg, #f5f7fa 0%, #e4e8f0 100%);
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        
        /* Header */
        .parent-header {
          padding: 30px;
          background: white;
          box-shadow: 0 2px 20px rgba(0,0,0,0.08);
        }
        
        .header-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        
        .back-button {
          color: #667eea;
          text-decoration: none;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 5px;
        }
        
        .logout-button {
          background: #fed7d7;
          color: #742a2a;
          border: none;
          padding: 8px 16px;
          border-radius: 8px;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 5px;
          transition: background 0.2s;
        }
        
        .logout-button:hover {
          background: #feb2b2;
        }
        
        .header-content h1 {
          margin: 0;
          color: #2d3748;
          font-size: 2rem;
        }
        
        .subtitle {
          margin: 10px 0 0;
          color: #718096;
          font-size: 1.1rem;
        }
        
        /* Main Content */
        .parent-main {
          max-width: 1200px;
          margin: 0 auto;
          padding: 30px;
        }
        
        /* Summary Card */
        .summary-card {
          background: white;
          border-radius: 16px;
          padding: 30px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.08);
          margin-bottom: 30px;
        }
        
        .summary-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
        }
        
        .summary-header h2 {
          margin: 0;
          color: #2d3748;
        }
        
        .xp-display {
          display: flex;
          align-items: center;
          gap: 15px;
        }
        
        .xp-label {
          font-weight: 600;
          color: #4a5568;
        }
        
        .xp-bar {
          width: 200px;
          height: 8px;
          background: #e2e8f0;
          border-radius: 4px;
          overflow: hidden;
        }
        
        .xp-fill {
          height: 100%;
          background: linear-gradient(90deg, #4ECDC4, #44a08d);
          border-radius: 4px;
          transition: width 0.5s ease;
        }
        
        .xp-points {
          font-weight: 600;
          color: #667eea;
        }
        
        .summary-content {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 25px;
          margin-bottom: 30px;
        }
        
        .summary-item {
          display: flex;
          align-items: center;
          gap: 15px;
        }
        
        .summary-icon {
          font-size: 2rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          width: 60px;
          height: 60px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .summary-item h3 {
          margin: 0 0 5px;
          color: #4a5568;
          font-size: 0.9rem;
          font-weight: 500;
        }
        
        .asset-name {
          margin: 0;
          color: #2d3748;
          font-size: 1.2rem;
          font-weight: 600;
        }
        
        .count {
          margin: 0;
          color: #2d3748;
          font-size: 1.2rem;
          font-weight: 600;
        }
        
        .asset-subtext {
          font-size: 0.85rem;
          color: #718096;
          margin: 2px 0 0 0;
        }
        
        .learning-message {
          padding: 20px;
          background: #f8fafc;
          border-radius: 12px;
          border-left: 4px solid #4ECDC4;
        }
        
        .learning-message p {
          margin: 0;
          line-height: 1.6;
          color: #4a5568;
        }
        
        /* Columns Layout */
        .columns-container {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 30px;
          margin-bottom: 30px;
        }
        
        @media (max-width: 768px) {
          .columns-container {
            grid-template-columns: 1fr;
          }
        }
        
        /* Events Section */
        .events-section,
        .badges-section {
          background: white;
          border-radius: 16px;
          padding: 25px;
          box-shadow: 0 5px 20px rgba(0,0,0,0.05);
        }
        
        .events-section h2,
        .badges-section h2 {
          margin: 0 0 10px;
          color: #2d3748;
        }
        
        .section-description {
          margin: 0 0 20px;
          color: #718096;
          font-size: 0.95rem;
        }
        
        .events-timeline {
          max-height: 400px;
          overflow-y: auto;
          padding-right: 10px;
        }
        
        .event-card {
          display: flex;
          gap: 15px;
          padding: 20px 0;
          border-bottom: 1px solid #e2e8f0;
        }
        
        .event-card:last-child {
          border-bottom: none;
        }
        
        .event-icon {
          font-size: 1.5rem;
          flex-shrink: 0;
        }
        
        .event-content {
          flex: 1;
        }
        
        .event-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }
        
        .event-header h3 {
          margin: 0;
          color: #2d3748;
          font-size: 1.1rem;
        }
        
        .event-asset {
          font-size: 0.75rem;
          padding: 2px 8px;
          background: #e2e8f0;
          border-radius: 12px;
          color: #4a5568;
          font-weight: 500;
        }
        
        .event-description {
          margin: 0 0 10px 0;
          color: #4a5568;
          line-height: 1.5;
          font-size: 0.95rem;
        }
        
        .event-impact {
          margin-bottom: 8px;
        }
        
        .impact-tag {
          font-size: 0.75rem;
          padding: 3px 10px;
          border-radius: 12px;
          font-weight: 500;
        }
        
        .impact-tag.positive {
          background: #c6f6d5;
          color: #22543d;
        }
        
        .impact-tag.negative {
          background: #fed7d7;
          color: #742a2a;
        }
        
        .event-time {
          font-size: 0.85rem;
          color: #a0aec0;
        }
        
        /* Badges Section */
        .badges-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 20px;
          max-height: 400px;
          overflow-y: auto;
          padding-right: 10px;
        }
        
        .badge-card {
          background: #f8fafc;
          border-radius: 12px;
          padding: 20px;
          border: 1px solid #e2e8f0;
        }
        
        .badge-icon {
          font-size: 2rem;
          margin-bottom: 10px;
        }
        
        .badge-content h3 {
          margin: 0 0 8px;
          color: #2d3748;
          font-size: 1rem;
        }
        
        .badge-content p {
          margin: 0 0 10px;
          color: #718096;
          font-size: 0.9rem;
          line-height: 1.4;
        }
        
        .badge-footer {
          margin-top: 8px;
          padding-top: 8px;
          border-top: 1px solid #e2e8f0;
        }
        
        .badge-date {
          font-size: 0.8rem;
          color: #a0aec0;
        }
        
        /* Empty States */
        .empty-state {
          text-align: center;
          padding: 40px 20px;
          background: #f8fafc;
          border-radius: 12px;
          border: 2px dashed #e2e8f0;
        }
        
        .empty-icon {
          font-size: 3rem;
          margin-bottom: 15px;
          opacity: 0.5;
        }
        
        .empty-state h3 {
          margin: 0 0 10px 0;
          color: #4a5568;
        }
        
        .empty-state p {
          margin: 0;
          color: #718096;
          max-width: 300px;
          margin: 0 auto;
          line-height: 1.5;
        }
        
        .section-footer {
          margin-top: 20px;
          padding-top: 15px;
          border-top: 1px solid #eaeaea;
          text-align: center;
          font-size: 0.9rem;
          color: #718096;
        }
        
        /* AI Assistant Section */
        .ai-assistant-section {
          background: white;
          border-radius: 16px;
          padding: 30px;
          box-shadow: 0 5px 20px rgba(0,0,0,0.05);
          margin-bottom: 30px;
          border: 2px solid #eef2ff;
        }
        
        .ai-assistant-section .section-header {
          display: flex;
          align-items: center;
          gap: 15px;
          margin-bottom: 20px;
          position: relative;
        }
        
        .ai-assistant-section .section-icon {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          width: 50px;
          height: 50px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .ai-badge {
          position: absolute;
          top: 0;
          right: 0;
          background: linear-gradient(135deg, #4ECDC4, #44a08d);
          color: white;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 600;
        }
        
        .section-subtitle {
          margin: 5px 0 0;
          color: #718096;
          font-size: 1rem;
          font-weight: normal;
        }
        
        .ai-description {
          background: #f8fafc;
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 25px;
          border-left: 4px solid #667eea;
        }
        
        .ai-description p {
          margin: 0;
          color: #4a5568;
          line-height: 1.6;
        }
        
        /* AI Assistant Widget */
        .ai-assistant {
          background: white;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          margin-bottom: 25px;
          overflow: hidden;
          transition: all 0.3s ease;
        }
        
        .ai-assistant.open {
          box-shadow: 0 8px 25px rgba(102, 126, 234, 0.15);
        }
        
        .ai-header {
          padding: 20px;
          background: linear-gradient(135deg, #f6f8ff 0%, #eef2ff 100%);
          cursor: pointer;
          border-bottom: 1px solid #e2e8f0;
        }
        
        .ai-header-content {
          display: flex;
          align-items: center;
          gap: 15px;
        }
        
        .ai-header h4 {
          margin: 0;
          color: #2d3748;
          font-size: 1.1rem;
        }
        
        .ai-header p {
          margin: 5px 0 0;
          color: #718096;
          font-size: 0.9rem;
        }
        
        .ai-toggle {
          margin-left: auto;
          background: #667eea;
          color: white;
          border: none;
          width: 30px;
          height: 30px;
          border-radius: 8px;
          font-size: 1.2rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .ai-body {
          max-height: 500px;
          display: flex;
          flex-direction: column;
        }
        
        .quick-questions {
          padding: 15px 20px;
          border-bottom: 1px solid #e2e8f0;
          background: #f8fafc;
        }
        
        .quick-questions-label {
          margin: 0 0 10px;
          color: #4a5568;
          font-size: 0.9rem;
          font-weight: 500;
        }
        
        .quick-buttons {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        
        .quick-buttons button {
          background: white;
          border: 1px solid #cbd5e0;
          border-radius: 20px;
          padding: 6px 12px;
          font-size: 0.85rem;
          color: #4a5568;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .quick-buttons button:hover {
          background: #667eea;
          color: white;
          border-color: #667eea;
        }
        
        .chat-messages {
          flex: 1;
          overflow-y: auto;
          padding: 20px;
          max-height: 300px;
          min-height: 200px;
        }
        
        .message {
          margin-bottom: 15px;
          animation: fadeIn 0.3s ease;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(5px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .message.user {
          text-align: right;
        }
        
        .message.assistant {
          text-align: left;
        }
        
        .message-content {
          display: inline-block;
          padding: 12px 16px;
          border-radius: 18px;
          max-width: 80%;
          line-height: 1.4;
          white-space: pre-wrap;
          word-break: break-word;
        }
        
        .message.user .message-content {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-bottom-right-radius: 4px;
        }
        
        .message.assistant .message-content {
          background: #f1f5f9;
          color: #2d3748;
          border-bottom-left-radius: 4px;
        }
        
        .message.assistant.loading .message-content {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #718096;
        }
        
        .message-time {
          font-size: 0.75rem;
          color: #a0aec0;
          margin-top: 4px;
        }
        
        .chat-input {
          padding: 20px;
          border-top: 1px solid #e2e8f0;
          display: flex;
          gap: 10px;
          background: #f8fafc;
        }
        
        .chat-input input {
          flex: 1;
          padding: 12px 16px;
          border: 2px solid #e2e8f0;
          border-radius: 24px;
          font-size: 0.95rem;
          transition: border-color 0.2s;
        }
        
        .chat-input input:focus {
          outline: none;
          border-color: #667eea;
        }
        
        .send-button {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          width: 50px;
          height: 50px;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.2s;
        }
        
        .send-button:hover:not(:disabled) {
          transform: scale(1.05);
        }
        
        .send-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        
        /* Example Questions */
        .ai-examples {
          margin-bottom: 25px;
        }
        
        .ai-examples h4 {
          margin: 0 0 15px;
          color: #4a5568;
          font-size: 1rem;
        }
        
        .example-questions {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 12px;
        }
        
        .example-card {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 15px;
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .example-card:hover {
          background: white;
          border-color: #667eea;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.1);
        }
        
        .example-card span {
          color: #4a5568;
          font-size: 0.9rem;
          line-height: 1.4;
        }
        
        /* AI Features */
        .ai-features {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          padding-top: 20px;
          border-top: 1px solid #e2e8f0;
        }
        
        .feature {
          display: flex;
          gap: 15px;
          align-items: flex-start;
        }
        
        .feature-icon {
          font-size: 1.5rem;
          flex-shrink: 0;
        }
        
        .feature h4 {
          margin: 0 0 5px;
          color: #2d3748;
          font-size: 1rem;
        }
        
        .feature p {
          margin: 0;
          color: #718096;
          font-size: 0.9rem;
          line-height: 1.4;
        }
        
        /* Safety Section */
        .safety-section {
          background: white;
          border-radius: 16px;
          padding: 30px;
          box-shadow: 0 5px 20px rgba(0,0,0,0.05);
        }
        
        .safety-header {
          display: flex;
          align-items: center;
          gap: 15px;
          margin-bottom: 30px;
        }
        
        .safety-icon {
          font-size: 2rem;
          background: linear-gradient(135deg, #4ECDC4 0%, #44a08d 100%);
          color: white;
          width: 60px;
          height: 60px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .safety-header h2 {
          margin: 0;
          color: #2d3748;
        }
        
        .safety-points {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 25px;
          margin-bottom: 30px;
        }
        
        .safety-point {
          display: flex;
          gap: 15px;
        }
        
        .point-icon {
          font-size: 1.5rem;
          flex-shrink: 0;
        }
        
        .safety-point h3 {
          margin: 0 0 8px;
          color: #2d3748;
          font-size: 1.1rem;
        }
        
        .safety-point p {
          margin: 0;
          color: #718096;
          line-height: 1.5;
          font-size: 0.95rem;
        }
        
        .educational-note h3 {
          margin: 0 0 10px 0;
          color: #2d3748;
          font-size: 1.1rem;
        }
        
        .educational-note p {
          margin: 0;
          color: #4a5568;
          line-height: 1.6;
        }
        
        /* Footer */
        .parent-footer {
          padding: 20px 30px;
          text-align: center;
          color: #718096;
          font-size: 0.9rem;
          border-top: 1px solid #e2e8f0;
          background: white;
        }
        
        .parent-footer p {
          margin: 0 0 10px;
        }
        
        .footer-note {
          font-size: 0.8rem;
          color: #a0aec0;
        }
        
        /* Animation for spinner */
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        @media (max-width: 768px) {
          .example-questions {
            grid-template-columns: 1fr;
          }
          
          .ai-features {
            grid-template-columns: 1fr;
          }
          
          .chat-messages {
            max-height: 250px;
          }
          
          .message-content {
            max-width: 90%;
          }
        }
      `}</style>
    </>
  );
}