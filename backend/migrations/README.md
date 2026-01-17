# Database Migrations

This directory contains SQL migration scripts for the TinyAssets database schema.

## Running Migrations

### Using Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the migration SQL
4. Execute the query

### Using Supabase CLI

```bash
# If you have Supabase CLI installed
supabase db push
```

### Manual Execution

1. Connect to your Supabase PostgreSQL database
2. Run the SQL scripts in order
3. Verify the changes

## Migration Files

### `add_parent_pin.sql`

Adds the `parent_pin` column to the `game_state` table.

**What it does:**
- Adds `parent_pin` column (TEXT, nullable)
- Creates index on `user_id` for faster lookups
- Sets up column for storing hashed PINs

**Important Notes:**
- PINs should be hashed using bcrypt before storing
- Existing users will have NULL parent_pin initially
- You'll need to set PINs for existing users separately

## Setting Parent PINs

After running the migration, you need to set PINs for users. You can:

1. **Use the backend API** (recommended):
   - Create an admin endpoint to set PINs
   - Or use a script to hash and store PINs

2. **Use a script**:
   ```javascript
   const bcrypt = require('bcrypt');
   const { supabase } = require('./src/services/supabaseService');
   
   async function setParentPin(userId, pin) {
     const hashedPin = await bcrypt.hash(pin, 10);
     await supabase
       .from('game_state')
       .update({ parent_pin: hashedPin })
       .eq('user_id', userId);
   }
   ```

3. **Manual SQL** (not recommended for production):
   ```sql
   -- Hash the PIN first using bcrypt, then:
   UPDATE game_state 
   SET parent_pin = '$2b$10$hashed_pin_here' 
   WHERE user_id = 'user_id_here';
   ```

## Verification

After running migrations, verify:

```sql
-- Check if column exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'game_state' AND column_name = 'parent_pin';

-- Check if index exists
SELECT indexname 
FROM pg_indexes 
WHERE tablename = 'game_state' AND indexname = 'idx_game_state_user_id';
```

