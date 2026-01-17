/**
 * Utility script to set parent PIN for a user
 * Usage: node scripts/set-parent-pin.js <user_id> <pin>
 * 
 * Example: node scripts/set-parent-pin.js testuser 1234
 */

require('dotenv').config();
const bcrypt = require('bcrypt');
const { supabase } = require('../src/services/supabaseService');

async function setParentPin(userId, pin) {
  try {
    // Validate PIN
    if (!pin || pin.length !== 4 || !/^\d+$/.test(pin)) {
      console.error('Error: PIN must be exactly 4 digits');
      process.exit(1);
    }

    // Hash the PIN
    console.log('Hashing PIN...');
    const hashedPin = await bcrypt.hash(pin, 10);

    // Check if user exists
    const { data: existingUser, error: checkError } = await supabase
      .from('game_state')
      .select('user_id')
      .eq('user_id', userId)
      .single();

    if (checkError || !existingUser) {
      console.error(`Error: User '${userId}' not found in game_state table`);
      process.exit(1);
    }

    // Update the PIN
    const { data, error } = await supabase
      .from('game_state')
      .update({ parent_pin: hashedPin })
      .eq('user_id', userId)
      .select();

    if (error) {
      console.error('Error updating PIN:', error);
      process.exit(1);
    }

    console.log(`✅ Successfully set parent PIN for user: ${userId}`);
    console.log(`   User ID: ${userId}`);
    console.log(`   PIN: ${pin} (hashed and stored securely)`);
  } catch (error) {
    console.error('Unexpected error:', error);
    process.exit(1);
  }
}

// Get command line arguments
const args = process.argv.slice(2);

if (args.length < 2) {
  console.log('Usage: node scripts/set-parent-pin.js <user_id> <pin>');
  console.log('Example: node scripts/set-parent-pin.js testuser 1234');
  process.exit(1);
}

const [userId, pin] = args;

setParentPin(userId, pin)
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

