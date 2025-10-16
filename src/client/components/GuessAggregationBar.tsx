import { useEffect, useState, useRef } from 'react';

type GuessAggregationBarProps = {
  guess: string;
  count: number;
  percentage: number;
  isPlayerGuess: boolean;
  isCreatorAnswer: boolean;
  rank: number;
  variants?: string[];
};

export function GuessAggregationBar({
  guess,
  count,
  percentage,
  isPlayerGuess,
  isCreatorAnswer,
  rank,
  variants,
}: GuessAggregationBarProps) {
  const [animatedWidth, setAnimatedWidth] = useState(0);
  const [displayPercentage, setDisplayPercentage] = useState(percentage);
  const prevPercentageRef = useRef(percentage);
  const animationFrameRef = useRef<number | null>(null);

  // Animate bar width from 0 to percentage on initial render
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedWidth(percentage);
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  // Animate percentage changes with count-up effect
  useEffect(() => {
    const prevPercentage = prevPercentageRef.current;
    
    if (prevPercentage === percentage) {
      return;
    }

    // Animate width
    setAnimatedWidth(percentage);

    // Animate count-up for percentage text
    const startTime = Date.now();
    const duration = 300;
    const startValue = prevPercentage;
    const endValue = percentage;
    const diff = endValue - startValue;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Ease-out function
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentValue = startValue + diff * easeOut;
      
      setDisplayPercentage(currentValue);
      
      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        setDisplayPercentage(endValue);
      }
    };
    
    animationFrameRef.current = requestAnimationFrame(animate);
    prevPercentageRef.current = percentage;

    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [percentage]);

  // Determine bar color based on percentage
  const getBarColor = () => {
    if (percentage >= 50) return 'bg-green-500';
    if (percentage >= 20) return 'bg-blue-500';
    if (percentage >= 5) return 'bg-yellow-500';
    return 'bg-gray-400';
  };

  // Determine border styling
  const getBorderClass = () => {
    if (isPlayerGuess) return 'border-2 border-[#FF4500]';
    if (isCreatorAnswer) return 'border-2 border-[#FFD700]';
    return 'border border-gray-300';
  };

  return (
    <div
      className={`p-3 md:p-4 rounded-lg ${getBorderClass()} bg-white mb-2 w-full`}
      data-testid="guess-aggregation-bar"
    >
      {/* Top row: Rank, Guess, Count, Percentage */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
        {/* Left side: Rank and Guess */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-gray-600 font-bold text-sm sm:text-base flex-shrink-0">
            #{rank}
          </span>
          <span
            className="text-gray-800 font-semibold text-base sm:text-lg truncate"
            title={guess}
          >
            {guess}
          </span>
          {isCreatorAnswer && (
            <span className="text-lg sm:text-xl flex-shrink-0" aria-label="Creator's answer">
              ⭐
            </span>
          )}
        </div>
        
        {/* Right side: Count and Percentage - prominent on mobile */}
        <div className="flex items-center justify-between sm:justify-end gap-3 flex-shrink-0">
          <span className="text-gray-600 text-xs sm:text-sm">
            {count.toLocaleString()} {count === 1 ? 'player' : 'players'}
          </span>
          <span className="text-gray-800 font-bold text-lg sm:text-base">
            {displayPercentage.toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Progress bar - full width on all screens */}
      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
        <div
          className={`h-full ${getBarColor()} transition-all duration-500 ease-out`}
          style={{ width: `${animatedWidth}%` }}
          data-testid="progress-bar"
        />
      </div>

      {/* Variants note - show if there are grouped variants */}
      {variants && variants.length > 0 && (
        <div className="mt-2 text-xs text-gray-500 italic">
          includes: {variants.map((v, i) => `'${v}'`).join(', ')}
        </div>
      )}
    </div>
  );
}
