import { getEarnedBadges } from '../../../lib/db-helpers';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { userId } = req.query;

        if (!userId) {
            return res.status(400).json({ error: 'userId is required' });
        }

        const badges = await getEarnedBadges(userId);

        return res.status(200).json({ success: true, data: badges });
    } catch (error) {
        console.error('Error fetching badges:', error);
        return res.status(500).json({ error: 'Internal server error', message: error.message });
    }
}
