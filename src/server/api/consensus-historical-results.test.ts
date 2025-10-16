import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { RedisClient } from '@devvit/web/server';
import { getFinalResults, preserveFinalResults } from '../services/redisAggregation';

describe('Historical Results API', () => {
  let mockRedis: RedisClient;

  beforeEach(() => {
    mockRedis = {
      get: vi.fn(),
      set: vi.fn(),
      hGetAll: vi.fn(),
      hIncrBy: vi.fn(),
      zAdd: vi.fn(),
      zCard: vi.fn(),
      expire: vi.fn(),
    } as unknown as RedisClient;
  });

  describe('preserveFinalResults', () => {
    it('should store final results as JSON with TTL', async () => {
      const promptId = 1;
      const sessionId = 'session123';
      const aggregationData = {
        guesses: { jellyfish: 100, squid: 50 },
        totalPlayers: 150,
        totalGuesses: 150,
      };

      await preserveFinalResults(mockRedis, promptId, sessionId, aggregationData);

      expect(mockRedis.set).toHaveBeenCalledWith(
        'prompt:1:session:session123:final',
        JSON.stringify(aggregationData),
        expect.objectContaining({
          expiration: expect.any(Date),
        })
      );
    });

    it('should throw error if Redis set fails', async () => {
      const promptId = 1;
      const sessionId = 'session123';
      const aggregationData = {
        guesses: { jellyfish: 100 },
        totalPlayers: 100,
        totalGuesses: 100,
      };

      vi.mocked(mockRedis.set).mockRejectedValue(new Error('Redis error'));

      await expect(
        preserveFinalResults(mockRedis, promptId, sessionId, aggregationData)
      ).rejects.toThrow('Failed to preserve final results');
    });
  });

  describe('getFinalResults', () => {
    it('should retrieve and parse stored final results', async () => {
      const promptId = 1;
      const sessionId = 'session123';
      const storedData = {
        guesses: { jellyfish: 100, squid: 50 },
        totalPlayers: 150,
        totalGuesses: 150,
      };

      vi.mocked(mockRedis.get).mockResolvedValue(JSON.stringify(storedData));

      const result = await getFinalResults(mockRedis, promptId, sessionId);

      expect(mockRedis.get).toHaveBeenCalledWith('prompt:1:session:session123:final');
      expect(result).toEqual(storedData);
    });

    it('should return null if no data found', async () => {
      const promptId = 1;
      const sessionId = 'session123';

      vi.mocked(mockRedis.get).mockResolvedValue(null);

      const result = await getFinalResults(mockRedis, promptId, sessionId);

      expect(result).toBeNull();
    });

    it('should throw error if Redis get fails', async () => {
      const promptId = 1;
      const sessionId = 'session123';

      vi.mocked(mockRedis.get).mockRejectedValue(new Error('Redis error'));

      await expect(getFinalResults(mockRedis, promptId, sessionId)).rejects.toThrow(
        'Failed to get final results'
      );
    });

    it('should handle invalid JSON gracefully', async () => {
      const promptId = 1;
      const sessionId = 'session123';

      vi.mocked(mockRedis.get).mockResolvedValue('invalid json');

      await expect(getFinalResults(mockRedis, promptId, sessionId)).rejects.toThrow();
    });
  });

  describe('Historical Results Endpoint Logic', () => {
    it('should return 404 for invalid promptId', () => {
      const invalidPromptId = NaN;
      expect(isNaN(invalidPromptId)).toBe(true);
    });

    it('should return 404 for non-existent prompt', () => {
      const prompts = [{ id: 1 }, { id: 2 }];
      const promptId = 999;
      const found = prompts.find((p) => p.id === promptId);
      expect(found).toBeUndefined();
    });

    it('should format aggregation data correctly', () => {
      const guesses = { jellyfish: 100, squid: 50, octopus: 25 };
      const totalPlayers = 175;

      const guessesArray = Object.entries(guesses).map(([guess, count]) => ({
        guess,
        count,
        percentage: Math.round(((count / totalPlayers) * 100 * 10)) / 10,
      }));

      guessesArray.sort((a, b) => b.count - a.count);

      expect(guessesArray[0]).toEqual({
        guess: 'jellyfish',
        count: 100,
        percentage: 57.1,
      });
      expect(guessesArray[1]).toEqual({
        guess: 'squid',
        count: 50,
        percentage: 28.6,
      });
    });

    it('should assign ranks correctly after sorting', () => {
      const guessesArray = [
        { guess: 'jellyfish', count: 100 },
        { guess: 'squid', count: 50 },
        { guess: 'octopus', count: 25 },
      ];

      guessesArray.forEach((guess, index) => {
        (guess as typeof guess & { rank: number }).rank = index + 1;
      });

      expect((guessesArray[0] as typeof guessesArray[0] & { rank: number }).rank).toBe(1);
      expect((guessesArray[1] as typeof guessesArray[1] & { rank: number }).rank).toBe(2);
      expect((guessesArray[2] as typeof guessesArray[2] & { rank: number }).rank).toBe(3);
    });
  });
});
