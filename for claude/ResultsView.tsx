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
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Auto-refresh every 5 seconds
  useEffect(() => {
    if (!autoRefreshEnabled) return;

    const interval = setInterval(() => {
      onRefresh();
    }, 5000);

    return () => clearInterval(interval);
  }, [autoRefreshEnabled, onRefresh]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      // Add a small delay to show the loading state
      setTimeout(() => setIsRefreshing(false), 300);
    }
  };

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
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Top Guesses</h1>
          <p className="text-sm text-gray-600">See how your guess compares to others!</p>
        </div>

        {/* Top 10 Guesses */}
        <div className="bg-white rounded-xl shadow-lg p-4 md:p-6 mb-6">
          <div className="space-y-3">
            {aggregation.map((item, index) => {
              const maxCount = aggregation[0]?.count || 1;
              const barWidth = (item.count / maxCount) * 100;

              return (
                <div
                  key={`${item.guess}-${index}`}
                  className={`relative ${
                    item.isPlayerGuess ? 'ring-2 ring-[#FF4500] rounded-lg p-2 -m-2' : ''
                  }`}
                >
                  {/* Bar */}
                  <div className="relative h-14 md:h-16 bg-gray-100 rounded-lg overflow-hidden">
                    <div
                      className={`absolute inset-y-0 left-0 transition-all duration-300 ${
                        item.isPlayerGuess ? 'bg-[#FF4500]' : 'bg-blue-500'
                      }`}
                      style={{ width: `${barWidth}%` }}
                    />

                    {/* Content */}
                    <div className="relative h-full flex items-center justify-between px-3 md:px-4 gap-2">
                      <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
                        <span className="text-base md:text-lg font-bold text-gray-900 truncate">
                          {item.guess}
                        </span>
                        {item.isPlayerGuess && (
                          <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full font-semibold whitespace-nowrap">
                            You
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 md:gap-3 text-sm font-semibold text-gray-900 whitespace-nowrap">
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
        <div className="bg-gray-50 rounded-lg p-4 mb-4 md:mb-6 text-center">
          <p className="text-sm md:text-base text-gray-700">
            <span className="font-semibold">{formatNumber(totalPlayers)}</span> players •{' '}
            <span className="font-semibold">{formatNumber(totalGuesses)}</span> guesses
          </p>
        </div>

        {/* Creator's Answer Info */}
        <div className="bg-green-50 rounded-lg p-4 mb-4 md:mb-6 text-center">
          <p className="text-sm md:text-base text-gray-700 break-words">
            Creator's Answer: <span className="font-bold text-green-700">{creatorAnswer}</span>
          </p>
        </div>

        {/* Player Score */}
        {playerGuess && (
          <div className="bg-blue-50 rounded-lg p-4 md:p-6">
            <h3 className="text-base md:text-lg font-bold text-gray-900 mb-3">Your Guess</h3>
            <div className="space-y-2">
              <p className="text-sm md:text-base text-gray-700 break-words">
                You guessed: <span className="font-semibold text-[#FF4500]">{playerGuess}</span>
              </p>
              <p className="text-sm md:text-base text-gray-700">
                Points earned:{' '}
                <span className="font-bold text-[#FF4500] text-lg md:text-xl">
                  {playerScore.pointsEarned}
                </span>
              </p>
              {playerScore.matchPercentage > 0 && (
                <p className="text-xs md:text-sm text-gray-600">
                  {playerScore.matchPercentage.toFixed(1)}% of players guessed the same
                </p>
              )}
            </div>
          </div>
        )}

        {/* Refresh Button */}
        <div className="mt-6 text-center">
          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center gap-2 px-6 py-3 bg-white border-2 border-gray-300 rounded-lg text-base md:text-lg text-gray-700 font-semibold hover:bg-gray-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF4500] focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px] touch-manipulation"
          >
            <span className={isRefreshing ? 'animate-spin' : ''}>🔄</span>
            <span>{isRefreshing ? 'Refreshing...' : 'Refresh Results'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
