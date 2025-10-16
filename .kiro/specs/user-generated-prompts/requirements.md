# Requirements Document

## Introduction

This document outlines the requirements for transforming Guessmetry into a user-generated prompt game where post creators define custom geometric description challenges, and players submit guesses to see crowd consensus results. The game focuses on collective intelligence rather than speed, showing players the most popular guesses and rewarding both correctness and alignment with the crowd.

## Requirements

### Requirement 1: Post Creation with Custom Prompts

**User Story:** As a post creator, I want to create a post with a custom geometric description and answer, so that players can guess what I'm describing.

#### Acceptance Criteria

1. WHEN a user clicks "Create Post" in the subreddit THEN the system SHALL display a Devvit custom post form
2. WHEN the form is displayed THEN the system SHALL show a "Description" field accepting text input up to 500 characters
3. WHEN the form is displayed THEN the system SHALL show an "Answer" field accepting text input up to 100 characters
4. WHEN the user submits the form THEN the system SHALL validate that both description and answer are provided
5. WHEN validation passes THEN the system SHALL create a Reddit post with the custom app embedded
6. WHEN the post is created THEN the system SHALL store the prompt and answer in Redis associated with the post ID
7. WHEN the post appears in the feed THEN the system SHALL display a custom splash screen with "Play" button

### Requirement 2: Player Guess Submission

**User Story:** As a player, I want to see the geometric description and submit my guess, so that I can participate in the challenge.

#### Acceptance Criteria

1. WHEN a player opens a post THEN the system SHALL display the custom geometric description
2. WHEN the player has not yet guessed THEN the system SHALL display a "Guess" button and input field
3. WHEN the player enters a guess THEN the system SHALL accept text input up to 100 characters
4. WHEN the player submits their guess THEN the system SHALL store the guess in Redis with the player's username and timestamp
5. WHEN the guess is submitted THEN the system SHALL prevent the player from submitting additional guesses for this post
6. WHEN the guess is submitted THEN the system SHALL immediately show the results view

### Requirement 3: Top Guesses Display

**User Story:** As a player, I want to see the top 10 guesses by count after submitting my guess, so that I can see what the crowd thinks.

#### Acceptance Criteria

1. WHEN a player submits a guess THEN the system SHALL aggregate all guesses for the post
2. WHEN aggregating guesses THEN the system SHALL normalize similar guesses (case-insensitive, trim whitespace)
3. WHEN aggregating guesses THEN the system SHALL group guesses with high string similarity (>80%)
4. WHEN displaying results THEN the system SHALL show the top 10 unique guesses sorted by count descending
5. WHEN displaying each guess THEN the system SHALL show the guess text, count, and percentage of total guesses
6. WHEN displaying results THEN the system SHALL highlight the correct answer if it appears in the top 10
7. WHEN displaying results THEN the system SHALL show total player count and total guess count
8. WHEN displaying results THEN the system SHALL update in real-time as new players submit guesses

### Requirement 4: Player Scoring

**User Story:** As a player, I want to earn points based on my guess accuracy and alignment with the crowd, so that I can compete on the leaderboard.

#### Acceptance Criteria

1. WHEN a player's guess matches the correct answer exactly THEN the system SHALL award 100 points
2. WHEN a player's guess is similar to the correct answer (>80% similarity) THEN the system SHALL award 75 points
3. WHEN a player's guess matches a top 3 popular guess THEN the system SHALL award bonus points (50 for #1, 30 for #2, 20 for #3)
4. WHEN a player's guess matches a top 10 popular guess THEN the system SHALL award 10 bonus points
5. WHEN calculating score THEN the system SHALL combine correctness points and consensus points
6. WHEN displaying score THEN the system SHALL show the breakdown of points earned
7. WHEN score is calculated THEN the system SHALL update the global leaderboard

### Requirement 5: Leaderboard

**User Story:** As a player, I want to see the top players across all posts, so that I can see how I rank.

#### Acceptance Criteria

1. WHEN a player views the leaderboard THEN the system SHALL display the top 10 players by total score
2. WHEN displaying leaderboard THEN the system SHALL show username, total score, and number of guesses
3. WHEN a player's score changes THEN the system SHALL update the leaderboard in real-time
4. WHEN displaying leaderboard THEN the system SHALL highlight the current player's position
5. WHEN the current player is not in top 10 THEN the system SHALL show their rank below the top 10

### Requirement 6: Results Persistence

**User Story:** As a player, I want to return to a post and see the results even if I already guessed, so that I can check updated crowd consensus.

#### Acceptance Criteria

1. WHEN a player returns to a post they already guessed THEN the system SHALL display the results view
2. WHEN displaying results THEN the system SHALL show the player's original guess highlighted
3. WHEN displaying results THEN the system SHALL show updated aggregated data
4. WHEN displaying results THEN the system SHALL not allow the player to change their guess

### Requirement 7: No Timer

**User Story:** As a player, I want to take my time thinking about my guess without time pressure, so that I can make thoughtful submissions.

#### Acceptance Criteria

1. WHEN a player is viewing the prompt THEN the system SHALL NOT display a countdown timer
2. WHEN a player is entering a guess THEN the system SHALL NOT impose any time limit
3. WHEN displaying results THEN the system SHALL NOT show time-based metrics

### Requirement 8: Mobile-Friendly Interface

**User Story:** As a mobile user, I want the interface to work well on my phone, so that I can play comfortably.

#### Acceptance Criteria

1. WHEN viewing on mobile THEN the system SHALL display a responsive layout
2. WHEN entering text THEN the system SHALL provide appropriately sized input fields
3. WHEN viewing results THEN the system SHALL display readable text and bars on small screens
4. WHEN interacting with buttons THEN the system SHALL provide touch-friendly tap targets
