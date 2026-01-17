import { executeDay } from '../../../lib/db-helpers';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({ error: 'userId is required' });
        }

        // Skip day with auto-hold cash (skipEventCheck = false means events still process)
        // The skip behavior is handled by frontend - backend just processes the day
        const result = await executeDay(userId, false);

        return res.status(200).json({ 
            success: true, 
            data: result,
            message: 'Day skipped and processed!' 
        });
    } catch (error) {
        console.error('Error skipping day:', error);
        return res.status(500).json({ error: error.message });
    }
}
