# Parent Auth System - Setup Guide

## ✅ Implementation Complete

### Database Schema
- Added `parent_codes` table to `backend/schema.sql`
- Run the updated schema in Supabase SQL Editor

### Helper Functions (lib/db-helpers.js)
- `generateUniquePin()` - Generates unique 4-digit PIN with retry limit
- `getParentCodeByUsername()` - Gets parent code by kid username
- `createParentCode()` - Creates parent code record
- `validateParentLogin()` - Validates username + PIN
- `setupKidAccount()` - Main setup function (handles both new and existing kids)

### API Routes
- `POST /api/kid/setup` - Setup kid account
- `POST /api/parent/login` - Parent login

---

## 📋 Database Setup

### Step 1: Update Supabase Schema
1. Go to Supabase SQL Editor
2. Copy the new `parent_codes` table definition from `backend/schema.sql`
3. Run it (or run the entire updated schema.sql)

### Step 2: Verify Table Created
- Go to Table Editor
- Should see `parent_codes` table

---

## 🧪 Testing

### Test 1: Setup Kid Account (New Kid)
**POST** `http://localhost:3000/api/kid/setup`
**Body:**
```json
{
  "kid_username": "superkid123"
}
```
**Expected Response:**
```json
{
  "success": true,
  "parent_pin": "7294",
  "game_state_id": "uuid-here",
  "message": "Account set up successfully!"
}
```

### Test 2: Setup Kid Account (Already Playing)
**POST** `http://localhost:3000/api/kid/setup`
**Body:**
```json
{
  "kid_username": "test123"
}
```
**Expected:** Links to existing game_state, returns PIN

### Test 3: Setup Kid Account (Already Set Up)
**POST** `http://localhost:3000/api/kid/setup`
**Body:**
```json
{
  "kid_username": "superkid123"
}
```
**Expected:** Returns existing PIN (idempotent)

### Test 4: Parent Login (Valid)
**POST** `http://localhost:3000/api/parent/login`
**Body:**
```json
{
  "kid_username": "superkid123",
  "parent_pin": "7294"
}
```
**Expected Response:**
```json
{
  "success": true,
  "kid_username": "superkid123",
  "profile": {
    "gameState": {...},
    "userAssets": [...],
    "badges": [...],
    "events": [...],
    "dailyProduction": [...],
    "transactions": [...],
    "summary": {...}
  }
}
```

### Test 5: Parent Login (Invalid)
**POST** `http://localhost:3000/api/parent/login`
**Body:**
```json
{
  "kid_username": "superkid123",
  "parent_pin": "0000"
}
```
**Expected:** `401 Unauthorized` with error message

---

## 🔒 Security Notes

- PIN is 4 digits (1000-9999)
- PIN uniqueness enforced in database
- Username validation: 3-50 chars, alphanumeric + underscores
- No JWT (MVP) - frontend stores kid_username after login
- PIN stored in plaintext (acceptable for MVP, not production)

---

## 📊 Flow Diagram

```
Kid Chooses Username
    ↓
POST /api/kid/setup
    ↓
Backend:
  1. Check if parent_code exists → Return existing PIN
  2. Get or create game_state (user_id = kid_username)
  3. Generate unique PIN
  4. Create parent_code record
    ↓
Return PIN to Parent
    ↓
Parent Saves PIN
    ↓
Parent Logs In:
POST /api/parent/login (username + PIN)
    ↓
Backend Validates → Returns Full Profile
```

---

## ✅ Features

- ✅ Smart setup (handles new and existing kids)
- ✅ Unique PIN generation with retry limit
- ✅ Idempotent setup (can call multiple times)
- ✅ Username validation
- ✅ PIN format validation
- ✅ Full profile data on login
- ✅ Error handling

---

## 🚀 Next Steps

1. Run updated schema in Supabase
2. Test both endpoints
3. Frontend can now integrate parent auth
4. Consider adding PIN reset functionality (future)
