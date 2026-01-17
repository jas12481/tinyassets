-- ============================================
-- TinyAssets Database Schema
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
    user_id TEXT NOT NULL, -- Could be session_id or user identifier
    selected_asset TEXT NOT NULL CHECK (selected_asset IN ('property', 'solar', 'gold')),
    xp INTEGER DEFAULT 0 NOT NULL,
    level INTEGER DEFAULT 1 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Event History Table
CREATE TABLE IF NOT EXISTS event_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL,
    asset_type TEXT NOT NULL CHECK (asset_type IN ('property', 'solar', 'gold')),
    event_name TEXT NOT NULL,
    effect_description TEXT,
    effect_value DECIMAL(10, 2), -- Percentage change or value change
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Earned Badges Table
CREATE TABLE IF NOT EXISTS earned_badges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL,
    badge_id TEXT NOT NULL, -- References badge metadata
    badge_name TEXT NOT NULL,
    asset_type TEXT, -- NULL if global badge
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- Indexes for Performance
-- ============================================

CREATE INDEX IF NOT EXISTS idx_game_state_user_id ON game_state(user_id);
CREATE INDEX IF NOT EXISTS idx_event_history_user_id ON event_history(user_id);
CREATE INDEX IF NOT EXISTS idx_event_history_timestamp ON event_history(timestamp);
CREATE INDEX IF NOT EXISTS idx_earned_badges_user_id ON earned_badges(user_id);

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

-- Note: Adjust RLS policies based on your auth strategy
-- For MVP with simple session-based auth, you might skip RLS initially

-- Enable RLS
ALTER TABLE game_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE earned_badges ENABLE ROW LEVEL SECURITY;

-- Example: Allow all operations (adjust based on your auth needs)
-- For MVP, you might use service_role key or simple policies
CREATE POLICY "Allow all for game_state" ON game_state
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for event_history" ON event_history
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for earned_badges" ON earned_badges
    FOR ALL USING (true) WITH CHECK (true);
