/**
 * Utility script to verify a parent PIN for a user
 * Usage: node scripts/verify-pin.js <user_id> <pin>
 * 
 * Example: node scripts/verify-pin.js testuser 1234
 */

require('dotenv').config();
const bcrypt = require('bcrypt');
const { supabase } = require('../src/services/supabaseService');

async function verifyPin(userId, pin) {
  try {
    // Get user's stored PIN
    const { data, error } = await supabase
      .from('game_state')
      .select('parent_pin')
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      console.error(`Error: User '${userId}' not found`);
      process.exit(1);
    }

    if (!data.parent_pin) {
      console.error(`Error: No PIN set for user '${userId}'`);
      process.exit(1);
    }

    // Verify the PIN
    const isValid = await bcrypt.compare(pin, data.parent_pin);

    if (isValid) {
      console.log(`✅ PIN is valid for user: ${userId}`);
    } else {
      console.log(`❌ PIN is invalid for user: ${userId}`);
      process.exit(1);
    }
  } catch (error) {
    console.error('Unexpected error:', error);
    process.exit(1);
  }
}

// Get command line arguments
const args = process.argv.slice(2);

if (args.length < 2) {
  console.log('Usage: node scripts/verify-pin.js <user_id> <pin>');
  console.log('Example: node scripts/verify-pin.js testuser 1234');
  process.exit(1);
}

const [userId, pin] = args;

verifyPin(userId, pin)
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

