import { PromptDisplay } from './PromptDisplay';
import { GuessInput } from './GuessInput';
import { ResultsDisplay } from './ResultsDisplay';
import { PollResultsDisplay } from './PollResultsDisplay';
import { Leaderboard } from './Leaderboard';
import type { GameState } from '../../shared/types/game';

type GameMode = 'classic' | 'consensus';

type GameScreenProps = {
  gameState: GameState;
  mode: GameMode;
  onSubmitGuess: (guess: string) => void;
  onNextRound: () => void;
  onDisplayComplete: () => void;
  onGuessComplete: () => void;
  lastResult?: {
    isCorrect: boolean;
    isClose: boolean;
    pointsEarned: number;
    correctAnswer: string;
  } | null;
};

export function GameScreen({
  gameState,
  mode,
  onSubmitGuess,
  onNextRound,
  onDisplayComplete,
  onGuessComplete,
  lastResult,
}: GameScreenProps) {
  const { phase, currentPrompt, playerGuess, score, roundsCompleted } = gameState;

  // Phase durations (in seconds)
  const DISPLAY_DURATION = 5;
  const GUESS_DURATION = 20;
  // Extend results phase timer to 15 seconds in consensus mode (keep 10s in classic)
  const RESULTS_DURATION = mode === 'consensus' ? 15 : 10;

  // Get phase description for screen readers
  const getPhaseDescription = () => {
    switch (phase) {
      case 'display':
        return 'Display phase: Memorize the geometric description';
      case 'guess':
        return 'Guess phase: Enter your answer';
      case 'results':
        return 'Results phase: View your score';
      default:
        return 'Game in progress';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-4 md:py-6 lg:py-8 relative" role="main">
      {/* Screen reader announcement for phase changes */}
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {getPhaseDescription()}
      </div>

      {/* Persistent Leaderboard */}
      <Leaderboard score={score} roundsCompleted={roundsCompleted} rank={1} />

      {/* Main Content Area */}
      <div className="container mx-auto px-2 md:px-4">
        {/* Display Phase */}
        {phase === 'display' && currentPrompt && (
          <div className="transition-opacity duration-300 ease-in-out">
            <PromptDisplay
              promptText={currentPrompt.promptText}
              timeRemaining={DISPLAY_DURATION}
              onComplete={onDisplayComplete}
            />
          </div>
        )}

        {/* Guess Phase */}
        {phase === 'guess' && (
          <div className="transition-opacity duration-300 ease-in-out">
            <GuessInput
              onSubmit={onSubmitGuess}
              timeRemaining={GUESS_DURATION}
              disabled={false}
              onComplete={onGuessComplete}
            />
          </div>
        )}

        {/* Results Phase */}
        {phase === 'results' && lastResult && (
          <div className="transition-opacity duration-300 ease-in-out">
            {mode === 'classic' ? (
              <ResultsDisplay
                correctAnswer={lastResult.correctAnswer}
                playerGuess={playerGuess}
                isCorrect={lastResult.isCorrect}
                isClose={lastResult.isClose}
                pointsEarned={lastResult.pointsEarned}
                totalScore={score}
                timeRemaining={RESULTS_DURATION}
                onComplete={onNextRound}
              />
            ) : (
              <PollResultsDisplay
                promptId={currentPrompt?.id || 0}
                playerGuess={playerGuess}
                creatorAnswer={lastResult.correctAnswer}
                timeRemaining={RESULTS_DURATION}
                totalScore={score}
                onComplete={onNextRound}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
