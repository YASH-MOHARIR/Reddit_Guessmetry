# Guessmetry - Geometric Pictionary

A Reddit-based guessing game where users create challenges by describing objects using geometric shapes, and other players guess what the description represents. After guessing, players see a leaderboard showing the most popular answers ranked by count.

**Play it on Reddit**: Find a Guessmetry post and click "Launch App" to start playing instantly!

---

## 🎮 What is Guessmetry?

Guessmetry is a unique community-driven guessing game that flips traditional Pictionary on its head. Instead of drawing pictures, users create text descriptions using geometric shapes (like "two circles connected by a rectangle"), and other Reddit users try to guess what object is being described.

The game runs directly inside Reddit posts as a native Devvit app, providing a seamless experience without leaving the platform. Built with React 19 and powered by Devvit's serverless infrastructure with Redis for data persistence, it creates a social guessing experience where the community's collective answers determine what's "correct."

### How It Works

**Create**: Any Reddit user can create a geometric description challenge post from the subreddit menu. You provide a geometric description and your intended answer.

**Guess**: Players read your description and submit their guess. Each player gets one guess per post.

**Discover**: After guessing, players see a live leaderboard showing the top 10 most popular answers, ranked by how many people guessed them. Your guess is highlighted if it made the top 10, and the creator's intended answer is shown separately.

## 🚀 Quick Start

### How to Play in 30 Seconds

1. **Find or Create**: Find a Guessmetry post on Reddit, or create your own challenge from the subreddit menu
2. **Launch**: Click "Launch App" on the post
3. **Read**: Read the geometric description carefully
4. **Guess**: Type your answer and submit (one guess per player)
5. **Discover**: See the leaderboard showing the top 10 most popular guesses
6. **Compare**: See how your guess compares to the community and the creator's intended answer

### Scoring System

Players earn points based on how popular their guess is among the community:

- 🏆 **High Consensus** (>20% of players): High points - you thought like the majority
- 🥈 **Medium Consensus** (5-20% of players): Medium points - a common answer
- 🥉 **Low Consensus** (<5% of players): Low points - an uncommon guess
- 💎 **Unique** (only you): Minimal points - a creative but rare answer

The more players who guess the same thing as you, the more points you earn!

## 💡 What Makes Guessmetry Innovative?

Guessmetry stands out from traditional guessing games with several unique features that make it perfect for Reddit's community-driven platform:

### 1. **Reverse Pictionary Concept**
Instead of drawing pictures, users create text descriptions using geometric shapes. Players must visualize the shapes in their mind and deduce what object they form. For example, "two circles connected by a rectangle" might be "dumbbell" or "barbell" - turning abstract descriptions into concrete objects through mental visualization.

### 2. **Community-Driven Answers**
There's no single "correct" answer - the community decides what's right! If 85% of players guess "jellyfish" but the creator intended "octopus," jellyfish becomes the popular answer. This creates fascinating moments where collective interpretation differs from the creator's intent.

### 3. **User-Generated Content**
Any Reddit user can create a challenge post from the subreddit menu. Simply provide:
- A geometric description (e.g., "A circle with eight lines extending outward")
- Your intended answer (stored securely, revealed after guessing)

This makes every post unique and community-created.

### 4. **Live Leaderboard Visualization**
After guessing, players see a dynamic leaderboard showing:
- **Top 10 guesses** ranked by popularity with vote counts and percentages
- **Your guess highlighted** with an orange badge if it made the top 10
- **Creator's answer** shown separately below the leaderboard
- **Similar guesses grouped** together (85%+ similarity) with variants displayed
- **Auto-refresh** every 5 seconds to show updated results as more players join

### 5. **Intelligent Guess Grouping**
The system automatically groups similar guesses together using string similarity algorithms:
- "jellyfish" and "jelly fish" are combined
- "octopus" and "octopuss" are merged
- Variants are shown below the primary guess

