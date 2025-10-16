import { useEffect, useState } from 'react';
import { Timer } from './Timer';

type ResultsDisplayProps = {
  correctAnswer: string;
  playerGuess: string | null;
  isCorrect: boolean;
  isClose: boolean;
  pointsEarned: number;
  totalScore: number;
  timeRemaining: number;
  onComplete: () => void;
};

export function ResultsDisplay({
  correctAnswer,
  playerGuess,
  isCorrect,
  isClose,
  pointsEarned,
  totalScore,
  timeRemaining,
  onComplete,
}: ResultsDisplayProps) {
  const [displayScore, setDisplayScore] = useState(totalScore - pointsEarned);

  // Count-up animation for score
  useEffect(() => {
    if (pointsEarned === 0) {
      setDisplayScore(totalScore);
      return;
    }

    const startScore = totalScore - pointsEarned;
    const duration = 200; // ms
    const steps = 10;
    const increment = pointsEarned / steps;
    let currentStep = 0;

    const interval = setInterval(() => {
      currentStep++;
      if (currentStep >= steps) {
        setDisplayScore(totalScore);
        clearInterval(interval);
      } else {
        setDisplayScore(Math.round(startScore + increment * currentStep));
      }
    }, duration / steps);

    return () => clearInterval(interval);
  }, [totalScore, pointsEarned]);

  const getResultColor = () => {
    if (isCorrect) return 'text-green-600';
    if (isClose) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getResultBgColor = () => {
    if (isCorrect) return 'bg-green-50';
    if (isClose) return 'bg-yellow-50';
    return 'bg-red-50';
  };

  const getResultText = () => {
    if (isCorrect) return 'Correct!';
    if (isClose) return 'Close!';
    return 'Incorrect';
  };

  const getPointsColor = () => {
    if (pointsEarned === 10) return 'text-green-600';
    if (pointsEarned === 5) return 'text-yellow-600';
    return 'text-gray-600';
  };

  return (
    <div
      className="w-full max-w-2xl mx-auto px-4 md:px-6 lg:px-8 animate-fade-in"
      role="region"
      aria-label="Results phase"
    >
      {/* Screen reader announcement */}
      <div className="sr-only" role="status" aria-live="assertive">
        Results: {getResultText()}. The correct answer was {correctAnswer}.
        {playerGuess && `You guessed ${playerGuess}. `}
        You earned {pointsEarned} points. Your total score is {displayScore}.
      </div>

      {/* Timer */}
      <div className="mb-6 md:mb-8">
        <Timer duration={timeRemaining} onComplete={onComplete} variant="results" />
      </div>

      {/* Results Card */}
      <div
        className={`rounded-xl shadow-lg p-6 md:p-10 lg:p-12 ${getResultBgColor()} animate-bounce-in`}
        role="article"
        aria-labelledby="result-status"
      >
        {/* Result Status */}
        <div className="text-center mb-4 md:mb-6">
          <h2
            id="result-status"
            className={`text-2xl md:text-3xl lg:text-4xl font-bold ${getResultColor()}`}
          >
            {getResultText()}
          </h2>
        </div>

        {/* Correct Answer */}
        <div className="mb-4 md:mb-6">
          <p className="text-gray-600 text-sm md:text-base mb-2">The answer was:</p>
          <p
            className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-800 capitalize"
            aria-label={`Correct answer: ${correctAnswer}`}
          >
            {correctAnswer}
          </p>
        </div>

        {/* Player's Guess */}
        {playerGuess && (
          <div className="mb-4 md:mb-6">
            <p className="text-gray-600 text-sm md:text-base mb-2">You guessed:</p>
            <p
              className="text-lg md:text-xl lg:text-2xl font-semibold text-gray-700 capitalize"
              aria-label={`Your guess: ${playerGuess}`}
            >
              {playerGuess}
            </p>
          </div>
        )}

        {/* Points Earned */}
        <div className="border-t border-gray-200 pt-4 md:pt-6 mt-4 md:mt-6">
          <div className="flex justify-between items-center mb-3 md:mb-4 animate-slide-up">
            <span className="text-base md:text-lg lg:text-xl font-semibold text-gray-700">
              Points Earned:
            </span>
            <span
              className={`text-xl md:text-2xl lg:text-3xl font-bold ${getPointsColor()}`}
              aria-label={`Points earned: ${pointsEarned}`}
            >
              +{pointsEarned}
            </span>
          </div>

          {/* Total Score */}
          <div className="flex justify-between items-center animate-count-up">
            <span className="text-base md:text-lg lg:text-xl font-semibold text-gray-700">
              Total Score:
            </span>
            <span
              className="text-xl md:text-2xl lg:text-3xl font-bold text-orange-600"
              aria-label={`Total score: ${displayScore}`}
              aria-live="polite"
            >
              {displayScore}
            </span>
          </div>
        </div>
      </div>

      {/* Next Round Message */}
      <p className="text-center text-gray-600 mt-4 md:mt-6 text-base md:text-lg" aria-live="polite">
        Next round starting soon...
      </p>
    </div>
  );
}
