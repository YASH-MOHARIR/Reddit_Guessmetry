# Implementation Plan

- [x] 1. Create shared types for consensus voting system

  - Define GuessAggregation, ConsensusScore, ConsensusScoreTier types in src/shared/types/game.ts
  - Define ConsensusGuessSubmittedResponse and ConsensusResultsResponse in src/shared/types/api.ts
  - Ensure types match the design document specifications
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 2. Implement Redis aggregation utilities

  - [x] 2.1 Create guess normalization utility function

    - Write normalizeGuess function that lowercases and trims whitespace
    - Add unit tests for normalization edge cases (extra spaces, mixed case, special characters)
    - _Requirements: 1.2_

  - [x] 2.2 Create Redis aggregation service module

    - Write storeGuess function using HINCRBY for atomic increment
    - Write addPlayerToSet function using SADD for unique player tracking
    - Write storePlayerGuess function to save individual player's guess
    - Write getAggregatedGuesses function using HGETALL to fetch all guesses
    - Write getTotalPlayers function using SCARD to count unique players
    - Set 24-hour TTL on all prompt-related keys
    - Add error handling with try-catch for all Redis operations
    - Write unit tests for each Redis operation
    - _Requirements: 1.1, 1.3, 1.4, 1.5, 1.6, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 13.1, 13.2_

- [ ] 3. Implement consensus scoring algorithm

  - [x] 3.1 Create scoring calculation utility

    - Write calculateConsensusTier function that determines tier based on percentage thresholds
    - Implement exact match logic for player guess in aggregation
    - Implement Levenshtein distance check for close matches (≥70% similarity)
    - Return ConsensusScore object with pointsEarned, matchPercentage, and tier
    - Write unit tests for all tier thresholds (majority, common, uncommon, rare, unique)
    - Write unit tests for close match bonus points
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 10.1, 10.2, 10.4, 10.5_

- [x] 4. Create server API endpoint for submitting consensus guesses

  - [x] 4.1 Implement POST /api/consensus/submit-guess endpoint

    - Validate request body (promptId, guess, sessionId)
    - Get username from Reddit API context
    - Call normalizeGuess utility on submitted guess
    - Call storeGuess to increment guess count in Redis
    - Call addPlayerToSet to add username to players set
    - Call storePlayerGuess to save player's specific guess
    - Return ConsensusGuessSubmittedResponse with success status
    - Add error handling for Redis failures with retry logic
    - Write integration tests for the endpoint
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 4.1, 4.2, 4.3, 4.4, 4.6, 13.1, 13.3_

- [x] 5. Create server API endpoint for fetching consensus results

  - [x] 5.1 Implement POST /api/consensus/get-results endpoint

    - Validate request body (promptId, username)
    - Call getAggregatedGuesses to fetch all guesses from Redis
    - Call getTotalPlayers to get unique player count
    - Calculate percentage for each guess based on total players
    - Sort guesses by count descending and take top 10
    - Fetch player's specific guess from Redis
    - Fetch creator's intended answer from prompts data
    - Call calculateConsensusTier to compute player's score
    - Mark which guess is the creator's answer in aggregation array
    - Mark which guess is the player's guess in aggregation array
    - Return ConsensusResultsResponse with all aggregated data

    - Add error handling for missing data scenarios
    - Write integration tests for the endpoint
    - _Requirements: 2.1, 2.2, 2.3, 2.6, 3.6, 3.8, 4.5, 4.7, 5.1, 6.1, 6.2, 6.3, 13.2, 13.4_

