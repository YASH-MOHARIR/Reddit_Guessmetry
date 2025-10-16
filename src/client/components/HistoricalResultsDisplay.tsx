import { useEffect, useState } from 'react';
import type { GuessAggregation } from '../../shared/types/game';
import type {
  HistoricalResultsResponse,
  HistoricalResultsNotFoundResponse,
} from '../../shared/types/api';
import { GuessAggregationBar } from './GuessAggregationBar';

type HistoricalResultsDisplayProps = {
  promptId: number;
  onClose?: () => void;
};

export function HistoricalResultsDisplay({ promptId, onClose }: HistoricalResultsDisplayProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<{
    aggregation: GuessAggregation[];
    creatorAnswer: string;
    totalPlayers: number;
    totalGuesses: number;
    promptText: string;
  } | null>(null);

  useEffect(() => {
    const fetchHistoricalResults = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/consensus/historical-results/${promptId}`);

        if (!response.ok) {
          if (response.status === 404) {
            const data = (await response.json()) as HistoricalResultsNotFoundResponse;
            setError(data.message);
          } else {
            setError('Failed to load historical results');
          }
          setLoading(false);
          return;
        }

        const data = (await response.json()) as HistoricalResultsResponse;

        setResults({
          aggregation: data.aggregation,
          creatorAnswer: data.creatorAnswer,
          totalPlayers: data.totalPlayers,
          totalGuesses: data.totalGuesses,
          promptText: data.promptText,
        });
      } catch (err) {
        console.error('Error fetching historical results:', err);
        setError('Failed to load historical results');
      } finally {
        setLoading(false);
      }
    };

    fetchHistoricalResults();
  }, [promptId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <div className="text-xl font-semibold text-gray-700">Loading historical results...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4">
        <div className="text-xl font-semibold text-gray-700">{error}</div>
        <p className="text-gray-600 text-center max-w-md">
          Historical results are only available for 24 hours after a prompt session ends.
        </p>
        {onClose && (
          <button
            onClick={onClose}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Close
          </button>
        )}
      </div>
    );
  }

  if (!results) {
    return null;
  }

  return (
    <div className="flex flex-col items-center w-full max-w-4xl mx-auto p-4">
      {/* Header */}
      <div className="w-full mb-6 text-center">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">Final Results</h2>
        <p className="text-lg text-gray-600 mb-2">{results.promptText}</p>
        <p className="text-md text-gray-500">
          {results.totalPlayers.toLocaleString()} players participated
        </p>
      </div>

      {/* Aggregation Bars */}
      <div className="w-full space-y-2 mb-6">
        {results.aggregation.map((agg) => (
          <GuessAggregationBar
            key={agg.guess}
            guess={agg.guess}
            count={agg.count}
            percentage={agg.percentage}
            isPlayerGuess={false} // No player context in historical view
            isCreatorAnswer={agg.isCreatorAnswer}
            rank={agg.rank}
            {...(agg.variants && { variants: agg.variants })}
          />
        ))}
      </div>

      {/* Summary */}
      <div className="w-full p-4 bg-gray-100 rounded-lg text-center">
        <p className="text-gray-700">
          📊 {results.totalPlayers.toLocaleString()} players •{' '}
          {results.totalGuesses.toLocaleString()} total guesses
        </p>
        <p className="text-sm text-gray-500 mt-2">
          These are the final results from this prompt session
        </p>
      </div>

      {/* Close Button */}
      {onClose && (
        <button
          onClick={onClose}
          className="mt-6 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          Close
        </button>
      )}
    </div>
  );
}
