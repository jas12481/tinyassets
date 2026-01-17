import { getTransactions } from '../../../lib/db-helpers';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { userId, limit = 50 } = req.query;

        if (!userId) {
            return res.status(400).json({ error: 'userId is required' });
        }

        const transactions = await getTransactions(userId, parseInt(limit));

        return res.status(200).json({ success: true, data: transactions });
    } catch (error) {
        console.error('Error fetching transactions:', error);
        return res.status(500).json({ error: 'Internal server error', message: error.message });
    }
}
