import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useGame } from './useGame';

// Mock fetch
const mockFetch = vi.fn();
// eslint-disable-next-line no-undef
(global as typeof globalThis).fetch = mockFetch;

describe('useGame', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useGame());

    expect(result.current.state.phase).toBe('home');
    expect(result.current.state.score).toBe(0);
    expect(result.current.state.roundsCompleted).toBe(0);
    expect(result.current.state.currentPrompt).toBeNull();
    expect(result.current.state.sessionId).toBeNull();
    expect(result.current.state.loading).toBe(false);
    expect(result.current.state.error).toBeNull();
  });

  describe('init', () => {
    it('should initialize game with user context', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          type: 'init',
          postId: 'post123',
          username: 'testuser',
        }),
      });

      const { result } = renderHook(() => useGame());

      await act(async () => {
        await result.current.init();
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/init');
      expect(result.current.state.postId).toBe('post123');
      expect(result.current.state.username).toBe('testuser');
      expect(result.current.state.loading).toBe(false);
    });

    it('should handle init errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
      });

      const { result } = renderHook(() => useGame());

      await act(async () => {
        await result.current.init();
      });

      expect(result.current.state.phase).toBe('error');
      expect(result.current.state.error).toBeTruthy();
    });
  });

  describe('startGame', () => {
    it('should start a new game session', async () => {
      const { result } = renderHook(() => useGame());

      // Set postId first
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          type: 'init',
          postId: 'post123',
          username: 'testuser',
        }),
      });

      await act(async () => {
        await result.current.init();
      });

      // Start game
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          type: 'game-start',
          sessionId: 'session123',
          username: 'testuser',
        }),
      });

      // Mock first prompt fetch (now happens inside startGame)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          type: 'next-prompt',
          prompt: {
            id: 1,
            promptText: 'Test prompt',
            difficulty: 'easy',
            category: 'everyday',
          },
        }),
      });

      await act(async () => {
        await result.current.startGame();
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/game/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId: 'post123' }),
      });
      expect(result.current.state.sessionId).toBe('session123');
      expect(result.current.state.phase).toBe('display');
      expect(result.current.state.score).toBe(0);
      expect(result.current.state.roundsCompleted).toBe(0);
      expect(result.current.state.currentPrompt?.id).toBe(1);
    });

    it('should handle start game errors', async () => {
      const { result } = renderHook(() => useGame());

      mockFetch.mockResolvedValueOnce({
        ok: false,
      });

      await act(async () => {
        await result.current.startGame();
      });

      expect(result.current.state.phase).toBe('error');
      expect(result.current.state.error).toBeTruthy();
    });
  });

  describe('fetchNextPrompt', () => {
    it('should fetch and load next prompt', async () => {
      const { result } = renderHook(() => useGame());

      // Setup session
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          type: 'init',
          postId: 'post123',
          username: 'testuser',
        }),
      });

      await act(async () => {
        await result.current.init();
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          type: 'game-start',
          sessionId: 'session123',
          username: 'testuser',
        }),
      });

      await act(async () => {
        await result.current.startGame();
      });

      // Fetch prompt
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          type: 'next-prompt',
          prompt: {
            id: 1,
            promptText: 'A circle on top of a rectangle',
            difficulty: 'easy',
            category: 'everyday',
          },
        }),
      });

      await act(async () => {
        await result.current.fetchNextPrompt();
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/game/next-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: 'session123' }),
      });
      expect(result.current.state.currentPrompt).toEqual({
        id: 1,
        promptText: 'A circle on top of a rectangle',
        difficulty: 'easy',
        category: 'everyday',
        answer: '',
        alternativeAnswers: [],
      });
      expect(result.current.state.usedPromptIds).toContain(1);
    });

    it('should handle fetch prompt errors', async () => {
      const { result } = renderHook(() => useGame());

      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          status: 'error',
          message: 'No prompts available',
        }),
      });

      await act(async () => {
        await result.current.fetchNextPrompt();
      });

      expect(result.current.state.phase).toBe('error');
      expect(result.current.state.error).toBe('No prompts available');
    });
  });

  describe('submitGuess', () => {
    it('should submit guess and transition to results phase', async () => {
      const { result } = renderHook(() => useGame());

      // Setup game with prompt
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          type: 'init',
          postId: 'post123',
          username: 'testuser',
        }),
      });

      await act(async () => {
        await result.current.init();
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          type: 'game-start',
          sessionId: 'session123',
          username: 'testuser',
        }),
      });

      await act(async () => {
        await result.current.startGame();
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          type: 'next-prompt',
          prompt: {
            id: 1,
            promptText: 'A circle on top of a rectangle',
            difficulty: 'easy',
            category: 'everyday',
          },
        }),
      });

      await act(async () => {
        await result.current.fetchNextPrompt();
      });

      // Submit guess
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          type: 'guess-result',
          isCorrect: true,
          isClose: false,
          correctAnswer: 'tree',
          pointsEarned: 10,
          totalScore: 10,
        }),
      });

      await act(async () => {
        await result.current.submitGuess('tree');
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/game/submit-guess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: 'session123',
          promptId: 1,
          guess: 'tree',
        }),
      });
      expect(result.current.state.phase).toBe('results');
      expect(result.current.state.score).toBe(10);
      expect(result.current.state.roundsCompleted).toBe(1);
      expect(result.current.state.playerGuess).toBe('tree');
      expect(result.current.state.currentPrompt?.answer).toBe('tree');
    });

    it('should handle submit guess errors', async () => {
      const { result } = renderHook(() => useGame());

      mockFetch.mockResolvedValueOnce({
        ok: false,
      });

      await act(async () => {
        await result.current.submitGuess('test');
      });

      expect(result.current.state.phase).toBe('error');
      expect(result.current.state.error).toBeTruthy();
    });

    it('should handle missing prompt error', async () => {
      const { result } = renderHook(() => useGame());

      await act(async () => {
        await result.current.submitGuess('test');
      });

      expect(result.current.state.phase).toBe('error');
      expect(result.current.state.error).toBe('No prompt available');
    });
  });

  describe('phase transitions', () => {
    it('should transition to display phase', () => {
      const { result } = renderHook(() => useGame());

      act(() => {
        result.current.startDisplayPhase();
      });

      expect(result.current.state.phase).toBe('display');
      expect(result.current.state.playerGuess).toBeNull();
    });

    it('should transition to guess phase', () => {
      const { result } = renderHook(() => useGame());

      act(() => {
        result.current.startGuessPhase();
      });

      expect(result.current.state.phase).toBe('guess');
    });

    it('should transition to next round', () => {
      const { result } = renderHook(() => useGame());

      // Set some state first
      act(() => {
        result.current.startGuessPhase();
      });

      act(() => {
        result.current.nextRound();
      });

      expect(result.current.state.phase).toBe('display');
      expect(result.current.state.playerGuess).toBeNull();
      expect(result.current.state.currentPrompt).toBeNull();
    });
  });

  describe('reducer state transitions', () => {
    it('should handle START_GAME action', async () => {
      const { result } = renderHook(() => useGame());

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          type: 'game-start',
          sessionId: 'session123',
          username: 'testuser',
        }),
      });

      // Mock first prompt fetch (now happens inside startGame)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          type: 'next-prompt',
          prompt: {
            id: 1,
            promptText: 'Test prompt',
            difficulty: 'easy',
            category: 'everyday',
          },
        }),
      });

      await act(async () => {
        await result.current.startGame();
      });

      expect(result.current.state.sessionId).toBe('session123');
      expect(result.current.state.phase).toBe('display');
      expect(result.current.state.score).toBe(0);
      expect(result.current.state.roundsCompleted).toBe(0);
      expect(result.current.state.usedPromptIds).toEqual([1]); // First prompt is now loaded
    });

    it('should track used prompt IDs', async () => {
      const { result } = renderHook(() => useGame());

      // Setup
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          type: 'init',
          postId: 'post123',
          username: 'testuser',
        }),
      });

      await act(async () => {
        await result.current.init();
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          type: 'game-start',
          sessionId: 'session123',
          username: 'testuser',
        }),
      });

      await act(async () => {
        await result.current.startGame();
      });

      // Fetch first prompt
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          type: 'next-prompt',
          prompt: {
            id: 1,
            promptText: 'Prompt 1',
            difficulty: 'easy',
            category: 'everyday',
          },
        }),
      });

      await act(async () => {
        await result.current.fetchNextPrompt();
      });

      expect(result.current.state.usedPromptIds).toEqual([1]);

      // Fetch second prompt
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          type: 'next-prompt',
          prompt: {
            id: 2,
            promptText: 'Prompt 2',
            difficulty: 'medium',
            category: 'animals',
          },
        }),
      });

      await act(async () => {
        await result.current.fetchNextPrompt();
      });

      expect(result.current.state.usedPromptIds).toEqual([1, 2]);
    });
  });

  describe('mode-specific API calls', () => {
    it('should use /api/game/submit-guess endpoint in classic mode', async () => {
      const { result } = renderHook(() => useGame());

      // Setup game with prompt
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          type: 'init',
          postId: 'post123',
          username: 'testuser',
        }),
      });

      await act(async () => {
        await result.current.init();
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          type: 'game-start',
          sessionId: 'session123',
          username: 'testuser',
        }),
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          type: 'next-prompt',
          prompt: {
            id: 1,
            promptText: 'Test prompt',
            difficulty: 'easy',
            category: 'everyday',
          },
        }),
      });

      await act(async () => {
        await result.current.startGame();
      });

      // Submit guess in classic mode
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          type: 'guess-result',
          isCorrect: true,
          isClose: false,
          correctAnswer: 'tree',
          pointsEarned: 10,
          totalScore: 10,
        }),
      });

      await act(async () => {
        await result.current.submitGuess('tree', 'classic');
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/game/submit-guess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: 'session123',
          promptId: 1,
          guess: 'tree',
        }),
      });
      expect(result.current.state.phase).toBe('results');
      expect(result.current.state.score).toBe(10);
    });

    it('should use /api/consensus/submit-guess endpoint in consensus mode', async () => {
      const { result } = renderHook(() => useGame());

      // Setup game with prompt
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          type: 'init',
          postId: 'post123',
          username: 'testuser',
        }),
      });

      await act(async () => {
        await result.current.init();
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          type: 'game-start',
          sessionId: 'session123',
          username: 'testuser',
        }),
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          type: 'next-prompt',
          prompt: {
            id: 1,
            promptText: 'Test prompt',
            difficulty: 'easy',
            category: 'everyday',
            answer: 'tree',
          },
        }),
      });

      await act(async () => {
        await result.current.startGame();
      });

      // Submit guess in consensus mode
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          type: 'consensus-guess-submitted',
          success: true,
          message: 'Guess submitted successfully',
        }),
      });

      await act(async () => {
        await result.current.submitGuess('jellyfish', 'consensus');
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/consensus/submit-guess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: 'session123',
          promptId: 1,
          guess: 'jellyfish',
        }),
      });
      expect(result.current.state.phase).toBe('results');
      expect(result.current.state.playerGuess).toBe('jellyfish');
    });

    it('should default to classic mode when mode is not specified', async () => {
      const { result } = renderHook(() => useGame());

      // Setup game with prompt
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          type: 'init',
          postId: 'post123',
          username: 'testuser',
        }),
      });

      await act(async () => {
        await result.current.init();
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          type: 'game-start',
          sessionId: 'session123',
          username: 'testuser',
        }),
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          type: 'next-prompt',
          prompt: {
            id: 1,
            promptText: 'Test prompt',
            difficulty: 'easy',
            category: 'everyday',
          },
        }),
      });

      await act(async () => {
        await result.current.startGame();
      });

      // Submit guess without specifying mode
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          type: 'guess-result',
          isCorrect: true,
          isClose: false,
          correctAnswer: 'tree',
          pointsEarned: 10,
          totalScore: 10,
        }),
      });

      await act(async () => {
        await result.current.submitGuess('tree');
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/game/submit-guess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: 'session123',
          promptId: 1,
          guess: 'tree',
        }),
      });
    });

    it('should transition to results phase with placeholder data in consensus mode', async () => {
      const { result } = renderHook(() => useGame());

      // Setup game with prompt
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          type: 'init',
          postId: 'post123',
          username: 'testuser',
        }),
      });

      await act(async () => {
        await result.current.init();
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          type: 'game-start',
          sessionId: 'session123',
          username: 'testuser',
        }),
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          type: 'next-prompt',
          prompt: {
            id: 1,
            promptText: 'Test prompt',
            difficulty: 'easy',
            category: 'everyday',
            answer: 'tree',
          },
        }),
      });

      await act(async () => {
        await result.current.startGame();
      });

      // Submit guess in consensus mode
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          type: 'consensus-guess-submitted',
          success: true,
          message: 'Guess submitted successfully',
        }),
      });

      await act(async () => {
        await result.current.submitGuess('jellyfish', 'consensus');
      });

      // In consensus mode, we transition to results with placeholder data
      // The actual results will be fetched by PollResultsDisplay
      expect(result.current.state.phase).toBe('results');
      expect(result.current.state.score).toBe(0); // Score not updated yet
      expect(result.current.state.roundsCompleted).toBe(1);
    });
  });
});
