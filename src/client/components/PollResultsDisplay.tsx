import { useEffect, useState, useRef } from 'react';
import { GuessAggregationBar } from './GuessAggregationBar';
import { ConsensusScoreDisplay } from './ConsensusScoreDisplay';
import { Timer } from './Timer';
import { useConsensusPolling } from '../hooks/useConsensusPolling';
import type { GuessAggregation } from '../../shared/types/game';

type PollResultsDisplayProps = {
  promptId: number;
  playerGuess: string | null;
  creatorAnswer: string;
  timeRemaining: number;
  totalScore: number;
  onComplete: () => void;
};

export function PollResultsDisplay({
  promptId,
  playerGuess,
  creatorAnswer,
  timeRemaining,
  totalScore,
  onComplete,
}: PollResultsDisplayProps) {
  // Enable polling only when timeRemaining > 0
  const pollingEnabled = timeRemaining > 0;
  
  const {
    aggregation,
    totalPlayers,
    totalGuesses,
    playerScore,
    creatorAnswerData,
    loading,
    error,
  } = useConsensusPolling({
    promptId,
    enabled: pollingEnabled,
    interval: 2000,
  });

  // Track previous aggregation for animations
  const prevAggregationRef = useRef<GuessAggregation[]>([]);
  const [animatingRanks, setAnimatingRanks] = useState<Set<string>>(new Set());

  // Detect rank changes and trigger slide animations
  useEffect(() => {
    if (aggregation.length === 0) return;

    const prevAgg = prevAggregationRef.current;
    if (prevAgg.length === 0) {
      prevAggregationRef.current = aggregation;
      return;
    }

    const newAnimatingRanks = new Set<string>();

    aggregation.forEach((current) => {
      const previous = prevAgg.find((p) => p.guess === current.guess);
      
      // Check if rank changed
      if (previous && previous.rank !== current.rank) {
        newAnimatingRanks.add(current.guess);
      }
    });

    if (newAnimatingRanks.size > 0) {
      setAnimatingRanks(newAnimatingRanks);
      setTimeout(() => setAnimatingRanks(new Set()), 300);
    }

    prevAggregationRef.current = aggregation;
  }, [aggregation]);

  // Auto-call onComplete when timeRemaining reaches 0
  useEffect(() => {
    if (timeRemaining === 0) {
      onComplete();
    }
  }, [timeRemaining, onComplete]);

  // Check if polling has failed 3 times
  const pollingFailed = error?.includes('3 consecutive failures');
  
  // Check if we have partial data (error but some aggregation exists)
  const hasPartialData = error && aggregation.length > 0;

  const handleRetry = () => {
    // Reset by toggling polling - this will be handled by re-enabling
    window.location.reload();
  };

  return (
    <div
      className="w-full max-w-[800px] mx-auto px-3 sm:px-4 md:px-6 lg:px-8 animate-fade-in overflow-x-hidden"
      role="region"
      aria-label="Poll results phase"
    >
      {/* Timer */}
      <div className="mb-4 sm:mb-6 md:mb-8">
        <Timer duration={timeRemaining} onComplete={onComplete} variant="results" />
      </div>

      {/* Loading State (initial load only) */}
      {loading && aggregation.length === 0 && (
        <div className="text-center py-12" role="status" aria-live="polite">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mb-4"></div>
          <p className="text-gray-600 text-lg">Loading results...</p>
        </div>
      )}

      {/* Polling Failed Warning */}
      {pollingFailed && aggregation.length > 0 && (
        <div
          className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 sm:p-4 mb-4 text-center"
          role="alert"
          aria-live="polite"
        >
          <p className="text-yellow-800 font-semibold mb-2 text-sm sm:text-base">⚠️ Live updates paused</p>
          <p className="text-yellow-700 text-xs sm:text-sm mb-3">
            Unable to fetch live updates. Showing last known results.
          </p>
          <button
            onClick={handleRetry}
            className="bg-yellow-600 hover:bg-yellow-700 active:bg-yellow-800 text-white font-semibold py-3 px-6 rounded-lg transition-colors text-sm min-h-[44px] min-w-[44px]"
            aria-label="Retry polling"
          >
            Retry
          </button>
        </div>
      )}

      {/* Partial Data Warning */}
      {hasPartialData && !pollingFailed && (
        <div
          className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4 mb-4 text-center"
          role="alert"
          aria-live="polite"
        >
          <p className="text-blue-800 font-semibold mb-1 text-sm sm:text-base">ℹ️ Partial results</p>
          <p className="text-blue-700 text-xs sm:text-sm">
            Some data may be missing. Displaying available results.
          </p>
        </div>
      )}

      {/* Error State (initial load failure) */}
      {error && aggregation.length === 0 && !loading && (
        <div
          className="bg-red-50 border border-red-200 rounded-lg p-4 sm:p-6 text-center"
          role="alert"
          aria-live="assertive"
        >
          <p className="text-red-600 font-semibold mb-2 text-sm sm:text-base">
            Results temporarily unavailable
          </p>
          <p className="text-red-500 text-xs sm:text-sm mb-4">
            {error.includes('temporarily unavailable') 
              ? 'Unable to load results. Please try again.'
              : error}
          </p>
          <button
            onClick={handleRetry}
            className="bg-orange-600 hover:bg-orange-700 active:bg-orange-800 text-white font-semibold py-3 px-6 rounded-lg transition-colors min-h-[44px] min-w-[44px]"
            aria-label="Retry loading results"
          >
            Retry
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && aggregation.length === 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 sm:p-8 text-center">
          <p className="text-blue-800 text-lg sm:text-xl font-semibold mb-2">
            Be the first to guess!
          </p>
          <p className="text-blue-600 text-sm sm:text-base">
            No guesses yet. Your answer will appear here once submitted.
          </p>
        </div>
      )}

      {/* Results Display */}
      {aggregation.length > 0 && (
        <div className="animate-bounce-in">
          {/* Screen reader announcement */}
          <div className="sr-only" role="status" aria-live="assertive">
            Poll results: {aggregation.length} different guesses from{' '}
            {totalPlayers} players.
            {aggregation[0] && ` Top guess is ${aggregation[0].guess} with ${aggregation[0].percentage.toFixed(1)}% of votes.`}
          </div>

          {/* Top 10 Guesses - Full width on mobile, stacked vertically */}
          <div className="mb-4 sm:mb-6 w-full">
            {aggregation.slice(0, 10).map((agg) => {
              const isAnimating = animatingRanks.has(agg.guess);
              
              return (
                <div
                  key={agg.guess}
                  className={`transition-all duration-300 ease-in-out w-full ${
                    isAnimating ? 'scale-105' : 'scale-100'
                  }`}
                >
                  <GuessAggregationBar
                    guess={agg.guess}
                    count={agg.count}
                    percentage={agg.percentage}
                    isPlayerGuess={agg.isPlayerGuess}
                    isCreatorAnswer={agg.isCreatorAnswer}
                    rank={agg.rank}
                  />
                </div>
              );
            })}
          </div>

          {/* Creator's Answer (if not in top 10) */}
          {creatorAnswerData && (
            <div className="mb-4 sm:mb-6 animate-fade-in w-full">
              <div className="text-center mb-2">
                <p className="text-gray-600 text-xs sm:text-sm font-semibold">Creator's Answer</p>
              </div>
              <GuessAggregationBar
                guess={creatorAnswerData.guess}
                count={creatorAnswerData.count}
                percentage={creatorAnswerData.percentage}
                isPlayerGuess={creatorAnswerData.isPlayerGuess}
                isCreatorAnswer={true}
                rank={creatorAnswerData.rank}
              />
            </div>
          )}

          {/* Consensus vs Creator Comparison */}
          {aggregation.length > 0 && aggregation[0] && (() => {
            const topGuess = aggregation[0];
            const creatorInTop10 = aggregation.find((agg) => agg.isCreatorAnswer);
            const creatorGuessData = creatorInTop10 || creatorAnswerData;
            
            if (!creatorGuessData || !topGuess) return null;
            
            const creatorMatchesMajority = topGuess.isCreatorAnswer;
            const percentageDiff = Math.abs(topGuess.percentage - creatorGuessData.percentage);
            
            return (
              <div className="mb-4 sm:mb-6 animate-fade-in w-full">
                {creatorMatchesMajority ? (
                  <div className="bg-green-50 border-2 border-green-300 rounded-lg p-3 sm:p-4 text-center">
                    <p className="text-green-800 text-base sm:text-lg md:text-xl font-bold mb-1">
                      🎯 The crowd agreed with the creator!
                    </p>
                    <p className="text-green-700 text-xs sm:text-sm md:text-base break-words">
                      The creator's answer "{creatorGuessData.guess}" is the majority choice at{' '}
                      {creatorGuessData.percentage.toFixed(1)}%
                    </p>
                  </div>
                ) : (
                  <div className="bg-purple-50 border-2 border-purple-300 rounded-lg p-3 sm:p-4 text-center">
                    <p className="text-purple-800 text-base sm:text-lg md:text-xl font-bold mb-1">
                      🤔 The crowd had other ideas!
                    </p>
                    <p className="text-purple-700 text-xs sm:text-sm md:text-base break-words">
                      Top guess: "{topGuess.guess}" ({topGuess.percentage.toFixed(1)}%) •{' '}
                      Creator's answer: "{creatorGuessData.guess}" ({creatorGuessData.percentage.toFixed(1)}%)
                    </p>
                    <p className="text-purple-600 text-xs sm:text-sm mt-1">
                      {percentageDiff.toFixed(1)}% difference
                    </p>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Bottom Summary */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 sm:p-4 text-center mb-4 sm:mb-6 w-full">
            <p className="text-gray-700 text-sm sm:text-base md:text-lg break-words">
              <span className="font-semibold">📊 {totalPlayers.toLocaleString()}</span>{' '}
              {totalPlayers === 1 ? 'player' : 'players'} •{' '}
              <span className="font-semibold">{totalGuesses.toLocaleString()}</span>{' '}
              total {totalGuesses === 1 ? 'guess' : 'guesses'}
            </p>
          </div>

          {/* Consensus Score Display */}
          {playerScore && (
            <div className="animate-fade-in">
              <ConsensusScoreDisplay
                pointsEarned={playerScore.pointsEarned}
                matchPercentage={playerScore.matchPercentage}
                tier={playerScore.tier}
                totalScore={totalScore}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
