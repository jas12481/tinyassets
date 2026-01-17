import { validateParentLogin, getUserProfile } from '../../../lib/db-helpers';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { kid_username, parent_pin } = req.body;

        if (!kid_username || !parent_pin) {
            return res.status(400).json({ 
                error: 'kid_username and parent_pin are required' 
            });
        }

        // Validate PIN format (4 digits)
        if (!/^\d{4}$/.test(parent_pin)) {
            return res.status(400).json({ 
                error: 'parent_pin must be exactly 4 digits' 
            });
        }

        // Validate login credentials
        const parentCode = await validateParentLogin(kid_username, parent_pin);

        if (!parentCode) {
            return res.status(401).json({ 
                error: 'Invalid username or PIN' 
            });
        }

        // Get kid's full profile
        const profile = await getUserProfile(kid_username);

        return res.status(200).json({
            success: true,
            kid_username: kid_username,
            profile: {
                gameState: profile.gameState,
                userAssets: profile.userAssets,
                badges: profile.badges,
                events: profile.events,
                dailyProduction: profile.dailyProduction,
                transactions: profile.transactions,
                summary: profile.summary,
            },
        });
    } catch (error) {
        console.error('Error during parent login:', error);
        return res.status(500).json({ 
            error: 'Internal server error', 
            message: error.message 
        });
    }
}
