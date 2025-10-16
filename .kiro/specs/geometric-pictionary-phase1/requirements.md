# Requirements Document

## Introduction

Geometric Pictionary is a multiplayer browser-based guessing game for Reddit where players guess objects based on geometric shape descriptions. Phase 1 focuses on building the core prompt creation and guessing system without the drawing component, targeting 3-5 minute casual gameplay sessions on the Reddit platform using Devvit Web.

The game will feature pre-written prompts describing geometric arrangements (e.g., "a circle on top of a rectangle" = "tree"), a timed guessing system, scoring mechanics, and session-based leaderboards. This phase establishes the foundation for future multiplayer synchronization and user-generated content.

## Requirements

### Requirement 1: Prompt Data Management

**User Story:** As a game developer, I want a structured prompt database with geometric descriptions and answers, so that the game has diverse content for players to guess.

#### Acceptance Criteria

1. WHEN the application initializes THEN the system SHALL load a collection of at least 20 pre-written prompts from a data source
2. WHEN a prompt is stored THEN it SHALL include the following fields: id (unique identifier), promptText (geometric description), answer (correct answer), alternativeAnswers (array of acceptable variations), difficulty (easy/medium/hard), and category (everyday/animals/reddit/abstract)
3. IF a prompt includes alternative answers THEN the system SHALL accept any of them as correct during guess validation
4. WHEN prompts are categorized THEN they SHALL be organized into at least four categories: everyday, animals, reddit, and abstract

### Requirement 2: Game Flow State Management

**User Story:** As a player, I want the game to progress through clear phases with appropriate timing, so that I have a structured and engaging gameplay experience.

#### Acceptance Criteria

1. WHEN a game session starts THEN the system SHALL initialize with a 'waiting' phase
2. WHEN the game begins THEN the system SHALL cycle through phases in this order: displaying prompt (5 seconds), guessing (20 seconds), showing results (10 seconds), then next round
3. WHEN each phase begins THEN the system SHALL display a visual timer showing remaining time
4. WHEN a phase timer expires THEN the system SHALL automatically transition to the next phase
5. IF a player submits a guess during the guessing phase THEN the system SHALL accept and store the guess
6. WHEN the results phase ends THEN the system SHALL load the next prompt and restart the cycle

### Requirement 3: Prompt Display Interface

**User Story:** As a player, I want to clearly see the geometric description prompt, so that I can understand what I need to guess.

#### Acceptance Criteria

1. WHEN the displaying phase begins THEN the system SHALL show the promptText in large, readable text
2. WHEN a prompt is displayed THEN the text SHALL be clearly visible on both desktop and mobile screens
3. WHEN the prompt is shown THEN the system SHALL display a countdown timer for the 5-second display phase
4. WHEN the display phase is active THEN the system SHALL NOT show any input fields or guess options

### Requirement 4: Guess Input System

**User Story:** As a player, I want to submit my guess for what the geometric description represents, so that I can participate in the game and earn points.

#### Acceptance Criteria

1. WHEN the guessing phase begins THEN the system SHALL display a text input field for the player's guess
2. WHEN a player types in the input field THEN the system SHALL accept alphanumeric characters
3. WHEN a player submits a guess THEN the system SHALL validate it against the correct answer and alternative answers (case-insensitive)
4. WHEN the guessing timer expires THEN the system SHALL automatically submit the current guess or mark it as no answer
5. IF the player presses Enter or clicks a Submit button THEN the system SHALL immediately submit the guess
6. WHEN a guess is submitted THEN the system SHALL store it for scoring and results display

### Requirement 5: Scoring System

**User Story:** As a player, I want to earn points for correct guesses, so that I can track my performance and compete on the leaderboard.

#### Acceptance Criteria

1. WHEN a player submits a correct answer THEN the system SHALL award 10 points
2. WHEN a player submits a partially correct answer (close match) THEN the system SHALL award 5 points
3. WHEN a player submits an incorrect answer or no answer THEN the system SHALL award 0 points
4. WHEN points are awarded THEN the system SHALL update the player's session score
5. WHEN a game session is active THEN the system SHALL persist the player's score across multiple rounds
6. WHEN calculating close matches THEN the system SHALL use string similarity (e.g., Levenshtein distance) with a threshold of 70% similarity

### Requirement 6: Results Display

**User Story:** As a player, I want to see the correct answer and my performance after each round, so that I can learn and track my progress.

#### Acceptance Criteria