- [x] 6. Create GuessAggregationBar component

  - [x] 6.1 Implement GuessAggregationBar.tsx component
    - Accept props: guess, count, percentage, isPlayerGuess, isCreatorAnswer, rank
    - Render rank number, guess text, count, and percentage
    - Render horizontal bar with width proportional to percentage
    - Apply orange border (2px solid #FF4500) if isPlayerGuess is true
    - Apply gold border (2px solid #FFD700) and star icon if isCreatorAnswer is true
    - Apply color coding based on percentage (green ≥50%, blue 20-49%, yellow 5-19%, gray <5%)
    - Animate bar width from 0 to percentage over 500ms with ease-out
    - Use Tailwind CSS for styling
    - Write unit tests for rendering with different prop combinations
    - _Requirements: 2.2, 2.3, 2.4, 2.5, 2.8, 6.2_

- [x] 7. Create PollResultsDisplay component

  - [x] 7.1 Implement PollResultsDisplay.tsx component
    - Accept props: promptId, playerGuess, creatorAnswer, timeRemaining, onComplete
    - Fetch initial aggregation data on mount by calling /api/consensus/get-results
    - Render top 10 GuessAggregationBar components sorted by count
    - Display total players and total guesses at bottom
    - Show loading state while fetching data
    - Show error message if fetch fails with retry button
    - Handle empty aggregation case with "Be the first to guess!" message
    - Auto-call onComplete when timeRemaining reaches 0
    - Use Tailwind CSS for layout (vertical stack, centered, max-width 800px)
    - Write unit tests for rendering and data fetching
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 5.1, 13.2, 13.3_

- [x] 8. Create useConsensusPolling custom hook

  - [x] 8.1 Implement useConsensusPolling.ts hook
    - Accept parameters: promptId, enabled, interval (default 2000ms)
    - Use setInterval to poll /api/consensus/get-results every interval milliseconds
    - Only poll when enabled is true
    - Return aggregation, totalPlayers, totalGuesses, loading, error
    - Clean up interval on unmount or when enabled becomes false
    - Implement error handling: stop polling after 3 consecutive failures
    - Track consecutive failure count and reset on success
    - Write unit tests for polling behavior and cleanup
    - _Requirements: 5.2, 5.3, 5.4, 5.5, 5.6, 13.1_

- [x] 9. Integrate real-time polling into PollResultsDisplay

  - [x] 9.1 Add useConsensusPolling hook to PollResultsDisplay
    - Call useConsensusPolling with promptId and enabled=true
    - Update displayed aggregation data when polling returns new data
    - Animate rank changes when guesses move up/down (300ms slide transition)
    - Animate percentage updates with count-up effect (300ms)
    - Show warning message if polling fails 3 times: "Live updates paused"
    - Provide "Retry" button to resume polling after failures
    - Stop polling when timeRemaining reaches 0
    - Write integration tests for live update behavior
    - _Requirements: 5.2, 5.3, 5.4, 5.5, 5.6, 13.1_

- [x] 10. Create ConsensusScoreDisplay component

  - [x] 10.1 Implement ConsensusScoreDisplay.tsx component
    - Accept props: pointsEarned, matchPercentage, tier, totalScore
    - Display tier badge with appropriate emoji and text (🏆 MAJORITY, 🥈 COMMON, etc.)
    - Display points earned with count-up animation from 0 to pointsEarned (500ms)
    - Display match percentage message: "You matched X% of players!"
    - Display total score with count-up animation (300ms)
    - Implement animation sequence: badge fade-in (200ms) → points count-up → percentage fade-in → total score count-up
    - Use Tailwind CSS for centered layout and styling
    - Write unit tests for rendering with different tier values
    - _Requirements: 3.8_

- [x] 11. Integrate ConsensusScoreDisplay into PollResultsDisplay

  - [x] 11.1 Add ConsensusScoreDisplay to PollResultsDisplay
    - Extract playerScore from /api/consensus/get-results response
    - Pass pointsEarned, matchPercentage, tier, totalScore as props to ConsensusScoreDisplay
    - Position ConsensusScoreDisplay below the poll results
    - Ensure animation sequence plays after poll results are displayed
    - Write integration tests for score display with poll results
    - _Requirements: 3.8_

- [x] 12. Add mode selection to home screen

  - [x] 12.1 Update HomeScreen component with mode selection
    - Add "Classic Mode" button that starts Phase 1 gameplay
    - Add "Consensus Mode" button that starts Phase 2 gameplay
    - Pass mode selection to GameScreen component via props or state
    - Update styling to clearly differentiate the two modes
    - Write unit tests for mode selection buttons
    - _Requirements: 8.1, 8.2, 8.5_

- [x] 13. Update GameScreen to support consensus mode

  - [x] 13.1 Modify GameScreen component for mode switching
    - Accept mode prop ('classic' | 'consensus')
    - Conditionally render ResultsDisplay (classic) or PollResultsDisplay (consensus)
    - Use /api/consensus/submit-guess endpoint when in consensus mode
    - Use /api/submit-guess endpoint when in classic mode
    - Extend results phase timer to 15 seconds in consensus mode (keep 10s in classic)
    - Maintain separate session scores for each mode
    - Write unit tests for mode-specific rendering and API calls
    - _Requirements: 8.2, 8.3, 8.4_

- [x] 14. Add creator's answer display when not in top 10

  - [x] 14.1 Implement creator answer fallback display
    - Check if creator's answer is in top 10 aggregation
    - If not in top 10, fetch creator's answer count and percentage from Redis
    - Display creator's answer separately below top 10 with label "Creator's Answer"
    - Show count and percentage for creator's answer
    - Apply gold border styling consistent with top 10 display
    - Write unit tests for creator answer fallback rendering
    - _Requirements: 6.3_

- [x] 15. Add consensus vs creator comparison messages

  - [x] 15.1 Implement comparison messaging
    - Check if creator's answer matches the majority guess (rank 1)
    - If match, display message: "The crowd agreed with the creator!"
    - If no match, display message: "The crowd had other ideas!"
    - Show percentage difference between creator's answer and top guess
    - Position message prominently near creator's answer indicator
    - Write unit tests for message display logic
    - _Requirements: 6.4, 6.5_

- [x] 16. Implement mobile responsiveness for poll display

  - [x] 16.1 Add mobile-specific styling to PollResultsDisplay
    - Use Tailwind responsive classes to stack bars vertically on mobile (<768px)
    - Set guess bars to full width on mobile
    - Truncate long guess text with ellipsis on mobile
    - Ensure percentages are prominently displayed next to each guess
    - Verify no horizontal scrolling on mobile screens
    - Ensure touch targets are at least 44x44px for buttons
    - Test on various mobile screen sizes (320px, 375px, 414px)
    - Write responsive design tests
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

- [x] 17. Add error handling for aggregation failures

  - [x] 17.1 Implement graceful degradation for Redis failures
    - Add fallback message in PollResultsDisplay: "Results temporarily unavailable"
    - Display available data with note about missing entries when partial data exists
    - Implement retry logic in submit-guess endpoint (retry once before error)
    - Add fallback to Phase 1 mode if Redis is completely unavailable
    - Log all Redis errors with context for debugging
    - Write tests for error scenarios and fallback behavior
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5_

- [x] 18. Implement guess similarity grouping

  - [x] 18.1 Add similarity grouping to aggregation logic
    - Modify getAggregatedGuesses to check for similar guesses using Levenshtein distance (≥85%)
    - Group similar guesses under the most common spelling variant
    - Track grouped variants and display note like "includes 'jelly fish', 'jely fish'"
    - Calculate combined count for grouped variants
    - Use combined percentage for scoring calculations
    - Write unit tests for similarity grouping with various spelling variations
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [x] 19. Add session management for multiplayer prompts

  - [x] 19.1 Implement prompt session tracking
    - Generate unique prompt session ID when prompt is displayed
    - Store session ID in Redis with prompt data
    - Ensure all players viewing the same prompt contribute to same session
    - Preserve aggregation data for 24 hours after session ends
    - Create new session with fresh aggregation for each new round
    - Write tests for session isolation and data persistence
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 20. Add historical results viewing capability

  - [x] 20.1 Implement historical results endpoint
    - Create GET /api/consensus/historical-results/:promptId endpoint
    - Fetch preserved aggregation data from Redis
    - Return final top 10 guesses with percentages
    - Include total players who participated
    - Add "Final Results" indicator in response
    - Handle expired data case with appropriate message
    - Write tests for historical data retrieval
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_
  - [x] 20.2 Add historical results UI component
    - Create HistoricalResultsDisplay component
    - Display "Final Results - X players" header
    - Reuse GuessAggregationBar components for display
    - Show message when historical data is no longer available
    - Add link to view historical results from leaderboard or home screen
    - Write tests for historical results display
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

- [ ] 21. Implement viral moment detection and highlighting

  - [ ] 21.1 Add viral moment detection logic
    - Check if top guess differs significantly from creator's answer (>30% difference)
    - Display "Viral Moment!" badge when condition is met
    - Show percentage difference between creator's answer and top guess
    - Add special styling for viral moments (animated border, emoji)
    - Calculate viral moment score in get-results endpoint
    - Write tests for viral moment detection
    - _Requirements: 9.1, 9.2, 9.4_
  - [ ] 21.2 Add share functionality for viral moments
    - Add "Share" button that appears during viral moments
    - Generate shareable text with prompt, top guess, and percentage
    - Integrate with Reddit sharing API to post to subreddit
    - Handle share success/failure with appropriate messages
    - Write tests for share functionality
    - _Requirements: 9.3_

- [ ] 22. Add comprehensive integration tests

  - [ ] 22.1 Write end-to-end tests for consensus mode
    - Test complete flow: mode selection → display → guess → results → next round
    - Test multiple players submitting guesses to same prompt
    - Test real-time polling updates with simulated concurrent players
    - Test scoring calculation with various guess distributions
    - Test error handling and fallback scenarios
    - Test mobile responsiveness on different screen sizes
    - _Requirements: All requirements_

- [ ] 23. Update documentation and README
  - [ ] 23.1 Document consensus voting feature
    - Add section to README explaining consensus mode gameplay
    - Document new API endpoints with request/response examples
    - Add architecture diagram showing consensus mode data flow
    - Document Redis schema for aggregation keys
    - Add troubleshooting guide for common issues
    - _Requirements: All requirements_
