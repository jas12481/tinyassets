import { getUserProfile } from '../../../lib/db-helpers';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { userId } = req.query;

        if (!userId) {
            return res.status(400).json({ error: 'userId is required' });
        }

        const profile = await getUserProfile(userId);

        return res.status(200).json({ 
            success: true, 
            data: {
                gameState: profile.gameState,
                badges: profile.badges,
                events: profile.events,
                summary: {
                    totalEvents: profile.events.length,
                    totalBadges: profile.badges.length,
                    currentLevel: profile.gameState.level,
                    currentXP: profile.gameState.xp,
                    selectedAsset: profile.gameState.selected_asset,
                }
            }
        });
    } catch (error) {
        console.error('Error fetching user profile:', error);
        return res.status(500).json({ error: 'Internal server error', message: error.message });
    }
}
