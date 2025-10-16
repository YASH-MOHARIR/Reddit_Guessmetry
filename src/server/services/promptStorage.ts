import type { RedisClient } from '@devvit/web/server';

const TTL_SECONDS = 30 * 24 * 60 * 60; // 30 days

export type CustomPrompt = {
  postId: string;
  description: string;
  answer: string;
  createdBy: string;
  createdAt: number;
};

/**
 * Store a custom prompt for a post
 * @param redis - Redis client instance
 * @param postId - The Reddit post ID
 * @param description - The geometric description
 * @param answer - The correct answer
 * @param createdBy - Username of the creator
 * @returns Promise that resolves when storage is complete
 */
export async function storeCustomPrompt(
  redis: RedisClient,
  postId: string,
  description: string,
  answer: string,
  createdBy: string
): Promise<void> {
  try {
    const createdAt = Date.now();
    const expirationDate = new Date(Date.now() + TTL_SECONDS * 1000);

    // Store description
    await redis.set(`post:${postId}:prompt:description`, description, {
      expiration: expirationDate,
    });

    // Store answer
    await redis.set(`post:${postId}:prompt:answer`, answer, {
      expiration: expirationDate,
    });

    // Store metadata as hash
    await redis.hSet(`post:${postId}:prompt:meta`, {
      createdBy,
      createdAt: createdAt.toString(),
      postId,
    });
    await redis.expire(`post:${postId}:prompt:meta`, TTL_SECONDS);

    console.log(`[Prompt Storage] Stored custom prompt for post ${postId}`);
  } catch (error) {
    console.error(
      `[Prompt Storage Error] Failed to store prompt for post ${postId}:`,
      error instanceof Error ? error.message : String(error),
      error instanceof Error ? error.stack : ''
    );
    throw new Error(
      `Failed to store custom prompt: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Retrieve a custom prompt for a post
 * @param redis - Redis client instance
 * @param postId - The Reddit post ID
 * @returns Promise that resolves to the custom prompt or null if not found
 */
export async function getCustomPrompt(
  redis: RedisClient,
  postId: string
): Promise<CustomPrompt | null> {
  try {
    // Fetch description and answer
    const description = await redis.get(`post:${postId}:prompt:description`);
    const answer = await redis.get(`post:${postId}:prompt:answer`);

    // If either is missing, prompt doesn't exist
    if (!description || !answer) {
      console.log(`[Prompt Storage] No custom prompt found for post ${postId}`);
      return null;
    }

    // Fetch metadata
    const meta = await redis.hGetAll(`post:${postId}:prompt:meta`);

    return {
      postId,
      description,
      answer,
      createdBy: meta.createdBy || 'unknown',
      createdAt: meta.createdAt ? parseInt(meta.createdAt, 10) : Date.now(),
    };
  } catch (error) {
    console.error(
      `[Prompt Storage Error] Failed to retrieve prompt for post ${postId}:`,
      error instanceof Error ? error.message : String(error),
      error instanceof Error ? error.stack : ''
    );
    throw new Error(
      `Failed to retrieve custom prompt: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
