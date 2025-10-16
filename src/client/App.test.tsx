import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { App } from './App';
import type { UseGameReturn } from './hooks/useGame';

// Mock the useGame hook
const mockUseGame = vi.fn<() => UseGameReturn>();
vi.mock('./hooks/useGame', () => ({
  useGame: () => mockUseGame(),
}));

// Mock child components
vi.mock('./components/HomeScreen', () => ({
  HomeScreen: ({ onStartGame, username }: { onStartGame: () => void; username: string | null }) => (
    <div data-testid="home-screen">
      <p>Username: {username || 'Guest'}</p>
      <button onClick={onStartGame}>Play</button>
    </div>
  ),
}));

vi.mock('./components/GameScreen', () => ({
  GameScreen: ({ gameState }: { gameState: { phase: string } }) => (
    <div data-testid="game-screen">
      <p>Phase: {gameState.phase}</p>
    </div>
  ),
}));

describe('App', () => {
  const mockInit = vi.fn();
  const mockStartGame = vi.fn();
  const mockFetchNextPrompt = vi.fn();
  const mockSubmitGuess = vi.fn();
  const mockStartDisplayPhase = vi.fn();
  const mockStartGuessPhase = vi.fn();
  const mockNextRound = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should display loading state while initializing', () => {
    mockUseGame.mockReturnValue({
      state: {
        phase: 'home',
        currentPrompt: null,
        playerGuess: null,
        score: 0,
        roundsCompleted: 0,
        usedPromptIds: [],
        username: null,
        postId: null,
        sessionId: null,
        loading: true,
        error: null,
      },
      init: mockInit,
      startGame: mockStartGame,
      fetchNextPrompt: mockFetchNextPrompt,
      submitGuess: mockSubmitGuess,
      startDisplayPhase: mockStartDisplayPhase,
      startGuessPhase: mockStartGuessPhase,
      nextRound: mockNextRound,
    });

    render(<App />);

    expect(screen.getByText('Loading...')).toBeDefined();
  });

  it('should call init on mount', () => {
    mockUseGame.mockReturnValue({
      state: {
        phase: 'home',
        currentPrompt: null,
        playerGuess: null,
        score: 0,
        roundsCompleted: 0,
        usedPromptIds: [],
        username: 'testuser',
        postId: 'post123',
        sessionId: null,
        loading: false,
        error: null,
      },
      init: mockInit,
      startGame: mockStartGame,
      fetchNextPrompt: mockFetchNextPrompt,
      submitGuess: mockSubmitGuess,
      startDisplayPhase: mockStartDisplayPhase,
      startGuessPhase: mockStartGuessPhase,
      nextRound: mockNextRound,
    });

    render(<App />);

    expect(mockInit).toHaveBeenCalledTimes(1);
  });

  it('should display HomeScreen when phase is home', () => {
    mockUseGame.mockReturnValue({
      state: {
        phase: 'home',
        currentPrompt: null,
        playerGuess: null,
        score: 0,
        roundsCompleted: 0,
        usedPromptIds: [],
        username: 'testuser',
        postId: 'post123',
        sessionId: null,
        loading: false,
        error: null,
      },
      init: mockInit,
      startGame: mockStartGame,
      fetchNextPrompt: mockFetchNextPrompt,
      submitGuess: mockSubmitGuess,
      startDisplayPhase: mockStartDisplayPhase,
      startGuessPhase: mockStartGuessPhase,
      nextRound: mockNextRound,
    });

    render(<App />);

    expect(screen.getByTestId('home-screen')).toBeDefined();
    expect(screen.getByText('Username: testuser')).toBeDefined();
  });

  it('should display GameScreen when phase is display', () => {
    mockUseGame.mockReturnValue({
      state: {
        phase: 'display',
        currentPrompt: {
          id: 1,
          promptText: 'A circle on top of a rectangle',
          answer: 'tree',
          alternativeAnswers: [],
          difficulty: 'easy',
          category: 'everyday',
        },
        playerGuess: null,
        score: 0,
        roundsCompleted: 0,
        usedPromptIds: [1],
        username: 'testuser',
        postId: 'post123',
        sessionId: 'session123',
        loading: false,
        error: null,
      },
      init: mockInit,
      startGame: mockStartGame,
      fetchNextPrompt: mockFetchNextPrompt,
      submitGuess: mockSubmitGuess,
      startDisplayPhase: mockStartDisplayPhase,
      startGuessPhase: mockStartGuessPhase,
      nextRound: mockNextRound,
    });

    render(<App />);

    expect(screen.getByTestId('game-screen')).toBeDefined();
    expect(screen.getByText('Phase: display')).toBeDefined();
  });

  it('should display error screen with retry button on error', () => {
    mockUseGame.mockReturnValue({
      state: {
        phase: 'error',
        currentPrompt: null,
        playerGuess: null,
        score: 0,
        roundsCompleted: 0,
        usedPromptIds: [],
        username: null,
        postId: null,
        sessionId: null,
        loading: false,
        error: 'Failed to load game data',
      },
      init: mockInit,
      startGame: mockStartGame,
      fetchNextPrompt: mockFetchNextPrompt,
      submitGuess: mockSubmitGuess,
      startDisplayPhase: mockStartDisplayPhase,
      startGuessPhase: mockStartGuessPhase,
      nextRound: mockNextRound,
    });

    render(<App />);

    expect(screen.getByText('Oops! Something went wrong')).toBeDefined();
    expect(screen.getByText('Failed to load game data')).toBeDefined();
    expect(screen.getByRole('button', { name: 'Retry loading the game' })).toBeDefined();
  });

  it('should call init when retry button is clicked', async () => {
    mockUseGame.mockReturnValue({
      state: {
        phase: 'error',
        currentPrompt: null,
        playerGuess: null,
        score: 0,
        roundsCompleted: 0,
        usedPromptIds: [],
        username: null,
        postId: null,
        sessionId: null,
        loading: false,
        error: 'Network error',
      },
      init: mockInit,
      startGame: mockStartGame,
      fetchNextPrompt: mockFetchNextPrompt,
      submitGuess: mockSubmitGuess,
      startDisplayPhase: mockStartDisplayPhase,
      startGuessPhase: mockStartGuessPhase,
      nextRound: mockNextRound,
    });

    render(<App />);

    const retryButton = screen.getByRole('button', { name: 'Retry loading the game' });
    retryButton.click();

    await waitFor(() => {
      expect(mockInit).toHaveBeenCalledTimes(2); // Once on mount, once on retry
    });
  });

  it('should display default error message when error is null', () => {
    mockUseGame.mockReturnValue({
      state: {
        phase: 'error',
        currentPrompt: null,
        playerGuess: null,
        score: 0,
        roundsCompleted: 0,
        usedPromptIds: [],
        username: null,
        postId: null,
        sessionId: null,
        loading: false,
        error: null,
      },
      init: mockInit,
      startGame: mockStartGame,
      fetchNextPrompt: mockFetchNextPrompt,
      submitGuess: mockSubmitGuess,
      startDisplayPhase: mockStartDisplayPhase,
      startGuessPhase: mockStartGuessPhase,
      nextRound: mockNextRound,
    });

    render(<App />);

    expect(screen.getByText('An unexpected error occurred. Please try again.')).toBeDefined();
  });

  it('should route to GameScreen for guess phase', () => {
    mockUseGame.mockReturnValue({
      state: {
        phase: 'guess',
        currentPrompt: {
          id: 1,
          promptText: 'A circle on top of a rectangle',
          answer: 'tree',
          alternativeAnswers: [],
          difficulty: 'easy',
          category: 'everyday',
        },
        playerGuess: null,
        score: 0,
        roundsCompleted: 0,
        usedPromptIds: [1],
        username: 'testuser',
        postId: 'post123',
        sessionId: 'session123',
        loading: false,
        error: null,
      },
      init: mockInit,
      startGame: mockStartGame,
      fetchNextPrompt: mockFetchNextPrompt,
      submitGuess: mockSubmitGuess,
      startDisplayPhase: mockStartDisplayPhase,
      startGuessPhase: mockStartGuessPhase,
      nextRound: mockNextRound,
    });

    render(<App />);

    expect(screen.getByTestId('game-screen')).toBeDefined();
    expect(screen.getByText('Phase: guess')).toBeDefined();
  });

  it('should route to GameScreen for results phase', () => {
    mockUseGame.mockReturnValue({
      state: {
        phase: 'results',
        currentPrompt: {
          id: 1,
          promptText: 'A circle on top of a rectangle',
          answer: 'tree',
          alternativeAnswers: [],
          difficulty: 'easy',
          category: 'everyday',
        },
        playerGuess: 'tree',
        score: 10,
        roundsCompleted: 1,
        usedPromptIds: [1],
        username: 'testuser',
        postId: 'post123',
        sessionId: 'session123',
        loading: false,
        error: null,
      },
      init: mockInit,
      startGame: mockStartGame,
      fetchNextPrompt: mockFetchNextPrompt,
      submitGuess: mockSubmitGuess,
      startDisplayPhase: mockStartDisplayPhase,
      startGuessPhase: mockStartGuessPhase,
      nextRound: mockNextRound,
    });

    render(<App />);

    expect(screen.getByTestId('game-screen')).toBeDefined();
    expect(screen.getByText('Phase: results')).toBeDefined();
  });
});
