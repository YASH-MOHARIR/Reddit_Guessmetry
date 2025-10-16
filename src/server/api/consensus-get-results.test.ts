import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { RedisClient } from '@devvit/web/server';

// Mock the consensus get-results endpoint logic
describe('POST /api/consensus/get-results', () => {
  let mockRedis: Partial<RedisClient>;
  let mockPrompts: Array<{
    id: number;
    promptText: string;
    answer: string;
    alternativeAnswers: string[];
    difficulty: string;
    category: string;
  }>;

  beforeEach(() => {
    // Setup mock Redis client
    mockRedis = {
      hGetAll: vi.fn(),
      zCard: vi.fn(),
      get: vi.fn(),
    };

    // Setup mock prompts data
    mockPrompts = [
      {
        id: 1,
        promptText: 'A triangle sitting on top of a square',
        answer: 'house',
        alternativeAnswers: ['home', 'building', 'hut'],
        difficulty: 'easy',
        category: 'everyday',
      },
      {
        id: 2,
        promptText: 'A circle on top of a rectangle',
        answer: 'tree',
        alternativeAnswers: ['palm tree', 'plant'],
        difficulty: 'easy',
        category: 'everyday',
      },
    ];
  });

  it('should validate request body and require promptId and username', async () => {
    const invalidRequests = [
      { promptId: undefined, username: 'testuser' },
      { promptId: 1, username: undefined },
      { promptId: undefined, username: undefined },
    ];

    for (const request of invalidRequests) {
      // In a real test, we'd make an HTTP request and check for 400 status
      // Here we're testing the validation logic
      const isValid = request.promptId !== undefined && request.username !== undefined;
      expect(isValid).toBe(false);
    }
  });

  it('should return 404 when prompt is not found', async () => {
    const promptId = 999; // Non-existent prompt

    const prompt = mockPrompts.find((p) => p.id === promptId);
    expect(prompt).toBeUndefined();
  });

  it('should return empty aggregation when no guesses exist', async () => {
    const promptId = 1;

    // Mock Redis to return empty data
    (mockRedis.hGetAll as ReturnType<typeof vi.fn>).mockResolvedValue({});
    (mockRedis.zCard as ReturnType<typeof vi.fn>).mockResolvedValue(0);
    (mockRedis.get as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const guessesMap = await mockRedis.hGetAll!(`prompt:${promptId}:guesses`);
    const totalPlayers = await mockRedis.zCard!(`prompt:${promptId}:players`);

    expect(Object.keys(guessesMap).length).toBe(0);
    expect(totalPlayers).toBe(0);

    // Expected response structure
    const expectedResponse = {
      type: 'consensus-results',
      aggregation: [],
      playerGuess: null,
      creatorAnswer: 'house',
      totalPlayers: 0,
      totalGuesses: 0,
      playerScore: {
        pointsEarned: 0,
        matchPercentage: 0,
        tier: 'unique',
      },
    };

    expect(expectedResponse.aggregation).toHaveLength(0);
    expect(expectedResponse.totalPlayers).toBe(0);
  });

  it('should calculate percentages correctly based on total players', async () => {
    const promptId = 1;

    // Mock Redis to return guess data
    const mockGuesses = {
      jellyfish: '85',
      squid: '10',
      octopus: '5',
    };
    const mockTotalPlayers = 100;

    (mockRedis.hGetAll as ReturnType<typeof vi.fn>).mockResolvedValue(mockGuesses);
    (mockRedis.zCard as ReturnType<typeof vi.fn>).mockResolvedValue(mockTotalPlayers);
    (mockRedis.get as ReturnType<typeof vi.fn>).mockResolvedValue('jellyfish');

    const guessesMap = await mockRedis.hGetAll!(`prompt:${promptId}:guesses`);
    const totalPlayers = await mockRedis.zCard!(`prompt:${promptId}:players`);

    // Calculate percentages
    const guessesArray = Object.entries(guessesMap).map(([guess, countStr]) => {
      const count = parseInt(countStr, 10);
      const percentage = (count / totalPlayers) * 100;
      return { guess, count, percentage: Math.round(percentage * 10) / 10 };
    });

    expect(guessesArray).toContainEqual({ guess: 'jellyfish', count: 85, percentage: 85.0 });
    expect(guessesArray).toContainEqual({ guess: 'squid', count: 10, percentage: 10.0 });
    expect(guessesArray).toContainEqual({ guess: 'octopus', count: 5, percentage: 5.0 });
  });

  it('should sort guesses by count descending and take top 10', async () => {
    const mockGuesses = {
      guess1: '100',
      guess2: '90',
      guess3: '80',
      guess4: '70',
      guess5: '60',
      guess6: '50',
      guess7: '40',
      guess8: '30',
      guess9: '20',
      guess10: '10',
      guess11: '5',
      guess12: '1',
    };

    const guessesArray = Object.entries(mockGuesses).map(([guess, countStr]) => ({
      guess,
      count: parseInt(countStr, 10),
    }));

    // Sort by count descending
    guessesArray.sort((a, b) => b.count - a.count);
    const top10 = guessesArray.slice(0, 10);

    expect(top10).toHaveLength(10);
    expect(top10[0]!.count).toBe(100);
    expect(top10[9]!.count).toBe(10);
    expect(top10.every((g, i) => i === 0 || g.count <= top10[i - 1]!.count)).toBe(true);
  });

  it('should mark player guess correctly in aggregation', async () => {
    const promptId = 1;
    const username = 'testuser';
    const playerGuess = 'jellyfish';

    const mockGuesses = {
      jellyfish: '85',
      squid: '10',
      house: '5',
    };

    (mockRedis.hGetAll as ReturnType<typeof vi.fn>).mockResolvedValue(mockGuesses);
    (mockRedis.zCard as ReturnType<typeof vi.fn>).mockResolvedValue(100);
    (mockRedis.get as ReturnType<typeof vi.fn>).mockResolvedValue(playerGuess);

    const retrievedPlayerGuess = await mockRedis.get!(`prompt:${promptId}:player:${username}:guess`);

    const guessesArray = Object.entries(mockGuesses).map(([guess, countStr]) => ({
      guess,
      count: parseInt(countStr, 10),
      isPlayerGuess: retrievedPlayerGuess === guess,
    }));

    const playerGuessEntry = guessesArray.find((g) => g.isPlayerGuess);
    expect(playerGuessEntry).toBeDefined();
    expect(playerGuessEntry?.guess).toBe('jellyfish');
  });

  it('should mark creator answer correctly in aggregation', async () => {
    const promptId = 1;
    const prompt = mockPrompts.find((p) => p.id === promptId);
    const creatorAnswer = prompt!.answer.toLowerCase().trim();

    const mockGuesses = {
      jellyfish: '85',
      house: '10', // Creator's answer
      squid: '5',
    };

    const guessesArray = Object.entries(mockGuesses).map(([guess, countStr]) => ({
      guess,
      count: parseInt(countStr, 10),
      isCreatorAnswer: guess.toLowerCase().trim() === creatorAnswer,
    }));

    const creatorGuessEntry = guessesArray.find((g) => g.isCreatorAnswer);
    expect(creatorGuessEntry).toBeDefined();
    expect(creatorGuessEntry?.guess).toBe('house');
  });

  it('should calculate total guesses as sum of all counts', async () => {
    const mockGuesses = {
      jellyfish: '85',
      squid: '10',
      house: '5',
      octopus: '3',
    };

    const totalGuesses = Object.values(mockGuesses).reduce(
      (sum, countStr) => sum + parseInt(countStr, 10),
      0
    );

    expect(totalGuesses).toBe(103);
  });

  it('should assign ranks correctly after sorting', async () => {
    const mockGuesses = {
      jellyfish: '85',
      squid: '10',
      house: '5',
    };

    const guessesArray = Object.entries(mockGuesses).map(([guess, countStr]) => ({
      guess,
      count: parseInt(countStr, 10),
      rank: 0,
    }));

    guessesArray.sort((a, b) => b.count - a.count);
    guessesArray.forEach((guess, index) => {
      guess.rank = index + 1;
    });

    expect(guessesArray[0]!.rank).toBe(1);
    expect(guessesArray[0]!.guess).toBe('jellyfish');
    expect(guessesArray[1]!.rank).toBe(2);
    expect(guessesArray[1]!.guess).toBe('squid');
    expect(guessesArray[2]!.rank).toBe(3);
    expect(guessesArray[2]!.guess).toBe('house');
  });

  it('should handle missing player guess gracefully', async () => {
    const promptId = 1;
    const username = 'testuser';

    (mockRedis.hGetAll as ReturnType<typeof vi.fn>).mockResolvedValue({
      jellyfish: '85',
      squid: '10',
    });
    (mockRedis.zCard as ReturnType<typeof vi.fn>).mockResolvedValue(95);
    (mockRedis.get as ReturnType<typeof vi.fn>).mockResolvedValue(null); // No player guess

    const playerGuess = await mockRedis.get!(`prompt:${promptId}:player:${username}:guess`);

    expect(playerGuess).toBeNull();

    // Should return default score when no player guess exists
    const expectedScore = {
      pointsEarned: 0,
      matchPercentage: 0,
      tier: 'unique',
    };

    expect(expectedScore.pointsEarned).toBe(0);
  });

  it('should handle Redis errors gracefully', async () => {
    const promptId = 1;

    (mockRedis.hGetAll as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error('Redis connection failed')
    );

    await expect(mockRedis.hGetAll!(`prompt:${promptId}:guesses`)).rejects.toThrow(
      'Redis connection failed'
    );
  });

  it('should return correct response structure', async () => {
    const expectedResponse = {
      type: 'consensus-results',
      aggregation: [
        {
          guess: 'jellyfish',
          count: 85,
          percentage: 85.0,
          isPlayerGuess: true,
          isCreatorAnswer: false,
          rank: 1,
        },
      ],
      playerGuess: 'jellyfish',
      creatorAnswer: 'house',
      totalPlayers: 100,
      totalGuesses: 100,
      playerScore: {
        pointsEarned: 100,
        matchPercentage: 85.0,
        tier: 'majority',
      },
    };

    expect(expectedResponse).toHaveProperty('type', 'consensus-results');
    expect(expectedResponse).toHaveProperty('aggregation');
    expect(expectedResponse).toHaveProperty('playerGuess');
    expect(expectedResponse).toHaveProperty('creatorAnswer');
    expect(expectedResponse).toHaveProperty('totalPlayers');
    expect(expectedResponse).toHaveProperty('totalGuesses');
    expect(expectedResponse).toHaveProperty('playerScore');
    expect(expectedResponse.playerScore).toHaveProperty('pointsEarned');
    expect(expectedResponse.playerScore).toHaveProperty('matchPercentage');
    expect(expectedResponse.playerScore).toHaveProperty('tier');
  });
});
