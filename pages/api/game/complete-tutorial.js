import { getOrCreateGameState, updateGameState } from '../../../lib/db-helpers';
import { MISSIONS, addXP } from '../../../backend/rules-engine';
import { supabase } from '../../../lib/supabase';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({ error: 'userId is required' });
        }

        // Get game state
        const gameState = await getOrCreateGameState(userId);

        // Mark tutorial as complete
        await updateGameState(userId, {
            tutorial_complete: true,
        });

        // Auto-complete "Asset Detective" mission
        const assetDetectiveMission = MISSIONS['asset-detective'];
        if (assetDetectiveMission) {
            // Check if mission already exists
            const { data: existingMission } = await supabase
                .from('missions')
                .select('*')
                .eq('user_id', userId)
                .eq('mission_id', 'asset-detective')
                .maybeSingle();

            if (!existingMission) {
                // Create completed mission
                await supabase
                    .from('missions')
                    .insert({
                        user_id: userId,
                        mission_id: 'asset-detective',
                        mission_name: assetDetectiveMission.name,
                        status: 'completed',
                        completed_at: new Date().toISOString(),
                    });
            }

            // Award XP and tokens for Asset Detective mission
            const { xp: newXP, level: newLevel } = addXP(gameState.xp, assetDetectiveMission.reward_xp);
            const newTokens = gameState.tokens + assetDetectiveMission.reward_tokens;

            await updateGameState(userId, {
                xp: newXP,
                level: newLevel,
                tokens: newTokens,
            });
        }

        // Get updated game state
        const updatedGameState = await getOrCreateGameState(userId);

        return res.status(200).json({ 
            success: true, 
            data: updatedGameState,
            message: 'Tutorial completed! Mission "Asset Detective" completed!'
        });
    } catch (error) {
        console.error('Error completing tutorial:', error);
        return res.status(500).json({ error: 'Internal server error', message: error.message });
    }
}
