/**
 * Retry logic utility for Redis operations
 */

export type RetryOptions = {
  maxRetries?: number;
  delayMs?: number;
  operationName?: string;
};

/**
 * Retry an async operation with exponential backoff
 */
export async function retryOperation<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const { maxRetries = 2, delayMs = 100, operationName = 'Operation' } = options;

  let lastError: Error | unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      if (attempt < maxRetries) {
        const delay = delayMs * Math.pow(2, attempt); // Exponential backoff
        console.warn(
          `[Retry] ${operationName} failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${delay}ms...`,
          error instanceof Error ? error.message : String(error)
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
      } else {
        console.error(
          `[Retry] ${operationName} failed after ${maxRetries + 1} attempts:`,
          error instanceof Error ? error.message : String(error),
          error instanceof Error ? error.stack : ''
        );
      }
    }
  }

  throw lastError;
}

/**
 * Execute multiple operations with partial success handling
 */
export async function executeWithPartialSuccess<T>(
  operations: Array<{ fn: () => Promise<T>; name: string }>,
  options: { requireAll?: boolean } = {}
): Promise<{ results: T[]; errors: string[]; allSucceeded: boolean }> {
  const { requireAll = false } = options;
  const results: T[] = [];
  const errors: string[] = [];

  for (const { fn, name } of operations) {
    try {
      const result = await retryOperation(fn, { operationName: name });
      results.push(result);
    } catch (error) {
      errors.push(name);
      console.error(
        `[Partial Success] ${name} failed:`,
        error instanceof Error ? error.message : String(error)
      );

      if (requireAll) {
        throw error;
      }
    }
  }

  const allSucceeded = errors.length === 0;

  return { results, errors, allSucceeded };
}
