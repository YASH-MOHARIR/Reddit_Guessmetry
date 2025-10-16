import { useReducer, useCallback } from 'react';
import type { GameState } from '../../shared/types/game';
import type {
  InitResponse,
  GameStartResponse,
  NextPromptResponse,
  GuessResultResponse,
  ErrorResponse,
} from '../../shared/types/api';

// Action types
type GameAction =
  | { type: 'START_GAME'; payload: { sessionId: string; username: string } }
  | {
      type: 'LOAD_PROMPT';
      payload: {
        id: number;
        promptText: string;
        difficulty: 'easy' | 'medium' | 'hard';
        category: 'everyday' | 'animals' | 'reddit' | 'abstract';
      };
    }
  | { type: 'START_DISPLAY_PHASE' }
  | { type: 'START_GUESS_PHASE' }
  | { type: 'SUBMIT_GUESS'; payload: { guess: string } }
  | {
      type: 'START_RESULTS_PHASE';
      payload: {
        isCorrect: boolean;
        isClose: boolean;
        correctAnswer: string;
        pointsEarned: number;
        totalScore: number;
      };
    }
  | { type: 'NEXT_ROUND' }
  | { type: 'SET_ERROR'; payload: { error: string } }
  | { type: 'SET_LOADING'; payload: { loading: boolean } }
  | { type: 'INIT'; payload: { postId: string; username: string } };

// Initial state
const initialState: GameState = {
  phase: 'home',
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
};

// Reducer function
function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'INIT':
      return {
        ...state,
        postId: action.payload.postId,
        username: action.payload.username,
        loading: false,
      };

    case 'START_GAME':
      return {
        ...state,
        sessionId: action.payload.sessionId,
        username: action.payload.username,
        phase: 'display',
        score: 0,
        roundsCompleted: 0,
        usedPromptIds: [],
        loading: false,
        error: null,
      };

    case 'LOAD_PROMPT':
      return {
        ...state,
        currentPrompt: {
          id: action.payload.id,
          promptText: action.payload.promptText,
          difficulty: action.payload.difficulty,
          category: action.payload.category,
          answer: '', // Not sent from server
          alternativeAnswers: [],
        },
        usedPromptIds: [...state.usedPromptIds, action.payload.id],
        loading: false,
      };

    case 'START_DISPLAY_PHASE':
      return {
        ...state,
        phase: 'display',
        playerGuess: null,
      };

    case 'START_GUESS_PHASE':
      return {
        ...state,
        phase: 'guess',
      };

    case 'SUBMIT_GUESS':
      return {
        ...state,
        playerGuess: action.payload.guess,
        loading: true,
      };

    case 'START_RESULTS_PHASE':
      return {
        ...state,
        phase: 'results',
        score: action.payload.totalScore,
        roundsCompleted: state.roundsCompleted + 1,
        loading: false,
        currentPrompt: state.currentPrompt
          ? {
              ...state.currentPrompt,
              answer: action.payload.correctAnswer,
            }
          : null,
      };

    case 'NEXT_ROUND':
      return {
        ...state,
        phase: 'display',
        playerGuess: null,
        currentPrompt: null,
      };

    case 'SET_ERROR':
      return {
        ...state,
        phase: 'error',
        error: action.payload.error,
        loading: false,
      };

    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload.loading,
      };

    default:
      return state;
  }
}

// Hook return type
export type UseGameReturn = {
  state: GameState;
  init: () => Promise<void>;
  startGame: () => Promise<void>;
  fetchNextPrompt: () => Promise<void>;
  submitGuess: (guess: string, mode?: 'classic' | 'consensus') => Promise<void>;
  startDisplayPhase: () => void;
  startGuessPhase: () => void;
  nextRound: () => void;
};

