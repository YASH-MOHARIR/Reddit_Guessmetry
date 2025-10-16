import { describe, it, expect } from 'vitest';
import { calculateConsensusTier } from './consensusScoring.js';
import type { GuessAggregation } from '../../shared/types/game.js';

describe('calculateConsensusTier', () => {
  // Helper function to create mock aggregation data
  const createAggregation = (
    guesses: Array<{ guess: string; count: number; percentage: number }>
  ): GuessAggregation[] => {
    return guesses.map((g, index) => ({
      guess: g.guess,
      count: g.count,
      percentage: g.percentage,
      isPlayerGuess: false,
      isCreatorAnswer: false,
      rank: index + 1,
    }));
  };

  describe('exact match scenarios', () => {
    it('should award 100 points for majority answer (≥50%)', () => {
      const aggregation = createAggregation([
        { guess: 'jellyfish', count: 5183, percentage: 85.2 },
        { guess: 'squid', count: 193, percentage: 3.2 },
        { guess: 'octopus', count: 95, percentage: 1.6 },
      ]);

      const result = calculateConsensusTier('jellyfish', aggregation);

      expect(result.pointsEarned).toBe(100);
      expect(result.matchPercentage).toBe(85.2);
      expect(result.tier).toBe('majority');
    });

    it('should award 100 points for exactly 50% match', () => {
      const aggregation = createAggregation([
        { guess: 'house', count: 500, percentage: 50.0 },
        { guess: 'building', count: 500, percentage: 50.0 },
      ]);

      const result = calculateConsensusTier('house', aggregation);

      expect(result.pointsEarned).toBe(100);
      expect(result.matchPercentage).toBe(50.0);
      expect(result.tier).toBe('majority');
    });

    it('should award 50 points for common answer (≥20% but <50%)', () => {
      const aggregation = createAggregation([
        { guess: 'jellyfish', count: 3000, percentage: 60.0 },
        { guess: 'squid', count: 1500, percentage: 30.0 },
        { guess: 'octopus', count: 500, percentage: 10.0 },
      ]);

      const result = calculateConsensusTier('squid', aggregation);

      expect(result.pointsEarned).toBe(50);
      expect(result.matchPercentage).toBe(30.0);
      expect(result.tier).toBe('common');
    });

    it('should award 50 points for exactly 20% match', () => {
      const aggregation = createAggregation([
        { guess: 'tree', count: 800, percentage: 80.0 },
        { guess: 'plant', count: 200, percentage: 20.0 },
      ]);

      const result = calculateConsensusTier('plant', aggregation);

      expect(result.pointsEarned).toBe(50);
      expect(result.matchPercentage).toBe(20.0);
      expect(result.tier).toBe('common');
    });

    it('should award 25 points for uncommon answer (≥5% but <20%)', () => {
      const aggregation = createAggregation([
        { guess: 'jellyfish', count: 5000, percentage: 70.0 },
        { guess: 'squid', count: 1500, percentage: 21.0 },
        { guess: 'octopus', count: 500, percentage: 7.0 },
        { guess: 'cuttlefish', count: 142, percentage: 2.0 },
      ]);

      const result = calculateConsensusTier('octopus', aggregation);

      expect(result.pointsEarned).toBe(25);
      expect(result.matchPercentage).toBe(7.0);
      expect(result.tier).toBe('uncommon');
    });

    it('should award 25 points for exactly 5% match', () => {
      const aggregation = createAggregation([
        { guess: 'car', count: 950, percentage: 95.0 },
        { guess: 'vehicle', count: 50, percentage: 5.0 },
      ]);

      const result = calculateConsensusTier('vehicle', aggregation);

      expect(result.pointsEarned).toBe(25);
      expect(result.matchPercentage).toBe(5.0);
      expect(result.tier).toBe('uncommon');
    });

    it('should award 10 points for rare answer (≥1% but <5%)', () => {
      const aggregation = createAggregation([
        { guess: 'jellyfish', count: 5000, percentage: 83.3 },
        { guess: 'squid', count: 800, percentage: 13.3 },
        { guess: 'octopus', count: 150, percentage: 2.5 },
        { guess: 'cuttlefish', count: 50, percentage: 0.8 },
      ]);

      const result = calculateConsensusTier('octopus', aggregation);

      expect(result.pointsEarned).toBe(10);
      expect(result.matchPercentage).toBe(2.5);
      expect(result.tier).toBe('rare');
    });

    it('should award 10 points for exactly 1% match', () => {
      const aggregation = createAggregation([
        { guess: 'dog', count: 990, percentage: 99.0 },
        { guess: 'puppy', count: 10, percentage: 1.0 },
      ]);

      const result = calculateConsensusTier('puppy', aggregation);

      expect(result.pointsEarned).toBe(10);
      expect(result.matchPercentage).toBe(1.0);
      expect(result.tier).toBe('rare');
    });

    it('should award 0 points for unique answer (<1%)', () => {
      const aggregation = createAggregation([
        { guess: 'jellyfish', count: 9950, percentage: 99.5 },
        { guess: 'squid', count: 45, percentage: 0.45 },
      ]);

      const result = calculateConsensusTier('squid', aggregation);

      expect(result.pointsEarned).toBe(0);
      expect(result.matchPercentage).toBe(0.45);
      expect(result.tier).toBe('unique');
    });
  });

  describe('case-insensitive matching', () => {
    it('should match regardless of case', () => {
      const aggregation = createAggregation([
        { guess: 'jellyfish', count: 5000, percentage: 85.0 },
      ]);

      const result1 = calculateConsensusTier('JELLYFISH', aggregation);
      const result2 = calculateConsensusTier('JellyFish', aggregation);
      const result3 = calculateConsensusTier('jellyfish', aggregation);

      expect(result1.pointsEarned).toBe(100);
      expect(result2.pointsEarned).toBe(100);
      expect(result3.pointsEarned).toBe(100);
    });
  });

  describe('whitespace handling', () => {
    it('should match with extra whitespace', () => {
      const aggregation = createAggregation([
        { guess: 'jellyfish', count: 5000, percentage: 85.0 },
      ]);

      const result1 = calculateConsensusTier('  jellyfish  ', aggregation);
      const result2 = calculateConsensusTier('jellyfish ', aggregation);
      const result3 = calculateConsensusTier(' jellyfish', aggregation);

      expect(result1.pointsEarned).toBe(100);
      expect(result2.pointsEarned).toBe(100);
      expect(result3.pointsEarned).toBe(100);
    });
  });

  describe('close match scenarios (Levenshtein distance ≥70%)', () => {
    it('should award 5 bonus points for close match with ≥70% similarity', () => {
      const aggregation = createAggregation([
        { guess: 'jellyfish', count: 5000, percentage: 85.0 },
        { guess: 'squid', count: 500, percentage: 8.5 },
      ]);

      // "jelly fish" vs "jellyfish" should be close match
      const result = calculateConsensusTier('jelly fish', aggregation);

      expect(result.pointsEarned).toBe(5);
      expect(result.tier).toBe('rare');
    });

    it('should award 5 points for typo that is ≥70% similar', () => {
      const aggregation = createAggregation([{ guess: 'bicycle', count: 5000, percentage: 90.0 }]);

      // "bycicle" vs "bicycle" - one character difference
      const result = calculateConsensusTier('bycicle', aggregation);

      expect(result.pointsEarned).toBe(5);
      expect(result.matchPercentage).toBe(90.0);
      expect(result.tier).toBe('rare');
    });

    it('should award 5 points for minor spelling variation', () => {
      const aggregation = createAggregation([{ guess: 'house', count: 1000, percentage: 50.0 }]);

      // "hous" vs "house" - 80% similarity
      const result = calculateConsensusTier('hous', aggregation);

      expect(result.pointsEarned).toBe(5);
      expect(result.matchPercentage).toBe(50.0);
      expect(result.tier).toBe('rare');
    });

    it('should prefer exact match over close match', () => {
      const aggregation = createAggregation([
        { guess: 'tree', count: 4000, percentage: 80.0 },
        { guess: 'three', count: 1000, percentage: 20.0 },
      ]);

      // "tree" should match exactly, not as close match to "three"
      const result = calculateConsensusTier('tree', aggregation);

      expect(result.pointsEarned).toBe(100);
      expect(result.matchPercentage).toBe(80.0);
      expect(result.tier).toBe('majority');
    });
  });

  describe('no match scenarios', () => {
    it('should award 0 points when guess is not in aggregation and not close', () => {
      const aggregation = createAggregation([
        { guess: 'jellyfish', count: 5000, percentage: 85.0 },
        { guess: 'squid', count: 500, percentage: 8.5 },
        { guess: 'octopus', count: 382, percentage: 6.5 },
      ]);

      // "house" is completely different
      const result = calculateConsensusTier('house', aggregation);

      expect(result.pointsEarned).toBe(0);
      expect(result.matchPercentage).toBe(0);
      expect(result.tier).toBe('unique');
    });

    it('should award 0 points for unique creative answer', () => {
      const aggregation = createAggregation([
        { guess: 'cat', count: 9000, percentage: 90.0 },
        { guess: 'dog', count: 1000, percentage: 10.0 },
      ]);

      const result = calculateConsensusTier('elephant', aggregation);

      expect(result.pointsEarned).toBe(0);
      expect(result.matchPercentage).toBe(0);
      expect(result.tier).toBe('unique');
    });
  });

  describe('edge cases', () => {
    it('should handle empty aggregation array', () => {
      const aggregation: GuessAggregation[] = [];

      const result = calculateConsensusTier('jellyfish', aggregation);

      expect(result.pointsEarned).toBe(0);
      expect(result.matchPercentage).toBe(0);
      expect(result.tier).toBe('unique');
    });

    it('should handle single guess in aggregation', () => {
      const aggregation = createAggregation([{ guess: 'jellyfish', count: 1, percentage: 100.0 }]);

      const result = calculateConsensusTier('jellyfish', aggregation);

      expect(result.pointsEarned).toBe(100);
      expect(result.matchPercentage).toBe(100.0);
      expect(result.tier).toBe('majority');
    });

    it('should handle empty player guess', () => {
      const aggregation = createAggregation([
        { guess: 'jellyfish', count: 5000, percentage: 85.0 },
      ]);

      const result = calculateConsensusTier('', aggregation);

      expect(result.pointsEarned).toBe(0);
      expect(result.matchPercentage).toBe(0);
      expect(result.tier).toBe('unique');
    });
  });

  describe('tier boundary testing', () => {
    it('should correctly handle boundary at 49.99% (common, not majority)', () => {
      const aggregation = createAggregation([
        { guess: 'answer1', count: 4999, percentage: 49.99 },
        { guess: 'answer2', count: 5001, percentage: 50.01 },
      ]);

      const result = calculateConsensusTier('answer1', aggregation);

      expect(result.pointsEarned).toBe(50);
      expect(result.tier).toBe('common');
    });

    it('should correctly handle boundary at 19.99% (uncommon, not common)', () => {
      const aggregation = createAggregation([
        { guess: 'answer1', count: 8000, percentage: 80.0 },
        { guess: 'answer2', count: 1999, percentage: 19.99 },
      ]);

      const result = calculateConsensusTier('answer2', aggregation);

      expect(result.pointsEarned).toBe(25);
      expect(result.tier).toBe('uncommon');
    });

    it('should correctly handle boundary at 4.99% (rare, not uncommon)', () => {
      const aggregation = createAggregation([
        { guess: 'answer1', count: 9501, percentage: 95.01 },
        { guess: 'answer2', count: 499, percentage: 4.99 },
      ]);

      const result = calculateConsensusTier('answer2', aggregation);

      expect(result.pointsEarned).toBe(10);
      expect(result.tier).toBe('rare');
    });

    it('should correctly handle boundary at 0.99% (unique, not rare)', () => {
      const aggregation = createAggregation([
        { guess: 'answer1', count: 9901, percentage: 99.01 },
        { guess: 'answer2', count: 99, percentage: 0.99 },
      ]);

      const result = calculateConsensusTier('answer2', aggregation);

      expect(result.pointsEarned).toBe(0);
      expect(result.tier).toBe('unique');
    });
  });

  describe('real-world scenario from design doc', () => {
    it('should match the jellyfish example from design document', () => {
      const aggregation = createAggregation([
        { guess: 'jellyfish', count: 5183, percentage: 85.0 },
        { guess: 'squid', count: 193, percentage: 3.2 },
        { guess: 'octopus', count: 95, percentage: 1.6 },
        { guess: 'house', count: 47, percentage: 0.8 },
      ]);

      // Player guessed "jellyfish" - majority
      const result1 = calculateConsensusTier('jellyfish', aggregation);
      expect(result1.pointsEarned).toBe(100);
      expect(result1.tier).toBe('majority');

      // Player guessed "squid" - rare
      const result2 = calculateConsensusTier('squid', aggregation);
      expect(result2.pointsEarned).toBe(10);
      expect(result2.tier).toBe('rare');

      // Player guessed "octopus" - rare
      const result3 = calculateConsensusTier('octopus', aggregation);
      expect(result3.pointsEarned).toBe(10);
      expect(result3.tier).toBe('rare');

      // Player guessed "house" (creator's answer) - unique
      const result4 = calculateConsensusTier('house', aggregation);
      expect(result4.pointsEarned).toBe(0);
      expect(result4.tier).toBe('unique');

      // Player guessed "jely fish" (typo) - close match
      const result5 = calculateConsensusTier('jely fish', aggregation);
      expect(result5.pointsEarned).toBe(5);
      expect(result5.tier).toBe('rare');
    });
  });
});
