import { getUserMissions } from '../../../lib/db-helpers';
import { MISSIONS } from '../../../backend/rules-engine';

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
        
        // Merge with mission configs for complete data
        const missionsWithConfig = userMissions.map(mission => {
            const config = MISSIONS[mission.mission_id];
            return {
                ...mission,
                description: config?.description || mission.mission_name,
                category: config?.category || 'unknown',
                reward_tokens: config?.reward_tokens || 0,
                reward_xp: config?.reward_xp || 0,
            };
        });

        return res.status(200).json({ 
            success: true, 
            data: missionsWithConfig
        });
    } catch (error) {
        console.error('Error fetching missions:', error);
        return res.status(500).json({ error: 'Internal server error', message: error.message });
    }
}
