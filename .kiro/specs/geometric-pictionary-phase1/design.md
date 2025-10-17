# Design Document

## Overview

Geometric Pictionary Phase 1 implements a Reddit-based guessing game using Devvit Web architecture. The system consists of a React client for the UI, an Express server for API endpoints, and Redis for data persistence. The design follows a simple three-phase flow: create challenge → guess → view leaderboard.

## Architecture

### High-Level Architecture

```
┌─────────────────┐
│  Reddit User    │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│         Devvit Web Platform             │
│  ┌───────────────────────────────────┐  │
│  │   React Client (src/client)       │  │
│  │   - App.tsx (main flow)           │  │
│  │   - PromptView.tsx (guess input)  │  │
│  │   - ResultsView.tsx (leaderboard) │  │
│  └──────────────┬────────────────────┘  │
│                 │ fetch(/api/*)          │
│                 ▼                        │
│  ┌───────────────────────────────────┐  │
│  │   Express Server (src/server)     │  │
│  │   - POST /api/init                │  │
│  │   - POST /api/prompt/submit-guess │  │
│  │   - POST /api/prompt/get-results  │  │
│  │   - GET/POST /internal/menu/*     │  │
│  └──────────────┬────────────────────┘  │
│                 │                        │
│                 ▼                        │
│  ┌───────────────────────────────────┐  │
│  │   Redis (Data Layer)              │  │
│  │   - Custom prompts                │  │
│  │   - Player guesses                │  │
│  │   - Aggregated results            │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

### Component Architecture

```
Client Components:
├── App.tsx (State machine: loading → prompt → results)
├── PromptView.tsx (Description display + guess input)
└── ResultsView.tsx (Leaderboard + stats)

Server Endpoints:
├── /api/init (Initialize game state)
├── /api/prompt/submit-guess (Store player guess)
├── /api/prompt/get-results (Fetch leaderboard)
└── /internal/menu/post-create-with-form (Create challenge)

Services:
├── promptStorage.ts (Store/retrieve custom prompts)
├── guessTracking.ts (Track who has guessed)
├── redisAggregation.ts (Aggregate guess counts)
└── guessNormalization.ts (Normalize guess text)
```

## Components and Interfaces

### 1. Post Creation Form

**Location:** Server endpoint `/internal/menu/post-create-with-form`

**Design:**
- GET request returns HTML form with embedded CSS and JavaScript
- Form fields:
  - `description` (textarea, required, placeholder with examples)
  - `answer` (text input, required, max 50 chars)
- POST request processes form data and creates Reddit post

**Interface:**
```typescript
type CreatePostOptions = {
  description: string;
  answer: string;
};

// POST body
{
  description: string;
  answer: string;
}

// Response
{
  navigateTo: string; // Reddit post URL
}
```

**Flow:**
1. User clicks subreddit menu → "Create Geometric Challenge"
2. Browser opens GET `/internal/menu/post-create-with-form`
3. User fills form and submits
4. JavaScript POSTs to same endpoint
5. Server creates post via `createPost()` function
6. Server stores prompt in Redis via `storeCustomPrompt()`
7. Server returns post URL
8. Browser redirects to new post

### 2. Client Application (App.tsx)

**State Machine:**
```
loading → prompt → results
   ↓         ↓
 error    error
```

**States:**
- `loading`: Fetching initial data
- `prompt`: Show description, accept guess
- `results`: Show leaderboard
- `error`: Show error message
- `no-prompt`: Post has no custom prompt

**Interface:**
```typescript
type AppState = 'loading' | 'prompt' | 'results' | 'error' | 'no-prompt';

type InitResponse = {
  type: 'init';
  postId: string;
  username: string;
  customPrompt: {
    description: string;
    hasGuessed: boolean;
  } | null;
};
```

**Flow:**
1. Component mounts → fetch `/api/init`
2. If `hasGuessed === false` → show PromptView
3. If `hasGuessed === true` → fetch results → show ResultsView
4. On guess submit → POST to `/api/prompt/submit-guess` → fetch results → show ResultsView

### 3. Prompt View Component

**Purpose:** Display geometric description and accept player guess

**Interface:**
```typescript
type PromptViewProps = {
  description: string;
  onSubmitGuess: (guess: string) => Promise<void>;
  loading: boolean;
};
```

**UI Elements:**
- Header: "Geometric Pictionary"
- Description box: Blue background with 📐 icon
- Input field: Text input with placeholder
- Submit button: Orange (#FF4500), disabled when empty

**Validation:**
- Trim whitespace
- Require non-empty guess
- Max length: 100 characters
- Disable button while submitting

### 4. Results View Component

**Purpose:** Display top 10 guesses leaderboard with player's score

**Interface:**
```typescript
type ResultsViewProps = {
  postId: string;
  playerGuess: string | null;
  aggregation: GuessAggregation[];
  creatorAnswer: string;
  totalPlayers: number;
  totalGuesses: number;
  playerScore: ConsensusScore;
  onRefresh: () => void;
};

