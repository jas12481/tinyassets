import { executeDay } from '../../../lib/db-helpers';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { userId, skipEventCheck = false } = req.body;

        if (!userId) {
            return res.status(400).json({ error: 'userId is required' });
        }

        const result = await executeDay(userId, skipEventCheck);

        return res.status(200).json({ 
            success: true, 
            data: result,
            message: 'Day executed successfully!' 
        });
    } catch (error) {
        console.error('Error executing day:', error);
        return res.status(500).json({ error: error.message });
    }
}
