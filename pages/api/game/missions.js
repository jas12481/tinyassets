import { getUserMissions, getOrCreateDailyMission } from '../../../lib/db-helpers';
import { MISSIONS, DAILY_MISSIONS } from '../../../backend/rules-engine';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { userId } = req.query;

        if (!userId) {
            return res.status(400).json({ error: 'userId is required' });
        }

        const userMissions = await getUserMissions(userId);
        
        // Get active daily mission (Level 2+ only)
        const dailyMission = await getOrCreateDailyMission(userId);
        
        // Merge with mission configs for complete data
        const missionsWithConfig = userMissions.map(mission => {
            const config = MISSIONS[mission.mission_id] || DAILY_MISSIONS[mission.mission_id];
            return {
                ...mission,
                description: config?.description || mission.mission_name,
                category: config?.category || 'unknown',
                reward_tokens: config?.reward_tokens || 0,
                reward_xp: config?.reward_xp || 0,
            };
        });
        
        // Add active daily mission if it exists and isn't already in the list
        if (dailyMission) {
            const dailyMissionConfig = DAILY_MISSIONS[dailyMission.mission_id];
            const existsInList = missionsWithConfig.some(m => m.mission_id === dailyMission.mission_id && m.status === 'in_progress');
            
            if (!existsInList) {
                missionsWithConfig.push({
                    ...dailyMission,
                    description: dailyMissionConfig?.description || dailyMission.mission_name,
                    category: dailyMissionConfig?.category || 'daily',
                    reward_tokens: dailyMissionConfig?.reward_tokens || 0,
                    reward_xp: dailyMissionConfig?.reward_xp || 0,
                });
            }
        }

        return res.status(200).json({ 
            success: true, 
            data: missionsWithConfig,
            activeDailyMission: dailyMission ? {
                ...dailyMission,
                ...(DAILY_MISSIONS[dailyMission.mission_id] || {}),
            } : null
        });
    } catch (error) {
        console.error('Error fetching missions:', error);
        return res.status(500).json({ error: 'Internal server error', message: error.message });
    }
}
