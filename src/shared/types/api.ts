// src/shared/types/api.ts

// Consensus voting types
export type ConsensusScoreTier = 'majority' | 'common' | 'uncommon' | 'rare' | 'unique';

export type ConsensusScore = {
  pointsEarned: number;
  matchPercentage: number;
  tier: ConsensusScoreTier;
};

export type GuessAggregation = {
  guess: string;
  count: number;
  percentage: number;
  isPlayerGuess: boolean;
  isCreatorAnswer: boolean;
  rank: number;
  variants?: string[];
};

// Init response
export type InitResponse = {
  type: 'init';
  postId: string;
  username: string;
  customPrompt: {
    description: string;
    hasGuessed: boolean;
  } | null;
};

// Consensus results response
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

// Error response
export type ErrorResponse = {
  status: 'error';
  message: string;
};
