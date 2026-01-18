# 🎮 RWA Tycoon - Gamified Real-World Asset Learning for Kids

> **Learn about real-world assets through fun, interactive gameplay!**  
> Property, Solar Farms, and Gold — discover how they work without any real money or risk.

---

## ✨ What is RWA Tycoon?

**RWA Tycoon** is an educational game that teaches kids about real-world assets (RWAs) through an engaging, Duolingo/Pokémon-style experience. Kids learn by playing: making investment decisions, experiencing market events, earning XP and badges, and watching their portfolio grow—all in a safe, educational environment.

### 🎯 Key Features

- 🏠 **Three Asset Types**: Property, Solar Farms, and Gold
- 🎲 **Daily Gameplay Loop**: Morning indicators → Midday decisions → Evening results → Night missions
- 🏆 **Gamification**: XP system, levels, tokens, badges, and daily missions
- 🎉 **Win Conditions**: Reach Level 5, earn 100 tokens, or achieve 100% ownership
- 👨‍👩‍👧‍👦 **Parent Dashboard**: Parents can view their child's progress using a unique parent code
- 📚 **Educational Events**: Real-world scenarios (heatwaves, economic changes, crises) affect assets differently

---

## 🎮 How It Works

### Daily Cycle

1. **🌅 Morning Phase** - View market indicators for the day
2. **🌞 Midday Phase** - Make investment decisions (buy, sell, or hold shares)
3. **🌆 Evening Phase** - See results: production earnings and events
4. **🌙 Night Phase** - Complete missions, claim rewards, and view progress

### Learning Mechanics

- **Tokens**: Earned through asset production and lost/gained during events
- **XP & Levels**: Gain experience points by playing daily and completing missions
- **Badges**: Unlock achievements as you reach milestones
- **Share-Based Ownership**: Buy 1-4 shares per asset (up to 100% ownership)
- **Event System**: Real-world events affect different assets in meaningful ways

---

## 🛠️ Tech Stack

- **Frontend Framework**: Next.js 14 (App Router + Pages Router)
- **UI Library**: React 18
- **Styling**: Tailwind CSS 3.4
- **Database**: Supabase (PostgreSQL)
- **Backend**: Next.js API Routes
- **State Management**: React Hooks (useState, useEffect)
- **Client Storage**: localStorage for user session

---

## 📁 Project Structure

```
tinyassets/
├── app/                      # Next.js App Router
│   ├── kid/                  # Kid's game interface
│   │   ├── game/             # Main game page (phases, gameplay)
│   │   ├── asset-choice/     # Asset selection screen
│   │   └── asset-detail/     # Individual asset details
│   └── layout.js             # Root layout
│
├── pages/                    # Next.js Pages Router
│   ├── api/                  # API endpoints
│   │   ├── game/             # Game logic APIs (buy/sell, execute day, etc.)
│   │   ├── kid/              # Kid-specific APIs (setup, parent code)
│   │   ├── parent/           # Parent dashboard APIs
│   │   └── ai/               # AI assistant integration
│   └── parent.js             # Parent dashboard page
│
├── lib/                      # Shared utilities
│   ├── gameAPI.js            # Client-side API helpers
│   ├── db-helpers.js         # Database operations
│   ├── gameEngine.js         # Game logic
│   ├── gameRules.js          # Rules and calculations
│   ├── badges.js             # Badge system
│   ├── missions.js           # Mission system
│   └── mockAssets.js         # Asset definitions
│
├── components/               # React components
│   └── TutorialFlow.js       # First-time tutorial
│
└── backend/                  # Backend services & schema
    ├── schema.sql            # Database schema
    ├── rules-engine.js       # Core game rules
    └── src/                  # Backend service structure
```

---

## 🎯 Core Gameplay Features

### Asset System
- **Property** 🏠: Earns daily tokens through rental income
- **Solar Farms** ☀️: High production, affected by environmental events
- **Gold** 🪙: Protects during crisis events (no daily income, but valuable during downturns)

### Progression System
- **XP Rewards**: Earn XP by completing daily cycles, missions, and events
- **Level Up**: Unlock new features and missions as you level up
- **Token Management**: Balance spending on assets vs. saving for goals

### Mission System
- **Daily Missions**: New challenges each day (Level 2+)
- **Achievement Missions**: Long-term goals (own all assets, reach milestones)
- **Mission Rewards**: Earn XP for completing missions

### Win Conditions
Players can win by achieving any of:
1. **Level 5** - Reach level 5 through XP progression
2. **100 Tokens** - Accumulate 100 tokens
3. **100% Ownership** - Own 4 shares of each asset (12 total shares)

---

## 🎨 User Experience

### Kid's Interface
- **Bright, Kid-Friendly Design**: Colorful gradients, playful animations
- **Phase-Based Backgrounds**: Each time of day has its own theme color
- **Intuitive Navigation**: Clear buttons and visual feedback
- **Parent Code Display**: Always visible on login screen for easy sharing

### Parent Dashboard
- **Progress Overview**: See child's level, XP, tokens, and portfolio
- **Learning Summary**: View badges earned, events experienced, missions completed
- **Secure Access**: Login with parent code to view child's progress

---

## 🔐 Security & Privacy

- ✅ **No Real Money**: Completely educational, no financial transactions
- ✅ **No Wallets**: No blockchain or crypto wallet required
- ✅ **Parent Code System**: Secure access for parents to view progress
- ✅ **Local Storage**: User sessions stored client-side
- ✅ **Read-Only Parent View**: Parents can view but not modify game state

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account (for database)

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd tinyassets

# Install dependencies
npm install

# Set up environment variables
# Create .env.local with:
# NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
# SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Run database migrations (see backend/schema.sql)

# Start development server
npm run dev
```

Visit `http://localhost:3000` to start playing!

---

## 📊 Architecture

```
┌─────────────────────────────────────────────┐
│  Kid Interface (Next.js App Router)         │
│  - Morning/Midday/Evening/Night phases      │
│  - Asset management UI                      │
│  - Mission & badge displays                 │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│  Game API (Next.js API Routes)              │
│  - /api/game/buy-asset                      │
│  - /api/game/sell-asset                     │
│  - /api/game/execute-day                    │
│  - /api/game/missions                       │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│  Rules Engine (lib/)                        │
│  - Game logic & calculations                │
│  - Event processing                         │
│  - XP & badge unlocks                       │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│  Supabase (PostgreSQL)                      │
│  - game_state                               │
│  - user_assets                              │
│  - missions, badges, events                 │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│  Parent Dashboard (Read-Only View)          │
│  - Progress tracking                        │
│  - Learning analytics                       │
└─────────────────────────────────────────────┘
```

---

## 🎓 Educational Goals

RWA Tycoon teaches kids about:

- **Real-World Assets**: What they are and how they work
- **Investment Concepts**: Shares, ownership, diversification
- **Market Events**: How external factors affect asset performance
- **Decision Making**: Weighing options and seeing consequences
- **Long-Term Planning**: Saving vs. spending, goal setting
- **Risk Management**: Different assets behave differently in crises

---

## 🌟 Future Enhancements

Potential features for future versions:
- Additional asset types (stocks, bonds, commodities)
- Multiplayer/leaderboard features
- More complex event scenarios
- Educational content library
- Advanced analytics for parents
- Mobile app version

---

## 📝 License

This project is built for educational purposes.

---

**Built with ❤️ to make learning about real-world assets fun and engaging for kids!**

---

## 🙏 Acknowledgments

Special thanks to the educational gaming community for inspiration on gamification and learning design.
