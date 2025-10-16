import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { generateSessionId } from './sessionId.js';

describe('generateSessionId', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should generate a session ID with all required components', () => {
    const postId = 'abc123';
    const username = 'testuser';
    const mockTimestamp = 1234567890000;
    vi.setSystemTime(mockTimestamp);
    const sessionId = generateSessionId(postId, username);
    expect(sessionId).toContain(postId);
    expect(sessionId).toContain(username);
    expect(sessionId).toContain(mockTimestamp.toString());
  });

  it('should include postId username timestamp and random component separated by underscores', () => {
    const postId = 'post456';
    const username = 'player1';
    const sessionId = generateSessionId(postId, username);
    const parts = sessionId.split('_');
    expect(parts.length).toBe(4);
    expect(parts[0]).toBe(postId);
    expect(parts[1]).toBe(username);
    expect(parts[2]).toMatch(/^\d+$/);
    expect(parts[3]).toMatch(/^[a-z0-9]+$/);
  });

  it('should generate unique IDs for the same user and post at different times', () => {
    const postId = 'post789';
    const username = 'user123';
    vi.setSystemTime(1000000000000);
    const sessionId1 = generateSessionId(postId, username);
    vi.setSystemTime(1000000001000);
    const sessionId2 = generateSessionId(postId, username);
    expect(sessionId1).not.toBe(sessionId2);
  });

  it('should generate unique IDs even at the same timestamp due to random component', () => {
    const postId = 'post999';
    const username = 'user456';
    const mockTimestamp = 1500000000000;
    vi.setSystemTime(mockTimestamp);
    const originalRandom = Math.random;
    let callCount = 0;
    vi.spyOn(Math, 'random').mockImplementation(() => {
      callCount++;
      return callCount === 1 ? 0.123456789 : 0.987654321;
    });
    const sessionId1 = generateSessionId(postId, username);
    const sessionId2 = generateSessionId(postId, username);
    expect(sessionId1).not.toBe(sessionId2);
    Math.random = originalRandom;
  });

  it('should generate different IDs for different users on the same post', () => {
    const postId = 'sharedpost';
    const username1 = 'alice';
    const username2 = 'bob';
    const sessionId1 = generateSessionId(postId, username1);
    const sessionId2 = generateSessionId(postId, username2);
    expect(sessionId1).not.toBe(sessionId2);
    expect(sessionId1).toContain(username1);
    expect(sessionId2).toContain(username2);
  });

  it('should generate different IDs for the same user on different posts', () => {
    const postId1 = 'post001';
    const postId2 = 'post002';
    const username = 'sameuser';
    const sessionId1 = generateSessionId(postId1, username);
    const sessionId2 = generateSessionId(postId2, username);
    expect(sessionId1).not.toBe(sessionId2);
    expect(sessionId1).toContain(postId1);
    expect(sessionId2).toContain(postId2);
  });

  it('should handle special characters in username', () => {
    const postId = 'post123';
    const username = 'user-with_special.chars';
    const sessionId = generateSessionId(postId, username);
    expect(sessionId).toContain(postId);
    expect(sessionId).toContain(username);
    expect(sessionId.split('_').length).toBeGreaterThanOrEqual(4);
  });

  it('should generate a random component of expected length', () => {
    const postId = 'post';
    const username = 'user';
    const sessionId = generateSessionId(postId, username);
    const parts = sessionId.split('_');
    const randomPart = parts[3]!;
    expect(randomPart.length).toBe(7);
    expect(randomPart).toMatch(/^[a-z0-9]+$/);
  });

  it('should use current timestamp when called', () => {
    const postId = 'timetest';
    const username = 'timeuser';
    const mockTime = 1609459200000;
    vi.setSystemTime(mockTime);
    const sessionId = generateSessionId(postId, username);
    expect(sessionId).toContain(mockTime.toString());
  });

  it('should return a string', () => {
    const postId = 'post';
    const username = 'user';
    const sessionId = generateSessionId(postId, username);
    expect(typeof sessionId).toBe('string');
  });
});
