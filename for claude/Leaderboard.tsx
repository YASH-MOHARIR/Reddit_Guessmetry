import { useEffect, useState } from 'react';

type LeaderboardProps = {
  score: number;
  roundsCompleted: number;
  rank: number;
};

export function Leaderboard({ score, roundsCompleted, rank }: LeaderboardProps) {
  const [displayScore, setDisplayScore] = useState(score);
  const [prevScore, setPrevScore] = useState(score);
  const [isAnimating, setIsAnimating] = useState(false);

  // Animate score changes
  useEffect(() => {
    if (score === prevScore) {
      setDisplayScore(score);
      return;
    }

    setIsAnimating(true);
    const diff = score - prevScore;
    const duration = 300; // ms
    const steps = 10;
    const increment = diff / steps;
    let currentStep = 0;

    const interval = setInterval(() => {
      currentStep++;
      if (currentStep >= steps) {
        setDisplayScore(score);
        setPrevScore(score);
        setIsAnimating(false);
        clearInterval(interval);
      } else {
        setDisplayScore(Math.round(prevScore + increment * currentStep));
      }
    }, duration / steps);

    return () => {
      clearInterval(interval);
      setIsAnimating(false);
    };
  }, [score, prevScore]);

  return (
    <aside
      className="fixed top-2 right-2 md:top-4 md:right-4 bg-white rounded-lg shadow-lg p-3 md:p-4 min-w-[160px] md:min-w-[200px] z-10"
      role="complementary"
      aria-label="Game statistics"
    >
      <h3 className="text-xs md:text-sm font-semibold text-gray-600 uppercase mb-2 md:mb-3">
        Leaderboard
      </h3>

      <div className="space-y-1.5 md:space-y-2">
        {/* Rank */}
        <div className="flex justify-between items-center">
          <span className="text-xs md:text-sm text-gray-600">Rank:</span>
          <span
            className="text-base md:text-lg font-bold text-orange-600"
            aria-label={`Current rank: ${rank}`}
          >
            #{rank}
          </span>
        </div>

        {/* Score */}
        <div className="flex justify-between items-center">
          <span className="text-xs md:text-sm text-gray-600">Score:</span>
          <span
            className={`text-xl md:text-2xl font-bold text-orange-600 transition-all duration-300 ${
              isAnimating ? 'animate-count-up' : ''
            }`}
            aria-label={`Current score: ${displayScore}`}
            aria-live="polite"
          >
            {displayScore}
          </span>
        </div>

        {/* Rounds */}
        <div className="flex justify-between items-center">
          <span className="text-xs md:text-sm text-gray-600">Rounds:</span>
          <span
            className="text-base md:text-lg font-semibold text-gray-700"
            aria-label={`Rounds completed: ${roundsCompleted}`}
          >
            {roundsCompleted}
          </span>
        </div>
      </div>
    </aside>
  );
}
