/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { selectNextPrompt } from './promptSelector.js';
import type { Prompt } from '../../shared/types/prompt.js';
import type { RedisClient } from '@devvit/web/server';

// Mock prompts for testing
const mockPrompts: Prompt[] = [
  {
    id: 1,
    promptText: 'A triangle on a square',
    answer: 'house',
    alternativeAnswers: ['home'],
    difficulty: 'easy',
    category: 'everyday',
  },
  {
    id: 2,
    promptText: 'A circle on a rectangle',
    answer: 'tree',
    alternativeAnswers: ['plant'],
    difficulty: 'easy',
    category: 'everyday',
  },
  {
    id: 3,
    promptText: 'Two circles connected',
    answer: 'dumbbell',
    alternativeAnswers: ['weight'],
    difficulty: 'easy',
    category: 'everyday',
  },
];

// Create a mock Redis client
function createMockRedis(): RedisClient {
  const storage = new Map<string, Array<string>>();

  return {
    zRange: vi.fn(async (key: string) => {
      return storage.get(key) || [];
    }),
    zAdd: vi.fn(async (key: string, member: { member: string; score: number }) => {
      if (!storage.has(key)) {
        storage.set(key, []);
      }
      const arr = storage.get(key)!;
      if (!arr.includes(member.member)) {
        arr.push(member.member);
      }
      return arr.length;
    }),
  } as unknown as RedisClient;
}

describe('selectNextPrompt', () => {
  let mockRedis: RedisClient;
  const sessionId = 'test-session-123';

  beforeEach(() => {
    mockRedis = createMockRedis();
  });

  describe('basic functionality', () => {
    it('should return a prompt when none have been used', async () => {
      const prompt = await selectNextPrompt(mockRedis, sessionId, mockPrompts);

      expect(prompt).not.toBeNull();
      expect(mockPrompts).toContainEqual(prompt);
    });

    it('should mark the selected prompt as used in Redis', async () => {
      const prompt = await selectNextPrompt(mockRedis, sessionId, mockPrompts);

      expect(mockRedis.zAdd).toHaveBeenCalledWith(
        `session:${sessionId}:used`,
        expect.objectContaining({
          member: prompt!.id.toString(),
          score: expect.any(Number),
        })
      );
    });

    it('should return a prompt that has not been used yet', async () => {
      // Manually mark prompt 1 as used

      await (mockRedis.zAdd as any)(`session:${sessionId}:used`, {
        member: '1',
        score: Date.now(),
      });

      const prompt = await selectNextPrompt(mockRedis, sessionId, mockPrompts);

      expect(prompt).not.toBeNull();
      expect(prompt!.id).not.toBe(1);
      expect([2, 3]).toContain(prompt!.id);
    });
  });

  describe('prompt exhaustion', () => {
    it('should return null when all prompts have been used', async () => {
      // Mark all prompts as used
      await (mockRedis.zAdd as any)(`session:${sessionId}:used`, {
        member: '1',
        score: Date.now(),
      });
      await (mockRedis.zAdd as any)(`session:${sessionId}:used`, {
        member: '2',
        score: Date.now(),
      });
      await (mockRedis.zAdd as any)(`session:${sessionId}:used`, {
        member: '3',
        score: Date.now(),
      });

      const prompt = await selectNextPrompt(mockRedis, sessionId, mockPrompts);

      expect(prompt).toBeNull();
    });

    it('should return the last available prompt when only one remains', async () => {
      // Mark prompts 1 and 2 as used
      await (mockRedis.zAdd as any)(`session:${sessionId}:used`, {
        member: '1',
        score: Date.now(),
      });
      await (mockRedis.zAdd as any)(`session:${sessionId}:used`, {
        member: '2',
        score: Date.now(),
      });

      const prompt = await selectNextPrompt(mockRedis, sessionId, mockPrompts);

      expect(prompt).not.toBeNull();
      expect(prompt!.id).toBe(3);
    });
  });

  describe('random selection', () => {
    it('should select different prompts over multiple calls', async () => {
      const selectedIds = new Set<number>();

      // Select prompts until we get at least 2 different ones or run out
      for (let i = 0; i < 10 && selectedIds.size < 2; i++) {
        const freshRedis = createMockRedis();
        const prompt = await selectNextPrompt(freshRedis, `session-${i}`, mockPrompts);
        if (prompt) {
          selectedIds.add(prompt.id);
        }
      }

      // With 3 prompts and 10 attempts, we should get at least 2 different ones
      expect(selectedIds.size).toBeGreaterThanOrEqual(2);
    });
  });

  describe('session isolation', () => {
    it('should track used prompts separately for different sessions', async () => {
      const session1 = 'session-1';
      const session2 = 'session-2';

      // Use prompt in session 1
      await selectNextPrompt(mockRedis, session1, mockPrompts);

      // Session 2 should still have all prompts available
      const prompt = await selectNextPrompt(mockRedis, session2, mockPrompts);

      expect(prompt).not.toBeNull();
      expect(mockRedis.zRange).toHaveBeenCalledWith(`session:${session2}:used`, 0, -1);
    });
  });

  describe('edge cases', () => {
    it('should handle empty prompts array', async () => {
      const prompt = await selectNextPrompt(mockRedis, sessionId, []);

      expect(prompt).toBeNull();
    });

    it('should handle single prompt array', async () => {
      const singlePrompt = [mockPrompts[0]!];
      const prompt = await selectNextPrompt(mockRedis, sessionId, singlePrompt);

      expect(prompt).not.toBeNull();
      expect(prompt!.id).toBe(1);
    });

    it('should handle prompts with non-sequential IDs', async () => {
      const nonSequentialPrompts: Prompt[] = [
        { ...mockPrompts[0]!, id: 10 },
        { ...mockPrompts[1]!, id: 25 },
        { ...mockPrompts[2]!, id: 100 },
      ];

      const prompt = await selectNextPrompt(mockRedis, sessionId, nonSequentialPrompts);

      expect(prompt).not.toBeNull();
      expect([10, 25, 100]).toContain(prompt!.id);
    });
  });

  describe('requirements validation', () => {
    it('should fetch unused prompts from Redis (Requirement 1.1)', async () => {
      await selectNextPrompt(mockRedis, sessionId, mockPrompts);

      expect(mockRedis.zRange).toHaveBeenCalledWith(`session:${sessionId}:used`, 0, -1);
    });

    it('should handle prompt exhaustion scenario (Requirement 12.4, 12.5)', async () => {
      // Mark all prompts as used
      for (const prompt of mockPrompts) {
        await (mockRedis.zAdd as any)(`session:${sessionId}:used`, {
          member: prompt.id.toString(),
          score: Date.now(),
        });
      }

      const result = await selectNextPrompt(mockRedis, sessionId, mockPrompts);

      expect(result).toBeNull();
    });

    it('should skip already used prompts (Requirement 12.4)', async () => {
      // Use first prompt
      const firstPrompt = await selectNextPrompt(mockRedis, sessionId, mockPrompts);
      expect(firstPrompt).not.toBeNull();

      // Use second prompt
      const secondPrompt = await selectNextPrompt(mockRedis, sessionId, mockPrompts);
      expect(secondPrompt).not.toBeNull();

      // Ensure they are different
      expect(firstPrompt!.id).not.toBe(secondPrompt!.id);
    });
  });
});
