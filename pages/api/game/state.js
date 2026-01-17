import { getOrCreateGameState } from '../../../lib/db-helpers';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { userId } = req.query;

        if (!userId) {
            return res.status(400).json({ error: 'userId is required' });
        }

        const gameState = await getOrCreateGameState(userId);

        return res.status(200).json({ success: true, data: gameState });
    } catch (error) {
        console.error('Error fetching game state:', error);
        return res.status(500).json({ error: 'Internal server error', message: error.message });
    }
}
