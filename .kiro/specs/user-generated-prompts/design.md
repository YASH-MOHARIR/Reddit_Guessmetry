# Design Document

## Overview

This design transforms Guessmetry from a timed game with predefined prompts into a user-generated prompt system where post creators define custom geometric description challenges. The game focuses on crowd consensus rather than speed, showing players the most popular guesses and rewarding both correctness and alignment with the crowd.

## Architecture

### High-Level Flow

```
Post Creator → Custom Post Form → Redis Storage → Post Created
                                                        ↓
Player Opens Post → See Description → Submit Guess → See Top 10 Results
                                                        ↓
                                            Real-time Updates as Others Guess
```

### Key Changes from Current Implementation

1. **Remove**: Timer-based gameplay, predefined prompts list, speed scoring
2. **Add**: Custom post form, per-post prompt storage, real-time aggregation display
3. **Keep**: Redis aggregation, consensus scoring, leaderboard system

## Components and Interfaces

### 1. Custom Post Form (Devvit Configuration)

**Location**: `devvit.json` configuration

**Purpose**: Collect custom prompt and answer from post creator

**Configuration**:
```json
{
  "forms": {
    "createPrompt": {
      "title": "Create Geometric Pictionary Challenge",
      "description": "Create a geometric description for players to guess",
      "fields": [
        {
          "name": "description",
          "label": "Geometric Description",
          "type": "string",
          "required": true,
          "helpText": "Describe a shape using geometric terms (e.g., 'two circles connected by a rectangle')",
          "maxLength": 500
        },
        {
          "name": "answer",
          "label": "Answer",
          "type": "string",
          "required": true,
          "helpText": "What is the object you're describing? (e.g., 'dumbbell')",
          "maxLength": 100
        }
      ],
      "acceptLabel": "Create Post",
      "cancelLabel": "Cancel"
    }
  }
}
```

**Handler**: `src/server/core/post.ts` - Modified to accept form data and store in Redis

### 2. Prompt Storage Service

**Location**: `src/server/services/promptStorage.ts` (new file)

**Purpose**: Store and retrieve custom prompts per post

**Interface**:
```typescript
type CustomPrompt = {
  postId: string;
  description: string;
  answer: string;
  createdBy: string;
  createdAt: number;
};

// Store custom prompt for a post
async function storeCustomPrompt(
  redis: RedisClient,
  postId: string,
  description: string,
  answer: string,
  createdBy: string
): Promise<void>

// Retrieve custom prompt for a post
async function getCustomPrompt(
  redis: RedisClient,
  postId: string
): Promise<CustomPrompt | null>
```

**Redis Keys**:
- `post:${postId}:prompt:description` - The geometric description
- `post:${postId}:prompt:answer` - The correct answer
- `post:${postId}:prompt:meta` - Hash with creator, timestamp

**TTL**: 30 days (2,592,000 seconds)

### 3. Client Application Redesign

#### 3.1 Simplified Flow

**Remove**:
- Timer component
- Display phase (no countdown)
- Mode selection (only one mode now)
- Next round button (single-round per post)

**Keep**:
- Guess input
- Results display with aggregation
- Leaderboard

#### 3.2 New Component: PromptView

**Location**: `src/client/components/PromptView.tsx`

**Purpose**: Display custom prompt and collect guess

**Props**:
```typescript
type PromptViewProps = {
  description: string;
  onSubmitGuess: (guess: string) => Promise<void>;
  loading: boolean;
};
```

**UI**:
- Large, readable description text
- Input field for guess
- Submit button
- No timer display

#### 3.3 Modified Component: ResultsView

**Location**: `src/client/components/ResultsView.tsx` (modified from existing)

**Purpose**: Show top 10 guesses with real-time updates

**Props**:
```typescript
type ResultsViewProps = {
  postId: string;
  playerGuess: string;
  aggregation: GuessAggregation[];
  creatorAnswer: string;
  totalPlayers: number;
  totalGuesses: number;
  playerScore: ConsensusScore;
  onRefresh: () => void;
};
```

**Features**:
- Display top 10 guesses with bars (like Jellyfish example)
- Highlight player's guess
- Highlight creator's answer
- Show player count and guess count
- Auto-refresh every 5 seconds
- Manual refresh button

