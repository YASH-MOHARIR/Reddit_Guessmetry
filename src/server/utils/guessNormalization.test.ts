import { describe, it, expect } from 'vitest';
import { normalizeGuess } from './guessNormalization';

describe('normalizeGuess', () => {
  it('should convert uppercase to lowercase', () => {
    expect(normalizeGuess('JELLYFISH')).toBe('jellyfish');
  });

  it('should convert mixed case to lowercase', () => {
    expect(normalizeGuess('JellyFish')).toBe('jellyfish');
  });

  it('should trim leading whitespace', () => {
    expect(normalizeGuess('   jellyfish')).toBe('jellyfish');
  });

  it('should trim trailing whitespace', () => {
    expect(normalizeGuess('jellyfish   ')).toBe('jellyfish');
  });

  it('should trim both leading and trailing whitespace', () => {
    expect(normalizeGuess('   jellyfish   ')).toBe('jellyfish');
  });

  it('should handle extra spaces between words', () => {
    expect(normalizeGuess('jelly  fish')).toBe('jelly  fish');
  });

  it('should handle tabs and newlines', () => {
    expect(normalizeGuess('\tjellyfish\n')).toBe('jellyfish');
  });

  it('should handle special characters', () => {
    expect(normalizeGuess('Jelly-Fish!')).toBe('jelly-fish!');
  });

  it('should handle empty string', () => {
    expect(normalizeGuess('')).toBe('');
  });

  it('should handle string with only whitespace', () => {
    expect(normalizeGuess('   ')).toBe('');
  });

  it('should handle unicode characters', () => {
    expect(normalizeGuess('Café')).toBe('café');
  });

  it('should handle numbers', () => {
    expect(normalizeGuess('House123')).toBe('house123');
  });

  it('should handle emojis', () => {
    expect(normalizeGuess('🐙 Octopus')).toBe('🐙 octopus');
  });
});
