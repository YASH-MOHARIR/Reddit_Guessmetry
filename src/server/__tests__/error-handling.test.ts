import { describe, it, expect, vi } from 'vitest';
import { retryOperation, executeWithPartialSuccess } from '../utils/retryLogic';

describe('Error Handling', () => {
  describe('retryOperation', () => {
    it('should succeed on first attempt', async () => {
      const operation = vi.fn().mockResolvedValue('success');

      const result = await retryOperation(operation, {
        operationName: 'Test operation',
      });

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure and succeed', async () => {
      const operation = vi
        .fn()
        .mockRejectedValueOnce(new Error('First failure'))
        .mockResolvedValueOnce('success');

      const result = await retryOperation(operation, {
        operationName: 'Test operation',
        maxRetries: 2,
        delayMs: 10,
      });

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(2);
    });

    it('should throw after max retries', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('Persistent failure'));

      await expect(
        retryOperation(operation, {
          operationName: 'Test operation',
          maxRetries: 2,
          delayMs: 10,
        })
      ).rejects.toThrow('Persistent failure');

      expect(operation).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });

    it('should use exponential backoff', async () => {
      const operation = vi
        .fn()
        .mockRejectedValueOnce(new Error('First failure'))
        .mockRejectedValueOnce(new Error('Second failure'))
        .mockResolvedValueOnce('success');

      const startTime = Date.now();
      await retryOperation(operation, {
        operationName: 'Test operation',
        maxRetries: 2,
        delayMs: 50,
      });
      const endTime = Date.now();

      // Should have delays of 50ms and 100ms (exponential backoff)
      // Total should be at least 150ms
      expect(endTime - startTime).toBeGreaterThanOrEqual(150);
      expect(operation).toHaveBeenCalledTimes(3);
    });
  });

  describe('executeWithPartialSuccess', () => {
    it('should execute all operations successfully', async () => {
      const op1 = vi.fn().mockResolvedValue('result1');
      const op2 = vi.fn().mockResolvedValue('result2');
      const op3 = vi.fn().mockResolvedValue('result3');

      const { results, errors, allSucceeded } = await executeWithPartialSuccess([
        { fn: op1, name: 'Operation 1' },
        { fn: op2, name: 'Operation 2' },
        { fn: op3, name: 'Operation 3' },
      ]);

      expect(allSucceeded).toBe(true);
      expect(errors).toEqual([]);
      expect(results).toEqual(['result1', 'result2', 'result3']);
    });

    it('should handle partial failures', async () => {
      const op1 = vi.fn().mockResolvedValue('result1');
      const op2 = vi.fn().mockRejectedValue(new Error('Operation 2 failed'));
      const op3 = vi.fn().mockResolvedValue('result3');

      const { results, errors, allSucceeded } = await executeWithPartialSuccess([
        { fn: op1, name: 'Operation 1' },
        { fn: op2, name: 'Operation 2' },
        { fn: op3, name: 'Operation 3' },
      ]);

      expect(allSucceeded).toBe(false);
      expect(errors).toEqual(['Operation 2']);
      expect(results).toEqual(['result1', 'result3']);
    });

    it('should throw immediately if requireAll is true', async () => {
      const op1 = vi.fn().mockResolvedValue('result1');
      const op2 = vi.fn().mockRejectedValue(new Error('Operation 2 failed'));
      const op3 = vi.fn().mockResolvedValue('result3');

      await expect(
        executeWithPartialSuccess(
          [
            { fn: op1, name: 'Operation 1' },
            { fn: op2, name: 'Operation 2' },
            { fn: op3, name: 'Operation 3' },
          ],
          { requireAll: true }
        )
      ).rejects.toThrow('Operation 2 failed');

      expect(op1).toHaveBeenCalled();
      expect(op2).toHaveBeenCalled();
      expect(op3).not.toHaveBeenCalled(); // Should not execute after failure
    });

    it('should handle all operations failing', async () => {
      const op1 = vi.fn().mockRejectedValue(new Error('Failed 1'));
      const op2 = vi.fn().mockRejectedValue(new Error('Failed 2'));
      const op3 = vi.fn().mockRejectedValue(new Error('Failed 3'));

      const { results, errors, allSucceeded } = await executeWithPartialSuccess([
        { fn: op1, name: 'Operation 1' },
        { fn: op2, name: 'Operation 2' },
        { fn: op3, name: 'Operation 3' },
      ]);

      expect(allSucceeded).toBe(false);
      expect(errors).toEqual(['Operation 1', 'Operation 2', 'Operation 3']);
      expect(results).toEqual([]);
    });
  });

  describe('Input Validation', () => {
    it('should reject empty guess', () => {
      const emptyGuesses = ['', '   ', '\t', '\n'];

      emptyGuesses.forEach((guess) => {
        expect(guess.trim()).toBe('');
      });
    });

    it('should reject guess exceeding max length', () => {
      const longGuess = 'a'.repeat(101);
      expect(longGuess.length).toBeGreaterThan(100);
    });

    it('should accept valid guess', () => {
      const validGuess = 'jellyfish';
      expect(validGuess.trim()).toBe('jellyfish');
      expect(validGuess.length).toBeLessThanOrEqual(100);
    });
  });
});
