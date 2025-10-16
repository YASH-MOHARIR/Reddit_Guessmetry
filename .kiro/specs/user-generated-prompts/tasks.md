# Implementation Plan

- [x] 1. Add custom post form to Devvit configuration

  - Add form definition to `devvit.json` with description and answer fields
  - Configure form to trigger on post creation
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 2. Create prompt storage service

  - Create `src/server/services/promptStorage.ts`
  - Implement `storeCustomPrompt()` to save prompt data to Redis
  - Implement `getCustomPrompt()` to retrieve prompt data from Redis
  - _Requirements: 1.5_

- [x] 3. Update post creation to handle custom prompts


  - Modify `src/server/core/post.ts` to accept form data
  - Store description and answer in Redis using prompt storage service
  - Create Reddit post with custom app embedded

  - _Requirements: 1.4, 1.5, 1.6_

- [x] 4. Implement guess tracking



  - Add functions to mark user as having guessed (Redis key: `post:${postId}:player:${username}:guessed`)
  - Add function to check if user has already guessed
  - _Requirements: 2.5, 6.1, 6.2, 6.3_

- [x] 5. Create guess submission API endpoint



  - Create `/api/prompt/submit-guess` endpoint in `src/server/index.ts`
  - Accept postId and guess from request
  - Check if user already guessed (prevent duplicates)
  - Normalize and store guess using existing aggregation service
  - Mark user as having guessed
  - _Requirements: 2.3, 2.4, 2.5_

- [x] 6. Create results retrieval API endpoint



  - Create `/api/prompt/get-results` endpoint in `src/server/index.ts`
  - Fetch custom prompt from Redis
  - Reuse existing aggregation logic to get top 10 guesses
  - Calculate player score using existing consensus scoring
  - Return aggregated results with creator's answer
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8_

- [x] 7. Update initialization API



  - Modify `/api/init` endpoint to fetch custom prompt for the post
  - Check if current user has already guessed
  - Return prompt description and guess status
  - Update `InitResponse` type in `src/shared/types/api.ts`
  - _Requirements: 2.1, 6.1_

- [x] 8. Create PromptView component



  - Create `src/client/components/PromptView.tsx`
  - Display custom geometric description
  - Render guess input field and submit button
  - Handle guess submission
  - _Requirements: 2.1, 2.2, 2.3_

- [x] 9. Create ResultsView component



  - Create `src/client/components/ResultsView.tsx`
  - Display top 10 guesses with horizontal bars (like Jellyfish example)
  - Show guess text, count, and percentage
  - Highlight player's guess and creator's answer
  - Show total players and guesses count
  - Display player's score
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

- [x] 10. Simplify App.tsx for single-round gameplay



  - Remove timer components and display phase
  - Remove mode selection (classic vs consensus)
  - Remove next round button and multi-round logic
  - Update to fetch custom prompt on init
  - Show PromptView if user hasn't guessed
  - Show ResultsView if user already guessed
  - _Requirements: 2.1, 6.1, 6.2, 6.3, 7.1, 7.2, 7.3_

- [x] 11. Update shared types



  - Update `src/shared/types/api.ts` with new API types
  - Update `src/shared/types/game.ts` to remove timer-related types
  - Add CustomPrompt type
  - _Requirements: All API-related requirements_

- [x] 12. Remove obsolete code


  - Remove timer components (`Timer.tsx`, `useTimer.ts`)
  - Remove mode selection from HomeScreen
  - Remove predefined prompts list (`src/server/data/prompts.ts`)
  - Remove session-based scoring logic
  - _Requirements: 7.1, 7.2, 7.3_
