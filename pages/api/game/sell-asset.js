import { sellAssetShares, getUserAssets } from '../../../lib/db-helpers';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { userId, assetId, assetType, shares = 1 } = req.body;

        if (!userId || (!assetId && !assetType)) {
            return res.status(400).json({ error: 'userId and assetId or assetType are required' });
        }

        // If assetType is provided, find the asset record
        let actualAssetId = assetId;
        if (assetType && !assetId) {
            const userAssets = await getUserAssets(userId);
            const asset = userAssets.find(a => a.asset_type === assetType && a.shares > 0);
            if (!asset) {
                return res.status(400).json({ error: `No ${assetType} shares found to sell` });
            }
            actualAssetId = asset.id;
        }

        const result = await sellAssetShares(userId, actualAssetId, shares);

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
