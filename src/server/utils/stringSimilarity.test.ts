import { describe, it, expect } from 'vitest';
import { calculateSimilarity } from './stringSimilarity.js';

describe('calculateSimilarity', () => {
  describe('exact matches', () => {
    it('should return 100 for identical strings', () => {
      expect(calculateSimilarity('house', 'house')).toBe(100);
      expect(calculateSimilarity('tree', 'tree')).toBe(100);
      expect(calculateSimilarity('bicycle', 'bicycle')).toBe(100);
    });

    it('should return 100 for identical strings with different casing', () => {
      expect(calculateSimilarity('House', 'house')).toBe(100);
      expect(calculateSimilarity('TREE', 'tree')).toBe(100);
      expect(calculateSimilarity('BiCyCle', 'bicycle')).toBe(100);
    });

    it('should return 100 for identical strings with extra whitespace', () => {
      expect(calculateSimilarity('  house  ', 'house')).toBe(100);
      expect(calculateSimilarity('tree', '  tree  ')).toBe(100);
      expect(calculateSimilarity('  bicycle  ', '  bicycle  ')).toBe(100);
    });
  });

  describe('close matches', () => {
    it('should return high similarity for strings with one character difference', () => {
      const similarity = calculateSimilarity('house', 'hous');
      expect(similarity).toBeGreaterThan(70);
      expect(similarity).toBe(80); // 4 out of 5 characters match
    });

    it('should return high similarity for strings with minor typos', () => {
      const similarity = calculateSimilarity('bicycle', 'bycicle');
      expect(similarity).toBeGreaterThan(70);
    });

    it('should return similarity above 70% for close matches', () => {
      expect(calculateSimilarity('cat', 'cats')).toBeGreaterThanOrEqual(75);
      expect(calculateSimilarity('dog', 'doge')).toBeGreaterThanOrEqual(75);
    });
  });

  describe('different strings', () => {
    it('should return low similarity for completely different strings', () => {
      expect(calculateSimilarity('house', 'tree')).toBeLessThan(50);
      expect(calculateSimilarity('bicycle', 'car')).toBeLessThan(50);
      expect(calculateSimilarity('apple', 'orange')).toBeLessThan(50);
    });

    it('should return 0 for strings with no common characters', () => {
      const similarity = calculateSimilarity('abc', 'xyz');
      expect(similarity).toBe(0);
    });

    it('should return similarity for tree vs three', () => {
      const similarity = calculateSimilarity('tree', 'three');
      // "tree" vs "three" has 1 character difference (edit distance = 1)
      // Similarity = (5 - 1) / 5 = 80%
      expect(similarity).toBe(80);
    });
  });

  describe('edge cases', () => {
    it('should return 100 for two empty strings', () => {
      expect(calculateSimilarity('', '')).toBe(100);
    });

    it('should return 0 when one string is empty', () => {
      expect(calculateSimilarity('house', '')).toBe(0);
      expect(calculateSimilarity('', 'tree')).toBe(0);
    });

    it('should handle single character strings', () => {
      expect(calculateSimilarity('a', 'a')).toBe(100);
      expect(calculateSimilarity('a', 'b')).toBe(0);
    });

    it('should handle strings with special characters', () => {
      expect(calculateSimilarity('hello!', 'hello!')).toBe(100);
      expect(calculateSimilarity('test-123', 'test-123')).toBe(100);
    });
  });

  describe('requirement 5.6 - 70% threshold examples', () => {
    it('should correctly identify close matches at 70% threshold', () => {
      // "house" vs "hous" = 80% (1 char difference out of 5)
      expect(calculateSimilarity('house', 'hous')).toBeGreaterThanOrEqual(70);

      // Test actual examples that fall below 70%
      expect(calculateSimilarity('cat', 'dog')).toBeLessThan(70);
      expect(calculateSimilarity('house', 'tree')).toBeLessThan(70);
    });

    it('should handle alternative answer scenarios', () => {
      // "bicycle" vs "bike" should be low similarity (different words)
      // but "bike" would be in alternativeAnswers array
      const similarity = calculateSimilarity('bicycle', 'bike');
      expect(similarity).toBeLessThan(70);
    });
  });
});
