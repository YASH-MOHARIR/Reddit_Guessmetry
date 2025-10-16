import type { GuessAggregation, ConsensusScore } from '../../shared/types/game.js';
import { calculateSimilarity } from './stringSimilarity.js';

/**
 * Calculate the consensus tier and score for a player's guess
 * @param playerGuess - The player's submitted guess (normalized)
 * @param aggregation - Array of all aggregated guesses with counts and percentages
 * @param totalPlayers - Total number of unique players who submitted guesses
 * @returns ConsensusScore object with pointsEarned, matchPercentage, and tier
 */
export function calculateConsensusTier(
  playerGuess: string,
  aggregation: GuessAggregation[]
): ConsensusScore {
  // Normalize player guess for comparison
  const normalizedGuess = playerGuess.toLowerCase().trim();

  // Find exact match in aggregation
  const exactMatch = aggregation.find((agg) => agg.guess.toLowerCase().trim() === normalizedGuess);

  if (exactMatch) {
    // Player's guess matches exactly - calculate tier based on percentage
    return calculateTierFromPercentage(exactMatch.percentage);
  }

  // No exact match - check for close matches using Levenshtein distance
  const closeMatch = aggregation.find((agg) => {
    const similarity = calculateSimilarity(normalizedGuess, agg.guess);
    return similarity >= 70;
  });

  if (closeMatch) {
    // Close match found - award 5 bonus points
    return {
      pointsEarned: 5,
      matchPercentage: closeMatch.percentage,
      tier: 'rare',
    };
  }

  // No match found - unique guess
  return {
    pointsEarned: 0,
    matchPercentage: 0,
    tier: 'unique',
  };
}

/**
 * Determine tier and points based on match percentage
 * @param percentage - Percentage of players who guessed the same answer
 * @returns ConsensusScore object with tier and points
 */
function calculateTierFromPercentage(percentage: number): ConsensusScore {
  if (percentage >= 50) {
    return {
      pointsEarned: 100,
      matchPercentage: percentage,
      tier: 'majority',
    };
  } else if (percentage >= 20) {
    return {
      pointsEarned: 50,
      matchPercentage: percentage,
      tier: 'common',
    };
  } else if (percentage >= 5) {
    return {
      pointsEarned: 25,
      matchPercentage: percentage,
      tier: 'uncommon',
    };
  } else if (percentage >= 1) {
    return {
      pointsEarned: 10,
      matchPercentage: percentage,
      tier: 'rare',
    };
  } else {
    return {
      pointsEarned: 0,
      matchPercentage: percentage,
      tier: 'unique',
    };
  }
}
