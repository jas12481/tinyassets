import { getParentCodeByUsername } from '../../../lib/db-helpers';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { userId } = req.query;

        if (!userId) {
            return res.status(400).json({ error: 'userId is required' });
        }

        const parentCode = await getParentCodeByUsername(userId);

        if (!parentCode) {
            return res.status(200).json({ 
                success: true, 
                data: { parent_pin: null, isNew: true }
            });
        }

        return res.status(200).json({ 
            success: true, 
            data: { 
                parent_pin: parentCode.parent_pin, 
                isNew: false 
            }
        });
    } catch (error) {
        console.error('Error fetching parent code:', error);
        return res.status(500).json({ error: 'Internal server error', message: error.message });
    }
}
