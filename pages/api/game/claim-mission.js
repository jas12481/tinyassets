import { claimMissionReward } from '../../../lib/db-helpers';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { userId, missionId } = req.body;

        if (!userId || !missionId) {
            return res.status(400).json({ error: 'userId and missionId are required' });
        }

        const result = await claimMissionReward(userId, missionId);

        return res.status(200).json({ 
            success: true, 
            data: result,
            message: `Mission reward claimed! +${result.tokensAwarded} tokens, +${result.xpAwarded} XP` 
        });
    } catch (error) {
        console.error('Error claiming mission:', error);
        return res.status(400).json({ error: error.message });
    }
}
