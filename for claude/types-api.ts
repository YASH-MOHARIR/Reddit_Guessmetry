// Init response for game initialization
export type InitResponse = {
  type: 'init';
  postId: string;
  username: string;
  customPrompt: {
    description: string;
    hasGuessed: boolean;
  } | null;
};

export type IncrementResponse = {
  type: 'increment';
  postId: string;
  count: number;
};

export type DecrementResponse = {
  type: 'decrement';
  postId: string;
  count: number;
};

// Game-specific API types
export type GameStartResponse = {
  type: 'game-start';
  sessionId: string;
  username: string;
};

export type NextPromptResponse = {
  type: 'next-prompt';
  prompt: {
    id: number;
    promptText: string;
    difficulty: 'easy' | 'medium' | 'hard';
    category: 'everyday' | 'animals' | 'reddit' | 'abstract';
  };
};

export type GuessResultResponse = {
  type: 'guess-result';
  isCorrect: boolean;
  isClose: boolean;
  correctAnswer: string;
  pointsEarned: number;
  totalScore: number;
};

export type ErrorResponse = {
  status: 'error';
  message: string;
};

// Consensus voting API types
export type ConsensusGuessSubmittedResponse = {
  type: 'consensus-guess-submitted';
  success: boolean;
  message: string;
};

export type ConsensusResultsResponse = {
  type: 'consensus-results';
  aggregation: GuessAggregation[];
  playerGuess: string | null;
  creatorAnswer: string;
  totalPlayers: number;
  totalGuesses: number;
  playerScore: ConsensusScore;
  creatorAnswerData?: GuessAggregation;
};

export type HistoricalResultsResponse = {
  type: 'historical-results';
  aggregation: GuessAggregation[];
  creatorAnswer: string;
  totalPlayers: number;
  totalGuesses: number;
  isFinal: true;
  promptText: string;
};

export type HistoricalResultsNotFoundResponse = {
  type: 'historical-results-not-found';
  message: string;
};

// Import types from game.ts for use in API responses
import type { GuessAggregation, ConsensusScore } from './game';
