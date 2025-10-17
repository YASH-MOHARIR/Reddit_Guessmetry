# Requirements Document

## Introduction

Geometric Pictionary is a Reddit-based guessing game where users create challenges by describing objects using geometric shapes, and other players guess what the description represents. After guessing, players see a leaderboard showing the most popular answers ranked by count.

This Phase 1 focuses on the core game loop: post creation, guessing, and leaderboard display.

## Requirements

### Requirement 1: Post Creation

**User Story:** As a Reddit user, I want to create a geometric description challenge post so that other users can guess what I'm describing.

#### Acceptance Criteria

1. WHEN a user accesses the subreddit menu THEN they SHALL see a "Create Geometric Challenge" option available to all users (not just moderators)
2. WHEN a user clicks "Create Geometric Challenge" THEN the system SHALL display a form with two required fields: "Geometric Description" and "Answer"
3. WHEN a user submits the form with valid data THEN the system SHALL create a Reddit post with the description stored in Redis
4. WHEN a user submits the form with valid data THEN the system SHALL store the answer securely in Redis (not visible to players until after they guess)
5. WHEN the post is created THEN the system SHALL display an engaging splash screen with a "🎮 Guess Now" button
6. WHEN the post is created THEN the title SHALL include "🎨 Guess the Shape:" followed by a preview of the description (max 60 characters)

### Requirement 2: Viewing and Guessing

**User Story:** As a player, I want to read the geometric description and submit my guess so that I can participate in the challenge.

#### Acceptance Criteria

1. WHEN a player opens a challenge post THEN they SHALL see the full geometric description prominently displayed
2. WHEN a player has not yet guessed THEN they SHALL see an input field to enter their guess
3. WHEN a player submits a guess THEN the system SHALL validate that the guess is not empty
4. WHEN a player submits a valid guess THEN the system SHALL store the guess in Redis with the player's username
5. WHEN a player submits a guess THEN the system SHALL mark the player as having guessed (one guess per player per post)
6. WHEN a player tries to guess a second time THEN the system SHALL prevent the submission and show an error message
7. WHEN a player submits a guess THEN the system SHALL immediately redirect them to the leaderboard view

### Requirement 3: Leaderboard Display

**User Story:** As a player who has guessed, I want to see how my guess compares to others so that I can see if I thought similarly to the community.

#### Acceptance Criteria

1. WHEN a player views the leaderboard THEN they SHALL see the top 10 guesses ranked by count (number of players who guessed it)
2. WHEN displaying the leaderboard THEN each guess SHALL show the guess text, count, and percentage of total players
3. WHEN displaying the leaderboard THEN guesses SHALL be sorted by count in descending order
4. WHEN displaying the leaderboard THEN the player's guess SHALL be highlighted with an orange badge if it appears in the top 10
5. WHEN displaying the leaderboard THEN the creator's answer SHALL be shown separately below the top 10 list
6. WHEN displaying the leaderboard THEN the creator's answer SHALL NOT receive special treatment in the rankings (only appears in top 10 if enough people guessed it)
7. WHEN displaying the leaderboard THEN similar guesses (85%+ string similarity) SHALL be grouped together with variants shown
8. WHEN displaying the leaderboard THEN the system SHALL show total player count and total guess count
9. WHEN a player is on the leaderboard THEN the system SHALL auto-refresh the data every 5 seconds to show updated results
10. WHEN a player is on the leaderboard THEN they SHALL see a manual refresh button to update results on demand

### Requirement 4: Scoring System

**User Story:** As a player, I want to earn points based on how popular my guess was so that I can see how well I aligned with the community consensus.

#### Acceptance Criteria

1. WHEN a player's guess matches many other players (>20%) THEN they SHALL earn high consensus points
2. WHEN a player's guess matches some other players (5-20%) THEN they SHALL earn medium consensus points
3. WHEN a player's guess matches few other players (<5%) THEN they SHALL earn low consensus points
4. WHEN a player's guess is unique THEN they SHALL earn minimal points
5. WHEN displaying the player's score THEN the system SHALL show points earned and the percentage of players who guessed the same

### Requirement 5: Data Persistence

**User Story:** As a system, I need to store game data reliably so that players can view results even after leaving and returning to the post.

#### Acceptance Criteria

1. WHEN a post is created THEN the description and answer SHALL be stored in Redis with the post ID as the key
2. WHEN a player submits a guess THEN the guess SHALL be stored in Redis with aggregation by guess text
3. WHEN a player submits a guess THEN the player SHALL be added to a unique players set in Redis
4. WHEN a player submits a guess THEN the player's specific guess SHALL be stored for retrieval when viewing results
5. WHEN storing data in Redis THEN the system SHALL use the post ID as the session identifier for custom prompts
6. WHEN a player has already guessed THEN the system SHALL retrieve their guess status from Redis on page load

### Requirement 6: Mobile Responsiveness

**User Story:** As a mobile user, I want the game to work smoothly on my phone so that I can play anywhere.

#### Acceptance Criteria

1. WHEN viewing on mobile THEN the form SHALL be fully responsive and easy to use
2. WHEN viewing on mobile THEN the description SHALL be readable without horizontal scrolling
3. WHEN viewing on mobile THEN the leaderboard SHALL display properly with touch-friendly controls
4. WHEN viewing on mobile THEN all buttons SHALL be large enough for easy tapping (minimum 44px touch target)

### Requirement 7: Error Handling

**User Story:** As a user, I want clear error messages when something goes wrong so that I know what to do next.

#### Acceptance Criteria

1. WHEN the post creation fails THEN the system SHALL display a user-friendly error message
2. WHEN a player tries to guess without entering text THEN the system SHALL show a validation error
3. WHEN a player tries to guess twice THEN the system SHALL show "You have already guessed on this post"
4. WHEN the leaderboard fails to load THEN the system SHALL show a retry button
5. WHEN Redis operations fail THEN the system SHALL log errors and show a graceful fallback message