This prevents vote splitting and shows true consensus.

### 6. **Reddit-Native Experience**
Built specifically for Reddit using Devvit Web:
- Runs directly in Reddit posts - no external websites or apps
- Automatic Reddit authentication - your username is recognized
- Seamless integration with Reddit's UI and navigation
- Mobile-responsive design optimized for Reddit's mobile app

### 7. **One Guess Per Player**
Each player gets exactly one guess per post, making every submission count. The system tracks who has guessed using Redis to prevent duplicate submissions, creating a fair and engaging experience where your first instinct matters.

### 8. **Real-Time Social Discovery**
Watch the leaderboard evolve in real-time as more players submit guesses. See consensus emerge, discover creative interpretations, and find out if you thought like the majority or had a unique perspective.

## ✨ Core Features

### User-Generated Content
- **Create Custom Challenges**: Any Reddit user can create a geometric description challenge from the subreddit menu
- **Two Required Fields**: 
  - Geometric description (e.g., "Two circles connected by a rectangle")
  - Your intended answer (stored securely in Redis, not visible until after guessing)
- **Automatic Post Creation**: System creates a Reddit post with your description and a "🎮 Guess Now" button

### Guessing Experience
- **One Guess Per Player**: Each player gets exactly one guess per post (enforced via Redis tracking)
- **Simple Input**: Clean text input field with validation (non-empty, max 100 characters)
- **Immediate Feedback**: After submitting, instantly redirected to the leaderboard view
- **No Repeat Guessing**: System prevents duplicate submissions with clear error messages

### Live Leaderboard
- **Top 10 Display**: Shows the most popular guesses ranked by count
- **Vote Counts & Percentages**: Each guess shows how many players chose it and what percentage
- **Your Guess Highlighted**: Orange badge marks your answer if it appears in the top 10
- **Creator's Answer Shown**: Displayed separately below the leaderboard (not given special treatment in rankings)
- **Similar Guess Grouping**: Automatically combines similar spellings (85%+ similarity) with variants shown
- **Auto-Refresh**: Updates every 5 seconds to show new results as more players join
- **Manual Refresh**: Button to update results on demand
- **Total Stats**: Shows total player count and total guess count

### Consensus Scoring
- **High Consensus** (>20% of players): High points for matching the majority
- **Medium Consensus** (5-20% of players): Medium points for common answers
- **Low Consensus** (<5% of players): Low points for uncommon guesses
- **Unique** (only you): Minimal points for creative but rare answers
- **Match Percentage**: Shows what percentage of players guessed the same as you

### Technical Features
- **Redis Data Persistence**: All game data stored reliably with post ID as session identifier
- **Guess Aggregation**: Real-time counting and grouping of player guesses
- **Mobile-Responsive Design**: Optimized for both desktop and mobile Reddit users
- **Touch-Friendly Controls**: Minimum 44px touch targets for easy mobile interaction
- **Error Handling**: Clear error messages with retry buttons for network failures
- **Full Accessibility**: ARIA labels, keyboard navigation, screen reader support

## 📖 How to Play

### For Players

#### Step 1: Find or Create a Challenge

**Option A: Play an Existing Challenge**
1. Find a Guessmetry post on Reddit (look for posts with "🎨 Guess the Shape:" in the title)
2. Click the **"Launch App"** button in the post
3. The game opens in full-screen mode within Reddit

**Option B: Create Your Own Challenge**
1. Go to any subreddit where Guessmetry is installed
2. Click the subreddit menu (three dots)
3. Select **"Create Geometric Challenge"**
4. A new post will be created (currently creates a default post)
5. **Note**: Custom prompt form is temporarily disabled. The menu action creates a default post for testing.
6. To create custom prompts, visit `/form/create-challenge` directly in your browser after the app is running

#### Step 2: Read the Description

When you open a challenge post:
- The geometric description is displayed prominently with a 📐 icon
- Read it carefully and visualize the shapes in your mind
- Think about what everyday object could match this description
- You have unlimited time to think before submitting