### 4. API Endpoints

#### 4.1 Modified: `/api/init`

**Changes**: Return custom prompt data instead of starting a session

**Response**:
```typescript
type InitResponse = {
  type: 'init';
  postId: string;
  username: string;
  customPrompt: {
    description: string;
    hasGuessed: boolean; // true if user already guessed
  } | null;
};
```

#### 4.2 New: `/api/prompt/submit-guess`

**Purpose**: Submit guess for custom prompt

**Request**:
```typescript
{
  postId: string;
  guess: string;
}
```

**Response**:
```typescript
{
  type: 'guess-submitted';
  success: boolean;
}
```

**Logic**:
1. Get username from Reddit context
2. Normalize guess
3. Store guess in Redis (reuse existing aggregation logic)
4. Mark user as having guessed
5. Return success

#### 4.3 Modified: `/api/prompt/get-results`

**Purpose**: Get aggregated results for custom prompt

**Request**:
```typescript
{
  postId: string;
}
```

**Response**: Same as current `ConsensusResultsResponse`

**Logic**: Reuse existing aggregation logic, but fetch creator's answer from Redis instead of prompts array

#### 4.4 New: `/api/prompt/create`

**Purpose**: Handle custom post form submission

**Request**: Form data from Devvit

**Logic**:
1. Validate description and answer
2. Create Reddit post
3. Store prompt in Redis
4. Return post URL

### 5. Scoring System

**Reuse existing consensus scoring** from `src/server/utils/consensusScoring.ts`:

- **Exact match with creator's answer**: 100 points
- **Similar to creator's answer (>80%)**: 75 points
- **Top 3 popular guess**: 50/30/20 bonus points
- **Top 10 popular guess**: 10 bonus points

**Leaderboard**: Aggregate scores across all posts per user

### 6. Data Models

#### 6.1 Custom Prompt (Redis)

```typescript
// Stored per post
type CustomPromptData = {
  description: string;    // "two circles connected by a rectangle"
  answer: string;         // "dumbbell"
  createdBy: string;      // "u/creator"
  createdAt: number;      // timestamp
};
```

**Redis Keys**:
- `post:${postId}:prompt:description`
- `post:${postId}:prompt:answer`
- `post:${postId}:prompt:meta` (hash)

#### 6.2 Guess Aggregation (Redis)

**Reuse existing structure** from `src/server/services/redisAggregation.ts`:

- `post:${postId}:guesses` - Hash of normalized guess → count
- `post:${postId}:players` - Set of usernames who guessed
- `post:${postId}:player:${username}:guess` - Individual player's guess

#### 6.3 User Has Guessed (Redis)

```typescript
// Track if user already guessed on this post
Key: `post:${postId}:player:${username}:guessed`
Value: "1"
TTL: 30 days
```

#### 6.4 Global Leaderboard (Redis)

```typescript
// Sorted set of username → total score
Key: `leaderboard:global`
Type: Sorted Set
Members: username
Scores: total points
```

## Error Handling

### Post Without Custom Prompt

**Scenario**: User opens old post or post creation failed

**Handling**:
1. Check if custom prompt exists in Redis
2. If not found, show error message: "This post doesn't have a valid prompt"
3. Provide "Go Back" button

### User Already Guessed

**Scenario**: User tries to guess again on same post

**Handling**:
1. Check `post:${postId}:player:${username}:guessed` key
2. If exists, skip guess input and show results directly
3. Display message: "You already guessed on this post"

### Redis Failures

**Reuse existing error handling** from consensus voting implementation:
- Retry logic for transient failures
- Partial success handling
- Graceful degradation with user-friendly messages

## Testing Strategy

### Unit Tests

1. **Prompt Storage Service**
   - Test storing custom prompts
   - Test retrieving custom prompts
   - Test handling missing prompts

2. **Guess Submission**
   - Test first guess submission
   - Test duplicate guess prevention
   - Test guess normalization

3. **Results Aggregation**
   - Test top 10 calculation
   - Test similarity grouping
   - Test percentage calculations

### Integration Tests

1. **Post Creation Flow**
   - Test form submission
   - Test prompt storage
   - Test post creation

2. **Gameplay Flow**
   - Test viewing prompt
   - Test submitting guess
   - Test viewing results
   - Test returning to post after guessing