type GuessAggregation = {
  guess: string;
  count: number;
  percentage: number;
  isPlayerGuess: boolean;
  rank: number;
  variants?: string[];
};

type ConsensusScore = {
  pointsEarned: number;
  matchPercentage: number;
  tier: 'high' | 'medium' | 'low' | 'unique';
};
```

**UI Layout:**
```
┌─────────────────────────────────┐
│      Top Guesses Header         │
├─────────────────────────────────┤
│  Top 10 Leaderboard             │
│  ┌───────────────────────────┐  │
│  │ 1. jellyfish  5183  85%   │  │
│  │ 2. jelly fish  193   3%   │  │
│  │ 3. squid        95   2%   │  │
│  └───────────────────────────┘  │
├─────────────────────────────────┤
│  Stats: 5.5k players • 6.1k     │
├─────────────────────────────────┤
│  Creator's Answer: jellyfish    │
├─────────────────────────────────┤
│  Your Guess: jellyfish          │
│  Points: 100                    │
├─────────────────────────────────┤
│  [🔄 Refresh Results]           │
└─────────────────────────────────┘
```

**Features:**
- Auto-refresh every 5 seconds
- Manual refresh button
- Player's guess highlighted with orange ring
- Bar chart visualization (width = count/maxCount * 100%)
- Variants shown below grouped guesses

## Data Models

### Redis Keys Structure

```
# Custom Prompt Storage
prompt:{postId}:description → string (geometric description)
prompt:{postId}:answer → string (creator's answer)
prompt:{postId}:creator → string (username)

# Guess Tracking
{postId}:player:{username}:guessed → "1" (flag)
{postId}:player:{username}:guess → string (normalized guess)

# Guess Aggregation
{postId}:guess:{normalizedGuess} → number (count)
{postId}:players → set (unique usernames)

# Example:
prompt:abc123:description → "Two circles connected by a rectangle"
prompt:abc123:answer → "dumbbell"
abc123:player:user1:guessed → "1"
abc123:player:user1:guess → "dumbbell"
abc123:guess:dumbbell → 5
abc123:guess:barbell → 3
abc123:players → {"user1", "user2", "user3", ...}
```

### Data Flow

**Post Creation:**
```
User Input → Server
  ↓
storeCustomPrompt(redis, postId, description, answer, creator)
  ↓
Redis: prompt:{postId}:* keys created
```

**Guess Submission:**
```
User Guess → Server
  ↓
normalizeGuess(guess) → "jellyfish"
  ↓
storeGuess(redis, 0, normalizedGuess, postId)
addPlayerToSet(redis, 0, username, postId)
storePlayerGuess(redis, 0, username, normalizedGuess, postId)
markUserAsGuessed(redis, postId, username)
  ↓
Redis: Multiple keys updated atomically
```

**Results Retrieval:**
```
Client Request → Server
  ↓
getAggregatedGuesses(redis, 0, postId) → {guess: count}
getTotalPlayers(redis, 0, postId) → number
getPlayerGuess(redis, postId, username) → string
  ↓
groupSimilarGuesses(guessesMap, 85) → grouped results
  ↓
Sort by count, take top 10
  ↓
calculateConsensusTier(playerGuess, top10) → score
  ↓
Return to client
```

## Error Handling

### Client-Side Errors

**Network Failures:**
```typescript
try {
  const response = await fetch('/api/...');
  if (!response.ok) throw new Error('Request failed');
} catch (error) {
  setError(error.message);
  setAppState('error');
}
```

**Validation Errors:**
- Empty guess → Disable submit button
- Already guessed → Show error from server
- Invalid data → Show error message with retry button

### Server-Side Errors

**Redis Failures:**
```typescript
// Retry logic for critical operations
const retryOperation = async (operation, operationName) => {
  try {
    return await operation();
  } catch (error) {
    console.warn(`${operationName} failed, retrying...`);
    await delay(100);
    return await operation(); // Retry once
  }
};
```

**Error Responses:**
```typescript
type ErrorResponse = {
  status: 'error';
  message: string;
};

// Example
res.status(400).json({
  status: 'error',
  message: 'You have already guessed on this post'
});
```

### Error Categories

1. **Validation Errors** (400)
   - Missing required fields
   - Empty guess
   - Already guessed

2. **Authentication Errors** (401)
   - Unable to get username from Reddit context

3. **Not Found Errors** (404)
   - Post not found
   - Prompt not found

4. **Server Errors** (500)
   - Redis connection failures
   - Unexpected exceptions

## Testing Strategy

### Unit Tests

**Client Components:**
```typescript
// PromptView.test.tsx
- Renders description correctly
- Validates empty guess
- Calls onSubmitGuess with trimmed value
- Disables button while submitting

// ResultsView.test.tsx
- Renders top 10 guesses
- Highlights player's guess
- Shows creator's answer separately
- Auto-refreshes every 5 seconds
- Formats numbers correctly (5.5k)
```

**Server Endpoints:**
```typescript
// api/init.test.ts
- Returns post data and username
- Returns hasGuessed status correctly
- Handles missing postId

// api/submit-guess.test.ts
- Stores guess in Redis
- Prevents duplicate guesses
- Normalizes guess text
- Returns success response

// api/get-results.test.ts
- Returns top 10 guesses
- Groups similar guesses
- Calculates percentages correctly
- Returns player's score
```

**Services:**
```typescript
// guessNormalization.test.ts
- Converts to lowercase
- Trims whitespace
- Handles special characters

// redisAggregation.test.ts
- Increments guess count
- Adds player to set
- Groups similar guesses (85% threshold)
```

### Integration Tests

**End-to-End Flow:**
1. Create post with description and answer
2. Verify post appears in Redis
3. Submit guess as player
4. Verify guess stored in Redis
5. Fetch results
6. Verify top 10 includes guess
7. Verify player's guess highlighted

**Edge Cases:**
- Multiple players guessing simultaneously
- Very long descriptions (>500 chars)
- Special characters in guesses
- Empty leaderboard (no guesses yet)
- Single player (100% consensus)

### Manual Testing Checklist

- [ ] Create challenge from subreddit menu
- [ ] Form validation works (empty fields)
- [ ] Post created with correct title
- [ ] Splash screen displays correctly
- [ ] Description shows in game
- [ ] Guess submission works
- [ ] Cannot guess twice
- [ ] Leaderboard shows top 10
- [ ] Player's guess highlighted
- [ ] Creator's answer shown separately
- [ ] Auto-refresh works
- [ ] Manual refresh works
- [ ] Mobile responsive
- [ ] Error messages clear

## Performance Considerations

### Redis Optimization

**Batch Operations:**
- Group related Redis operations together
- Use pipelining for multiple reads
- Minimize round trips

**TTL Strategy:**
- Set reasonable TTLs on temporary data
- Keep prompt data indefinitely (or very long TTL)
- Clean up old guess data after 30 days

**Caching:**
- Cache aggregated results for 1 second to reduce Redis load during high traffic
- Invalidate cache on new guess submission

### Client Optimization

**Auto-Refresh:**
- Use 5-second interval (not too aggressive)
- Cancel pending requests on unmount
- Debounce manual refresh button

**Bundle Size:**
- Code splitting not needed (small app)
- Minimize dependencies
- Use Tailwind for CSS (no extra CSS files)

### Scalability

**Current Limitations:**
- Redis single instance (Devvit limitation)
- No horizontal scaling needed for Phase 1
- Serverless functions handle concurrent requests

**Future Considerations:**
- If >10k concurrent players, consider result caching
- If >100k guesses per post, consider pagination
- Monitor Redis memory usage

## Security Considerations

### Data Protection

**Answer Security:**
- Store answer in Redis (not sent to client until after guess)
- Never expose answer in API responses before guess
- Validate user has guessed before showing results

**User Authentication:**
- Use Reddit's built-in authentication
- Get username from `reddit.getCurrentUsername()`
- No custom auth needed

**Input Validation:**
- Sanitize description and answer on server
- Limit description length (500 chars)
- Limit answer length (50 chars)
- Trim and normalize all user input

### Rate Limiting

**Guess Submission:**
- One guess per user per post (enforced in Redis)
- Check `hasUserGuessed()` before accepting guess
- Return 400 error if already guessed

**Post Creation:**
- No rate limiting in Phase 1 (rely on Reddit's limits)
- Future: Consider limiting posts per user per hour

## Deployment

### Build Process

```bash
# Development
npm run dev  # Starts client, server, and devvit playtest

# Production Build
npm run build  # Builds client and server
npm run deploy  # Deploys to Reddit
```

### Environment Variables

```
# Automatically provided by Devvit
DEVVIT_REDIS_URL
DEVVIT_REDDIT_TOKEN
```

### Deployment Checklist

- [ ] Run `npm run build` successfully
- [ ] Test in playtest environment
- [ ] Verify all endpoints work
- [ ] Check mobile responsiveness
- [ ] Review error handling
- [ ] Deploy with `npm run deploy`
- [ ] Test in production subreddit
- [ ] Monitor logs for errors

## Future Enhancements (Out of Scope for Phase 1)

1. **Historical Results:** View past challenges
2. **User Profiles:** Track player stats across challenges
3. **Categories:** Filter challenges by difficulty
4. **Voting:** Upvote/downvote guesses
5. **Hints:** Creator can provide hints
6. **Time Limits:** Challenges expire after X hours
7. **Achievements:** Badges for milestones
8. **Leaderboards:** Global player rankings