#### Step 3: Submit Your Guess

- Type your answer in the input field (e.g., "dumbbell", "barbell", "weights")
- The input validates:
  - Must not be empty
  - Maximum 100 characters
  - Automatically trims whitespace
- Click **"Submit Guess"** or press **Enter**
- You get **one guess per post** - make it count!
- If you try to guess again, you'll see an error: "You have already guessed on this post"

#### Step 4: View the Leaderboard

After submitting your guess, you're immediately redirected to the results view showing:

**Top 10 Leaderboard**
- The most popular guesses ranked by count
- Each entry shows:
  - The guess text
  - Number of players who guessed it
  - Percentage of total players
  - Rank position (1-10)
- **Your guess is highlighted** with an orange badge if it appears in the top 10
- **Similar guesses are grouped** together (85%+ similarity) with variants shown below

**Creator's Answer**
- Displayed separately below the leaderboard in a green box
- Shows what the creator intended (may or may not match the top guess!)
- Not given special treatment in the rankings - only appears in top 10 if enough people guessed it

**Your Score**
- Shows points earned based on consensus
- Displays match percentage (what % of players guessed the same as you)
- Updates as more players join

**Stats**
- Total players who have guessed
- Total number of guesses submitted

**Auto-Refresh**
- Leaderboard updates every 5 seconds automatically
- Manual refresh button available to update on demand
- Watch rankings shift as more players participate!

### For Developers

#### Setup and Development

1. **Prerequisites**: Make sure you have Node.js 22.2.0 or higher installed
2. **Installation**: Clone this repository and run `npm install`
3. **Development**: Run `npm run dev` to start the development server
4. **Testing**: Open the playtest URL provided in your terminal (e.g., `https://www.reddit.com/r/your-subreddit?playtest=guessmetry`)
5. **Building**: Run `npm run build` to create production builds
6. **Deployment**: Run `npm run deploy` to upload to Reddit, then `npm run launch` to publish

---

### Game Flow Details

**Creating a Challenge:**

1. User clicks subreddit menu → "Create Geometric Challenge"
2. Browser opens GET `/internal/menu/post-create-with-form` (returns HTML form)
3. User fills in:
   - **Description** (textarea, required): Geometric description
   - **Answer** (text input, required, max 50 chars): Intended answer
4. JavaScript POSTs form data to same endpoint
5. Server creates Reddit post via `createPost()` function
6. Server stores prompt in Redis via `storeCustomPrompt()`
7. Post title: "🎨 Guess the Shape: [first 60 chars of description]"
8. Post displays splash screen with "🎮 Guess Now" button

**Playing a Challenge:**

1. Player clicks "Launch App" on post
2. Client fetches `/api/init` to get:
   - Post ID
   - Username
   - Custom prompt data (description, hasGuessed status)
3. **If hasGuessed === false**: Show PromptView component
   - Display geometric description with 📐 icon
   - Show input field for guess
   - Validate: non-empty, max 100 chars
   - On submit: POST to `/api/prompt/submit-guess`
4. **If hasGuessed === true**: Show ResultsView component
   - Fetch results via POST `/api/prompt/get-results`
   - Display top 10 leaderboard
   - Auto-refresh every 5 seconds

**Viewing Results:**

The ResultsView component displays:
- **Top 10 Guesses**: Ranked by count with animated bars
  - Bar width = (count / maxCount) × 100%
  - Shows guess text, count, percentage
  - Player's guess highlighted with orange ring
  - Similar guesses grouped (85%+ similarity) with variants shown
- **Creator's Answer**: Shown separately in green box below leaderboard
- **Player Score**: Points earned and match percentage
- **Stats**: Total players and total guesses
- **Refresh**: Auto-refresh every 5s + manual refresh button

**Data Flow:**

