import { useEffect, useState } from 'react';
import type { ConsensusScoreTier } from '../../shared/types/game';

type ConsensusScoreDisplayProps = {
  pointsEarned: number;
  matchPercentage: number;
  tier: ConsensusScoreTier;
  totalScore: number;
};

const TIER_CONFIG: Record<
  ConsensusScoreTier,
  { emoji: string; label: string; color: string }
> = {
  majority: { emoji: '🏆', label: 'MAJORITY', color: 'text-yellow-500' },
  common: { emoji: '🥈', label: 'COMMON', color: 'text-gray-400' },
  uncommon: { emoji: '🥉', label: 'UNCOMMON', color: 'text-orange-600' },
  rare: { emoji: '💎', label: 'RARE', color: 'text-blue-400' },
  unique: { emoji: '❄️', label: 'UNIQUE', color: 'text-cyan-300' },
};

export function ConsensusScoreDisplay({
  pointsEarned,
  matchPercentage,
  tier,
  totalScore,
}: ConsensusScoreDisplayProps) {
  const [showBadge, setShowBadge] = useState(false);
  const [animatedPoints, setAnimatedPoints] = useState(0);
  const [showPercentage, setShowPercentage] = useState(false);
  const [animatedTotal, setAnimatedTotal] = useState(totalScore - pointsEarned);

  const tierConfig = TIER_CONFIG[tier];

  useEffect(() => {
    // Animation sequence
    // 1. Badge fade-in (200ms)
    const badgeTimer = setTimeout(() => setShowBadge(true), 0);

    // 2. Points count-up (500ms) - starts after badge
    const pointsTimer = setTimeout(() => {
      const duration = 500;
      const steps = 30;
      const increment = pointsEarned / steps;
      let current = 0;
      let step = 0;

      const interval = setInterval(() => {
        step++;
        current = Math.min(current + increment, pointsEarned);
        setAnimatedPoints(Math.round(current));

        if (step >= steps || current >= pointsEarned) {
          clearInterval(interval);
          setAnimatedPoints(pointsEarned);
        }
      }, duration / steps);

      return () => clearInterval(interval);
    }, 200);

    // 3. Percentage fade-in - starts after points
    const percentageTimer = setTimeout(() => setShowPercentage(true), 700);

    // 4. Total score count-up (300ms) - starts after percentage
    const totalTimer = setTimeout(() => {
      const duration = 300;
      const steps = 20;
      const startValue = totalScore - pointsEarned;
      const increment = pointsEarned / steps;
      let current = startValue;
      let step = 0;

      const interval = setInterval(() => {
        step++;
        current = Math.min(current + increment, totalScore);
        setAnimatedTotal(Math.round(current));

        if (step >= steps || current >= totalScore) {
          clearInterval(interval);
          setAnimatedTotal(totalScore);
        }
      }, duration / steps);

      return () => clearInterval(interval);
    }, 900);

    return () => {
      clearTimeout(badgeTimer);
      clearTimeout(pointsTimer);
      clearTimeout(percentageTimer);
      clearTimeout(totalTimer);
    };
  }, [pointsEarned, matchPercentage, totalScore, tier]);

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-white rounded-lg shadow-lg max-w-md mx-auto">
      {/* Tier Badge */}
      <div
        className={`transition-opacity duration-200 ${
          showBadge ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="flex items-center gap-2 mb-4">
          <span className="text-4xl">{tierConfig.emoji}</span>
          <span className={`text-2xl font-bold ${tierConfig.color}`}>
            {tierConfig.label}
          </span>
        </div>
      </div>

      {/* Points Earned */}
      <div className="text-5xl font-bold text-green-600 mb-4">
        +{animatedPoints} POINTS
      </div>

      {/* Match Percentage */}
      <div
        className={`text-lg text-gray-700 mb-4 transition-opacity duration-200 ${
          showPercentage ? 'opacity-100' : 'opacity-0'
        }`}
      >
        You matched {matchPercentage.toFixed(1)}% of players!
      </div>

      {/* Total Score */}
      <div className="text-xl text-gray-800 font-semibold">
        Total Score: {animatedTotal}
      </div>
    </div>
  );
}
