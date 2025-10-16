// Custom prompt type for user-generated prompts
export type CustomPrompt = {
  postId: string;
  description: string;
  answer: string;
  createdBy: string;
  createdAt: number;
};

// Consensus voting types
export type ConsensusScoreTier = 'majority' | 'common' | 'uncommon' | 'rare' | 'unique';

export type ConsensusScore = {
  pointsEarned: number; // 100, 50, 25, 10, or 0
  matchPercentage: number; // Percentage of players who guessed the same
  tier: ConsensusScoreTier; // Which tier the guess falls into
};

export type GuessAggregation = {
  guess: string; // "jellyfish"
  count: number; // 5183
  percentage: number; // 85.2
  isPlayerGuess: boolean; // true if this is the current player's guess
  isCreatorAnswer: boolean; // true if this matches creator's intended answer
  rank: number; // 1-10 position in top guesses
  variants?: string[]; // Optional array of similar spelling variants (e.g., ["jelly fish", "jely fish"])
};
