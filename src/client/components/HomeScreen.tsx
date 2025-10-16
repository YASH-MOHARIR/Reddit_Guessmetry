import React from 'react';

type GameMode = 'classic' | 'consensus';

type HomeScreenProps = {
  onStartGame: (mode: GameMode) => void;
  username: string | null;
};

export function HomeScreen({ onStartGame, username }: HomeScreenProps) {
  const handleModeSelect = (mode: GameMode) => {
    onStartGame(mode);
  };

  const handleKeyDown = (mode: GameMode) => (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onStartGame(mode);
    }
  };

  return (
    <div
      className="min-h-screen bg-white flex items-center justify-center p-4 md:p-6 lg:p-8 animate-fade-in"
      role="main"
    >
      <div className="max-w-2xl w-full">
        {/* Game Title */}
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 text-center mb-6 md:mb-8">
          Guessmetry
        </h1>

        {/* Personalized Greeting */}
        {username && (
          <p
            className="text-lg md:text-xl text-gray-700 text-center mb-4 md:mb-6"
            aria-live="polite"
          >
            Welcome, {username}!
          </p>
        )}

        {/* Instructions Card */}
        <section
          className="bg-gray-50 rounded-xl p-5 md:p-7 lg:p-8 mb-6 md:mb-8 shadow-sm"
          aria-labelledby="instructions-heading"
        >
          <h2
            id="instructions-heading"
            className="text-xl md:text-2xl font-semibold text-gray-900 mb-3 md:mb-4"
          >
            Choose Your Mode
          </h2>
          <p className="text-base md:text-lg text-gray-700 leading-relaxed mb-4">
            You'll see geometric shape descriptions like "a circle on top of a rectangle." Your goal
            is to guess what object is being described!
          </p>
        </section>

        {/* Mode Selection Buttons */}
        <div className="space-y-4 mb-6 md:mb-8">
          {/* Classic Mode Button */}
          <button
            onClick={() => handleModeSelect('classic')}
            onKeyDown={handleKeyDown('classic')}
            className="w-full bg-[#FF4500] hover:bg-[#D93900] text-white text-lg md:text-xl font-semibold py-4 md:py-5 px-6 rounded-lg transition-all duration-150 hover:scale-[1.02] active:scale-[0.98] shadow-md min-h-[48px] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF4500] focus-visible:ring-offset-2"
            aria-label="Start Classic Mode - Match the creator's answer"
            type="button"
          >
            <div className="flex flex-col items-center">
              <span className="text-2xl mb-1" aria-hidden="true">
                🎯
              </span>
              <span className="font-bold">Classic Mode</span>
              <span className="text-sm md:text-base font-normal opacity-90 mt-1">
                Match the creator's answer • 10 pts for exact, 5 pts for close
              </span>
            </div>
          </button>

          {/* Consensus Mode Button */}
          <button
            onClick={() => handleModeSelect('consensus')}
            onKeyDown={handleKeyDown('consensus')}
            className="w-full bg-[#0079D3] hover:bg-[#0060A8] text-white text-lg md:text-xl font-semibold py-4 md:py-5 px-6 rounded-lg transition-all duration-150 hover:scale-[1.02] active:scale-[0.98] shadow-md min-h-[48px] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0079D3] focus-visible:ring-offset-2"
            aria-label="Start Consensus Mode - Match what the crowd thinks"
            type="button"
          >
            <div className="flex flex-col items-center">
              <span className="text-2xl mb-1" aria-hidden="true">
                👥
              </span>
              <span className="font-bold">Consensus Mode</span>
              <span className="text-sm md:text-base font-normal opacity-90 mt-1">
                Match the crowd • Up to 100 pts for majority answers
              </span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
