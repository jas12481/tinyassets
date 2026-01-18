# AI Chatbot Testing Guide

This guide covers how to test the AI chatbot functionality for the TinyAssets parent dashboard.

---

## 🚀 Quick Start

### Prerequisites
1. Backend server running on port 3001
2. Supabase database configured and connected
3. (Optional) OpenAI API key for enhanced responses

### Start the Backend
```bash
cd backend
npm run dev  # or npm start
```

---

## 📝 Testing Methods

### Method 1: Using cURL (Command Line)

#### Test 1: Basic Question Without Context
```bash
curl -X POST http://localhost:3001/api/ai/assistant \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What is my childs current level?",
    "context": {
      "childUsername": "testkid123"
    }
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "answer": "Your child testkid123 is currently at Level 1 with 0 XP...",
  "confidence": 0.7,
  "suggestions": [
    "What is my child's current level?",
    "What badges has my child earned?",
    "What is my child learning about?",
    "Recent learning events?"
  ]
}
```

#### Test 2: Question With Full Context
```bash
curl -X POST http://localhost:3001/api/ai/assistant \
  -H "Content-Type: application/json" \
  -d '{
    "question": "Tell me about the badges my child earned",
    "context": {
      "childUsername": "testkid123",
      "gameState": {
        "level": 3,
        "xp": 150,
        "selected_asset": "property"
      },
      "recentEvents": [
        {
          "event_name": "Economic Boom",
          "asset_type": "property",
          "timestamp": "2024-01-01T00:00:00Z"
        }
      ],
      "earnedBadges": [
        {
          "badge_name": "First Purchase",
          "unlocked_at": "2024-01-01T00:00:00Z"
        }
      ],
      "learningFocus": "property"
    }
  }'
```

#### Test 3: With JWT Token (After Parent Login)
```bash
# First, login to get token
curl -X POST http://localhost:3001/api/parent/login \
  -H "Content-Type: application/json" \
  -d '{
    "kid_username": "testkid123",
    "parent_pin": "1234"
  }'

# Then use the token in AI request
curl -X POST http://localhost:3001/api/ai/assistant \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -d '{
    "question": "What is my child learning about?"
  }'
```

#### Test 4: Conversation History (Multi-turn)
```bash
curl -X POST http://localhost:3001/api/ai/assistant \
  -H "Content-Type: application/json" \
  -d '{
    "question": "Tell me more about that",
    "context": {
      "childUsername": "testkid123"
    },
    "conversationHistory": [
      {
        "role": "user",
        "content": "What level is my child at?"
      },
      {
        "role": "assistant",
        "content": "Your child is at Level 3..."
      }
    ]
  }'
```

#### Test 5: Error Cases
```bash
# Missing question
curl -X POST http://localhost:3001/api/ai/assistant \
  -H "Content-Type: application/json" \
  -d '{
    "context": {
      "childUsername": "testkid123"
    }
  }'

# Expected: 400 Bad Request
```

---

### Method 2: Using Postman or Insomnia

#### Setup Request
1. **Method**: `POST`
2. **URL**: `http://localhost:3001/api/ai/assistant`
3. **Headers**:
   - `Content-Type: application/json`
   - `Authorization: Bearer <token>` (optional)
4. **Body** (raw JSON):
```json
{
  "question": "What badges has my child earned?",
  "context": {
    "childUsername": "testkid123",
    "gameState": {
      "level": 2,
      "xp": 100,
      "selected_asset": "solar"
    },
    "recentEvents": [],
    "earnedBadges": [
      {
        "badge_name": "Early Investor",
        "badge_id": "badge_001"
      }
    ],
    "learningFocus": "solar"
  },
  "conversationHistory": []
}
```

---

### Method 3: Testing from Frontend (Browser)

#### Step 1: Start Both Servers
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend  # or root if using Next.js
npm run dev
```

#### Step 2: Login as Parent
1. Navigate to `http://localhost:3000/parent` (or your frontend URL)
2. Enter:
   - **Kid Username**: `testkid123` (or existing username)
   - **Parent PIN**: `1234` (or the PIN generated during setup)
3. Click "Login"

#### Step 3: Open AI Chatbot
1. Look for the AI chatbot icon/button in the parent dashboard
2. Click to open the chat interface
3. Ask a question like:
   - "What is my child's current level?"
   - "What badges has my child earned?"
   - "Tell me about recent learning events"
   - "What is my child learning about?"

#### Step 4: Verify Response
- ✅ AI should respond with relevant information
- ✅ Response should include the child's username
- ✅ Response should reference game state, badges, or events if available
- ✅ Confidence score should be between 0 and 1
- ✅ Suggestions should be provided

---

## 🧪 Test Scenarios

### Scenario 1: Child With No Game Data
**Setup**: User exists but has never played
```bash
curl -X POST http://localhost:3001/api/ai/assistant \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What is my childs level?",
    "context": {
      "childUsername": "newkid456"
    }
  }'
```

**Expected**: AI responds with default values (Level 1, 0 XP, no events/badges)

---

### Scenario 2: Child With Rich Game Data
**Setup**: User has played extensively
```bash
# First ensure data exists in database for testkid123
# Then ask:
curl -X POST http://localhost:3001/api/ai/assistant \
  -H "Content-Type: application/json" \
  -d '{
    "question": "Summarize my childs progress",
    "context": {
      "childUsername": "testkid123"
    }
  }'
```

**Expected**: AI fetches actual data and provides detailed response

---

### Scenario 3: Without Authentication
**Test**: Request without JWT token
```bash
curl -X POST http://localhost:3001/api/ai/assistant \
  -H "Content-Type: application/json" \
  -d '{
    "question": "Tell me about my child",
    "context": {
      "childUsername": "testkid123"
    }
  }'
```