1. WHEN the results phase begins THEN the system SHALL display the correct answer prominently
2. WHEN results are shown THEN the system SHALL indicate whether the player's guess was correct, close, or incorrect
3. WHEN results are displayed THEN the system SHALL show the points earned for that round
4. WHEN results are shown THEN the system SHALL display the player's current total score
5. WHEN the results phase is active THEN the system SHALL show a countdown timer for the 10-second results phase
6. WHEN the results timer expires THEN the system SHALL transition to the next round

### Requirement 7: Session Leaderboard

**User Story:** As a player, I want to see my ranking and score during the session, so that I can gauge my performance.

#### Acceptance Criteria

1. WHEN a game session is active THEN the system SHALL display a leaderboard showing the player's current score
2. WHEN the leaderboard is displayed THEN it SHALL show the player's rank (for single-player Phase 1, this is rank 1)
3. WHEN the leaderboard updates THEN it SHALL reflect score changes after each round
4. WHEN the session ends THEN the system SHALL display final scores and rankings
5. IF the player refreshes or leaves THEN the session score SHALL reset (no persistence across browser sessions in Phase 1)

### Requirement 8: Home Screen and Navigation

**User Story:** As a player, I want a clear entry point to start the game and understand how to play, so that I can quickly begin playing.

#### Acceptance Criteria

1. WHEN the application loads THEN the system SHALL display a home screen with a "Play" button
2. WHEN the home screen is displayed THEN it SHALL show brief instructions on how to play
3. WHEN the player clicks the "Play" button THEN the system SHALL start a new game session
4. WHEN instructions are shown THEN they SHALL explain the game concept, timing, and scoring in 3-4 sentences
5. WHEN the home screen is displayed THEN it SHALL use Reddit-inspired design (white/orange color scheme)

### Requirement 9: Visual Timer Component

**User Story:** As a player, I want to see how much time remains in each phase, so that I can manage my time effectively.

#### Acceptance Criteria

1. WHEN any timed phase is active THEN the system SHALL display a visual countdown timer
2. WHEN the timer is displayed THEN it SHALL show remaining seconds numerically
3. WHEN the timer is displayed THEN it SHALL include a progress bar or circular indicator showing time visually
4. WHEN time is running out (last 5 seconds) THEN the timer SHALL change color or animate to indicate urgency
5. WHEN the timer reaches zero THEN the system SHALL immediately transition to the next phase

### Requirement 10: Mobile Responsive Design

**User Story:** As a mobile player, I want the game to work smoothly on my phone, so that I can play on any device.

#### Acceptance Criteria

1. WHEN the game is accessed on a mobile device THEN all UI elements SHALL be readable and interactive
2. WHEN the game is displayed on screens smaller than 768px width THEN the layout SHALL adapt to a mobile-friendly single-column design
3. WHEN text is displayed on mobile THEN font sizes SHALL be at least 16px to ensure readability
4. WHEN interactive elements are displayed on mobile THEN they SHALL have touch targets of at least 44x44px
5. WHEN the game runs on mobile THEN all animations and transitions SHALL perform smoothly without lag

### Requirement 11: Phase Transition Animations

**User Story:** As a player, I want smooth visual transitions between game phases, so that the experience feels polished and engaging.

#### Acceptance Criteria

1. WHEN transitioning between phases THEN the system SHALL display a simple animation (fade, slide, or scale)
2. WHEN animations play THEN they SHALL complete within 300-500 milliseconds
3. WHEN a new phase begins THEN the previous phase content SHALL fade out before new content fades in
4. WHEN animations are active THEN they SHALL not block user interaction with the next phase
5. IF the device has reduced motion preferences enabled THEN the system SHALL minimize or disable animations

### Requirement 12: Error Handling and Edge Cases

**User Story:** As a player, I want the game to handle unexpected situations gracefully, so that my experience is not disrupted by errors.

#### Acceptance Criteria

1. WHEN the prompt data fails to load THEN the system SHALL display an error message and retry button
2. WHEN no prompts are available THEN the system SHALL display a message indicating the game cannot start
3. WHEN a player submits an empty guess THEN the system SHALL treat it as no answer (0 points)
4. WHEN the same prompt is selected twice in a session THEN the system SHALL skip it and select a different prompt
5. WHEN all prompts have been used in a session THEN the system SHALL either reshuffle prompts or end the session with a completion message
6. IF a timer fails to start THEN the system SHALL log the error and attempt to restart the phase