export function useGame(): UseGameReturn {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  // Initialize game with user context
  const init = useCallback(async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: { loading: true } });
      const response = await fetch('/api/init');
      if (!response.ok) {
        throw new Error('Failed to initialize game');
      }
      const data = (await response.json()) as InitResponse;
      dispatch({
        type: 'INIT',
        payload: { postId: data.postId, username: data.username },
      });
    } catch (error) {
      dispatch({
        type: 'SET_ERROR',
        payload: {
          error: error instanceof Error ? error.message : 'Failed to initialize',
        },
      });
    }
  }, []);

  // Start a new game session
  const startGame = useCallback(async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: { loading: true } });
      const response = await fetch('/api/game/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId: state.postId }),
      });

      if (!response.ok) {
        throw new Error('Failed to start game');
      }

      const data = (await response.json()) as GameStartResponse;
      dispatch({
        type: 'START_GAME',
        payload: { sessionId: data.sessionId, username: data.username },
      });

      // Fetch first prompt immediately after starting game
      const promptResponse = await fetch('/api/game/next-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: data.sessionId }),
      });

      if (!promptResponse.ok) {
        const errorData = (await promptResponse.json()) as ErrorResponse;
        throw new Error(errorData.message || 'Failed to fetch prompt');
      }

      const promptData = (await promptResponse.json()) as NextPromptResponse;
      dispatch({
        type: 'LOAD_PROMPT',
        payload: promptData.prompt,
      });
    } catch (error) {
      dispatch({
        type: 'SET_ERROR',
        payload: {
          error: error instanceof Error ? error.message : 'Failed to start game',
        },
      });
    }
  }, [state.postId]);

  // Fetch next prompt
  const fetchNextPrompt = useCallback(async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: { loading: true } });
      const response = await fetch('/api/game/next-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: state.sessionId }),
      });

      if (!response.ok) {
        const errorData = (await response.json()) as ErrorResponse;
        throw new Error(errorData.message || 'Failed to fetch prompt');
      }

      const data = (await response.json()) as NextPromptResponse;
      dispatch({
        type: 'LOAD_PROMPT',
        payload: data.prompt,
      });
    } catch (error) {
      dispatch({
        type: 'SET_ERROR',
        payload: {
          error: error instanceof Error ? error.message : 'Failed to fetch prompt',
        },
      });
    }
  }, [state.sessionId]);

  // Submit guess
  const submitGuess = useCallback(
    async (guess: string, mode: 'classic' | 'consensus' = 'classic') => {
      if (!state.currentPrompt) {
        dispatch({
          type: 'SET_ERROR',
          payload: { error: 'No prompt available' },
        });
        return;
      }

      try {
        dispatch({ type: 'SUBMIT_GUESS', payload: { guess } });

        // Use different endpoints based on mode
        const endpoint = mode === 'consensus' 
          ? '/api/consensus/submit-guess' 
          : '/api/game/submit-guess';

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: state.sessionId,
            promptId: state.currentPrompt.id,
            guess,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to submit guess');
        }

        if (mode === 'consensus') {
          // For consensus mode, we don't get immediate results
          // Just transition to results phase with placeholder data
          // The actual results will be fetched by PollResultsDisplay
          dispatch({
            type: 'START_RESULTS_PHASE',
            payload: {
              isCorrect: false,
              isClose: false,
              correctAnswer: state.currentPrompt.answer || '',
              pointsEarned: 0,
              totalScore: state.score,
            },
          });
        } else {
          // Classic mode returns immediate results
          const data = (await response.json()) as GuessResultResponse;
          dispatch({
            type: 'START_RESULTS_PHASE',
            payload: {
              isCorrect: data.isCorrect,
              isClose: data.isClose,
              correctAnswer: data.correctAnswer,
              pointsEarned: data.pointsEarned,
              totalScore: data.totalScore,
            },
          });
        }
      } catch (error) {
        dispatch({
          type: 'SET_ERROR',
          payload: {
            error: error instanceof Error ? error.message : 'Failed to submit guess',
          },
        });
      }
    },
    [state.sessionId, state.currentPrompt, state.score]
  );

  // Phase transition actions
  const startDisplayPhase = useCallback(() => {
    dispatch({ type: 'START_DISPLAY_PHASE' });
  }, []);

  const startGuessPhase = useCallback(() => {
    dispatch({ type: 'START_GUESS_PHASE' });
  }, []);

  const nextRound = useCallback(() => {
    dispatch({ type: 'NEXT_ROUND' });
  }, []);

  return {
    state,
    init,
    startGame,
    fetchNextPrompt,
    submitGuess,
    startDisplayPhase,
    startGuessPhase,
    nextRound,
  };
}