```
User Input → Server
  ↓
normalizeGuess(guess) → lowercase, trim
  ↓
storeGuess(redis, 0, normalizedGuess, postId)
addPlayerToSet(redis, 0, username, postId)
storePlayerGuess(redis, 0, username, normalizedGuess, postId)
markUserAsGuessed(redis, postId, username)
  ↓
Redis Keys Updated:
- {postId}:guesses → Hash (guess → count)
- {postId}:players → Sorted Set (unique usernames)
- {postId}:player:{username}:guess → String (player's guess)
- {postId}:player:{username}:guessed → Flag ("1")
```

## 💡 Tips for Success

### Strategy Tips

1. **Visualize carefully**: Picture the shapes in your mind - imagine how they connect and what they form
2. **Think like the crowd**: What would most people guess first? The obvious answer is often the most popular
3. **Trust your instincts**: First thoughts are often what others think too - don't overthink it
4. **Simple is better**: Common, everyday objects tend to be more popular than creative interpretations
5. **One guess counts**: You only get one submission per post, so make it count!
6. **Watch the leaderboard**: See what becomes popular to calibrate your thinking for future challenges
7. **Learn from results**: Pay attention to which answers get grouped together to understand how others think

### Creating Great Challenges

1. **Be clear but not obvious**: Good descriptions are specific enough to visualize but open to interpretation
2. **Use common shapes**: Circles, squares, triangles, rectangles are easier to visualize than complex polygons
3. **Think about orientation**: "On top of", "next to", "inside" help players visualize the arrangement
4. **Test your description**: Can you visualize it yourself? Would others see the same thing?
5. **Expect surprises**: The community might interpret your description differently than you intended - that's part of the fun!

### General Tips

- **Keyboard shortcuts**: Press Enter to submit your guess quickly
- **Mobile-friendly**: The game works great on phones - perfect for playing on the go
- **Accessibility**: Full keyboard navigation and screen reader support available
- **Auto-refresh**: Leaderboard updates every 5 seconds - watch consensus emerge in real-time
- **Manual refresh**: Click the refresh button to update results on demand

### Accessibility Features

- **Keyboard navigation**: Tab to navigate, Enter to submit
- **Screen reader support**: ARIA labels for all interactive elements
- **Reduced motion**: Respects user preferences for reduced motion
- **High contrast**: Colors meet WCAG AA standards (4.5:1 minimum)
- **Touch targets**: Minimum 44x44px on mobile devices for easy tapping
- **Focus indicators**: Clear 2px orange outline on focused elements

### Game Architecture

**State Management:**

The App component uses React's useState hook for simple state management:

- **App State**: Current view state ('loading' | 'prompt' | 'results' | 'error' | 'no-prompt')
- **Custom Prompt**: Object containing description and hasGuessed status
- **Post ID**: Reddit post identifier
- **Results Data**: Leaderboard data including aggregation, player guess, creator answer, scores
- **Error**: Error message if something goes wrong

**Component Hierarchy:**

```
App (Root)
├── Loading State (appState === 'loading')
│   └── Spinner with "Loading..." message
├── Error State (appState === 'error' | 'no-prompt')
│   └── Error message with retry button
├── PromptView (appState === 'prompt')
│   ├── Header: "Geometric Pictionary"
│   ├── Description box with 📐 icon
│   ├── Input field (auto-focus, max 100 chars)
│   ├── Submit button (disabled when empty)
│   └── Validation error display
└── ResultsView (appState === 'results')
    ├── Header: "Top Guesses"
    ├── Top 10 Leaderboard
    │   ├── Animated bars (width based on count)
    │   ├── Player guess highlighted (orange ring)
    │   └── Variants shown below grouped guesses
    ├── Stats: Total players • Total guesses
    ├── Creator's Answer (green box)
    ├── Player Score (blue box)
    │   ├── Your guess
    │   ├── Points earned
    │   └── Match percentage
    └── Refresh button (manual + auto every 5s)
```

