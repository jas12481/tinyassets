/**
 * Data Service
 * Handles data aggregation and formatting for API responses
 */

const { getGameState, getEventHistory, getEarnedBadges, getGameData } = require('./supabaseService');

/**
 * Get formatted parent data with educational insights
 */
async function getParentData(kidUsername) {
  try {
    const gameData = await getGameData(kidUsername);

    // Add educational insights
    const insights = generateEducationalInsights(gameData);

    return {
      ...gameData,
      educational_insights: insights
    };
  } catch (error) {
    console.error('Error getting parent data:', error);
    throw error;
  }
}

/**
 * Generate educational insights from game data
 */
function generateEducationalInsights(gameData) {
  const { game_state, event_history, earned_badges, learning_progress } = gameData;

  const insights = {
    learning_strength: 'Exploring',
    areas_of_focus: [],
    progress_summary: '',
    recommendations: []
  };

  // Analyze learning progress
  if (learning_progress.total_events > 10) {
    insights.learning_strength = 'Active Learner';
    insights.areas_of_focus.push('Event Understanding');
  }

  if (learning_progress.total_badges > 5) {
    insights.learning_strength = 'Achiever';
    insights.areas_of_focus.push('Milestone Completion');
  }

  if (learning_progress.current_level >= 5) {
    insights.learning_strength = 'Advanced Learner';
    insights.areas_of_focus.push('Level Progression');
  }

  // Asset-specific insights
  const assetType = game_state?.selected_asset;
  if (assetType) {
    insights.areas_of_focus.push(`${assetType} Asset Learning`);
  }

  // Progress summary
  insights.progress_summary = `Your child is at Level ${learning_progress.current_level} with ${learning_progress.total_xp} XP. They've experienced ${learning_progress.total_events} learning events and earned ${learning_progress.total_badges} badges.`;

  // Recommendations
  if (learning_progress.total_events < 5) {
    insights.recommendations.push('Encourage your child to explore different events to learn about asset behavior');
  }

  if (learning_progress.total_badges < 3) {
    insights.recommendations.push('Help your child complete learning milestones to earn badges');
  }

  if (learning_progress.current_level < 3) {
    insights.recommendations.push('Continue playing to unlock more advanced learning content');
  }

  return insights;
}

module.exports = {
  getParentData,
  generateEducationalInsights
};

