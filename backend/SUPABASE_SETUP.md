# Supabase Setup Guide

## Quick Setup (5 minutes)

### Step 1: Create Supabase Project
1. Go to https://supabase.com
2. Sign up or log in
3. Click "New Project"
4. Fill in:
   - **Name**: `tinyassets` (or your choice)
   - **Database Password**: (save this securely)
   - **Region**: Choose closest to you
5. Click "Create new project"
6. Wait ~2 minutes for setup

### Step 2: Run Database Schema
1. In your Supabase dashboard, go to **SQL Editor** (left sidebar)
2. Click **New Query**
3. Open `backend/schema.sql` from this project
4. Copy the entire contents
5. Paste into the SQL Editor
6. Click **Run** (or press `Ctrl+Enter`)
7. You should see "Success. No rows returned"

### Step 3: Get API Keys
1. Go to **Settings** → **API** (left sidebar)
2. You'll see:
   - **Project URL** (something like `https://xxxxx.supabase.co`)
   - **anon public** key (starts with `eyJ...`)
   - **service_role** key (starts with `eyJ...`) - Keep this secret!

### Step 4: Set Environment Variables
1. Create `.env.local` in your project root (if not exists)
2. Add:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...your-anon-key
SUPABASE_SERVICE_ROLE_KEY=eyJ...your-service-role-key
```

3. Replace the values with your actual keys from Step 3

### Step 5: Verify Tables Created
1. Go to **Table Editor** (left sidebar)
2. You should see three tables:
   - ✅ `game_state`
   - ✅ `event_history`
   - ✅ `earned_badges`

## Testing Connection

Once Next.js is set up, you can test with:

```javascript
import { supabase } from './lib/supabase';

// Test query
const { data, error } = await supabase
  .from('game_state')
  .select('count');
  
console.log(data, error);
```

## Troubleshooting

### "Missing Supabase environment variables"
- Check `.env.local` exists in project root
- Restart Next.js dev server after adding env vars
- Make sure variable names start with `NEXT_PUBLIC_` for client-side access

### "relation does not exist"
- Make sure you ran `schema.sql` in SQL Editor
- Check for any errors when running the schema

### RLS (Row Level Security) Issues
- The schema includes policies that allow all operations for MVP
- For production, you'll want to tighten these policies

## Next Steps

- ✅ Database schema created
- ✅ Environment variables set
- ⏳ Install `@supabase/supabase-js` package
- ⏳ Test database connection
- ⏳ Create API routes using `lib/db-helpers.js`
