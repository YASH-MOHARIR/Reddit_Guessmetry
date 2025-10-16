import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  generatePromptSessionId,
  getOrCreatePromptSession,
  endPromptSession,
  isPromptSessionActive,
} from './promptSession.js';
import type { RedisClient } from '@devvit/web/server';

describe('generatePromptSessionId', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should generate a prompt session ID with all required components', () => {
    const postId = 'abc123';
    const promptId = 42;
    const mockTimestamp = 1234567890000;
    vi.setSystemTime(mockTimestamp);

    const sessionId = generatePromptSessionId(postId, promptId);

    expect(sessionId).toContain('prompt_session');
    expect(sessionId).toContain(postId);
    expect(sessionId).toContain(promptId.toString());
    expect(sessionId).toContain(mockTimestamp.toString());
  });

  it('should generate unique IDs for the same prompt at different times', () => {
    const postId = 'post123';
    const promptId = 1;

    vi.setSystemTime(1000000000000);
    const sessionId1 = generatePromptSessionId(postId, promptId);

    vi.setSystemTime(1000000001000);
    const sessionId2 = generatePromptSessionId(postId, promptId);

    expect(sessionId1).not.toBe(sessionId2);
  });

  it('should generate unique IDs even at the same timestamp due to random component', () => {
    const postId = 'post456';
    const promptId = 2;
    const mockTimestamp = 1500000000000;
    vi.setSystemTime(mockTimestamp);

    const originalRandom = Math.random;
    let callCount = 0;
    vi.spyOn(Math, 'random').mockImplementation(() => {
      callCount++;
      return callCount === 1 ? 0.123456789 : 0.987654321;
    });

    const sessionId1 = generatePromptSessionId(postId, promptId);
    const sessionId2 = generatePromptSessionId(postId, promptId);

    expect(sessionId1).not.toBe(sessionId2);
    Math.random = originalRandom;
  });

  it('should generate different IDs for different prompts', () => {
    const postId = 'post789';
    const promptId1 = 1;
    const promptId2 = 2;

    const sessionId1 = generatePromptSessionId(postId, promptId1);
    const sessionId2 = generatePromptSessionId(postId, promptId2);

    expect(sessionId1).not.toBe(sessionId2);
    expect(sessionId1).toContain(promptId1.toString());
    expect(sessionId2).toContain(promptId2.toString());
  });

  it('should return a string', () => {
    const postId = 'post';
    const promptId = 1;
    const sessionId = generatePromptSessionId(postId, promptId);
    expect(typeof sessionId).toBe('string');
  });
});

