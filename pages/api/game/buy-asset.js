import { buyAssetShares } from '../../../lib/db-helpers';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { userId, assetType, shares = 1 } = req.body;

        if (!userId || !assetType) {
            return res.status(400).json({ error: 'userId and assetType are required' });
        }

        const result = await buyAssetShares(userId, assetType, shares);

        return res.status(200).json({ 
            success: true, 
            data: result,
            message: `Purchased ${shares} share(s) of ${assetType}! Now own ${result.sharesOwned}/4 shares (${result.ownershipPercentage}%)` 
        });
    } catch (error) {
        console.error('Error buying shares:', error);
        return res.status(400).json({ error: error.message });
    }
}
