# Implementation Plan

## Core Functionality (Phase 1A)

- [x] 1. Verify post creation form works

  - Check GET `/internal/menu/post-create-with-form` returns HTML form
  - Verify POST endpoint creates post and stores in Redis
  - Test form submission creates post successfully
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 2. Fix client initialization

  - Verify `/api/init` endpoint returns correct data
  - Ensure `hasGuessed` status is checked properly
  - Fix state machine to show prompt or results based on status
  - _Requirements: 2.1, 5.6_

- [x] 3. Verify guess submission works

  - Check `/api/prompt/submit-guess` stores guess in Redis
  - Ensure one guess per user is enforced
  - Verify guess is normalized and stored correctly


  - _Requirements: 2.3, 2.4, 2.5, 2.6_

- [x] 4. Fix results endpoint

  - Verify `/api/prompt/get-results` fetches data from Redis
  - Ensure top 10 guesses are sorted by count
  - Check player's guess is returned
  - _Requirements: 3.1, 3.2, 3.3_

- [ ] 5. Update ResultsView to match requirements


  - Remove special highlighting for creator's answer in top 10
  - Show creator's answer separately below leaderboard
  - Ensure player's guess is highlighted with orange
  - Display stats (total players, total guesses)
  - _Requirements: 3.4, 3.5, 3.6, 3.8_

- [x] 6. Test complete flow end-to-end


  - Create post from menu
  - Open post and submit guess
  - Verify leaderboard shows correctly
  - Test with second user to verify aggregation
  - _Requirements: All_

## Polish & Optimization (Phase 1B - After Flow Confirmed)

- [x] 7. Add auto-refresh to leaderboard



  - Implement 5-second auto-refresh
  - Add manual refresh button
  - _Requirements: 3.9, 3.10_

- [x] 8. Improve error handling



  - Add client-side error messages
  - Improve server error responses
  - Add retry logic for Redis failures
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 9. Optimize mobile experience

  - Test on mobile devices
  - Adjust spacing and font sizes
  - Ensure touch targets are large enough
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [ ] 10. Add scoring display
  - Show points earned based on consensus
  - Display match percentage
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_
