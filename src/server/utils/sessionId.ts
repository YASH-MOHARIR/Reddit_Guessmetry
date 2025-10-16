/**
 * Generate a unique session ID for a game session
 * @param postId - The Reddit post ID
 * @param username - The Reddit username
 * @returns A unique session ID string
 */
export function generateSessionId(postId: string, username: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 9);
  return `${postId}_${username}_${timestamp}_${random}`;
}
