# Backend Setup - TinyAssets

## Supabase Setup

1. Create a new Supabase project at https://supabase.com
2. Go to SQL Editor
3. Run `schema.sql` to create all tables
4. Copy your project URL and anon key to `.env.local`

## Database Structure

- `game_state` - Current learning progress
- `event_history` - Log of all events triggered
- `earned_badges` - Badge unlock records

## Rules Engine

The `rules-engine.js` file contains:
- XP calculation logic
- Event definitions and effects
- Badge unlock conditions
- Level progression system

## Usage

Import the rules engine in your Next.js API routes:

```javascript
const { processEvent, checkBadgeUnlocks, addXP } = require('./backend/rules-engine');
```

## Badge Metadata

The `badge-metadata.json` file contains visual metadata for all badges:
- Icon emojis
- Rarity levels
- Descriptions for UI display
