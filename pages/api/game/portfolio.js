import { getUserAssets, getPortfolioSummary } from '../../../lib/db-helpers';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { userId } = req.query;

        if (!userId) {
            return res.status(400).json({ error: 'userId is required' });
        }

        const [assets, summary] = await Promise.all([
            getUserAssets(userId),
            getPortfolioSummary(userId),
        ]);

        return res.status(200).json({ 
            success: true, 
            data: {
                assets,
                summary,
            }
        });
    } catch (error) {
        console.error('Error fetching portfolio:', error);
        return res.status(500).json({ error: 'Internal server error', message: error.message });
    }
}
