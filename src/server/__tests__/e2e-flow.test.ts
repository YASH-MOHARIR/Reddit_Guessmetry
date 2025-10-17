import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { RedisClient } from '@devvit/web/server';
import { normalizeGuess } from '../utils/guessNormalization';
import {
  storeGuess,
  addPlayerToSet,
  storePlayerGuess,
  getAggregatedGuesses,
  getTotalPlayers,
  getPlayerGuess,
} from '../services/redisAggregation';
import { hasUserGuessed, markUserAsGuessed } from '../services/guessTracking';
import { storeCustomPrompt, getCustomPrompt } from '../services/promptStorage';

describe('End-to-End Flow Tests', () => {
  let mockRedis: RedisClient;

  beforeEach(() => {
    // Create a comprehensive mock Redis client
    mockRedis = {
      hIncrBy: vi.fn().mockResolvedValue(1),
      expire: vi.fn().mockResolvedValue(true),
      zAdd: vi.fn().mockResolvedValue(1),
      zCard: vi.fn().mockResolvedValue(0),
      set: vi.fn().mockResolvedValue('OK'),
      get: vi.fn().mockResolvedValue(null),
      hGetAll: vi.fn().mockResolvedValue({}),
      hSet: vi.fn().mockResolvedValue(1),
    } as unknown as RedisClient;
  });

  describe('Complete Game Flow', () => {
    it('should handle complete flow: create post -> submit guess -> view results', async () => {
      const postId = 'test-post-123';
      const description = 'Two circles connected by a rectangle';
      const answer = 'dumbbell';
      const creator = 'creator-user';
      const player1 = 'player1';
      const player2 = 'player2';

      // Step 1: Create post with custom prompt
      await storeCustomPrompt(mockRedis, postId, description, answer, creator);

      expect(mockRedis.hSet).toHaveBeenCalledWith(
        `prompt:${postId}`,
        expect.objectContaining({
          description,
          answer,
          creator,
        })
      );

      // Step 2: Player 1 opens post and checks if they've guessed
      vi.mocked(mockRedis.get).mockResolvedValueOnce('');
      const player1HasGuessed = await hasUserGuessed(mockRedis, postId, player1);
      expect(player1HasGuessed).toBe(false);

      // Step 3: Player 1 submits guess
      const player1Guess = 'Dumbbell';
      const normalizedGuess1 = normalizeGuess(player1Guess);

      await storeGuess(mockRedis, 0, normalizedGuess1, postId);
      await addPlayerToSet(mockRedis, 0, player1, postId);
      await storePlayerGuess(mockRedis, 0, player1, normalizedGuess1, postId);
      await markUserAsGuessed(mockRedis, postId, player1);

      expect(mockRedis.hIncrBy).toHaveBeenCalledWith(
        `${postId}:guesses`,
        'dumbbell',
        1
      );

      // Step 4: Player 2 submits different guess
      const player2Guess = 'Barbell';
      const normalizedGuess2 = normalizeGuess(player2Guess);

      vi.mocked(mockRedis.get).mockResolvedValueOnce('');
      const player2HasGuessed = await hasUserGuessed(mockRedis, postId, player2);
      expect(player2HasGuessed).toBe(false);

      await storeGuess(mockRedis, 0, normalizedGuess2, postId);
      await addPlayerToSet(mockRedis, 0, player2, postId);
      await storePlayerGuess(mockRedis, 0, player2, normalizedGuess2, postId);
      await markUserAsGuessed(mockRedis, postId, player2);

      // Step 5: Fetch results
      vi.mocked(mockRedis.hGetAll).mockResolvedValueOnce({
        'dumbbell': '1',
        'barbell': '1',
      });
      vi.mocked(mockRedis.zCard).mockResolvedValueOnce(2);

      const guesses = await getAggregatedGuesses(mockRedis, 0, postId);
      const totalPlayers = await getTotalPlayers(mockRedis, 0, postId);

      expect(guesses).toEqual({
        'dumbbell': 1,
        'barbell': 1,
      });
      expect(totalPlayers).toBe(2);

      // Step 6: Verify player 1 cannot guess again
      vi.mocked(mockRedis.get).mockResolvedValueOnce('1');
      const player1SecondAttempt = await hasUserGuessed(mockRedis, postId, player1);
      expect(player1SecondAttempt).toBe(true);
    });

    it('should handle multiple players guessing the same answer', async () => {
      const postId = 'test-post-456';
      const players = ['user1', 'user2', 'user3', 'user4', 'user5'];
      const commonGuess = 'jellyfish';

      // All players submit the same guess
      for (let i = 0; i < players.length; i++) {
        const player = players[i];
        if (!player) continue;
        await storeGuess(mockRedis, 0, commonGuess, postId);
        await addPlayerToSet(mockRedis, 0, player, postId);
        await storePlayerGuess(mockRedis, 0, player, commonGuess, postId);
        await markUserAsGuessed(mockRedis, postId, player);
      }

      // Verify hIncrBy was called 5 times for the same guess
      expect(mockRedis.hIncrBy).toHaveBeenCalledTimes(5);
      expect(mockRedis.hIncrBy).toHaveBeenCalledWith(
        `${postId}:guesses`,
        'jellyfish',
        1
      );

      // Verify all players were added to the set
      expect(mockRedis.zAdd).toHaveBeenCalledTimes(5);
    });

    it('should handle mixed case and whitespace in guesses', async () => {
      const postId = 'test-post-789';
      const variations = [
        '  JELLYFISH  ',
        'jellyfish',
        'JellyFish',
        '  jelly fish  ',
      ];

      for (let i = 0; i < variations.length; i++) {
        const variation = variations[i];
        if (!variation) continue;
        const normalized = normalizeGuess(variation);
        await storeGuess(mockRedis, 0, normalized, postId);
        await addPlayerToSet(mockRedis, 0, `user${i}`, postId);
        await storePlayerGuess(mockRedis, 0, `user${i}`, normalized, postId);
      }

      // Verify all variations were normalized correctly
      const calls = vi.mocked(mockRedis.hIncrBy).mock.calls;
      calls.forEach((call) => {
        expect(call[1]).toMatch(/^(jellyfish|jelly fish)$/);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle Redis failures gracefully', async () => {
      const postId = 'test-post-error';
      const guess = 'test';

      // Simulate Redis failure
      vi.mocked(mockRedis.hIncrBy).mockRejectedValueOnce(new Error('Redis connection failed'));

      await expect(storeGuess(mockRedis, 0, guess, postId)).rejects.toThrow(
        'Redis connection failed'
      );
    });

    it('should handle missing custom prompt', async () => {
      const postId = 'nonexistent-post';

      vi.mocked(mockRedis.hGetAll).mockResolvedValueOnce({});

      const prompt = await getCustomPrompt(mockRedis, postId);
      expect(prompt).toBeNull();
    });

    it('should handle empty guess aggregation', async () => {
      const postId = 'empty-post';

      vi.mocked(mockRedis.hGetAll).mockResolvedValueOnce({});
      vi.mocked(mockRedis.zCard).mockResolvedValueOnce(0);

      const guesses = await getAggregatedGuesses(mockRedis, 0, postId);
      const totalPlayers = await getTotalPlayers(mockRedis, 0, postId);

      expect(guesses).toEqual({});
      expect(totalPlayers).toBe(0);
    });
  });

  describe('Data Consistency', () => {
    it('should maintain consistency between player count and guess count', async () => {
      const postId = 'consistency-test';
      const players = ['user1', 'user2', 'user3'];
      const guesses = ['apple', 'banana', 'apple'];

      // Submit guesses
      for (let i = 0; i < players.length; i++) {
        const player = players[i];
        const guess = guesses[i];
        if (!player || !guess) continue;
        await storeGuess(mockRedis, 0, guess, postId);
        await addPlayerToSet(mockRedis, 0, player, postId);
        await storePlayerGuess(mockRedis, 0, player, guess, postId);
      }

      // Mock aggregated results
      vi.mocked(mockRedis.hGetAll).mockResolvedValueOnce({
        'apple': '2',
        'banana': '1',
      });
      vi.mocked(mockRedis.zCard).mockResolvedValueOnce(3);

      const guessesMap = await getAggregatedGuesses(mockRedis, 0, postId);
      const totalPlayers = await getTotalPlayers(mockRedis, 0, postId);

      // Total guesses should equal total players
      const totalGuesses = Object.values(guessesMap).reduce((sum, count) => sum + count, 0);
      expect(totalGuesses).toBe(totalPlayers);
    });

    it('should retrieve correct player guess after submission', async () => {
      const postId = 'retrieve-test';
      const player = 'test-user';
      const guess = 'octopus';

      await storePlayerGuess(mockRedis, 0, player, guess, postId);

      // Mock retrieval
      vi.mocked(mockRedis.get).mockResolvedValueOnce('octopus');

      const retrievedGuess = await getPlayerGuess(mockRedis, 0, player, postId);
      expect(retrievedGuess).toBe('octopus');
    });
  });
});
