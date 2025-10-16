# Implementation Plan

- [x] 1. Set up shared types and data structures

  - Create TypeScript type definitions for Prompt, GameState, and API responses in shared/types
  - Create prompts data file with at least 20 pre-written geometric prompts
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [-] 2. Implement server utilities and helper functions

  - [x] 2.1 Create string similarity utility with Levenshtein distance algorithm
    - Write calculateSimilarity function that returns percentage match (0-100)
    - Write tests for various string comparisons (exact, close, different)
    - _Requirements: 5.6_
  - [x] 2.2 Create prompt selection utility

    - Write selectNextPrompt function that fetches unused prompts from Redis
    - Implement random selection from available prompts
    - Handle case when all prompts are exhausted
    - Write tests for prompt selection logic
    - _Requirements: 1.1, 12.4, 12.5_

  - [x] 2.3 Create session ID generation utility

    - Write generateSessionId function using postId, username, and timestamp
    - Ensure uniqueness with random component
    - Write tests for ID generation
    - _Requirements: 2.1_

- [x] 3. Implement server API endpoints

  - [x] 3.1 Update /api/init endpoint
    - Modify existing endpoint to return username from Reddit API
    - Add error handling for missing postId
    - Write tests for init endpoint
    - _Requirements: 8.1, 12.1_
  - [x] 3.2 Create /api/game/start endpoint
    - Implement POST endpoint to initialize game session
    - Generate sessionId and store in Redis with TTL
    - Initialize session score and used prompts set in Redis
    - Return sessionId and username to client
    - Write tests for session initialization
    - _Requirements: 2.1, 8.3_
  - [x] 3.3 Create /api/game/next-prompt endpoint
    - Implement POST endpoint to fetch next unused prompt
    - Use promptSelector utility to get random unused prompt
    - Return prompt without answer field to client
    - Handle case when no prompts available
    - Write tests for prompt fetching
    - _Requirements: 1.1, 2.2, 3.1, 12.4, 12.5_
  - [x] 3.4 Create /api/game/submit-guess endpoint
    - Implement POST endpoint to validate guess and calculate score
    - Normalize guess (lowercase, trim) and check against answer and alternativeAnswers
    - Use string similarity utility for close match detection (≥70% threshold)
    - Award points: 10 (correct), 5 (close), 0 (incorrect)
    - Update session score in Redis
    - Return result with correct answer, points earned, and total score
    - Write tests for guess validation and scoring
    - _Requirements: 4.3, 5.1, 5.2, 5.3, 5.4, 5.6, 6.4_

- [x] 4. Create client custom hooks

  - [x] 4.1 Implement useTimer hook
    - Create countdown timer with duration parameter
    - Return timeRemaining, progress percentage, and control functions
    - Implement start, pause, reset functions
    - Call onComplete callback when timer reaches 0
    - Handle cleanup on unmount
    - Write tests for timer functionality
    - _Requirements: 2.3, 9.1, 9.2, 9.3, 9.4, 9.5_
  - [x] 4.2 Implement useGame hook
    - Create game state using useReducer with GameState type
    - Define actions: START_GAME, LOAD_PROMPT, START_DISPLAY_PHASE, START_GUESS_PHASE, SUBMIT_GUESS, START_RESULTS_PHASE, NEXT_ROUND, SET_ERROR
    - Implement reducer function handling all state transitions
    - Create action creators for each action type
    - Implement API call functions (startGame, fetchNextPrompt, submitGuess)
    - Handle loading states and errors
    - Write tests for reducer and state transitions
    - _Requirements: 2.1, 2.2, 2.5, 2.6, 12.1, 12.2, 12.3_

