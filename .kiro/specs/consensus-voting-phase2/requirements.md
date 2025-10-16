# Requirements Document

## Introduction

Consensus Voting Phase 2 transforms Geometric Pictionary from a creator-answer model to a crowd-consensus model inspired by r/place's voting visualization. Instead of matching a pre-defined answer, players earn points based on how well their guess aligns with what the majority of other players guessed. This creates emergent "correct" answers determined by the community rather than a single authority, making the game more social, viral, and Reddit-native.

The system aggregates all player guesses in real-time, displays them as a live poll with percentage bars (like your screenshot), and awards points based on popularity rather than correctness. Even if the original prompt creator said "house," if 85% of players say "jellyfish," that becomes the culturally correct answer.

## Requirements

### Requirement 1: Guess Aggregation System

**User Story:** As a game developer, I want to aggregate all player guesses for each prompt in real-time, so that I can display consensus results and calculate crowd-based scores.

#### Acceptance Criteria

1. WHEN a player submits a guess THEN the system SHALL store it in Redis with the prompt ID and increment the count for that specific guess text
2. WHEN storing guesses THEN the system SHALL normalize guess text (lowercase, trim whitespace) to group similar answers
3. WHEN multiple players submit the same guess THEN the system SHALL increment a counter rather than storing duplicate entries
4. WHEN aggregating guesses THEN the system SHALL track total number of unique players who guessed
5. WHEN aggregating guesses THEN the system SHALL track total number of guesses submitted (may exceed player count if players guess multiple times)
6. WHEN a guess is stored THEN the system SHALL associate it with the player's username to track individual guesses

### Requirement 2: Results Display with Poll Visualization

**User Story:** As a player, I want to see how my guess compares to what everyone else guessed, so that I can understand the crowd consensus and see if I matched popular opinion.

#### Acceptance Criteria

1. WHEN the results phase begins THEN the system SHALL display the top 10 most popular guesses sorted by count (descending)
2. WHEN displaying each guess THEN the system SHALL show the guess text, count of players who guessed it, and percentage of total players
3. WHEN displaying guesses THEN the system SHALL render horizontal percentage bars (like a bar chart) showing relative popularity
4. WHEN the player's guess appears in the top 10 THEN the system SHALL highlight it with a distinct color or border
5. WHEN the creator's intended answer appears in the top 10 THEN the system SHALL mark it with a special indicator (e.g., gold border or star icon)
6. WHEN displaying results THEN the system SHALL show total players and total guesses at the bottom
7. WHEN results are displayed THEN the system SHALL use a pixel or retro font for Reddit nostalgia aesthetic
8. WHEN percentage bars are rendered THEN they SHALL be visually proportional to the percentage value

### Requirement 3: Consensus-Based Scoring System

**User Story:** As a player, I want to earn points based on matching popular guesses rather than a single correct answer, so that I'm rewarded for thinking like the crowd.

#### Acceptance Criteria

1. WHEN a player's guess matches the majority answer (≥50% of players) THEN the system SHALL award 100 points
2. WHEN a player's guess matches a common answer (≥20% but <50%) THEN the system SHALL award 50 points
3. WHEN a player's guess matches an uncommon answer (≥5% but <20%) THEN the system SHALL award 25 points
4. WHEN a player's guess matches a rare answer (≥1% but <5%) THEN the system SHALL award 10 points
5. WHEN a player's guess is unique or matches <1% THEN the system SHALL award 0 points
6. WHEN calculating scores THEN the system SHALL use exact string match after normalization (case-insensitive, trimmed)
7. WHEN a player's guess is close to a popular answer (Levenshtein distance ≥70%) THEN the system SHALL award 5 bonus points
8. WHEN displaying score THEN the system SHALL show a message like "You matched 85% of players!" to emphasize consensus

### Requirement 4: Real-Time Guess Aggregation in Redis

**User Story:** As a game developer, I want to efficiently store and retrieve guess aggregations using Redis, so that the system can handle multiple concurrent players without performance issues.

#### Acceptance Criteria

1. WHEN a prompt is active THEN the system SHALL create a Redis hash with key `prompt:{promptId}:guesses` storing guess text as fields and counts as values
2. WHEN a guess is submitted THEN the system SHALL use HINCRBY to atomically increment the count for that guess
3. WHEN storing player-specific data THEN the system SHALL create a Redis set `prompt:{promptId}:players` to track unique players
4. WHEN a player submits a guess THEN the system SHALL add their username to the players set using SADD
5. WHEN calculating results THEN the system SHALL use HGETALL to retrieve all guesses and counts efficiently
6. WHEN a prompt expires THEN the system SHALL set a TTL of 24 hours on prompt-related keys to prevent memory bloat
7. WHEN retrieving aggregated data THEN the system SHALL calculate percentages based on total unique players (SCARD of players set)

### Requirement 5: Live Results Update Flow

**User Story:** As a player, I want to see the results update in real-time as more players submit guesses, so that I can watch the consensus emerge dynamically.

#### Acceptance Criteria

1. WHEN the results phase begins THEN the system SHALL fetch the latest aggregated guess data from Redis
2. WHEN displaying results THEN the system SHALL poll the server every 2 seconds to get updated aggregation data
3. WHEN new guesses are submitted by other players THEN the system SHALL update the displayed percentages and counts
4. WHEN the top 10 changes THEN the system SHALL animate the transition (guesses moving up/down in ranking)
5. WHEN polling for updates THEN the system SHALL only fetch data during the results phase (not during display or guess phases)
6. WHEN the results phase ends THEN the system SHALL stop polling to conserve resources

### Requirement 6: Creator's Intended Answer Tracking

