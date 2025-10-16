import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useConsensusPolling } from './useConsensusPolling';
import type { GuessAggregation } from '../../shared/types/game';

describe('useConsensusPolling', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('should initialize with default values', () => {
    const { result } = renderHook(() =>
      useConsensusPolling({ promptId: 1, enabled: false })
    );

    expect(result.current.aggregation).toEqual([]);
    expect(result.current.totalPlayers).toBe(0);
    expect(result.current.totalGuesses).toBe(0);
    expect(result.current.playerScore).toBeNull();
    expect(result.current.creatorAnswerData).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should not fetch when enabled is false', async () => {
    renderHook(() => useConsensusPolling({ promptId: 1, enabled: false }));

    await vi.advanceTimersByTimeAsync(5000);

    expect(global.fetch).not.toHaveBeenCalled();
  });


  it('should fetch immediately when enabled is true', async () => {
    const mockData = {
      aggregation: [{ guess: 'test', count: 5, percentage: 50 }],
      totalPlayers: 10,
      totalGuesses: 10,
      playerScore: { pointsEarned: 50, matchPercentage: 50, tier: 'majority' as const },
      creatorAnswerData: null,
    };

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    } as Response);

    const { result } = renderHook(() =>
      useConsensusPolling({ promptId: 1, enabled: true })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(global.fetch).toHaveBeenCalledWith('/api/consensus/get-results', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        promptId: 1,
        username: '',
      }),
    });
    expect(result.current.aggregation).toEqual(mockData.aggregation);
    expect(result.current.totalPlayers).toBe(10);
    expect(result.current.totalGuesses).toBe(10);
    expect(result.current.playerScore).toEqual(mockData.playerScore);
    expect(result.current.creatorAnswerData).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('should poll at specified interval', async () => {
    const mockData = {
      aggregation: [],
      totalPlayers: 0,
      totalGuesses: 0,
      playerScore: null,
      creatorAnswerData: null,
    };

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => mockData,
    } as Response);

    renderHook(() =>
      useConsensusPolling({ promptId: 1, enabled: true, interval: 2000 })
    );

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    // Advance by 2 seconds
    await vi.advanceTimersByTimeAsync(2000);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    // Advance by another 2 seconds
    await vi.advanceTimersByTimeAsync(2000);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(3);
    });
  });


  it('should use default interval of 2000ms when not specified', async () => {
    const mockData = {
      aggregation: [],
      totalPlayers: 0,
      totalGuesses: 0,
      playerScore: null,
      creatorAnswerData: null,
    };

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => mockData,
    } as Response);

    renderHook(() => useConsensusPolling({ promptId: 1, enabled: true }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    // Advance by default interval (2000ms)
    await vi.advanceTimersByTimeAsync(2000);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });

  it('should stop polling when enabled becomes false', async () => {
    const mockData = {
      aggregation: [],
      totalPlayers: 0,
      totalGuesses: 0,
      playerScore: null,
      creatorAnswerData: null,
    };

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => mockData,
    } as Response);

    const { rerender } = renderHook(
      ({ enabled }) => useConsensusPolling({ promptId: 1, enabled }),
      { initialProps: { enabled: true } }
    );

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    // Disable polling
    rerender({ enabled: false });

    const callCountBeforeAdvance = (global.fetch as ReturnType<typeof vi.fn>).mock.calls.length;

    // Advance time - should not trigger more calls
    await vi.advanceTimersByTimeAsync(5000);

    expect(global.fetch).toHaveBeenCalledTimes(callCountBeforeAdvance);
  });


  it('should handle fetch errors and set error state', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error('Network error')
    );

    const { result } = renderHook(() =>
      useConsensusPolling({ promptId: 1, enabled: true })
    );

    await waitFor(() => {
      expect(result.current.error).toBe('Network error');
    });

    expect(result.current.loading).toBe(false);
  });

  it('should handle non-ok response status', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      statusText: 'Not Found',
    } as Response);

    const { result } = renderHook(() =>
      useConsensusPolling({ promptId: 1, enabled: true })
    );

    await waitFor(() => {
      expect(result.current.error).toBe('Failed to fetch results: Not Found');
    });

    expect(result.current.loading).toBe(false);
  });

  it('should track consecutive failures', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error('Network error')
    );

    const { result } = renderHook(() =>
      useConsensusPolling({ promptId: 1, enabled: true, interval: 1000 })
    );

    // First failure
    await waitFor(() => {
      expect(result.current.error).toBe('Network error');
    });

    // Second failure
    await vi.advanceTimersByTimeAsync(1000);
    await waitFor(() => {
      expect(result.current.error).toBe('Network error');
    });

    // Third failure - should stop polling
    await vi.advanceTimersByTimeAsync(1000);
    await waitFor(() => {
      expect(result.current.error).toBe('Polling stopped after 3 consecutive failures');
    });

    const callCountAfterStop = (global.fetch as ReturnType<typeof vi.fn>).mock.calls.length;

    // Advance more time - should not make more calls
    await vi.advanceTimersByTimeAsync(5000);

    expect(global.fetch).toHaveBeenCalledTimes(callCountAfterStop);
  });


  it('should reset consecutive failures on successful fetch', async () => {
    let callCount = 0;
    (global.fetch as ReturnType<typeof vi.fn>).mockImplementation(() => {
      callCount++;
      if (callCount === 1 || callCount === 2) {
        return Promise.reject(new Error('Network error'));
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({
          aggregation: [],
          totalPlayers: 0,
          totalGuesses: 0,
          playerScore: null,
          creatorAnswerData: null,
        }),
      } as Response);
    });

    const { result } = renderHook(() =>
      useConsensusPolling({ promptId: 1, enabled: true, interval: 1000 })
    );

    // First failure
    await waitFor(() => {
      expect(result.current.error).toBe('Network error');
    });

    // Second failure
    await vi.advanceTimersByTimeAsync(1000);
    await waitFor(() => {
      expect(result.current.error).toBe('Network error');
    });

    // Third call succeeds - should reset failure count
    await vi.advanceTimersByTimeAsync(1000);
    await waitFor(() => {
      expect(result.current.error).toBeNull();
    });

    // Should continue polling after success
    await vi.advanceTimersByTimeAsync(1000);
    expect(global.fetch).toHaveBeenCalledTimes(4);
  });

  it('should cleanup interval on unmount', async () => {
    const mockData = {
      aggregation: [],
      totalPlayers: 0,
      totalGuesses: 0,
      playerScore: null,
      creatorAnswerData: null,
    };

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => mockData,
    } as Response);

    const { unmount } = renderHook(() =>
      useConsensusPolling({ promptId: 1, enabled: true, interval: 1000 })
    );

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    const callCountBeforeUnmount = (global.fetch as ReturnType<typeof vi.fn>).mock.calls.length;

    unmount();

    // Advance time after unmount - should not trigger more calls
    await vi.advanceTimersByTimeAsync(5000);

    expect(global.fetch).toHaveBeenCalledTimes(callCountBeforeUnmount);
  });


  it('should handle empty or missing data gracefully', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    } as Response);

    const { result } = renderHook(() =>
      useConsensusPolling({ promptId: 1, enabled: true })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.aggregation).toEqual([]);
    expect(result.current.totalPlayers).toBe(0);
    expect(result.current.totalGuesses).toBe(0);
    expect(result.current.playerScore).toBeNull();
    expect(result.current.creatorAnswerData).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('should update data when polling returns new results', async () => {
    const mockData1 = {
      aggregation: [{ guess: 'test1', count: 5, percentage: 50 }] as GuessAggregation[],
      totalPlayers: 10,
      totalGuesses: 10,
      playerScore: null,
      creatorAnswerData: null,
    };

    const mockData2 = {
      aggregation: [
        { guess: 'test1', count: 8, percentage: 40 },
        { guess: 'test2', count: 12, percentage: 60 },
      ] as GuessAggregation[],
      totalPlayers: 20,
      totalGuesses: 20,
      playerScore: null,
      creatorAnswerData: null,
    };

    let callCount = 0;
    (global.fetch as ReturnType<typeof vi.fn>).mockImplementation(() => {
      callCount++;
      return Promise.resolve({
        ok: true,
        json: async () => (callCount === 1 ? mockData1 : mockData2),
      } as Response);
    });

    const { result } = renderHook(() =>
      useConsensusPolling({ promptId: 1, enabled: true, interval: 1000 })
    );

    // First fetch
    await waitFor(() => {
      expect(result.current.aggregation).toEqual(mockData1.aggregation);
    });
    expect(result.current.totalPlayers).toBe(10);

    // Second fetch after interval
    await vi.advanceTimersByTimeAsync(1000);

    await waitFor(() => {
      expect(result.current.aggregation).toEqual(mockData2.aggregation);
    });
    expect(result.current.totalPlayers).toBe(20);
    expect(result.current.totalGuesses).toBe(20);
  });

  it('should set loading to true during fetch', async () => {
    let resolvePromise: (value: Response) => void;
    const fetchPromise = new Promise<Response>((resolve) => {
      resolvePromise = resolve;
    });

    (global.fetch as ReturnType<typeof vi.fn>).mockReturnValueOnce(fetchPromise);

    const { result } = renderHook(() =>
      useConsensusPolling({ promptId: 1, enabled: true })
    );

    // Should be loading immediately
    await waitFor(() => {
      expect(result.current.loading).toBe(true);
    });

    // Resolve the fetch
    resolvePromise!({
      ok: true,
      json: async () => ({
        aggregation: [],
        totalPlayers: 0,
        totalGuesses: 0,
        playerScore: null,
        creatorAnswerData: null,
      }),
    } as Response);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });

  it('should handle creatorAnswerData when provided', async () => {
    const mockCreatorAnswerData = {
      guess: 'house',
      count: 5,
      percentage: 5.0,
      isPlayerGuess: false,
      isCreatorAnswer: true,
      rank: 11,
    };

    const mockData = {
      aggregation: [
        { guess: 'jellyfish', count: 85, percentage: 85.0 },
        { guess: 'squid', count: 10, percentage: 10.0 },
      ] as GuessAggregation[],
      totalPlayers: 100,
      totalGuesses: 100,
      playerScore: { pointsEarned: 100, matchPercentage: 85.0, tier: 'majority' as const },
      creatorAnswerData: mockCreatorAnswerData,
    };

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    } as Response);

    const { result } = renderHook(() =>
      useConsensusPolling({ promptId: 1, enabled: true })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.creatorAnswerData).toEqual(mockCreatorAnswerData);
    expect(result.current.creatorAnswerData?.isCreatorAnswer).toBe(true);
    expect(result.current.creatorAnswerData?.rank).toBe(11);
  });
});
