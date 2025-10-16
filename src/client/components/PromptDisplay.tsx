import { Timer } from './Timer';

type PromptDisplayProps = {
  promptText: string;
  timeRemaining: number;
  onComplete: () => void;
};

export function PromptDisplay({ promptText, timeRemaining, onComplete }: PromptDisplayProps) {
  return (
    <div
      className="w-full max-w-2xl mx-auto px-4 md:px-6 lg:px-8 animate-fade-in"
      role="region"
      aria-label="Prompt display phase"
    >
      {/* Screen reader announcement */}
      <div className="sr-only" role="status" aria-live="polite">
        Display phase: Memorize the prompt. {timeRemaining} seconds remaining.
      </div>

      {/* Timer */}
      <div className="mb-6 md:mb-8">
        <Timer duration={timeRemaining} onComplete={onComplete} variant="display" />
      </div>

      {/* Prompt Text */}
      <div
        className="bg-white rounded-xl shadow-lg p-6 md:p-10 lg:p-12"
        role="article"
        aria-labelledby="prompt-text"
      >
        <p
          id="prompt-text"
          className="text-2xl md:text-3xl lg:text-4xl font-semibold text-gray-800 text-center leading-relaxed"
        >
          {promptText}
        </p>
      </div>

      {/* Instruction */}
      <p className="text-center text-gray-600 mt-4 md:mt-6 text-base md:text-lg" aria-live="polite">
        Memorize this description!
      </p>
    </div>
  );
}
