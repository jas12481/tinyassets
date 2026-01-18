- Migration: Add parent_pin column to game_state table
-- Description: Adds a parent_pin column to store hashed PINs for parent authentication
-- Date: 2024-01-15

-- Step 1: Add parent_pin column (nullable initially for existing records)
ALTER TABLE game_state
ADD COLUMN IF NOT EXISTS parent_pin TEXT;

-- Step 2: Add comment to column
COMMENT ON COLUMN game_state.parent_pin IS 'Hashed 4-digit PIN for parent authentication';

-- Step 3: Create index for faster lookups (optional but recommended)
CREATE INDEX IF NOT EXISTS idx_game_state_user_id ON game_state(user_id);

-- Step 4: Example of how to set a PIN for existing users (run manually as needed)
-- UPDATE game_state 
-- SET parent_pin = '$2b$10$hashed_pin_here' 
-- WHERE user_id = 'some_user_id';

-- Note: The PIN should be hashed using bcrypt before storing
-- Use the backend API or a script to hash and store PINs securely