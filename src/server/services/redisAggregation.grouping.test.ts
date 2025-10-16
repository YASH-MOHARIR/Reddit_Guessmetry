import { describe, it, expect } from 'vitest';
import { groupSimilarGuesses } from './redisAggregation';

describe('groupSimilarGuesses', () => {
  it('should group similar guesses with ≥85% similarity', () => {
    const guessesMap = {
      jellyfish: 100,
      'jelly fish': 50,
      'jellyf1sh': 30, // 88.9% similar - will group
      squid: 20,
    };

    const grouped = groupSimilarGuesses(guessesMap, 85);

    // Should have 2 groups: jellyfish variants and squid
    expect(grouped).toHaveLength(2);

    // First group should be jellyfish with variants
    const jellyfishGroup = grouped.find((g) => g.primaryGuess === 'jellyfish');
    expect(jellyfishGroup).toBeDefined();
    expect(jellyfishGroup!.combinedCount).toBe(180); // 100 + 50 + 30
    expect(jellyfishGroup!.variants).toHaveLength(3);
    expect(jellyfishGroup!.variants.map((v) => v.guess)).toContain('jellyfish');
    expect(jellyfishGroup!.variants.map((v) => v.guess)).toContain('jelly fish');
    expect(jellyfishGroup!.variants.map((v) => v.guess)).toContain('jellyf1sh');

    // Second group should be squid alone
    const squidGroup = grouped.find((g) => g.primaryGuess === 'squid');
    expect(squidGroup).toBeDefined();
    expect(squidGroup!.combinedCount).toBe(20);
    expect(squidGroup!.variants).toHaveLength(1);
  });

  it('should use the most common spelling as primary guess', () => {
    const guessesMap = {
      'jellyf1sh': 30,
      jellyfish: 100,
      'jelly fish': 50,
    };

    const grouped = groupSimilarGuesses(guessesMap, 85);

    expect(grouped).toHaveLength(1);
    expect(grouped[0]!.primaryGuess).toBe('jellyfish'); // Most common (100)
  });

  it('should not group dissimilar guesses', () => {
    const guessesMap = {
      jellyfish: 100,
      octopus: 50,
      squid: 30,
      house: 20,
    };

    const grouped = groupSimilarGuesses(guessesMap, 85);

    // All should be separate groups
    expect(grouped).toHaveLength(4);
    grouped.forEach((group) => {
      expect(group.variants).toHaveLength(1);
      expect(group.combinedCount).toBe(group.variants[0]!.count);
    });
  });

  it('should handle empty guesses map', () => {
    const guessesMap = {};

    const grouped = groupSimilarGuesses(guessesMap, 85);

    expect(grouped).toHaveLength(0);
  });

  it('should handle single guess', () => {
    const guessesMap = {
      jellyfish: 100,
    };

    const grouped = groupSimilarGuesses(guessesMap, 85);

    expect(grouped).toHaveLength(1);
    expect(grouped[0]!.primaryGuess).toBe('jellyfish');
    expect(grouped[0]!.combinedCount).toBe(100);
    expect(grouped[0]!.variants).toHaveLength(1);
  });

  it('should respect custom similarity threshold', () => {
    const guessesMap = {
      jellyfish: 100,
      'jelly fish': 50, // Very similar
      octopus: 30, // Not similar
    };

    // With 95% threshold, 'jelly fish' might not group with 'jellyfish'
    const grouped95 = groupSimilarGuesses(guessesMap, 95);
    
    // With 70% threshold, they should definitely group
    const grouped70 = groupSimilarGuesses(guessesMap, 70);

    // Lower threshold should result in fewer or equal groups
    expect(grouped70.length).toBeLessThanOrEqual(grouped95.length);
  });

  it('should handle case-insensitive grouping', () => {
    const guessesMap = {
      JellyFish: 100,
      'JELLY FISH': 50,
      jellyfish: 30,
    };

    const grouped = groupSimilarGuesses(guessesMap, 85);

    // Should group all variants together
    expect(grouped).toHaveLength(1);
    expect(grouped[0]!.combinedCount).toBe(180);
  });

  it('should handle spelling variations correctly', () => {
    const guessesMap = {
      color: 100,
      colour: 80, // British spelling
      colors: 20, // Plural - might not group depending on similarity
    };

    const grouped = groupSimilarGuesses(guessesMap, 85);

    // color and colour should group (very similar)
    const colorGroup = grouped.find(
      (g) => g.primaryGuess === 'color' || g.primaryGuess === 'colour'
    );
    expect(colorGroup).toBeDefined();
    
    // Combined count should include both if grouped
    if (colorGroup!.variants.length > 1) {
      expect(colorGroup!.combinedCount).toBeGreaterThan(100);
    }
  });

  it('should track all variants with their individual counts', () => {
    const guessesMap = {
      jellyfish: 100,
      'jelly fish': 50,
      'jellyf1sh': 30,
    };

    const grouped = groupSimilarGuesses(guessesMap, 85);

    expect(grouped).toHaveLength(1);
    const group = grouped[0]!;
    
    expect(group.variants).toHaveLength(3);
    expect(group.variants.find((v) => v.guess === 'jellyfish')?.count).toBe(100);
    expect(group.variants.find((v) => v.guess === 'jelly fish')?.count).toBe(50);
    expect(group.variants.find((v) => v.guess === 'jellyf1sh')?.count).toBe(30);
  });

  it('should sort groups by combined count', () => {
    const guessesMap = {
      squid: 200,
      jellyfish: 100,
      'jelly fish': 50,
      'jellyf1sh': 30,
      octopus: 150,
    };

    const grouped = groupSimilarGuesses(guessesMap, 85);

    // squid: 200, jellyfish group: 180, octopus: 150
    expect(grouped[0]!.primaryGuess).toBe('squid');
    expect(grouped[0]!.combinedCount).toBe(200);
    
    expect(grouped[1]!.primaryGuess).toBe('jellyfish');
    expect(grouped[1]!.combinedCount).toBe(180);
    
    expect(grouped[2]!.primaryGuess).toBe('octopus');
    expect(grouped[2]!.combinedCount).toBe(150);
  });

  it('should handle typos and misspellings', () => {
    const guessesMap = {
      elephant: 100,
      elefant: 40,
      elaphant: 30,
      elepant: 20,
    };

    const grouped = groupSimilarGuesses(guessesMap, 85);

    // Most typos should group together
    const elephantGroup = grouped.find((g) => g.primaryGuess === 'elephant');
    expect(elephantGroup).toBeDefined();
    expect(elephantGroup!.variants.length).toBeGreaterThan(1);
  });
});
