/**
 * Normalizes a guess by converting to lowercase and trimming whitespace
 * @param guess - The raw guess string from the user
 * @returns Normalized guess string
 */
export function normalizeGuess(guess: string): string {
  return guess.toLowerCase().trim();
}
