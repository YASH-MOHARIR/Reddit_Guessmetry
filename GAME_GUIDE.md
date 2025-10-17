# Geometric Pictionary - Game Guide

## Overview

Geometric Pictionary is a Reddit game where players describe objects using geometric shapes and others guess what they're describing. After guessing, players see a leaderboard showing the most popular answers.

## How It Works

### Phase 1: Creating a Challenge (Any User)

1. **Access the Form**: Any user clicks on the subreddit menu and selects "Create Geometric Challenge"
2. **Fill in the Details**:
   - **Description**: Write a geometric description (e.g., "A big rectangle with a right angle triangle on top with its longer side as base")
   - **Answer**: Provide the answer (e.g., "house")
3. **Create Post**: The system creates a new post with your challenge

### Phase 2: Players Guess

1. **View the Challenge**: Players see the post in their Reddit feed with an engaging splash screen
2. **Click to Play**: Players click the "🎮 Guess Now" button to open the game
3. **Read the Description**: The geometric description is displayed prominently
4. **Submit Guess**: Players enter their guess in the input field and submit

### Phase 3: View Leaderboard

After submitting a guess, players immediately see:

- **Top 10 Guesses**: The most popular answers ranked by count and percentage
- **Their Guess**: Highlighted with an orange badge if it appears in the top 10
- **Creator's Answer**: Shown separately below the leaderboard (not specially marked in the top 10)
- **Player Stats**: Total players and total guesses
- **Score**: Points earned based on how popular their guess was

### Leaderboard Rules

- Guesses are ranked **purely by count** (how many people guessed it)
- If 10 people guessed "A", 9 guessed "B", and you guessed "C", then:
  - Rank 1: A (10 votes)
  - Rank 2: B (9 votes)
  - Rank 3: C (1 vote) ← Your guess
- The creator's answer gets **no special treatment** - it only appears in the top 10 if enough people guessed it
- Similar guesses (85%+ similarity) are grouped together

### Scoring System

Players earn points based on how many others guessed the same thing:

- **High Consensus** (>20% of players): More points for popular guesses
- **Medium Consensus** (5-20%): Moderate points
- **Low Consensus** (<5%): Fewer points
- **Unique Guess**: Minimal points for one-of-a-kind answers

### Real-Time Updates

The leaderboard auto-refreshes every 5 seconds, so players can watch as more people submit guesses and the rankings change.

## Example Challenges

### Easy Examples
- **Description**: "Two circles connected by a rectangle"
  - **Answer**: dumbbell

- **Description**: "A circle with triangular slices removed"
  - **Answer**: pizza

### Medium Examples
- **Description**: "A big rectangle with a right angle triangle on top"
  - **Answer**: house

- **Description**: "Three rectangles forming a U shape"
  - **Answer**: goal post

### Hard Examples
- **Description**: "A large circle with a smaller circle inside, connected by lines radiating from the center"
  - **Answer**: wheel

- **Description**: "Two triangles meeting at their points, forming an hourglass"
  - **Answer**: hourglass

## Tips for Creating Good Challenges

1. **Be Clear**: Use precise geometric terms (rectangle, triangle, circle, etc.)
2. **Be Specific**: Mention sizes (big, small), positions (on top, inside, connected)
3. **Be Fair**: Make sure the description actually matches the answer
4. **Test It**: Think about whether players could reasonably guess your answer
5. **Have Fun**: Creative descriptions make the game more engaging!

## Technical Details

- **One Guess Per Player**: Each player can only guess once per challenge
- **Anonymous Voting**: Guesses are aggregated anonymously
- **Similar Answers Grouped**: Answers with 85%+ similarity are grouped together
- **Persistent Data**: Results are stored and can be viewed later
- **Mobile-Friendly**: Works great on both desktop and mobile devices

## Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Deploy to Reddit
npm run deploy
```

## Architecture

- **Client**: React app with Tailwind CSS for the UI
- **Server**: Express.js backend with Redis for data storage
- **Platform**: Devvit Web (Reddit's developer platform)
