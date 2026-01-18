/**
 * Game API Client
 * Handles all API calls for the game
 */

/**
 * Get userId from localStorage (no auto-generation - requires login)
 */
export function getUserId() {
  if (typeof window === 'undefined') return null;
  
  return localStorage.getItem('tinyassets_user_id');
}

/**
 * Set userId (for future auth system)
 */
export function setUserId(userId) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('tinyassets_user_id', userId);
}

/**
 * Make API request with userId
 */
async function apiRequest(endpoint, options = {}) {
  const userId = getUserId();
  if (!userId) {
    throw new Error('User ID not found');
  }

  const url = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const config = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || `HTTP error! status: ${response.status}`);
    }
    
    return data;
  } catch (error) {
    console.error('API request error:', error);
    throw error;
  }
}

/**
 * Get game state
 */
export async function getGameState() {
  const userId = getUserId();
  const response = await apiRequest(`/api/game/state?userId=${userId}`);
  return response.data;
}

/**
 * Get portfolio
 */
export async function getPortfolio() {
  const userId = getUserId();
  const response = await apiRequest(`/api/game/portfolio?userId=${userId}`);
  return response.data;
}

/**
 * Buy asset shares
 */
export async function buyShares(assetType, shares = 1) {
  const userId = getUserId();
  const response = await apiRequest('/api/game/buy-asset', {
    method: 'POST',
    body: JSON.stringify({
      userId,
      assetType,
      shares,
    }),
  });
  return response;
}

/**
 * Sell asset shares
 */
export async function sellShares(assetType, shares = 1) {
  const userId = getUserId();
  const response = await apiRequest('/api/game/sell-asset', {
    method: 'POST',
    body: JSON.stringify({
      userId,
      assetType, // Pass assetType, API will find the asset record
      shares,
    }),
  });
  return response;
}

/**
 * Execute day (process production + events)
 */
export async function executeDay() {
  const userId = getUserId();
  const response = await apiRequest('/api/game/execute-day', {
    method: 'POST',
    body: JSON.stringify({
      userId,
      skipEventCheck: false,
    }),
  });
  return response.data;
}

/**
 * Skip day (auto-hold + process day)
 */
export async function skipDay() {
  const userId = getUserId();
  const response = await apiRequest('/api/game/skip-day', {
    method: 'POST',
    body: JSON.stringify({
      userId,
    }),
  });
  return response.data;
}

/**
 * Get missions
 */
export async function getMissions() {
  const userId = getUserId();
  const response = await apiRequest(`/api/game/missions?userId=${userId}`);
  return response.data;
}

/**
 * Claim mission reward
 */
export async function claimMission(missionId) {
  const userId = getUserId();
  const response = await apiRequest('/api/game/claim-mission', {
    method: 'POST',
    body: JSON.stringify({
      userId,
      missionId,
    }),
  });
  return response;
}

/**
 * Get badges
 */
export async function getBadges() {
  const userId = getUserId();
  const response = await apiRequest(`/api/game/badges?userId=${userId}`);
  return response.data;
}

/**
 * Get events
 */
export async function getEvents() {
  const userId = getUserId();
  const response = await apiRequest(`/api/game/events?userId=${userId}`);
  return response.data;
}

/**
 * Complete tutorial
 */
export async function completeTutorial() {
  const userId = getUserId();
  const response = await apiRequest('/api/game/complete-tutorial', {
    method: 'POST',
    body: JSON.stringify({
      userId,
    }),
  });
  return response.data;
}

/**
 * Get parent code for current user
 */
export async function getParentCode() {
  const userId = getUserId();
  const response = await apiRequest(`/api/kid/get-parent-code?userId=${userId}`);
  return response.data;
}
