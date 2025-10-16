import { useEffect, useState, useCallback } from 'react';
import { PromptView } from './components/PromptView';
import { ResultsView } from './components/ResultsView';
import type { GuessAggregation, ConsensusScore } from '../shared/types/game';

type AppState = 'loading' | 'prompt' | 'results' | 'error' | 'no-prompt';

export const App = () => {
  const [appState, setAppState] = useState<AppState>('loading');
  const [error, setError] = useState<string | null>(null);
  const [customPrompt, setCustomPrompt] = useState<{
    description: string;
    hasGuessed: boolean;
  } | null>(null);
  const [postId, setPostId] = useState<string | null>(null);
  const [resultsData, setResultsData] = useState<{
    aggregation: GuessAggregation[];
    playerGuess: string | null;
    creatorAnswer: string;
    totalPlayers: number;
    totalGuesses: number;
    playerScore: ConsensusScore;
  } | null>(null);

  // Initialize app
  useEffect(() => {
    const initialize = async () => {
      try {
        const response = await fetch('/api/init');
        if (!response.ok) {
          throw new Error('Failed to initialize');
        }

        const data = await response.json();
        setPostId(data.postId);

        if (!data.customPrompt) {
          setAppState('no-prompt');
          setError('This post does not have a custom prompt');
          return;
        }

        setCustomPrompt(data.customPrompt);

        // If user already guessed, fetch results
        if (data.customPrompt.hasGuessed) {
          await fetchResults();
          setAppState('results');
        } else {
          setAppState('prompt');
        }
      } catch (err) {
        console.error('Initialization error:', err);
        setError(err instanceof Error ? err.message : 'Failed to load');
        setAppState('error');
      }
    };

    void initialize();
  }, []);

  // Fetch results
  const fetchResults = useCallback(async () => {
    if (!postId) return;

    try {
      const response = await fetch('/api/prompt/get-results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch results');
      }

      const data = await response.json();
      setResultsData({
        aggregation: data.aggregation,
        playerGuess: data.playerGuess,
        creatorAnswer: data.creatorAnswer,
        totalPlayers: data.totalPlayers,
        totalGuesses: data.totalGuesses,
        playerScore: data.playerScore,
      });
    } catch (err) {
      console.error('Failed to fetch results:', err);
    }
  }, [postId]);

  // Handle guess submission
  const handleSubmitGuess = async (guess: string) => {
    try {
      const response = await fetch('/api/prompt/submit-guess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guess }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit guess');
      }

      // Fetch results after successful submission
      await fetchResults();
      setAppState('results');
    } catch (err) {
      console.error('Failed to submit guess:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit guess');
      setAppState('error');
    }
  };

  // Handle refresh
  const handleRefresh = useCallback(() => {
    void fetchResults();
  }, [fetchResults]);

  // Loading state
  if (appState === 'loading') {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF4500] mb-4"></div>
          <p className="text-lg text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (appState === 'error' || appState === 'no-prompt') {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-red-50 rounded-xl p-6 md:p-8 text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Oops! Something went wrong</h2>
          <p className="text-base text-gray-700 mb-6">
            {error || 'An unexpected error occurred. Please try again.'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-[#FF4500] hover:bg-[#D93900] text-white text-lg font-semibold py-3 px-6 rounded-lg transition-all"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Prompt view (user hasn't guessed yet)
  if (appState === 'prompt' && customPrompt) {
    return (
      <PromptView
        description={customPrompt.description}
        onSubmitGuess={handleSubmitGuess}
        loading={false}
      />
    );
  }

  // Results view (user already guessed)
  if (appState === 'results' && resultsData && postId) {
    return (
      <ResultsView
        postId={postId}
        playerGuess={resultsData.playerGuess}
        aggregation={resultsData.aggregation}
        creatorAnswer={resultsData.creatorAnswer}
        totalPlayers={resultsData.totalPlayers}
        totalGuesses={resultsData.totalGuesses}
        playerScore={resultsData.playerScore}
        onRefresh={handleRefresh}
      />
    );
  }

  // Fallback
  return null;
};
