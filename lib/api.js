/**
 * API Utility
 * Handles all API calls to the Next.js backend API routes
 */

/**
 * Make API request with error handling
 * Uses relative paths for Next.js API routes
 */
async function apiRequest(endpoint, options = {}) {
  // Use relative path for Next.js API routes (same origin)
  const url = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  // Add authorization token if available
  if (typeof window !== 'undefined') {
    const authData = localStorage.getItem('parent_auth');
    if (authData) {
      try {
        const parsed = JSON.parse(authData);
        if (parsed.token) {
          defaultOptions.headers['Authorization'] = `Bearer ${parsed.token}`;
        }
      } catch (e) {
        // Ignore parsing errors
      }
    }
  }

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
 * Kid Setup API
 */
export const kidAPI = {
  /**
   * Setup parent PIN for a kid account (one-time)
   */
  setup: async (kidUsername) => {
    return apiRequest('/api/kid/setup', {
      method: 'POST',
      body: JSON.stringify({
        kid_username: kidUsername,
      }),
    });
  },
};

/**
 * Parent Authentication API
 */
export const parentAPI = {
  /**
   * Login parent with kid username and PIN
   * Returns profile data directly
   */
  login: async (kidUsername, parentPin) => {
    return apiRequest('/api/parent/login', {
      method: 'POST',
      body: JSON.stringify({
        kid_username: kidUsername,
        parent_pin: parentPin,
      }),
    });
  },
};

/**
 * AI Assistant API
 */
export const aiAPI = {
  /**
   * Get AI assistant response
   */
  ask: async (question, context, conversationHistory = []) => {
    return apiRequest('/api/ai/assistant', {
      method: 'POST',
      body: JSON.stringify({
        question,
        context,
        conversationHistory,
      }),
    });
  },
};

/**
 * Game Data API
 */
export const gameDataAPI = {
  /**
   * Get game data for a user
   */
  getGameData: async (userId) => {
    return apiRequest(`/api/game-data/${userId}`);
  },
  
  /**
   * Get parent data for a kid
   */
  getParentData: async (kidUsername) => {
    return apiRequest(`/api/parent/${kidUsername}`);
  },
};

/**
 * Health Check API
 */
export const healthAPI = {
  /**
   * Check API health
   */
  check: async () => {
    return apiRequest('/api/health');
  },
};