- [x] 5. Implement core UI components

  - [x] 5.1 Create Timer component
    - Display numeric countdown showing seconds remaining
    - Show progress bar or circular indicator
    - Change color/animate when time < 5 seconds (urgent state)
    - Accept duration, onComplete, and variant props
    - Use useTimer hook for countdown logic
    - Apply Tailwind styling per design specs
    - Write tests for timer rendering and urgency state
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 11.3_
  - [x] 5.2 Create PromptDisplay component
    - Display promptText in large, readable font (2rem)
    - Show Timer component for 5-second display phase
    - Implement fade-in entrance animation
    - Ensure mobile responsiveness (readable on small screens)
    - Apply Tailwind styling per design specs
    - Write tests for prompt rendering
    - _Requirements: 3.1, 3.2, 3.3, 10.2, 10.3, 11.1_
  - [x] 5.3 Create GuessInput component
    - Display text input field with focus on mount
    - Show Timer component for 20-second guess phase
    - Handle Enter key to submit guess
    - Display Submit button
    - Disable input after submission
    - Validate input (max 100 characters)
    - Apply Tailwind styling per design specs (16px font for mobile)
    - Write tests for input handling and submission
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 10.3, 10.4, 12.3_
  - [x] 5.4 Create ResultsDisplay component
    - Display correct answer prominently
    - Show player's guess and result (correct/close/incorrect)
    - Display points earned with color coding (green/yellow/red)
    - Show updated total score with count-up animation
    - Show Timer component for 10-second results phase
    - Implement results reveal animations
    - Apply Tailwind styling per design specs
    - Write tests for results rendering and animations
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 11.2_
  - [x] 5.5 Create Leaderboard component
    - Display current session score
    - Show rounds completed count
    - Display rank (always 1 for Phase 1 single-player)
    - Implement score change animation
    - Position as persistent UI element
    - Apply Tailwind styling per design specs
    - Write tests for leaderboard rendering
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [x] 6. Implement screen components

  - [x] 6.1 Create HomeScreen component
    - Display game title "Guessmetry"
    - Show brief instructions (3-4 sentences explaining gameplay)
    - Display "Play" button with Reddit orange styling
    - Show personalized greeting with username if available
    - Implement Reddit-inspired design (white/orange color scheme)
    - Ensure mobile responsiveness
    - Apply Tailwind styling per design specs
    - Write tests for home screen rendering
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 10.1, 10.2_
  - [x] 6.2 Create GameScreen component
    - Manage phase transitions (display → guess → results)
    - Render PromptDisplay during display phase
    - Render GuessInput during guess phase
    - Render ResultsDisplay during results phase
    - Display Leaderboard persistently
    - Handle phase timing with useTimer hook
    - Implement phase transition animations
    - Apply Tailwind styling per design specs
    - Write tests for phase transitions
    - _Requirements: 2.2, 2.3, 2.4, 11.1, 11.3_

- [x] 7. Update App component and integrate game flow

  - Replace counter demo with game implementation
  - Use useGame hook for state management
  - Route between HomeScreen and GameScreen based on game phase
  - Handle game initialization on mount (call /api/init)
  - Implement error boundary for error handling
  - Display loading state while initializing
  - Display error screen with retry button on errors
  - Apply Tailwind styling per design specs
  - Write tests for app routing and error handling
  - _Requirements: 2.1, 8.1, 12.1, 12.2_

- [x] 8. Implement mobile responsiveness and accessibility

  - [x] 8.1 Add responsive breakpoints and mobile styles
    - Implement mobile (<768px), tablet (768-1024px), and desktop (>1024px) breakpoints
    - Adjust layout to single-column on mobile
    - Ensure all text is at least 16px on mobile
    - Ensure touch targets are at least 44x44px
    - Test on various screen sizes
    - _Requirements: 10.1, 10.2, 10.3, 10.4_
  - [x] 8.2 Add accessibility features
    - Add ARIA labels to all interactive elements
    - Implement keyboard navigation (Tab, Enter)
    - Add focus indicators (2px orange outline)
    - Ensure color contrast meets WCAG AA (4.5:1)
    - Implement prefers-reduced-motion support
    - Add screen reader announcements for phase changes
    - Test with keyboard-only navigation
    - _Requirements: 11.5_

- [x] 9. Polish animations and transitions

  - Implement fade + scale animations for phase transitions (300ms)
  - Add bounce animation for correct answer reveal
  - Implement count-up animation for score updates
  - Add pulse animation for timer urgency (<5s)
  - Implement button hover and active states
  - Ensure animations respect prefers-reduced-motion
  - Test animation performance on mobile devices
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

- [x] 10. End-to-end testing and bug fixes
  - Test complete game flow from home to multiple rounds
  - Verify all 20+ prompts appear without duplicates in session
  - Test edge cases (empty guess, special characters, rapid clicking)
  - Test browser refresh behavior
  - Test network error handling
  - Test prompt exhaustion scenario
  - Fix any bugs discovered during testing
  - Verify mobile responsiveness on real devices
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6_
