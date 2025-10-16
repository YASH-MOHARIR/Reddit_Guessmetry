/**
 * Calculate the Levenshtein distance between two strings
 * Returns the minimum number of single-character edits needed to change one string into the other
 */
function levenshteinDistance(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;

  // Create a 2D array for dynamic programming
  const dp: number[][] = Array.from({ length: len1 + 1 }, () =>
    Array.from({ length: len2 + 1 }, () => 0)
  );

  // Initialize first row and column
  for (let i = 0; i <= len1; i++) {
    dp[i]![0] = i;
  }
  for (let j = 0; j <= len2; j++) {
    dp[0]![j] = j;
  }

  // Fill the dp table
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i]![j] = dp[i - 1]![j - 1]!;
      } else {
        dp[i]![j] = Math.min(
          dp[i - 1]![j]! + 1, // deletion
          dp[i]![j - 1]! + 1, // insertion
          dp[i - 1]![j - 1]! + 1 // substitution
        );
      }
    }
  }

  return dp[len1]![len2]!;
}

/**
 * Calculate similarity percentage between two strings using Levenshtein distance
 * @param str1 - First string to compare
 * @param str2 - Second string to compare
 * @returns Similarity percentage (0-100)
 */
export function calculateSimilarity(str1: string, str2: string): number {
  // Normalize strings (lowercase and trim)
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();

  // Handle edge cases
  if (s1 === s2) return 100;
  if (s1.length === 0 && s2.length === 0) return 100;
  if (s1.length === 0 || s2.length === 0) return 0;

  // Calculate Levenshtein distance
  const distance = levenshteinDistance(s1, s2);
  const maxLength = Math.max(s1.length, s2.length);

  // Return similarity percentage (0-100)
  return ((maxLength - distance) / maxLength) * 100;
}
