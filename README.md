# 🎮 TinyAssets - Gamified RWA Learning Platform for Kids

> **Duolingo/Pokémon-style learning, but for real-world assets (RWAs)**  
> Property, Solar Farms, Gold — without real money, wallets, or risk.

---

## 🎯 Core Concept

Kids choose an "asset card", watch how it behaves over time, experience simple real-world events (e.g., heatwave → solar does better), and earn XP + badges. Parents get a summary of what their child learned.

### What We Are NOT Doing
- ❌ No real money
- ❌ No trading
- ❌ No custody or compliance complexity
- ✅ **Education-first approach**

---

## 🚀 MVP Scope (24h)

### Assets
- 🏠 Property
- ☀️ Solar
- 🪙 Gold

### Screens
1. **Start** — Entry point
2. **Asset Choice** — Select an asset to learn about
3. **Asset Detail** — Watch asset behavior + events + XP
4. **Parent View** — Learning summary dashboard

### Features
- Simple rules engine
- XP progression system
- Badge earning mechanism
- Event simulation (real-world effects)

---

## 🛠️ Tech Stack

- **Frontend**: Next.js (JavaScript)
- **Backend/Database**: Supabase (PostgreSQL)
- **Styling**: HTML/CSS
- **Data**: JSON (mock NFT metadata)
- **Optional**: Python scripts for data prep

---

## 📁 Project Structure

```
tinyassets/
├── frontend/          # Next.js app
│   ├── pages/        # Screen routes
│   ├── components/   # Reusable UI components
│   └── styles/       # CSS/styling
├── backend/          # Supabase schema & rules engine
│   ├── schema.sql    # Database schema
│   └── rules.js      # Game rules engine
├── data/             # Mock NFT metadata & assets
└── README.md
```

---

## 👥 Team & Branches

| Person | Branch | Responsibility |
|--------|--------|----------------|
| **Person 1** | `feature/kid-interface` | Kid Interface + Asset Detail screens |
| **Person 2** | `feature/start-parent-dashboard` | Start screen + Parent Dashboard + styling |
| **Leader** | `feature/backend-setup` | Supabase setup, rules engine, badge logic, data modeling |

### Branch Workflow
1. Each person works on their feature branch
2. Leader coordinates merges to `main`
3. Test integration frequently

---

## 🗄️ Database Schema (Supabase)

### `game_state`
- `id`, `user_id`, `selected_asset`, `xp`, `level`, `created_at`, `updated_at`

### `event_history`
- `id`, `user_id`, `asset_type`, `event_name`, `effect`, `timestamp`

### `earned_badges`
- `id`, `user_id`, `badge_id`, `badge_name`, `asset_type`, `unlocked_at`

---

## 🎲 Rules Engine

### Simple Event → Effect Logic
- **Property**: "New park built nearby" → +15% value
- **Solar**: "Heatwave" → +25% output
- **Gold**: "Economic uncertainty" → +10% value

### XP Progression
- Level thresholds: Pre-defined (Level 1 = 100 XP, Level 2 = 300 XP, etc.)
- XP earned per interaction/event

### Badge Unlocks
- "First Asset Explored" — Select first asset
- "Event Survivor" — Experience first event
- "Level 5 Learner" — Reach level 5

---

## 🚦 Getting Started

### Prerequisites
- Node.js 18+
- Supabase account
- Git

### Setup (Coming Soon)
```bash
# Clone repository
git clone <repo-url>
cd tinyassets

# Install dependencies
npm install

# Setup Supabase
# (Add connection string to .env.local)

# Run development server
npm run dev
```

---

## 📊 Architecture Overview

```
┌─────────────────────────────────────────────┐
│  Kid Interface (Next.js)                    │
│  - Asset selection                          │
│  - XP display                               │
│  - Event triggers                           │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│  Rules Engine (Client-Side)                 │
│  - Asset behavior simulation                │
│  - Event → effect logic                     │
│  - XP & badge calculation                   │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│  Supabase (Postgres)                        │
│  - game_state                               │
│  - event_history                            │
│  - earned_badges                            │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│  Parent Dashboard (Read-Only)               │
│  - Learning summary                         │
│  - Events & badges earned                   │
└─────────────────────────────────────────────┘
```

---

## 🔒 Security & Safety

- ✅ No wallets — eliminates custody risk
- ✅ No real tokens — avoids compliance issues
- ✅ Read-only parent view — transparency without control
- ✅ Mock NFTs only — concept learning, not ownership

---

## 📝 Development Notes

- **24-hour timeline** — Focus on MVP, not perfection
- **Visual polish** — Duolingo/Pokémon style matters
- **Simple logic** — Keep rules engine lightweight
- **Education-first** — Every feature should teach something

---

## 📅 Next Steps

1. ✅ Repository setup
2. ⏳ Branch creation
3. ⏳ Project scaffolding
4. ⏳ Supabase schema setup
5. ⏳ Frontend screens development
6. ⏳ Rules engine implementation
7. ⏳ Integration & testing

---

**Built with ❤️ for kids to learn about real-world assets**