**API Communication:**

The client communicates with the Express server through RESTful API endpoints:

1. **GET /api/init**: Initialize with user context (username, postId, customPrompt data)
2. **POST /api/prompt/submit-guess**: Submit player's guess, store in Redis
3. **POST /api/prompt/get-results**: Fetch leaderboard data (top 10, player guess, scores)

All API calls use standard `fetch()` with JSON payloads and handle errors gracefully with try-catch blocks.

### Technology Stack

- **[Devvit Web 0.12.1](https://developers.reddit.com/)**: Reddit's developer platform for building apps that run in posts
- **[React 19.1.0](https://react.dev/)**: UI framework with hooks for state management (useState, useEffect, useCallback)
- **[Vite 6.2.4](https://vite.dev/)**: Fast build tool and development server with hot module replacement (HMR)
- **[Express 5.1.0](https://expressjs.com/)**: Backend API server running in serverless environment
- **[Redis](https://redis.io/)**: Data persistence for prompts, guesses, and player tracking (via @devvit/web/server)
  - Operations: SET, GET, HSET, HGETALL, HINCRBY, ZADD, ZCARD, EXPIRE
- **[Tailwind CSS 4.1.6](https://tailwindcss.com/)**: Utility-first styling with mobile-first responsive design
- **[TypeScript 5.7.3](https://www.typescriptlang.org/)**: Type-safe development with strict mode enabled
- **[Vitest](https://vitest.dev/)**: Unit testing framework with React Testing Library integration
- **[ESLint](https://eslint.org/)**: Code quality and consistency checking
- **[Prettier](https://prettier.io/)**: Code formatting

### Development Commands

- `npm run dev`: Start development server with live reload on Reddit
- `npm run build`: Build client and server for production
- `npm run deploy`: Upload new version to Reddit
- `npm run launch`: Publish app for Reddit review
- `npm run check`: Run type checking, linting, and formatting
- `npm test`: Run test suite with Vitest

### Project Structure

```
src/
├── client/                    # React frontend (runs in browser)
│   ├── components/            # UI components
│   │   ├── PromptView.tsx     # Guess input view (description + input field)
│   │   └── ResultsView.tsx    # Leaderboard view (top 10 + stats)
│   ├── App.tsx                # Main app component (state machine)
│   ├── main.tsx               # Entry point
│   ├── index.html             # HTML template
│   └── index.css              # Tailwind CSS styles
├── server/                    # Express backend (serverless)
│   ├── index.ts               # Main server with API routes
│   ├── core/                  # Business logic
│   │   └── post.ts            # Post creation functionality
│   ├── services/              # Redis services
│   │   ├── promptStorage.ts   # Store/retrieve custom prompts
│   │   ├── guessTracking.ts   # Track who has guessed
│   │   └── redisAggregation.ts # Aggregate guess counts
│   ├── utils/                 # Utility functions
│   │   ├── guessNormalization.ts # Normalize guess text
│   │   ├── stringSimilarity.ts   # Calculate similarity
│   │   ├── consensusScoring.ts   # Calculate consensus tiers
│   │   └── retryLogic.ts         # Redis retry logic
│   └── __tests__/             # Server tests
│       ├── error-handling.test.ts
│       └── e2e-flow.test.ts
└── shared/                    # Shared types
    └── types/
        ├── api.ts             # API response types
        └── game.ts            # Game data types```

### Redis Data Structure

**Custom Prompt Storage:**
```
prompt:{postId}:description → String (geometric description)
prompt:{postId}:answer → String (creator's answer)
prompt:{postId}:creator → String (username)
```

**Guess Tracking:**
```
{postId}:player:{username}:guessed → "1" (flag)
{postId}:player:{username}:guess → String (normalized guess)
```

**Guess Aggregation:**
```
{postId}:guesses → Hash (guess → count)
{postId}:players → Sorted Set (unique usernames)
```

**Example:**
```
prompt:abc123:description → "Two circles connected by a rectangle"
prompt:abc123:answer → "dumbbell"
abc123:player:user1:guessed → "1"
abc123:player:user1:guess → "dumbbell"
abc123:guesses → {"dumbbell": 5, "barbell": 3, "weights": 1}
abc123:players → {"user1", "user2", "user3", ...}
```

### Current Development Status

**Phase 1 - Core Gameplay (Complete) ✅**

This phase implements the complete user-generated challenge flow:

**Backend Infrastructure:**
- ✅ Express server with Devvit Web integration
- ✅ GET /api/init endpoint (user context initialization)
- ✅ POST /api/prompt/submit-guess endpoint (guess submission and storage)
- ✅ POST /api/prompt/get-results endpoint (leaderboard data retrieval)
- ✅ GET/POST /internal/menu/post-create-with-form (challenge creation form)
- ✅ Redis data persistence with atomic operations
- ✅ String similarity algorithm using Levenshtein distance (85% threshold for grouping)
- ✅ Guess normalization (lowercase, trim whitespace)
- ✅ Consensus scoring algorithm with tier calculation
- ✅ Error handling with retry logic for Redis operations

**Frontend Components:**
- ✅ App.tsx root component with state machine (loading → prompt → results)
- ✅ PromptView component with description display and guess input
- ✅ ResultsView component with top 10 leaderboard and auto-refresh
- ✅ Input validation (non-empty, max 100 chars)
- ✅ Auto-focus on input field
- ✅ Keyboard support (Enter to submit)
- ✅ Loading and error states

**Data Features:**
- ✅ One guess per player enforcement
- ✅ Real-time guess aggregation
- ✅ Similar guess grouping (85%+ similarity)
- ✅ Variant display for grouped guesses
- ✅ Player guess highlighting
- ✅ Creator answer display
- ✅ Total stats (players, guesses)

**Styling & UX:**
- ✅ Mobile-responsive design with Tailwind CSS
- ✅ Reddit-inspired color scheme (orange #FF4500)
- ✅ Smooth animations and transitions
- ✅ Touch targets at least 44x44px on mobile
- ✅ Auto-refresh every 5 seconds
- ✅ Manual refresh button

**Accessibility:**
- ✅ ARIA labels for screen readers
- ✅ Keyboard navigation (Tab, Enter)
- ✅ Focus indicators
- ✅ High contrast colors
- ✅ Semantic HTML

**Testing:**
- ✅ Unit tests for utilities (normalization, similarity, scoring)
- ✅ Integration tests for Redis operations
- ✅ End-to-end flow tests
- ✅ Error handling tests
- ✅ Test coverage using Vitest

**Ready for Deployment:**
- ✅ All core features implemented and tested
- ✅ Mobile-responsive and accessible
- ✅ Error handling and retry logic in place
- ✅ Documentation complete

---

## 🚀 Getting Started

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/guessmetry.git
cd guessmetry

# Install dependencies
npm install

# Start development server
npm run dev
```

### Development

The `npm run dev` command starts:
1. Devvit playtest server
2. Client development server with hot reload
3. Server build watcher

Open the playtest URL in your browser (e.g., `https://www.reddit.com/r/your-subreddit?playtest=guessmetry`)

### Deployment

```bash
# Build for production
npm run build

# Deploy to Reddit
npm run deploy

# Publish for review (required for subreddits >200 members)
npm run launch
```

---

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 🙏 Acknowledgments

- Built with [Devvit](https://developers.reddit.com/) - Reddit's developer platform
- Inspired by classic Pictionary and community-driven games like r/place
- Uses [Levenshtein distance](https://en.wikipedia.org/wiki/Levenshtein_distance) for intelligent guess grouping

---

## 📧 Contact

For questions, suggestions, or bug reports, please open an issue on GitHub.

**Play Guessmetry on Reddit today and see if you can think like the crowd!** 🎨🎮
