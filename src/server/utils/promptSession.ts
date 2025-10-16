import type { RedisClient } from '@devvit/web/server';

const TTL_SECONDS = 24 * 60 * 60; // 24 hours

/**
 * Generate a unique prompt session ID
 * A prompt session represents a single instance of a prompt being played by multiple players
 * @param postId - The Reddit post ID
 * @param promptId - The prompt ID
 * @returns A unique prompt session ID string
 */
export function generatePromptSessionId(postId: string, promptId: number): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 9);
  return `prompt_session:${postId}:${promptId}:${timestamp}:${random}`;
}

/**
 * Get or create a prompt session for a given prompt
 * If an active session exists, return it. Otherwise, create a new one.
 * @param redis - Redis client instance
 * @param postId - The Reddit post ID
 * @param promptId - The prompt ID
 * @returns The prompt session ID
 */
export async function getOrCreatePromptSession(
  redis: RedisClient,
  postId: string,
  promptId: number
): Promise<string> {
  try {
    const activeSessionKey = `prompt:${promptId}:active_session`;
    
    // Check if there's an active session for this prompt
    const existingSession = await redis.get(activeSessionKey);
    
    if (existingSession) {
      // Return existing session
      return existingSession;
    }
    
    // Create new session
    const newSessionId = generatePromptSessionId(postId, promptId);
    
    // Store the active session ID with TTL
    await redis.set(activeSessionKey, newSessionId, {
      expiration: new Date(Date.now() + TTL_SECONDS * 1000),
    });
    
    // Store session metadata
    await redis.hSet(`${newSessionId}:meta`, {
      postId,
      promptId: promptId.toString(),
      createdAt: Date.now().toString(),
      status: 'active',
    });
    await redis.expire(`${newSessionId}:meta`, TTL_SECONDS);
    
    return newSessionId;
  } catch (error) {
    console.error(
      `[Redis Error] Failed to get or create prompt session for prompt ${promptId}:`,
      error instanceof Error ? error.message : String(error),
      error instanceof Error ? error.stack : ''
    );
    throw new Error(
      `Failed to get or create prompt session: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * End a prompt session and preserve its data
 * @param redis - Redis client instance
 * @param promptId - The prompt ID
 */
export async function endPromptSession(
  redis: RedisClient,
  promptId: number
): Promise<void> {
  try {
    const activeSessionKey = `prompt:${promptId}:active_session`;
    
    // Get the current session ID
    const sessionId = await redis.get(activeSessionKey);
    
    if (sessionId) {
      // Update session status to 'ended'
      await redis.hSet(`${sessionId}:meta`, {
        status: 'ended',
        endedAt: Date.now().toString(),
      });
      
      // Remove the active session pointer (data is preserved with TTL)
      await redis.del(activeSessionKey);
    }
  } catch (error) {
    console.error(
      `[Redis Error] Failed to end prompt session for prompt ${promptId}:`,
      error instanceof Error ? error.message : String(error),
      error instanceof Error ? error.stack : ''
    );
    throw new Error(
      `Failed to end prompt session: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Check if a prompt session is active
 * @param redis - Redis client instance
 * @param promptId - The prompt ID
 * @returns True if an active session exists
 */
export async function isPromptSessionActive(
  redis: RedisClient,
  promptId: number
): Promise<boolean> {
  try {
    const activeSessionKey = `prompt:${promptId}:active_session`;
    const sessionId = await redis.get(activeSessionKey);
    return sessionId !== null;
  } catch (error) {
    console.error(
      `[Redis Error] Failed to check prompt session status for prompt ${promptId}:`,
      error instanceof Error ? error.message : String(error)
    );
    return false;
  }
}
