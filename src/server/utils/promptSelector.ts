import type { Prompt } from '../../shared/types/prompt';
import type { RedisClient } from '@devvit/web/server';

/**
 * Select the next random prompt that hasn't been used in the current session
 * @param redis - Redis client instance
 * @param sessionId - Current game session ID
 * @param allPrompts - Array of all available prompts
 * @returns Selected prompt or null if all prompts have been used
 */
export async function selectNextPrompt(
  redis: RedisClient,
  sessionId: string,
  allPrompts: Prompt[]
): Promise<Prompt | null> {
  // Get used prompt IDs from Redis
  const usedIdsSet = await redis.zRange(`session:${sessionId}:used`, 0, -1);
  const usedIdNumbers = usedIdsSet.map((id) => parseInt(String(id), 10));

  // Filter available prompts (not yet used)
  const available = allPrompts.filter((p) => !usedIdNumbers.includes(p.id));

  // If all prompts have been used, return null (session complete)
  if (available.length === 0) {
    return null;
  }

  // Select random prompt from available ones
  const randomIndex = Math.floor(Math.random() * available.length);
  const selected = available[randomIndex];

  if (!selected) {
    return null;
  }

  // Mark prompt as used in Redis (using sorted set with timestamp as score)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (redis.zAdd as any)(`session:${sessionId}:used`, {
    member: selected.id.toString(),
    score: Date.now(),
  });

  return selected;
}
