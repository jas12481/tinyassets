import { sellAssetShares } from '../../../lib/db-helpers';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { userId, assetId, shares = 1 } = req.body;

        if (!userId || !assetId) {
            return res.status(400).json({ error: 'userId and assetId are required' });
        }

        const result = await sellAssetShares(userId, assetId, shares);

        return res.status(200).json({ 
            success: true, 
            data: result,
            message: `Sold ${shares} share(s)! Received ${result.returnAmount} tokens` 
        });
    } catch (error) {
        console.error('Error selling shares:', error);
        return res.status(400).json({ error: error.message });
    }
}