**User Story:** As a player, I want to see what the original creator intended as the answer, so that I can compare it to the crowd consensus and see if the crowd agreed or diverged.

#### Acceptance Criteria

1. WHEN a prompt is created THEN the system SHALL store the creator's intended answer in the prompt data
2. WHEN displaying results THEN the system SHALL mark the creator's intended answer with a special visual indicator (gold border, star, or "Creator's Answer" label)
3. WHEN the creator's answer is not in the top 10 THEN the system SHALL still display it separately below the top 10 with its count and percentage
4. WHEN the creator's answer matches the majority guess THEN the system SHALL show a message like "The crowd agreed with the creator!"
5. WHEN the creator's answer differs significantly from the majority THEN the system SHALL show a message like "The crowd had other ideas!"

### Requirement 7: Multiplayer Session Management

**User Story:** As a player, I want to participate in the same prompt session as other players, so that my guess contributes to the collective results.

#### Acceptance Criteria

1. WHEN a prompt is displayed THEN the system SHALL assign it a unique prompt session ID
2. WHEN multiple players view the same prompt THEN they SHALL all contribute to the same aggregation data
3. WHEN a player submits a guess THEN it SHALL be associated with the current prompt session
4. WHEN a prompt session ends THEN the system SHALL preserve the aggregation data for 24 hours for historical viewing
5. WHEN a new round begins THEN the system SHALL create a new prompt session with fresh aggregation data

### Requirement 8: Transition from Phase 1 to Phase 2

**User Story:** As a player, I want the game to seamlessly transition from the basic guessing mode to the consensus voting mode, so that I can experience both gameplay styles.

#### Acceptance Criteria

1. WHEN Phase 1 is complete THEN the system SHALL display a "Try Consensus Mode" button
2. WHEN the player clicks the consensus mode button THEN the system SHALL switch to Phase 2 gameplay
3. WHEN in Phase 2 THEN the system SHALL use the same prompts but aggregate guesses across all players
4. WHEN switching modes THEN the system SHALL preserve the player's session score separately for each mode
5. WHEN displaying the home screen THEN the system SHALL offer both "Classic Mode" and "Consensus Mode" options

### Requirement 9: Viral Moment Highlighting

**User Story:** As a player, I want to see when funny or unexpected answers become the top guess, so that I can share and enjoy viral moments.

#### Acceptance Criteria

1. WHEN a guess that differs significantly from the creator's answer becomes the majority THEN the system SHALL display a "Viral Moment!" badge
2. WHEN displaying viral moments THEN the system SHALL show the percentage difference between the creator's answer and the top guess
3. WHEN a viral moment occurs THEN the system SHALL provide a "Share" button to share the result on Reddit
4. WHEN the top guess is humorous or unexpected THEN the system SHALL highlight it with special styling (e.g., animated border, emoji)

### Requirement 10: Guess Similarity Grouping

**User Story:** As a game developer, I want to group similar guesses together, so that minor spelling variations don't fragment the consensus.

#### Acceptance Criteria

1. WHEN aggregating guesses THEN the system SHALL check for similar guesses using Levenshtein distance (≥85% similarity)
2. WHEN similar guesses are found THEN the system SHALL group them under the most common spelling variant
3. WHEN displaying grouped guesses THEN the system SHALL show the primary variant with a note like "includes 'jelly fish', 'jely fish'"
4. WHEN calculating percentages THEN the system SHALL use the combined count of all grouped variants
5. WHEN a player's guess matches a grouped variant THEN they SHALL receive points based on the combined percentage

### Requirement 11: Historical Results Viewing

**User Story:** As a player, I want to view past prompt results even after the session ends, so that I can see how the consensus evolved over time.

#### Acceptance Criteria

1. WHEN a prompt session ends THEN the system SHALL preserve the final aggregation data in Redis with a 24-hour TTL
2. WHEN a player requests historical results THEN the system SHALL display the final top 10 guesses with percentages
3. WHEN viewing historical results THEN the system SHALL show the total number of players who participated
4. WHEN viewing historical results THEN the system SHALL indicate that the data is historical (e.g., "Final Results - 1,234 players")
5. WHEN historical data expires THEN the system SHALL display a message indicating results are no longer available

### Requirement 12: Mobile Responsiveness for Poll Display

**User Story:** As a mobile player, I want the poll results to display clearly on my phone screen, so that I can easily read the guesses and percentages.

#### Acceptance Criteria

1. WHEN displaying results on mobile (<768px) THEN the system SHALL stack guess bars vertically with full width
2. WHEN displaying guess text on mobile THEN the system SHALL truncate long guesses with ellipsis if they exceed screen width
3. WHEN displaying percentages on mobile THEN the system SHALL show them prominently next to each guess
4. WHEN displaying the top 10 on mobile THEN the system SHALL ensure all entries are visible without horizontal scrolling
5. WHEN touch targets are displayed on mobile THEN they SHALL be at least 44x44px for accessibility

### Requirement 13: Error Handling for Aggregation Failures

**User Story:** As a player, I want the game to handle aggregation errors gracefully, so that my experience isn't disrupted if Redis fails.

#### Acceptance Criteria

1. WHEN Redis fails to store a guess THEN the system SHALL log the error and return a fallback response
2. WHEN aggregation data cannot be retrieved THEN the system SHALL display a message like "Results temporarily unavailable"
3. WHEN a player's guess fails to submit THEN the system SHALL retry once before showing an error
4. WHEN displaying results with incomplete data THEN the system SHALL show available data with a note about missing entries
5. WHEN Redis is unavailable THEN the system SHALL allow the game to continue in Phase 1 mode (single-player) as a fallback
