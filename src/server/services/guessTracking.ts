import type { RedisClient } from '@devvit/web/server';

const TTL_SECONDS = 30 * 24 * 60 * 60; // 30 days

/**
 * Mark a user as having guessed on a post
 * @param redis - Redis client instance
 * @param postId - The Reddit post ID
 * @param username - The username of the player
 * @returns Promise that resolves when marking is complete
 */
export async function markUserAsGuessed(
  redis: RedisClient,
  postId: string,
  username: string
): Promise<void> {
  try {
    const key = `post:${postId}:player:${username}:guessed`;
    const expirationDate = new Date(Date.now() + TTL_SECONDS * 1000);

    await redis.set(key, '1', {
      expiration: expirationDate,
    });

    console.log(`[Guess Tracking] Marked user ${username} as guessed on post ${postId}`);
  } catch (error) {
    console.error(
      `[Guess Tracking Error] Failed to mark user ${username} as guessed on post ${postId}:`,
      error instanceof Error ? error.message : String(error),
      error instanceof Error ? error.stack : ''
    );
    throw new Error(
      `Failed to mark user as guessed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Check if a user has already guessed on a post
 * @param redis - Redis client instance
 * @param postId - The Reddit post ID
 * @param username - The username of the player
 * @returns Promise that resolves to true if user has guessed, false otherwise
 */
export async function hasUserGuessed(
  redis: RedisClient,
  postId: string,
  username: string
): Promise<boolean> {
  try {
    const key = `post:${postId}:player:${username}:guessed`;
    const value = await redis.get(key);

    return value !== null;
  } catch (error) {
    console.error(
      `[Guess Tracking Error] Failed to check if user ${username} has guessed on post ${postId}:`,
      error instanceof Error ? error.message : String(error)
    );
    // Return false on error to allow user to attempt guess
    return false;
  }
}