describe('getOrCreatePromptSession', () => {
  let mockRedis: RedisClient;

  beforeEach(() => {
    mockRedis = {
      get: vi.fn(),
      set: vi.fn(),
      hSet: vi.fn(),
      expire: vi.fn(),
      del: vi.fn(),
    } as unknown as RedisClient;
  });

  it('should return existing session if one is active', async () => {
    const postId = 'post123';
    const promptId = 42;
    const existingSessionId = 'prompt_session:post123:42:1234567890000:abc123';

    vi.mocked(mockRedis.get).mockResolvedValue(existingSessionId);

    const result = await getOrCreatePromptSession(mockRedis, postId, promptId);

    expect(result).toBe(existingSessionId);
    expect(mockRedis.get).toHaveBeenCalledWith('prompt:42:active_session');
    expect(mockRedis.set).not.toHaveBeenCalled();
  });

  it('should create new session if none exists', async () => {
    const postId = 'post456';
    const promptId = 10;

    vi.mocked(mockRedis.get).mockResolvedValue(null);
    vi.mocked(mockRedis.set).mockResolvedValue('OK');
    vi.mocked(mockRedis.hSet).mockResolvedValue(0);
    vi.mocked(mockRedis.expire).mockResolvedValue(true);

    const result = await getOrCreatePromptSession(mockRedis, postId, promptId);

    expect(result).toContain('prompt_session');
    expect(result).toContain(postId);
    expect(result).toContain(promptId.toString());
    expect(mockRedis.get).toHaveBeenCalledWith('prompt:10:active_session');
    expect(mockRedis.set).toHaveBeenCalled();
    expect(mockRedis.hSet).toHaveBeenCalled();
    expect(mockRedis.expire).toHaveBeenCalled();
  });

  it('should store session metadata when creating new session', async () => {
    const postId = 'post789';
    const promptId = 5;

    vi.mocked(mockRedis.get).mockResolvedValue(null);
    vi.mocked(mockRedis.set).mockResolvedValue('OK');
    vi.mocked(mockRedis.hSet).mockResolvedValue(0);
    vi.mocked(mockRedis.expire).mockResolvedValue(true);

    await getOrCreatePromptSession(mockRedis, postId, promptId);

    expect(mockRedis.hSet).toHaveBeenCalledWith(
      expect.stringContaining(':meta'),
      expect.objectContaining({
        postId,
        promptId: promptId.toString(),
        status: 'active',
      })
    );
  });

  it('should set TTL on active session key', async () => {
    const postId = 'post111';
    const promptId = 7;

    vi.mocked(mockRedis.get).mockResolvedValue(null);
    vi.mocked(mockRedis.set).mockResolvedValue('OK');
    vi.mocked(mockRedis.hSet).mockResolvedValue(0);
    vi.mocked(mockRedis.expire).mockResolvedValue(true);

    await getOrCreatePromptSession(mockRedis, postId, promptId);

    expect(mockRedis.set).toHaveBeenCalledWith(
      'prompt:7:active_session',
      expect.any(String),
      expect.objectContaining({
        expiration: expect.any(Date),
      })
    );
  });

  it('should throw error if Redis operations fail', async () => {
    const postId = 'post222';
    const promptId = 8;

    vi.mocked(mockRedis.get).mockRejectedValue(new Error('Redis connection failed'));

    await expect(getOrCreatePromptSession(mockRedis, postId, promptId)).rejects.toThrow(
      'Failed to get or create prompt session'
    );
  });

  it('should ensure all players for same prompt get same session', async () => {
    const postId = 'post333';
    const promptId = 15;
    const sessionId = 'prompt_session:post333:15:1234567890000:xyz789';

    vi.mocked(mockRedis.get).mockResolvedValue(sessionId);

    const result1 = await getOrCreatePromptSession(mockRedis, postId, promptId);
    const result2 = await getOrCreatePromptSession(mockRedis, postId, promptId);

    expect(result1).toBe(sessionId);
    expect(result2).toBe(sessionId);
    expect(result1).toBe(result2);
  });
});

describe('endPromptSession', () => {
  let mockRedis: RedisClient;

  beforeEach(() => {
    mockRedis = {
      get: vi.fn(),
      hSet: vi.fn(),
      del: vi.fn(),
    } as unknown as RedisClient;
  });

  it('should mark session as ended and remove active pointer', async () => {
    const promptId = 42;
    const sessionId = 'prompt_session:post123:42:1234567890000:abc123';

    vi.mocked(mockRedis.get).mockResolvedValue(sessionId);
    vi.mocked(mockRedis.hSet).mockResolvedValue(0);
    vi.mocked(mockRedis.del).mockResolvedValue(1);

    await endPromptSession(mockRedis, promptId);

    expect(mockRedis.get).toHaveBeenCalledWith('prompt:42:active_session');
    expect(mockRedis.hSet).toHaveBeenCalledWith(
      `${sessionId}:meta`,
      expect.objectContaining({
        status: 'ended',
        endedAt: expect.any(String),
      })
    );
    expect(mockRedis.del).toHaveBeenCalledWith('prompt:42:active_session');
  });

  it('should handle case when no active session exists', async () => {
    const promptId = 10;

    vi.mocked(mockRedis.get).mockResolvedValue(null);

    await endPromptSession(mockRedis, promptId);

    expect(mockRedis.get).toHaveBeenCalledWith('prompt:10:active_session');
    expect(mockRedis.hSet).not.toHaveBeenCalled();
    expect(mockRedis.del).not.toHaveBeenCalled();
  });

  it('should throw error if Redis operations fail', async () => {
    const promptId = 5;

    vi.mocked(mockRedis.get).mockRejectedValue(new Error('Redis connection failed'));

    await expect(endPromptSession(mockRedis, promptId)).rejects.toThrow(
      'Failed to end prompt session'
    );
  });

  it('should preserve aggregation data after ending session', async () => {
    const promptId = 20;
    const sessionId = 'prompt_session:post456:20:1234567890000:xyz789';

    vi.mocked(mockRedis.get).mockResolvedValue(sessionId);
    vi.mocked(mockRedis.hSet).mockResolvedValue(0);
    vi.mocked(mockRedis.del).mockResolvedValue(1);

    await endPromptSession(mockRedis, promptId);

    // Verify that we only delete the active session pointer, not the data
    expect(mockRedis.del).toHaveBeenCalledWith('prompt:20:active_session');
    expect(mockRedis.del).toHaveBeenCalledTimes(1);
  });
});

