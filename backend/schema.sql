-- ============================================
-- TinyAssets Database Schema (Updated for Share-Based Fractional Ownership)
-- Supabase PostgreSQL Setup
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- Tables
-- ============================================

-- Game State Table
CREATE TABLE IF NOT EXISTS game_state (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL,
    selected_asset TEXT CHECK (selected_asset IN ('property', 'solar', 'gold')), -- Legacy, can be NULL
    xp INTEGER DEFAULT 0 NOT NULL,
    level INTEGER DEFAULT 1 NOT NULL,
    tokens INTEGER DEFAULT 15 NOT NULL, -- Start with 15 tokens
    current_day INTEGER DEFAULT 1 NOT NULL, -- Track day number
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Assets Table (Share-Based Ownership)
CREATE TABLE IF NOT EXISTS user_assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL,
    asset_type TEXT NOT NULL CHECK (asset_type IN ('property', 'solar', 'gold')),
    shares INTEGER DEFAULT 0 NOT NULL CHECK (shares >= 0 AND shares <= 4), -- 0-4 shares (0-100% ownership)
    purchase_price INTEGER NOT NULL, -- Total paid for all shares
    purchased_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_production_at TIMESTAMP WITH TIME ZONE, -- When last daily production happened
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Event History Table
CREATE TABLE IF NOT EXISTS event_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL,
    asset_type TEXT NOT NULL CHECK (asset_type IN ('property', 'solar', 'gold')),
    event_name TEXT NOT NULL,
    event_type TEXT CHECK (event_type IN ('environmental', 'economic', 'crisis')),
    effect_description TEXT,
    token_effect INTEGER DEFAULT 0, -- Actual token change
    shares_affected INTEGER, -- How many shares were affected
    day_number INTEGER NOT NULL, -- Which day the event occurred
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transactions Table (Buy/Sell history)
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('buy', 'sell')),
    asset_type TEXT,
    shares INTEGER NOT NULL, -- Number of shares bought/sold
    amount INTEGER NOT NULL, -- Token amount (negative for buy, positive for sell)
    details JSONB, -- Extra details
    day_number INTEGER NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Missions Table (Track mission progress)
CREATE TABLE IF NOT EXISTS missions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL,
    mission_id TEXT NOT NULL,
    mission_name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'claimed')),
    progress JSONB DEFAULT '{}'::jsonb, -- Track progress metrics
    completed_at TIMESTAMP WITH TIME ZONE,
    claimed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Daily Production History
CREATE TABLE IF NOT EXISTS daily_production (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL,
    asset_id UUID NOT NULL REFERENCES user_assets(id) ON DELETE CASCADE,
    tokens_earned INTEGER NOT NULL,
    production_date DATE NOT NULL,
    day_number INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Earned Badges Table
CREATE TABLE IF NOT EXISTS earned_badges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL,
    badge_id TEXT NOT NULL,
    badge_name TEXT NOT NULL,
    asset_type TEXT,
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    day_number INTEGER NOT NULL -- Day when badge was unlocked
);

-- Parent Codes Table (Parent Auth)
CREATE TABLE IF NOT EXISTS parent_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    kid_username VARCHAR(50) UNIQUE NOT NULL,
    parent_pin VARCHAR(4) NOT NULL,
    game_state_id UUID REFERENCES game_state(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(kid_username, parent_pin)
);

-- ============================================
-- Indexes for Performance
-- ============================================

CREATE INDEX IF NOT EXISTS idx_game_state_user_id ON game_state(user_id);
CREATE INDEX IF NOT EXISTS idx_user_assets_user_id ON user_assets(user_id);
CREATE INDEX IF NOT EXISTS idx_event_history_user_id ON event_history(user_id);
CREATE INDEX IF NOT EXISTS idx_event_history_day ON event_history(user_id, day_number);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_day ON transactions(user_id, day_number);
CREATE INDEX IF NOT EXISTS idx_missions_user_id ON missions(user_id);
CREATE INDEX IF NOT EXISTS idx_missions_status ON missions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_missions_mission_id ON missions(user_id, mission_id);
CREATE INDEX IF NOT EXISTS idx_daily_production_user_id ON daily_production(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_production_date ON daily_production(user_id, production_date);
CREATE INDEX IF NOT EXISTS idx_earned_badges_user_id ON earned_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_parent_codes_kid_username ON parent_codes(kid_username);
CREATE INDEX IF NOT EXISTS idx_parent_codes_pin ON parent_codes(parent_pin);

-- ============================================
-- Functions & Triggers
-- ============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_game_state_updated_at BEFORE UPDATE ON game_state
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Row Level Security (RLS) - Enable for Supabase
-- ============================================

ALTER TABLE game_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_production ENABLE ROW LEVEL SECURITY;
ALTER TABLE earned_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for game_state" ON game_state
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for user_assets" ON user_assets
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for event_history" ON event_history
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for transactions" ON transactions
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for missions" ON missions
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for daily_production" ON daily_production
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for earned_badges" ON earned_badges
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for parent_codes" ON parent_codes
    FOR ALL USING (true) WITH CHECK (true);
