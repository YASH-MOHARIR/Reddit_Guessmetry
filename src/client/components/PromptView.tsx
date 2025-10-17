import { useState } from 'react';

type PromptViewProps = {
  description: string;
  onSubmitGuess: (guess: string) => Promise<void>;
  loading: boolean;
};

export const PromptView = ({ description, onSubmitGuess, loading }: PromptViewProps) => {
  const [guess, setGuess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Clear previous validation errors
    setValidationError(null);

    // Validate guess
    const trimmedGuess = guess.trim();
    if (!trimmedGuess) {
      setValidationError('Please enter a guess');
      return;
    }

    if (trimmedGuess.length > 100) {
      setValidationError('Guess must be 100 characters or less');
      return;
    }

    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmitGuess(trimmedGuess);
    } catch (error) {
      // Error will be handled by parent component
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="text-center">
          <div
            className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF4500] mb-4"
            role="status"
            aria-label="Loading prompt"
          ></div>
          <p className="text-lg text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Geometric Pictionary</h1>
            <p className="text-gray-600">What does this description represent?</p>
          </div>

          {/* Description Box */}
          <div className="bg-blue-50 rounded-lg p-6 mb-8">
            <div className="flex items-start gap-3">
              <div className="text-3xl" aria-hidden="true">
                📐
              </div>
              <div className="flex-1">
                <h2 className="text-sm font-semibold text-gray-700 mb-2">Description:</h2>
                <p className="text-lg text-gray-900 leading-relaxed">{description}</p>
              </div>
            </div>
          </div>

          {/* Guess Form */}
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label htmlFor="guess-input" className="block text-sm font-medium text-gray-700 mb-2">
                Your Guess
              </label>
              <input
                id="guess-input"
                type="text"
                value={guess}
                onChange={(e) => {
                  setGuess(e.target.value);
                  setValidationError(null); // Clear error on input change
                }}
                placeholder="Enter your guess..."
                className={`w-full px-4 py-3 text-lg border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent ${
                  validationError
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:ring-[#FF4500]'
                }`}
                disabled={isSubmitting}
                maxLength={100}
                autoFocus
              />
              {validationError && (
                <p className="mt-2 text-sm text-red-600" role="alert">
                  {validationError}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={!guess.trim() || isSubmitting}
              className="w-full bg-[#FF4500] hover:bg-[#D93900] text-white text-lg font-semibold py-4 px-6 rounded-lg transition-all duration-150 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF4500] focus-visible:ring-offset-2"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Guess'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