**Expected**: Should work (optionalAuth allows it), uses context.childUsername

---

### Scenario 4: Question Types

#### Level/Progress Questions
```json
{
  "question": "What level is my child at?",
  "context": { "childUsername": "testkid123" }
}
```

#### Badge Questions
```json
{
  "question": "What badges has my child earned?",
  "context": { "childUsername": "testkid123" }
}
```

#### Event Questions
```json
{
  "question": "What recent events happened in the game?",
  "context": { "childUsername": "testkid123" }
}
```

#### Learning Focus Questions
```json
{
  "question": "What is my child learning about?",
  "context": { "childUsername": "testkid123" }
}
```

#### XP Questions
```json
{
  "question": "How much XP does my child have?",
  "context": { "childUsername": "testkid123" }
}
```

---

## 🔍 Debugging Tips

### 1. Check Backend Logs
Watch the console for:
```
[AI Controller] Fetching game data for: testkid123
[Supabase Service] Fetching game data for user: testkid123
[Supabase Service] Successfully fetched game data: { hasGameState: true, eventCount: 5, badgeCount: 2 }
```

### 2. Verify Database Connection
```bash
curl http://localhost:3001/api/health
```

**Expected**:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "database": "connected"
}
```

### 3. Check Environment Variables
Ensure these are set in `backend/.env`:
```env
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_KEY=eyJ... (or SUPABASE_SERVICE_ROLE_KEY)
JWT_SECRET=your-secret-key (optional)
OPENAI_API_KEY=sk-... (optional)
```

### 4. Test Database Queries Directly
If using Supabase dashboard:
```sql
-- Check if user exists
SELECT * FROM game_state WHERE user_id = 'testkid123';

-- Check events
SELECT * FROM event_history WHERE user_id = 'testkid123' ORDER BY timestamp DESC LIMIT 5;

-- Check badges
SELECT * FROM earned_badges WHERE user_id = 'testkid123' ORDER BY unlocked_at DESC;
```

---

## ✅ Success Criteria

### For Rule-Based Assistant (No OpenAI Key)
- ✅ Responds to level/progress questions
- ✅ Responds to badge questions
- ✅ Responds to event questions
- ✅ Responds to learning focus questions
- ✅ Provides helpful suggestions
- ✅ Confidence score between 0.7-0.95

### For OpenAI Assistant (With API Key)
- ✅ Responds naturally to any question
- ✅ Context-aware responses
- ✅ Maintains conversation history
- ✅ Confidence score 0.95
- ✅ Falls back to rule-based if API fails

### For Context Building
- ✅ Fetches game data when childUsername provided
- ✅ Handles missing data gracefully
- ✅ Uses provided context if complete
- ✅ Extracts childUsername from JWT token if available

---

## 🐛 Common Issues & Solutions

### Issue: "Please provide a question" error
**Cause**: Question is missing or empty
**Solution**: Ensure `question` field is a non-empty string

### Issue: "I'm having trouble processing your question"
**Cause**: Backend error or Supabase connection issue
**Solution**: 
- Check backend logs
- Verify Supabase connection with `/api/health`
- Check environment variables

### Issue: Generic responses without child data
**Cause**: childUsername not found or no game data
**Solution**:
- Verify childUsername in context
- Check if user exists in database
- Ensure game data is populated

### Issue: OpenAI errors
**Cause**: Invalid API key or API down
**Solution**: 
- Verify OPENAI_API_KEY is correct
- Check OpenAI service status
- System will fallback to rule-based assistant

---

## 📊 Example Test Script

Save as `test-ai-chatbot.sh`:

```bash
#!/bin/bash

API_URL="http://localhost:3001/api/ai/assistant"
CHILD_USERNAME="testkid123"

echo "=== Test 1: Basic Question ==="
curl -X POST $API_URL \
  -H "Content-Type: application/json" \
  -d "{\"question\": \"What is my child's level?\", \"context\": {\"childUsername\": \"$CHILD_USERNAME\"}}" \
  | jq '.'

echo -e "\n=== Test 2: Badge Question ==="
curl -X POST $API_URL \
  -H "Content-Type: application/json" \
  -d "{\"question\": \"What badges has my child earned?\", \"context\": {\"childUsername\": \"$CHILD_USERNAME\"}}" \
  | jq '.'

echo -e "\n=== Test 3: Event Question ==="
curl -X POST $API_URL \
  -H "Content-Type: application/json" \
  -d "{\"question\": \"Tell me about recent events\", \"context\": {\"childUsername\": \"$CHILD_USERNAME\"}}" \
  | jq '.'

echo -e "\n=== Test 4: Error Handling (Missing Question) ==="
curl -X POST $API_URL \
  -H "Content-Type: application/json" \
  -d "{\"context\": {\"childUsername\": \"$CHILD_USERNAME\"}}" \
  | jq '.'
```

Run with:
```bash
chmod +x test-ai-chatbot.sh
./test-ai-chatbot.sh
```

---

## 🎯 Quick Test Checklist

- [ ] Backend server running on port 3001
- [ ] Database connection working (`/api/health`)
- [ ] Can send POST request to `/api/ai/assistant`
- [ ] Receives response with `success: true`
- [ ] Answer contains relevant information
- [ ] Confidence score is a number
- [ ] Suggestions array is provided
- [ ] Works without JWT token (optional auth)
- [ ] Works with JWT token (after parent login)
- [ ] Handles missing game data gracefully
- [ ] Falls back to rule-based if OpenAI unavailable

---

**Last Updated**: After comprehensive AI chatbot implementation and fixes

