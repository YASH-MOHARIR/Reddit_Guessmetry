import type { RedisClient } from '@devvit/web/server';
import { normalizeGuess } from '../utils/guessNormalization';
import { calculateSimilarity } from '../utils/stringSimilarity';

const TTL_SECONDS = 24 * 60 * 60; // 24 hours

/**
 * Represents a grouped guess with its variants
 */
export type GroupedGuess = {
  primaryGuess: string;
  combinedCount: number;
  variants: Array<{ guess: string; count: number }>;
};

/**
 * Stores a guess in Redis and increments its count atomically
 * @param redis - Redis client instance
 * @param promptId - The prompt ID
 * @param guess - The raw guess string
 * @param sessionId - Optional prompt session ID (if not provided, uses promptId)
 * @returns The new count for this guess
 */
export async function storeGuess(
  redis: RedisClient,
  promptId: number,
  guess: string,
  sessionId?: string
): Promise<number> {
  try {
    const normalizedGuess = normalizeGuess(guess);
    // Use session ID if provided, otherwise fall back to promptId for backwards compatibility
    const key = sessionId ? `${sessionId}:guesses` : `prompt:${promptId}:guesses`;

    // Use HINCRBY for atomic increment
    const newCount = await redis.hIncrBy(key, normalizedGuess, 1);

    // Set TTL on the key (only needs to be done once, but safe to repeat)
    await redis.expire(key, TTL_SECONDS);

    return newCount;
  } catch (error) {
    console.error(
      `[Redis Error] Failed to store guess for prompt ${promptId}:`,
      error instanceof Error ? error.message : String(error),
      error instanceof Error ? error.stack : ''
    );
    throw new Error(
      `Failed to store guess: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Adds a player to the unique players set for a prompt
 * Uses a sorted set (zset) with timestamp as score since Redis sets aren't available
 * @param redis - Redis client instance
 * @param promptId - The prompt ID
 * @param username - The player's username
 * @param sessionId - Optional prompt session ID (if not provided, uses promptId)
 * @returns The new size of the players set
 */
export async function addPlayerToSet(
  redis: RedisClient,
  promptId: number,
  username: string,
  sessionId?: string
): Promise<number> {
  try {
    // Use session ID if provided, otherwise fall back to promptId for backwards compatibility
    const key = sessionId ? `${sessionId}:players` : `prompt:${promptId}:players`;

    // Use ZADD to add player to sorted set (automatically handles duplicates)
    // Using timestamp as score for ordering
    await redis.zAdd(key, {
      member: username,
      score: Date.now(),
    });

    // Set TTL on the key
    await redis.expire(key, TTL_SECONDS);

    // Get the size of the sorted set
    const size = await redis.zCard(key);

    return size;
  } catch (error) {
    console.error(
      `[Redis Error] Failed to add player to set for prompt ${promptId}:`,
      error instanceof Error ? error.message : String(error),
      error instanceof Error ? error.stack : ''
    );
    throw new Error(
      `Failed to add player: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Stores an individual player's guess for a prompt
 * @param redis - Redis client instance
 * @param promptId - The prompt ID
 * @param username - The player's username
 * @param guess - The raw guess string
 * @param sessionId - Optional prompt session ID (if not provided, uses promptId)
 */
export async function storePlayerGuess(
  redis: RedisClient,
  promptId: number,
  username: string,
  guess: string,
  sessionId?: string
): Promise<void> {
  try {
    const normalizedGuess = normalizeGuess(guess);
    // Use session ID if provided, otherwise fall back to promptId for backwards compatibility
    const key = sessionId
      ? `${sessionId}:player:${username}:guess`
      : `prompt:${promptId}:player:${username}:guess`;

    // Store the player's guess
    await redis.set(key, normalizedGuess, {
      expiration: new Date(Date.now() + TTL_SECONDS * 1000),
    });
  } catch (error) {
    console.error(
      `[Redis Error] Failed to store player guess for prompt ${promptId}, user ${username}:`,
      error instanceof Error ? error.message : String(error),
      error instanceof Error ? error.stack : ''
    );
    throw new Error(
      `Failed to store player guess: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Groups similar guesses together based on Levenshtein distance
 * @param guessesMap - Object mapping guess text to count
 * @param similarityThreshold - Minimum similarity percentage (default 85%)
 * @returns Array of grouped guesses with variants
 */
export function groupSimilarGuesses(
  guessesMap: Record<string, number>,
  similarityThreshold = 85
): GroupedGuess[] {
  const guesses = Object.entries(guessesMap).map(([guess, count]) => ({ guess, count }));
  
  // Sort by count descending to prioritize most common spellings
  guesses.sort((a, b) => b.count - a.count);
  
  const grouped: GroupedGuess[] = [];
  const processed = new Set<string>();
  
  for (const current of guesses) {
    if (processed.has(current.guess)) {
      continue;
    }
    
    // Start a new group with the current guess as primary
    const group: GroupedGuess = {
      primaryGuess: current.guess,
      combinedCount: current.count,
      variants: [{ guess: current.guess, count: current.count }],
    };
    
    processed.add(current.guess);
    
    // Find similar guesses to group with this one
    for (const other of guesses) {
      if (processed.has(other.guess)) {
        continue;
      }
      
      const similarity = calculateSimilarity(current.guess, other.guess);
      
      if (similarity >= similarityThreshold) {
        group.variants.push({ guess: other.guess, count: other.count });
        group.combinedCount += other.count;
        processed.add(other.guess);
      }
    }
    
    grouped.push(group);
  }
  
  return grouped;
}

/**
 * Retrieves all aggregated guesses for a prompt
 * @param redis - Redis client instance
 * @param promptId - The prompt ID
 * @param sessionId - Optional prompt session ID (if not provided, uses promptId)
 * @returns Object mapping guess text to count
 */
export async function getAggregatedGuesses(
  redis: RedisClient,
  promptId: number,
  sessionId?: string
): Promise<Record<string, number>> {
  try {
    // Use session ID if provided, otherwise fall back to promptId for backwards compatibility
    const key = sessionId ? `${sessionId}:guesses` : `prompt:${promptId}:guesses`;

    // Use HGETALL to fetch all guesses and counts
    const guesses = await redis.hGetAll(key);

    // Convert string values to numbers
    const result: Record<string, number> = {};
    for (const [guess, countStr] of Object.entries(guesses)) {
      result[guess] = parseInt(countStr, 10);
    }

    return result;
  } catch (error) {
    console.error(
      `[Redis Error] Failed to get aggregated guesses for prompt ${promptId}:`,
      error instanceof Error ? error.message : String(error),
      error instanceof Error ? error.stack : ''
    );
    throw new Error(
      `Failed to get aggregated guesses: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Gets the total number of unique players who guessed for a prompt
 * Uses zCard since we're using a sorted set for players
 * @param redis - Redis client instance
 * @param promptId - The prompt ID
 * @param sessionId - Optional prompt session ID (if not provided, uses promptId)
 * @returns The number of unique players
 */
export async function getTotalPlayers(
  redis: RedisClient,
  promptId: number,
  sessionId?: string
): Promise<number> {
  try {
    // Use session ID if provided, otherwise fall back to promptId for backwards compatibility
    const key = sessionId ? `${sessionId}:players` : `prompt:${promptId}:players`;

    // Use ZCARD to count unique players in sorted set
    const count = await redis.zCard(key);

    return count;
  } catch (error) {
    console.error(
      `[Redis Error] Failed to get total players for prompt ${promptId}:`,
      error instanceof Error ? error.message : String(error),
      error instanceof Error ? error.stack : ''
    );
    throw new Error(
      `Failed to get total players: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Gets a player's specific guess for a prompt
 * @param redis - Redis client instance
 * @param promptId - The prompt ID
 * @param username - The player's username
 * @param sessionId - Optional prompt session ID (if not provided, uses promptId)
 * @returns The player's guess or null if not found
 */
export async function getPlayerGuess(
  redis: RedisClient,
  promptId: number,
  username: string,
  sessionId?: string
): Promise<string | null> {
  try {
    // Use session ID if provided, otherwise fall back to promptId for backwards compatibility
    const key = sessionId
      ? `${sessionId}:player:${username}:guess`
      : `prompt:${promptId}:player:${username}:guess`;

    const guess = await redis.get(key);
    return guess ?? null;
  } catch (error) {
    console.error(
      `[Redis Error] Failed to get player guess for prompt ${promptId}, user ${username}:`,
      error instanceof Error ? error.message : String(error),
      error instanceof Error ? error.stack : ''
    );
    throw new Error(
      `Failed to get player guess: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Preserves final aggregation results for historical viewing
 * @param redis - Redis client instance
 * @param promptId - The prompt ID
 * @param sessionId - The prompt session ID
 * @param aggregationData - The final aggregation data to preserve
 */
export async function preserveFinalResults(
  redis: RedisClient,
  promptId: number,
  sessionId: string,
  aggregationData: {
    guesses: Record<string, number>;
    totalPlayers: number;
    totalGuesses: number;
  }
): Promise<void> {
  try {
    const key = `prompt:${promptId}:session:${sessionId}:final`;

    // Store as JSON string
    await redis.set(key, JSON.stringify(aggregationData), {
      expiration: new Date(Date.now() + TTL_SECONDS * 1000),
    });
  } catch (error) {
    console.error(
      `[Redis Error] Failed to preserve final results for prompt ${promptId}, session ${sessionId}:`,
      error instanceof Error ? error.message : String(error),
      error instanceof Error ? error.stack : ''
    );
    throw new Error(
      `Failed to preserve final results: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Retrieves preserved final results for historical viewing
 * @param redis - Redis client instance
 * @param promptId - The prompt ID
 * @param sessionId - The prompt session ID
 * @returns The preserved aggregation data or null if not found/expired
 */
export async function getFinalResults(
  redis: RedisClient,
  promptId: number,
  sessionId: string
): Promise<{
  guesses: Record<string, number>;
  totalPlayers: number;
  totalGuesses: number;
} | null> {
  try {
    const key = `prompt:${promptId}:session:${sessionId}:final`;

    const data = await redis.get(key);
    if (!data) {
      return null;
    }

    return JSON.parse(data);
  } catch (error) {
    console.error(
      `[Redis Error] Failed to get final results for prompt ${promptId}, session ${sessionId}:`,
      error instanceof Error ? error.message : String(error),
      error instanceof Error ? error.stack : ''
    );
    throw new Error(
      `Failed to get final results: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
