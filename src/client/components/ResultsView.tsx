import { useEffect, useState } from 'react';
import type { GuessAggregation, ConsensusScore } from '../../shared/types/game';

type ResultsViewProps = {
  postId: string;
  playerGuess: string | null;
  aggregation: GuessAggregation[];
  creatorAnswer: string;
  totalPlayers: number;
  totalGuesses: number;
  playerScore: ConsensusScore;
  onRefresh: () => void;
};

export const ResultsView = ({
  playerGuess,
  aggregation,
  creatorAnswer,
  totalPlayers,
  totalGuesses,
  playerScore,
  onRefresh,
}: ResultsViewProps) => {
  const [autoRefreshEnabled] = useState(true);

  // Auto-refresh every 5 seconds
  useEffect(() => {
    if (!autoRefreshEnabled) return;

    const interval = setInterval(() => {
      onRefresh();
    }, 5000);

    return () => clearInterval(interval);
  }, [autoRefreshEnabled, onRefresh]);

  const formatNumber = (num: number): string => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}k`;
    }
    return num.toString();
  };

  return (
    <div className="min-h-screen bg-white p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Results</h1>
          <p className="text-lg text-gray-700">
            Answer: <span className="font-semibold text-[#FF4500]">{creatorAnswer}</span>
          </p>
        </div>

        {/* Top 10 Guesses */}
        <div className="bg-white rounded-xl shadow-lg p-4 md:p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Top Guesses</h2>

          <div className="space-y-3">
            {aggregation.map((item) => {
              const maxCount = aggregation[0]?.count || 1;
              const barWidth = (item.count / maxCount) * 100;

              return (
                <div
                  key={item.rank}
                  className={`relative ${
                    item.isPlayerGuess ? 'ring-2 ring-[#FF4500] rounded-lg p-2 -m-2' : ''
                  }`}
                >
                  {/* Bar */}
                  <div className="relative h-12 bg-gray-100 rounded-lg overflow-hidden">
                    <div
                      className={`absolute inset-y-0 left-0 transition-all duration-300 ${
                        item.isCreatorAnswer
                          ? 'bg-green-500'
                          : item.isPlayerGuess
                            ? 'bg-[#FF4500]'
                            : 'bg-blue-500'
                      }`}
                      style={{ width: `${barWidth}%` }}
                    />

                    {/* Content */}
                    <div className="relative h-full flex items-center justify-between px-4">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <span className="text-lg font-bold text-gray-900">{item.guess}</span>
                        {item.isCreatorAnswer && (
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-semibold">
                            ✓ Correct
                          </span>
                        )}
                        {item.isPlayerGuess && !item.isCreatorAnswer && (
                          <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full font-semibold">
                            Your Guess
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-sm font-semibold text-gray-900">
                        <span>{item.count}</span>
                        <span className="text-gray-600">{item.percentage}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Variants */}
                  {item.variants && item.variants.length > 0 && (
                    <div className="mt-1 ml-4 text-xs text-gray-500">
                      Also: {item.variants.join(', ')}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Stats */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6 text-center">
          <p className="text-gray-700">
            <span className="font-semibold">{formatNumber(totalPlayers)}</span> players •{' '}
            <span className="font-semibold">{formatNumber(totalGuesses)}</span> guesses
          </p>
        </div>

        {/* Player Score */}
        {playerGuess && (
          <div className="bg-blue-50 rounded-lg p-4 md:p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-3">Your Score</h3>
            <div className="space-y-2">
              <p className="text-gray-700">
                Your guess: <span className="font-semibold">{playerGuess}</span>
              </p>
              <p className="text-gray-700">
                Points earned:{' '}
                <span className="font-bold text-[#FF4500] text-xl">{playerScore.pointsEarned}</span>
              </p>
              {playerScore.matchPercentage > 0 && (
                <p className="text-sm text-gray-600">
                  {playerScore.matchPercentage.toFixed(1)}% of players guessed the same
                </p>
              )}
            </div>
          </div>
        )}

        {/* Refresh Button */}
        <div className="mt-6 text-center">
          <button
            onClick={onRefresh}
            className="inline-flex items-center gap-2 px-6 py-3 bg-white border-2 border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF4500] focus-visible:ring-offset-2"
          >
            <span>🔄</span>
            <span>Refresh Results</span>
          </button>
        </div>
      </div>
    </div>
  );
};