3. **Real-time Updates**
   - Test results refresh
   - Test multiple players guessing
   - Test aggregation updates

### Manual Testing

1. **Post Creator Experience**
   - Create post with custom prompt
   - Verify post appears in subreddit
   - Verify prompt is stored correctly

2. **Player Experience**
   - Open post and see description
   - Submit guess
   - See top 10 results
   - Verify score calculation
   - Return to post and see updated results

3. **Edge Cases**
   - Very long descriptions
   - Special characters in answers
   - Many players guessing simultaneously
   - Returning after 30 days (expired data)

## Migration Strategy

### Phase 1: Add Custom Prompt Support

1. Add custom post form to `devvit.json`
2. Create prompt storage service
3. Modify post creation handler
4. Add new API endpoints

### Phase 2: Simplify Client

1. Remove timer components
2. Remove mode selection
3. Simplify game flow to single-round
4. Update UI to show custom prompts

### Phase 3: Remove Old Code

1. Remove predefined prompts list
2. Remove session-based scoring
3. Remove timer-related utilities
4. Clean up unused components

### Phase 4: Testing & Polish

1. Test all flows end-to-end
2. Polish UI for mobile
3. Add loading states
4. Add error messages
5. Test with multiple users

## UI/UX Design

### Splash Screen (Reddit Feed)

```
┌─────────────────────────────┐
│  🎨 Geometric Pictionary    │
│                             │
│  "Can you guess what this   │
│   geometric description     │
│   represents?"              │
│                             │
│  [▶ Play Now]              │
└─────────────────────────────┘
```

### Prompt View (Before Guessing)

```
┌─────────────────────────────┐
│  Geometric Pictionary       │
├─────────────────────────────┤
│                             │
│  📐 Description:            │
│                             │
│  "Two circles connected by  │
│   a rectangle"              │
│                             │
│  ┌─────────────────────┐   │
│  │ Your guess...       │   │
│  └─────────────────────┘   │
│                             │
│  [Submit Guess]             │
│                             │
└─────────────────────────────┘
```

### Results View (After Guessing)

```
┌─────────────────────────────┐
│  Dumbbell                   │
│  by u/creator               │
├─────────────────────────────┤
│                             │
│  Dumbbell     5183  85% ✓   │
│  ████████████████████       │
│                             │
│  Barbell       193   3%     │
│  ██                         │
│                             │
│  Weights       113   2%     │
│  █                          │
│                             │
│  ... (7 more)               │
│                             │
│  5.5k players • 6.1k guesses│
│                             │
│  Your guess: "dumbbell" ✓   │
│  Points earned: 150         │
│  (100 correct + 50 popular) │
│                             │
│  [🔄 Refresh] [📊 Leaderboard]│
└─────────────────────────────┘
```

## Performance Considerations

### Redis Optimization

1. **Batch Operations**: Use pipelines for multiple Redis operations
2. **TTL Management**: Set appropriate TTLs to prevent data bloat
3. **Key Naming**: Use consistent, hierarchical key naming for easy cleanup

### Client Optimization

1. **Debounced Refresh**: Limit auto-refresh to every 5 seconds
2. **Conditional Rendering**: Only re-render when data changes
3. **Lazy Loading**: Load leaderboard only when requested

### Scalability

1. **Per-Post Isolation**: Each post has independent data, no cross-post queries
2. **Sorted Sets**: Use Redis sorted sets for efficient leaderboard queries
3. **Caching**: Cache aggregated results for 5 seconds to reduce Redis load

## Security Considerations

1. **Input Validation**: Sanitize description and answer inputs
2. **Rate Limiting**: Prevent spam post creation
3. **Duplicate Prevention**: Enforce one guess per user per post
4. **XSS Protection**: Escape user-generated content in UI
5. **Answer Privacy**: Never send answer to client before user guesses

## Accessibility

1. **Keyboard Navigation**: All interactions accessible via keyboard
2. **Screen Reader Support**: Proper ARIA labels and live regions
3. **Color Contrast**: Ensure text meets WCAG AA standards
4. **Touch Targets**: Minimum 48x48px for mobile buttons
5. **Focus Indicators**: Clear focus states for all interactive elements