describe('isPromptSessionActive', () => {
  let mockRedis: RedisClient;

  beforeEach(() => {
    mockRedis = {
      get: vi.fn(),
    } as unknown as RedisClient;
  });

  it('should return true if active session exists', async () => {
    const promptId = 42;
    const sessionId = 'prompt_session:post123:42:1234567890000:abc123';

    vi.mocked(mockRedis.get).mockResolvedValue(sessionId);

    const result = await isPromptSessionActive(mockRedis, promptId);

    expect(result).toBe(true);
    expect(mockRedis.get).toHaveBeenCalledWith('prompt:42:active_session');
  });

  it('should return false if no active session exists', async () => {
    const promptId = 10;

    vi.mocked(mockRedis.get).mockResolvedValue(null);

    const result = await isPromptSessionActive(mockRedis, promptId);

    expect(result).toBe(false);
    expect(mockRedis.get).toHaveBeenCalledWith('prompt:10:active_session');
  });

  it('should return false if Redis operation fails', async () => {
    const promptId = 5;

    vi.mocked(mockRedis.get).mockRejectedValue(new Error('Redis connection failed'));

    const result = await isPromptSessionActive(mockRedis, promptId);

    expect(result).toBe(false);
  });
});

describe('Session Isolation', () => {
  let mockRedis: RedisClient;

  beforeEach(() => {
    mockRedis = {
      get: vi.fn(),
      set: vi.fn(),
      hSet: vi.fn(),
      expire: vi.fn(),
      del: vi.fn(),
    } as unknown as RedisClient;
  });

  it('should create separate sessions for different prompts', async () => {
    const postId = 'post123';
    const promptId1 = 1;
    const promptId2 = 2;

    vi.mocked(mockRedis.get).mockResolvedValue(null);
    vi.mocked(mockRedis.set).mockResolvedValue('OK');
    vi.mocked(mockRedis.hSet).mockResolvedValue(0);
    vi.mocked(mockRedis.expire).mockResolvedValue(true);

    const session1 = await getOrCreatePromptSession(mockRedis, postId, promptId1);
    const session2 = await getOrCreatePromptSession(mockRedis, postId, promptId2);

    expect(session1).not.toBe(session2);
    expect(session1).toContain(promptId1.toString());
    expect(session2).toContain(promptId2.toString());
  });

  it('should create new session after previous one is ended', async () => {
    const postId = 'post456';
    const promptId = 10;
    const firstSessionId = 'prompt_session:post456:10:1000000000000:abc123';

    // First call: no active session, create new one
    vi.mocked(mockRedis.get).mockResolvedValueOnce(null);
    vi.mocked(mockRedis.set).mockResolvedValue('OK');
    vi.mocked(mockRedis.hSet).mockResolvedValue(0);
    vi.mocked(mockRedis.expire).mockResolvedValue(true);

    const session1 = await getOrCreatePromptSession(mockRedis, postId, promptId);

    // End the session
    vi.mocked(mockRedis.get).mockResolvedValueOnce(firstSessionId);
    vi.mocked(mockRedis.del).mockResolvedValue(1);
    await endPromptSession(mockRedis, promptId);

    // Second call: no active session (was ended), create new one
    vi.mocked(mockRedis.get).mockResolvedValueOnce(null);
    const session2 = await getOrCreatePromptSession(mockRedis, postId, promptId);

    expect(session1).not.toBe(session2);
  });
});
