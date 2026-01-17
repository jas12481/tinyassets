import { setupKidAccount } from '../../../lib/db-helpers';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { kid_username } = req.body;

        if (!kid_username) {
            return res.status(400).json({ error: 'kid_username is required' });
        }

        // Validate username format (alphanumeric, 3-50 chars)
        const usernameRegex = /^[a-zA-Z0-9_]{3,50}$/;
        if (!usernameRegex.test(kid_username)) {
            return res.status(400).json({ 
                error: 'kid_username must be 3-50 characters, alphanumeric and underscores only' 
            });
        }

        const result = await setupKidAccount(kid_username);

        return res.status(200).json({
            success: true,
            parent_pin: result.parent_pin,
            game_state_id: result.game_state_id,
            message: result.message || 'Account set up successfully!',
        });
    } catch (error) {
        console.error('Error setting up kid account:', error);
        return res.status(500).json({ 
            error: 'Internal server error', 
            message: error.message 
        });
    }
}
