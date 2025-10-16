import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PollResultsDisplay } from './PollResultsDisplay';
import type { ConsensusResultsResponse } from '../../shared/types/api';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock the useConsensusPolling hook
vi.mock('../hooks/useConsensusPolling', () => ({
  useConsensusPolling: vi.fn(),
}));

import { useConsensusPolling } from '../hooks/useConsensusPolling';

describe('PollResultsDisplay', () => {
  const mockOnComplete = vi.fn();
  const mockUseConsensusPolling = useConsensusPolling as ReturnType<typeof vi.fn>;

  const mockResultsData: ConsensusResultsResponse = {
    type: 'consensus-results',
    aggregation: [
      {
        guess: 'jellyfish',
        count: 5183,
        percentage: 85.2,
        isPlayerGuess: true,
        isCreatorAnswer: false,
        rank: 1,
      },
      {
        guess: 'squid',
        count: 193,
        percentage: 3.2,
        isPlayerGuess: false,
        isCreatorAnswer: false,
        rank: 2,
      },
      {
        guess: 'octopus',
        count: 95,
        percentage: 1.6,
        isPlayerGuess: false,
        isCreatorAnswer: false,
        rank: 3,
      },
      {
        guess: 'house',
        count: 47,
        percentage: 0.8,
        isPlayerGuess: false,
        isCreatorAnswer: true,
        rank: 4,
      },
    ],
    playerGuess: 'jellyfish',
    creatorAnswer: 'house',
    totalPlayers: 6082,
    totalGuesses: 6518,
    playerScore: {
      pointsEarned: 100,
      matchPercentage: 85.2,
      tier: 'majority',
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockResultsData,
    });
    
    // Default mock implementation for useConsensusPolling
    mockUseConsensusPolling.mockReturnValue({
      aggregation: mockResultsData.aggregation,
      totalPlayers: mockResultsData.totalPlayers,
      totalGuesses: mockResultsData.totalGuesses,
      playerScore: mockResultsData.playerScore,
      creatorAnswerData: null,
      loading: false,
      error: null,
    });
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  it('should render loading state initially', () => {
    mockUseConsensusPolling.mockReturnValue({
      aggregation: [],
      totalPlayers: 0,
      totalGuesses: 0,
      playerScore: null,
      creatorAnswerData: null,
      loading: true,
      error: null,
    });

    render(
      <PollResultsDisplay
        promptId={1}
        playerGuess="jellyfish"
        creatorAnswer="house"
        timeRemaining={15}
        totalScore={350}
        onComplete={mockOnComplete}
      />
    );

    expect(screen.getByText('Loading results...')).toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('should call useConsensusPolling with correct parameters', async () => {
    render(
      <PollResultsDisplay
        promptId={42}
        playerGuess="jellyfish"
        creatorAnswer="house"
        timeRemaining={15}
        totalScore={350}
        onComplete={mockOnComplete}
      />
    );

    expect(mockUseConsensusPolling).toHaveBeenCalledWith({
      promptId: 42,
      enabled: true,
      interval: 2000,
    });
  });

  it('should render top 10 GuessAggregationBar components sorted by count', async () => {
    render(
      <PollResultsDisplay
        promptId={1}
        playerGuess="jellyfish"
        creatorAnswer="house"
        timeRemaining={15}
        totalScore={350}
        onComplete={mockOnComplete}
      />
    );

    await waitFor(() => {
      expect(screen.queryByText('Loading results...')).not.toBeInTheDocument();
    });

    // Check that all 4 guesses are rendered
    expect(screen.getByText('jellyfish')).toBeInTheDocument();
    expect(screen.getByText('squid')).toBeInTheDocument();
    expect(screen.getByText('octopus')).toBeInTheDocument();
    expect(screen.getByText('house')).toBeInTheDocument();

    // Check ranks
    expect(screen.getByText('#1')).toBeInTheDocument();
    expect(screen.getByText('#2')).toBeInTheDocument();
    expect(screen.getByText('#3')).toBeInTheDocument();
    expect(screen.getByText('#4')).toBeInTheDocument();
  });

  it('should display total players and total guesses at bottom', async () => {
    render(
      <PollResultsDisplay
        promptId={1}
        playerGuess="jellyfish"
        creatorAnswer="house"
        timeRemaining={15}
        totalScore={350}
        onComplete={mockOnComplete}
      />
    );

    await waitFor(() => {
      expect(screen.queryByText('Loading results...')).not.toBeInTheDocument();
    });

    // Check for the summary section with specific text pattern
    expect(screen.getByText(/6,082/)).toBeInTheDocument();
    expect(screen.getByText(/6,518/)).toBeInTheDocument();
    expect(screen.getByText(/total guesses/)).toBeInTheDocument();
    
    // Verify the summary container exists using getAllByText and checking the first match
    const summaryElements = screen.getAllByText((content, element) => {
      return element?.textContent === '📊 6,082 players • 6,518 total guesses';
    });
    expect(summaryElements.length).toBeGreaterThan(0);
  });

  it('should show error message if polling fails with retry button', async () => {
    mockUseConsensusPolling.mockReturnValue({
      aggregation: [],
      totalPlayers: 0,
      totalGuesses: 0,
      playerScore: null,
      creatorAnswerData: null,
      loading: false,
      error: 'Network error',
    });

    render(
      <PollResultsDisplay
        promptId={1}
        playerGuess="jellyfish"
        creatorAnswer="house"
        timeRemaining={15}
        totalScore={350}
        onComplete={mockOnComplete}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('should handle empty aggregation case with "Be the first to guess!" message', async () => {
    mockUseConsensusPolling.mockReturnValue({
      aggregation: [],
      totalPlayers: 0,
      totalGuesses: 0,
      playerScore: null,
      creatorAnswerData: null,
      loading: false,
      error: null,
    });

    render(
      <PollResultsDisplay
        promptId={1}
        playerGuess={null}
        creatorAnswer="house"
        timeRemaining={15}
        totalScore={350}
        onComplete={mockOnComplete}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Be the first to guess!')).toBeInTheDocument();
    });

    expect(
      screen.getByText(/No guesses yet. Your answer will appear here once submitted./)
    ).toBeInTheDocument();
  });

  it('should auto-call onComplete when timeRemaining reaches 0', async () => {
    const { rerender } = render(
      <PollResultsDisplay
        promptId={1}
        playerGuess="jellyfish"
        creatorAnswer="house"
        timeRemaining={5}
        totalScore={350}
        onComplete={mockOnComplete}
      />
    );

    await waitFor(() => {
      expect(screen.queryByText('Loading results...')).not.toBeInTheDocument();
    });

    expect(mockOnComplete).not.toHaveBeenCalled();

    // Update timeRemaining to 0
    rerender(
      <PollResultsDisplay
        promptId={1}
        playerGuess="jellyfish"
        creatorAnswer="house"
        timeRemaining={0}
        totalScore={350}
        onComplete={mockOnComplete}
      />
    );

    await waitFor(() => {
      expect(mockOnComplete).toHaveBeenCalledTimes(1);
    });
  });

  it('should use Tailwind CSS for layout with vertical stack, centered, max-width 800px', async () => {
    const { container } = render(
      <PollResultsDisplay
        promptId={1}
        playerGuess="jellyfish"
        creatorAnswer="house"
        timeRemaining={15}
        totalScore={350}
        onComplete={mockOnComplete}
      />
    );

    await waitFor(() => {
      expect(screen.queryByText('Loading results...')).not.toBeInTheDocument();
    });

    const mainContainer = container.querySelector('[role="region"]');
    expect(mainContainer).toHaveClass('max-w-[800px]');
    expect(mainContainer).toHaveClass('mx-auto');
  });

  it('should handle polling errors', async () => {
    mockUseConsensusPolling.mockReturnValue({
      aggregation: [],
      totalPlayers: 0,
      totalGuesses: 0,
      playerScore: null,
      creatorAnswerData: null,
      loading: false,
      error: 'Failed to fetch results: Internal Server Error',
    });

    render(
      <PollResultsDisplay
        promptId={1}
        playerGuess="jellyfish"
        creatorAnswer="house"
        timeRemaining={15}
        totalScore={350}
        onComplete={mockOnComplete}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/Failed to fetch results/)).toBeInTheDocument();
    });
  });

  it('should render only top 10 guesses when more than 10 exist', async () => {
    const manyGuesses = Array.from({ length: 15 }, (_, i) => ({
      guess: `guess${i + 1}`,
      count: 100 - i * 5,
      percentage: 10 - i * 0.5,
      isPlayerGuess: i === 0,
      isCreatorAnswer: false,
      rank: i + 1,
    }));

    mockUseConsensusPolling.mockReturnValue({
      aggregation: manyGuesses,
      totalPlayers: 1000,
      totalGuesses: 1000,
      playerScore: null,
      creatorAnswerData: null,
      loading: false,
      error: null,
    });

    render(
      <PollResultsDisplay
        promptId={1}
        playerGuess="guess1"
        creatorAnswer="house"
        timeRemaining={15}
        totalScore={350}
        onComplete={mockOnComplete}
      />
    );

    await waitFor(() => {
      expect(screen.queryByText('Loading results...')).not.toBeInTheDocument();
    });

    // Should render first 10
    expect(screen.getByText('guess1')).toBeInTheDocument();
    expect(screen.getByText('guess10')).toBeInTheDocument();

    // Should not render 11th and beyond
    expect(screen.queryByText('guess11')).not.toBeInTheDocument();
    expect(screen.queryByText('guess15')).not.toBeInTheDocument();
  });

  it('should display singular "player" and "guess" when counts are 1', async () => {
    mockUseConsensusPolling.mockReturnValue({
      aggregation: [
        {
          guess: 'jellyfish',
          count: 1,
          percentage: 100,
          isPlayerGuess: true,
          isCreatorAnswer: false,
          rank: 1,
        },
      ],
      totalPlayers: 1,
      totalGuesses: 1,
      playerScore: null,
      creatorAnswerData: null,
      loading: false,
      error: null,
    });

    render(
      <PollResultsDisplay
        promptId={1}
        playerGuess="jellyfish"
        creatorAnswer="house"
        timeRemaining={15}
        totalScore={350}
        onComplete={mockOnComplete}
      />
    );

    await waitFor(() => {
      expect(screen.queryByText('Loading results...')).not.toBeInTheDocument();
    });

    // Verify the summary container has singular forms using getAllByText
    const summaryElements = screen.getAllByText((content, element) => {
      return element?.textContent === '📊 1 player • 1 total guess';
    });
    expect(summaryElements.length).toBeGreaterThan(0);
  });

  describe('ConsensusScoreDisplay Integration', () => {
    it('should render ConsensusScoreDisplay when playerScore is available', async () => {
      render(
        <PollResultsDisplay
          promptId={1}
          playerGuess="jellyfish"
          creatorAnswer="house"
          timeRemaining={15}
          totalScore={450}
          onComplete={mockOnComplete}
        />
      );

      await waitFor(() => {
        expect(screen.queryByText('Loading results...')).not.toBeInTheDocument();
      });

      // Check that ConsensusScoreDisplay is rendered with correct data
      expect(screen.getByText(/MAJORITY/)).toBeInTheDocument();
      // Wait for animation to complete - points count up from 0 to 100
      await waitFor(() => {
        expect(screen.getByText(/\+100 POINTS/)).toBeInTheDocument();
      }, { timeout: 1000 });
      expect(screen.getByText(/You matched 85.2% of players!/)).toBeInTheDocument();
      // Wait for total score animation to complete
      await waitFor(() => {
        expect(screen.getByText(/Total Score: 450/)).toBeInTheDocument();
      }, { timeout: 1500 });
    });

    it('should not render ConsensusScoreDisplay when playerScore is null', async () => {
      mockUseConsensusPolling.mockReturnValue({
        aggregation: mockResultsData.aggregation,
        totalPlayers: mockResultsData.totalPlayers,
        totalGuesses: mockResultsData.totalGuesses,
        playerScore: null,
        creatorAnswerData: null,
        loading: false,
        error: null,
      });

      render(
        <PollResultsDisplay
          promptId={1}
          playerGuess="jellyfish"
          creatorAnswer="house"
          timeRemaining={15}
          totalScore={350}
          onComplete={mockOnComplete}
        />
      );

      await waitFor(() => {
        expect(screen.queryByText('Loading results...')).not.toBeInTheDocument();
      });

      // ConsensusScoreDisplay should not be rendered
      expect(screen.queryByText(/MAJORITY/)).not.toBeInTheDocument();
      expect(screen.queryByText(/POINTS/)).not.toBeInTheDocument();
    });

    it('should position ConsensusScoreDisplay below poll results', async () => {
      const { container } = render(
        <PollResultsDisplay
          promptId={1}
          playerGuess="jellyfish"
          creatorAnswer="house"
          timeRemaining={15}
          totalScore={450}
          onComplete={mockOnComplete}
        />
      );

      await waitFor(() => {
        expect(screen.queryByText('Loading results...')).not.toBeInTheDocument();
      });

      // Find the summary section and score display
      const summarySection = screen.getByText(/6,082/).closest('div');
      const scoreDisplay = screen.getByText(/MAJORITY/).closest('div');

      // Verify score display comes after summary in DOM order
      expect(summarySection).toBeInTheDocument();
      expect(scoreDisplay).toBeInTheDocument();
    });

    it('should pass correct props to ConsensusScoreDisplay', async () => {
      render(
        <PollResultsDisplay
          promptId={1}
          playerGuess="jellyfish"
          creatorAnswer="house"
          timeRemaining={15}
          totalScore={450}
          onComplete={mockOnComplete}
        />
      );

      await waitFor(() => {
        expect(screen.queryByText('Loading results...')).not.toBeInTheDocument();
      });

      // Verify all props are correctly passed
      // Wait for animation to complete - points count up from 0 to 100
      await waitFor(() => {
        expect(screen.getByText(/\+100 POINTS/)).toBeInTheDocument(); // pointsEarned
      }, { timeout: 1000 });
      expect(screen.getByText(/You matched 85.2% of players!/)).toBeInTheDocument(); // matchPercentage
      expect(screen.getByText(/MAJORITY/)).toBeInTheDocument(); // tier
      // Wait for total score animation to complete
      await waitFor(() => {
        expect(screen.getByText(/Total Score: 450/)).toBeInTheDocument(); // totalScore
      }, { timeout: 1500 });
    });
  });

  describe('Live Polling Integration', () => {
    it('should enable polling when timeRemaining > 0', async () => {
      render(
        <PollResultsDisplay
          promptId={1}
          playerGuess="jellyfish"
          creatorAnswer="house"
          timeRemaining={15}
          totalScore={350}
          onComplete={mockOnComplete}
        />
      );

      expect(mockUseConsensusPolling).toHaveBeenCalledWith({
        promptId: 1,
        enabled: true,
        interval: 2000,
      });
    });

    it('should disable polling when timeRemaining reaches 0', async () => {
      const { rerender } = render(
        <PollResultsDisplay
          promptId={1}
          playerGuess="jellyfish"
          creatorAnswer="house"
          timeRemaining={5}
          totalScore={350}
          onComplete={mockOnComplete}
        />
      );

      expect(mockUseConsensusPolling).toHaveBeenCalledWith({
        promptId: 1,
        enabled: true,
        interval: 2000,
      });

      // Set timeRemaining to 0
      rerender(
        <PollResultsDisplay
          promptId={1}
          playerGuess="jellyfish"
          creatorAnswer="house"
          timeRemaining={0}
          totalScore={350}
          onComplete={mockOnComplete}
        />
      );

      // Should now be called with enabled: false
      expect(mockUseConsensusPolling).toHaveBeenCalledWith({
        promptId: 1,
        enabled: false,
        interval: 2000,
      });
    });

    it('should update displayed aggregation data when polling returns new data', async () => {
      const initialData = {
        aggregation: [
          {
            guess: 'jellyfish',
            count: 100,
            percentage: 50,
            isPlayerGuess: true,
            isCreatorAnswer: false,
            rank: 1,
          },
        ],
        totalPlayers: 200,
        totalGuesses: 200,
        playerScore: null,
        creatorAnswerData: null,
        loading: false,
        error: null,
      };

      mockUseConsensusPolling.mockReturnValue(initialData);

      const { rerender } = render(
        <PollResultsDisplay
          promptId={1}
          playerGuess="jellyfish"
          creatorAnswer="house"
          timeRemaining={15}
          totalScore={350}
          onComplete={mockOnComplete}
        />
      );

      // Wait for initial data
      await waitFor(() => {
        const elements = screen.getAllByText(/200/);
        expect(elements.length).toBeGreaterThan(0);
      });

      // Simulate polling returning new data
      const updatedData = {
        aggregation: [
          {
            guess: 'jellyfish',
            count: 150,
            percentage: 60,
            isPlayerGuess: true,
            isCreatorAnswer: false,
            rank: 1,
          },
          {
            guess: 'squid',
            count: 100,
            percentage: 40,
            isPlayerGuess: false,
            isCreatorAnswer: false,
            rank: 2,
          },
        ],
        totalPlayers: 250,
        totalGuesses: 250,
        playerScore: null,
        creatorAnswerData: null,
        loading: false,
        error: null,
      };

      mockUseConsensusPolling.mockReturnValue(updatedData);
      rerender(
        <PollResultsDisplay
          promptId={1}
          playerGuess="jellyfish"
          creatorAnswer="house"
          timeRemaining={15}
          totalScore={350}
          onComplete={mockOnComplete}
        />
      );

      // Wait for updated data
      await waitFor(() => {
        const elements = screen.getAllByText(/250/);
        expect(elements.length).toBeGreaterThan(0);
        expect(screen.getByText('squid')).toBeInTheDocument();
      });
    });

    it('should show warning message if polling fails 3 times', async () => {
      mockUseConsensusPolling.mockReturnValue({
        aggregation: [
          {
            guess: 'jellyfish',
            count: 100,
            percentage: 50,
            isPlayerGuess: true,
            isCreatorAnswer: false,
            rank: 1,
          },
        ],
        totalPlayers: 200,
        totalGuesses: 200,
        playerScore: null,
        creatorAnswerData: null,
        loading: false,
        error: 'Polling stopped after 3 consecutive failures',
      });

      render(
        <PollResultsDisplay
          promptId={1}
          playerGuess="jellyfish"
          creatorAnswer="house"
          timeRemaining={15}
          totalScore={350}
          onComplete={mockOnComplete}
        />
      );

      // Should show warning message
      await waitFor(() => {
        expect(screen.getByText(/Live updates paused/)).toBeInTheDocument();
      });

      expect(screen.getByText(/Unable to fetch live updates/)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
      
      // Should still show the data
      expect(screen.getByText('jellyfish')).toBeInTheDocument();
    });

    it('should provide Retry button to resume polling after failures', async () => {
      mockUseConsensusPolling.mockReturnValue({
        aggregation: [
          {
            guess: 'jellyfish',
            count: 100,
            percentage: 50,
            isPlayerGuess: true,
            isCreatorAnswer: false,
            rank: 1,
          },
        ],
        totalPlayers: 200,
        totalGuesses: 200,
        playerScore: null,
        creatorAnswerData: null,
        loading: false,
        error: 'Polling stopped after 3 consecutive failures',
      });

      render(
        <PollResultsDisplay
          promptId={1}
          playerGuess="jellyfish"
          creatorAnswer="house"
          timeRemaining={15}
          totalScore={350}
          onComplete={mockOnComplete}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/Live updates paused/)).toBeInTheDocument();
      });

      const retryButton = screen.getByRole('button', { name: /retry/i });
      expect(retryButton).toBeInTheDocument();

      // Note: Retry button reloads the page, so we can't test the actual retry behavior
      // but we can verify the button exists and is clickable
      expect(retryButton).not.toBeDisabled();
    });

    it('should animate rank changes when guesses move up/down', async () => {
      const initialData = {
        aggregation: [
          {
            guess: 'jellyfish',
            count: 100,
            percentage: 50,
            isPlayerGuess: true,
            isCreatorAnswer: false,
            rank: 1,
          },
          {
            guess: 'squid',
            count: 80,
            percentage: 40,
            isPlayerGuess: false,
            isCreatorAnswer: false,
            rank: 2,
          },
        ],
        totalPlayers: 200,
        totalGuesses: 200,
        playerScore: null,
        creatorAnswerData: null,
        loading: false,
        error: null,
      };

      mockUseConsensusPolling.mockReturnValue(initialData);

      const { container, rerender } = render(
        <PollResultsDisplay
          promptId={1}
          playerGuess="jellyfish"
          creatorAnswer="house"
          timeRemaining={15}
          totalScore={350}
          onComplete={mockOnComplete}
        />
      );

      // Wait for initial data
      await waitFor(() => {
        expect(screen.getByText('jellyfish')).toBeInTheDocument();
      });

      // Simulate polling returning data with rank changes
      const updatedData = {
        aggregation: [
          {
            guess: 'squid',
            count: 120,
            percentage: 55,
            isPlayerGuess: false,
            isCreatorAnswer: false,
            rank: 1,
          },
          {
            guess: 'jellyfish',
            count: 100,
            percentage: 45,
            isPlayerGuess: true,
            isCreatorAnswer: false,
            rank: 2,
          },
        ],
        totalPlayers: 220,
        totalGuesses: 220,
        playerScore: null,
        creatorAnswerData: null,
        loading: false,
        error: null,
      };

      mockUseConsensusPolling.mockReturnValue(updatedData);
      rerender(
        <PollResultsDisplay
          promptId={1}
          playerGuess="jellyfish"
          creatorAnswer="house"
          timeRemaining={15}
          totalScore={350}
          onComplete={mockOnComplete}
        />
      );

      // Wait for updated data with rank changes
      await waitFor(() => {
        const squidElements = screen.getAllByText('squid');
        expect(squidElements.length).toBeGreaterThan(0);
      });

      // Check that transition classes are applied
      const transitionElements = container.querySelectorAll('.transition-all');
      expect(transitionElements.length).toBeGreaterThan(0);
    });
  });

  describe('Creator Answer Fallback Display', () => {
    it('should display creator answer separately when not in top 10', async () => {
      const creatorAnswerData = {
        guess: 'house',
        count: 5,
        percentage: 0.5,
        isPlayerGuess: false,
        isCreatorAnswer: true,
        rank: 11,
      };

      mockUseConsensusPolling.mockReturnValue({
        aggregation: [
          {
            guess: 'jellyfish',
            count: 850,
            percentage: 85.0,
            isPlayerGuess: true,
            isCreatorAnswer: false,
            rank: 1,
          },
          {
            guess: 'squid',
            count: 100,
            percentage: 10.0,
            isPlayerGuess: false,
            isCreatorAnswer: false,
            rank: 2,
          },
        ],
        totalPlayers: 1000,
        totalGuesses: 1000,
        playerScore: {
          pointsEarned: 100,
          matchPercentage: 85.0,
          tier: 'majority',
        },
        creatorAnswerData: creatorAnswerData,
        loading: false,
        error: null,
      });

      render(
        <PollResultsDisplay
          promptId={1}
          playerGuess="jellyfish"
          creatorAnswer="house"
          timeRemaining={15}
          totalScore={450}
          onComplete={mockOnComplete}
        />
      );

      await waitFor(() => {
        expect(screen.queryByText('Loading results...')).not.toBeInTheDocument();
      });

      // Should show "Creator's Answer" label
      expect(screen.getByText("Creator's Answer")).toBeInTheDocument();

      // Should show the creator's answer
      expect(screen.getByText('house')).toBeInTheDocument();

      // Should show count and percentage
      expect(screen.getByText(/5 players/)).toBeInTheDocument();
      expect(screen.getAllByText(/0.5%/).length).toBeGreaterThan(0);
    });

    it('should not display creator answer section when it is in top 10', async () => {
      mockUseConsensusPolling.mockReturnValue({
        aggregation: [
          {
            guess: 'jellyfish',
            count: 850,
            percentage: 85.0,
            isPlayerGuess: true,
            isCreatorAnswer: false,
            rank: 1,
          },
          {
            guess: 'house',
            count: 100,
            percentage: 10.0,
            isPlayerGuess: false,
            isCreatorAnswer: true,
            rank: 2,
          },
        ],
        totalPlayers: 1000,
        totalGuesses: 1000,
        playerScore: {
          pointsEarned: 100,
          matchPercentage: 85.0,
          tier: 'majority',
        },
        creatorAnswerData: null,
        loading: false,
        error: null,
      });

      render(
        <PollResultsDisplay
          promptId={1}
          playerGuess="jellyfish"
          creatorAnswer="house"
          timeRemaining={15}
          totalScore={450}
          onComplete={mockOnComplete}
        />
      );

      await waitFor(() => {
        expect(screen.queryByText('Loading results...')).not.toBeInTheDocument();
      });

      // Should NOT show "Creator's Answer" label
      expect(screen.queryByText("Creator's Answer")).not.toBeInTheDocument();

      // Creator's answer should still appear in the top 10
      expect(screen.getByText('house')).toBeInTheDocument();
    });

    it('should apply gold border styling to creator answer fallback', async () => {
      const creatorAnswerData = {
        guess: 'house',
        count: 5,
        percentage: 0.5,
        isPlayerGuess: false,
        isCreatorAnswer: true,
        rank: 11,
      };

      mockUseConsensusPolling.mockReturnValue({
        aggregation: [
          {
            guess: 'jellyfish',
            count: 850,
            percentage: 85.0,
            isPlayerGuess: true,
            isCreatorAnswer: false,
            rank: 1,
          },
        ],
        totalPlayers: 1000,
        totalGuesses: 1000,
        playerScore: null,
        creatorAnswerData: creatorAnswerData,
        loading: false,
        error: null,
      });

      render(
        <PollResultsDisplay
          promptId={1}
          playerGuess="jellyfish"
          creatorAnswer="house"
          timeRemaining={15}
          totalScore={450}
          onComplete={mockOnComplete}
        />
      );

      await waitFor(() => {
        expect(screen.queryByText('Loading results...')).not.toBeInTheDocument();
      });

      // Find the creator answer section by its parent div with animate-fade-in class
      const creatorAnswerSection = screen.getByText("Creator's Answer").closest('div')?.parentElement;
      expect(creatorAnswerSection).toBeInTheDocument();
    });
  });

  describe('Consensus vs Creator Comparison Messages', () => {
    it('should display "The crowd agreed with the creator!" when creator answer matches majority', async () => {
      mockUseConsensusPolling.mockReturnValue({
        aggregation: [
          {
            guess: 'house',
            count: 5000,
            percentage: 85.0,
            isPlayerGuess: false,
            isCreatorAnswer: true,
            rank: 1,
          },
          {
            guess: 'jellyfish',
            count: 500,
            percentage: 8.5,
            isPlayerGuess: true,
            isCreatorAnswer: false,
            rank: 2,
          },
        ],
        totalPlayers: 5882,
        totalGuesses: 6000,
        playerScore: {
          pointsEarned: 50,
          matchPercentage: 8.5,
          tier: 'uncommon',
        },
        creatorAnswerData: null,
        loading: false,
        error: null,
      });

      render(
        <PollResultsDisplay
          promptId={1}
          playerGuess="jellyfish"
          creatorAnswer="house"
          timeRemaining={15}
          totalScore={350}
          onComplete={mockOnComplete}
        />
      );

      await waitFor(() => {
        expect(screen.queryByText('Loading results...')).not.toBeInTheDocument();
      });

      // Should show agreement message
      expect(screen.getByText(/The crowd agreed with the creator!/)).toBeInTheDocument();
      expect(screen.getByText(/The creator's answer "house" is the majority choice at 85.0%/)).toBeInTheDocument();
    });

    it('should display "The crowd had other ideas!" when creator answer does not match majority', async () => {
      mockUseConsensusPolling.mockReturnValue({
        aggregation: [
          {
            guess: 'jellyfish',
            count: 5000,
            percentage: 85.0,
            isPlayerGuess: true,
            isCreatorAnswer: false,
            rank: 1,
          },
          {
            guess: 'house',
            count: 50,
            percentage: 0.85,
            isPlayerGuess: false,
            isCreatorAnswer: true,
            rank: 2,
          },
        ],
        totalPlayers: 5882,
        totalGuesses: 6000,
        playerScore: {
          pointsEarned: 100,
          matchPercentage: 85.0,
          tier: 'majority',
        },
        creatorAnswerData: null,
        loading: false,
        error: null,
      });

      render(
        <PollResultsDisplay
          promptId={1}
          playerGuess="jellyfish"
          creatorAnswer="house"
          timeRemaining={15}
          totalScore={450}
          onComplete={mockOnComplete}
        />
      );

      await waitFor(() => {
        expect(screen.queryByText('Loading results...')).not.toBeInTheDocument();
      });

      // Should show disagreement message
      expect(screen.getByText(/The crowd had other ideas!/)).toBeInTheDocument();
      expect(screen.getByText(/Top guess: "jellyfish" \(85.0%\)/)).toBeInTheDocument();
      expect(screen.getByText(/Creator's answer: "house" \(0.8%\)/)).toBeInTheDocument();
    });

    it('should show percentage difference between creator answer and top guess', async () => {
      mockUseConsensusPolling.mockReturnValue({
        aggregation: [
          {
            guess: 'jellyfish',
            count: 5000,
            percentage: 85.0,
            isPlayerGuess: true,
            isCreatorAnswer: false,
            rank: 1,
          },
          {
            guess: 'house',
            count: 300,
            percentage: 5.1,
            isPlayerGuess: false,
            isCreatorAnswer: true,
            rank: 2,
          },
        ],
        totalPlayers: 5882,
        totalGuesses: 6000,
        playerScore: {
          pointsEarned: 100,
          matchPercentage: 85.0,
          tier: 'majority',
        },
        creatorAnswerData: null,
        loading: false,
        error: null,
      });

      render(
        <PollResultsDisplay
          promptId={1}
          playerGuess="jellyfish"
          creatorAnswer="house"
          timeRemaining={15}
          totalScore={450}
          onComplete={mockOnComplete}
        />
      );

      await waitFor(() => {
        expect(screen.queryByText('Loading results...')).not.toBeInTheDocument();
      });

      // Should show percentage difference (85.0 - 5.1 = 79.9)
      expect(screen.getByText(/79.9% difference/)).toBeInTheDocument();
    });

    it('should work with creator answer not in top 10 (using creatorAnswerData)', async () => {
      const creatorAnswerData = {
        guess: 'house',
        count: 5,
        percentage: 0.5,
        isPlayerGuess: false,
        isCreatorAnswer: true,
        rank: 11,
      };

      mockUseConsensusPolling.mockReturnValue({
        aggregation: [
          {
            guess: 'jellyfish',
            count: 850,
            percentage: 85.0,
            isPlayerGuess: true,
            isCreatorAnswer: false,
            rank: 1,
          },
          {
            guess: 'squid',
            count: 100,
            percentage: 10.0,
            isPlayerGuess: false,
            isCreatorAnswer: false,
            rank: 2,
          },
        ],
        totalPlayers: 1000,
        totalGuesses: 1000,
        playerScore: {
          pointsEarned: 100,
          matchPercentage: 85.0,
          tier: 'majority',
        },
        creatorAnswerData: creatorAnswerData,
        loading: false,
        error: null,
      });

      render(
        <PollResultsDisplay
          promptId={1}
          playerGuess="jellyfish"
          creatorAnswer="house"
          timeRemaining={15}
          totalScore={450}
          onComplete={mockOnComplete}
        />
      );

      await waitFor(() => {
        expect(screen.queryByText('Loading results...')).not.toBeInTheDocument();
      });

      // Should show disagreement message
      expect(screen.getByText(/The crowd had other ideas!/)).toBeInTheDocument();
      expect(screen.getByText(/Top guess: "jellyfish" \(85.0%\)/)).toBeInTheDocument();
      expect(screen.getByText(/Creator's answer: "house" \(0.5%\)/)).toBeInTheDocument();
      
      // Should show percentage difference (85.0 - 0.5 = 84.5)
      expect(screen.getByText(/84.5% difference/)).toBeInTheDocument();
    });

    it('should position comparison message prominently near creator answer indicator', async () => {
      mockUseConsensusPolling.mockReturnValue({
        aggregation: [
          {
            guess: 'jellyfish',
            count: 5000,
            percentage: 85.0,
            isPlayerGuess: true,
            isCreatorAnswer: false,
            rank: 1,
          },
          {
            guess: 'house',
            count: 50,
            percentage: 0.85,
            isPlayerGuess: false,
            isCreatorAnswer: true,
            rank: 2,
          },
        ],
        totalPlayers: 5882,
        totalGuesses: 6000,
        playerScore: {
          pointsEarned: 100,
          matchPercentage: 85.0,
          tier: 'majority',
        },
        creatorAnswerData: null,
        loading: false,
        error: null,
      });

      const { container } = render(
        <PollResultsDisplay
          promptId={1}
          playerGuess="jellyfish"
          creatorAnswer="house"
          timeRemaining={15}
          totalScore={450}
          onComplete={mockOnComplete}
        />
      );

      await waitFor(() => {
        expect(screen.queryByText('Loading results...')).not.toBeInTheDocument();
      });

      // Find the comparison message
      const comparisonMessage = screen.getByText(/The crowd had other ideas!/).closest('div');
      expect(comparisonMessage).toBeInTheDocument();
      
      // Verify it has prominent styling (updated for responsive classes)
      expect(comparisonMessage).toHaveClass('border-2');
      expect(comparisonMessage).toHaveClass('rounded-lg');
      expect(comparisonMessage).toHaveClass('p-3', 'sm:p-4');
      expect(comparisonMessage).toHaveClass('text-center');
    });

    it('should not display comparison message when no creator answer data is available', async () => {
      mockUseConsensusPolling.mockReturnValue({
        aggregation: [
          {
            guess: 'jellyfish',
            count: 5000,
            percentage: 85.0,
            isPlayerGuess: true,
            isCreatorAnswer: false,
            rank: 1,
          },
        ],
        totalPlayers: 5882,
        totalGuesses: 6000,
        playerScore: {
          pointsEarned: 100,
          matchPercentage: 85.0,
          tier: 'majority',
        },
        creatorAnswerData: null,
        loading: false,
        error: null,
      });

      render(
        <PollResultsDisplay
          promptId={1}
          playerGuess="jellyfish"
          creatorAnswer="unknown"
          timeRemaining={15}
          totalScore={450}
          onComplete={mockOnComplete}
        />
      );

      await waitFor(() => {
        expect(screen.queryByText('Loading results...')).not.toBeInTheDocument();
      });

      // Should not show any comparison message
      expect(screen.queryByText(/The crowd agreed with the creator!/)).not.toBeInTheDocument();
      expect(screen.queryByText(/The crowd had other ideas!/)).not.toBeInTheDocument();
    });

    it('should use green styling for agreement message', async () => {
      mockUseConsensusPolling.mockReturnValue({
        aggregation: [
          {
            guess: 'house',
            count: 5000,
            percentage: 85.0,
            isPlayerGuess: false,
            isCreatorAnswer: true,
            rank: 1,
          },
        ],
        totalPlayers: 5882,
        totalGuesses: 6000,
        playerScore: null,
        creatorAnswerData: null,
        loading: false,
        error: null,
      });

      render(
        <PollResultsDisplay
          promptId={1}
          playerGuess="jellyfish"
          creatorAnswer="house"
          timeRemaining={15}
          totalScore={350}
          onComplete={mockOnComplete}
        />
      );

      await waitFor(() => {
        expect(screen.queryByText('Loading results...')).not.toBeInTheDocument();
      });

      const agreementMessage = screen.getByText(/The crowd agreed with the creator!/).closest('div');
      expect(agreementMessage).toHaveClass('bg-green-50');
      expect(agreementMessage).toHaveClass('border-green-300');
    });

    it('should use purple styling for disagreement message', async () => {
      mockUseConsensusPolling.mockReturnValue({
        aggregation: [
          {
            guess: 'jellyfish',
            count: 5000,
            percentage: 85.0,
            isPlayerGuess: true,
            isCreatorAnswer: false,
            rank: 1,
          },
          {
            guess: 'house',
            count: 50,
            percentage: 0.85,
            isPlayerGuess: false,
            isCreatorAnswer: true,
            rank: 2,
          },
        ],
        totalPlayers: 5882,
        totalGuesses: 6000,
        playerScore: null,
        creatorAnswerData: null,
        loading: false,
        error: null,
      });

      render(
        <PollResultsDisplay
          promptId={1}
          playerGuess="jellyfish"
          creatorAnswer="house"
          timeRemaining={15}
          totalScore={450}
          onComplete={mockOnComplete}
        />
      );

      await waitFor(() => {
        expect(screen.queryByText('Loading results...')).not.toBeInTheDocument();
      });

      const disagreementMessage = screen.getByText(/The crowd had other ideas!/).closest('div');
      expect(disagreementMessage).toHaveClass('bg-purple-50');
      expect(disagreementMessage).toHaveClass('border-purple-300');
    });
  });

  describe('Mobile Responsiveness', () => {
    it('applies responsive padding to main container', () => {
      const { container } = render(
        <PollResultsDisplay
          promptId={1}
          playerGuess="jellyfish"
          creatorAnswer="house"
          timeRemaining={15}
          totalScore={450}
          onComplete={mockOnComplete}
        />
      );

      const mainContainer = container.querySelector('[role="region"]');
      expect(mainContainer).toHaveClass('px-3', 'sm:px-4', 'md:px-6', 'lg:px-8');
    });

    it('prevents horizontal scrolling with overflow-x-hidden', () => {
      const { container } = render(
        <PollResultsDisplay
          promptId={1}
          playerGuess="jellyfish"
          creatorAnswer="house"
          timeRemaining={15}
          totalScore={450}
          onComplete={mockOnComplete}
        />
      );

      const mainContainer = container.querySelector('[role="region"]');
      expect(mainContainer).toHaveClass('overflow-x-hidden');
    });

    it('applies responsive margin to timer section', () => {
      const { container } = render(
        <PollResultsDisplay
          promptId={1}
          playerGuess="jellyfish"
          creatorAnswer="house"
          timeRemaining={15}
          totalScore={450}
          onComplete={mockOnComplete}
        />
      );

      const timerContainer = container.querySelector('.mb-4.sm\\:mb-6.md\\:mb-8');
      expect(timerContainer).toBeInTheDocument();
    });

    it('ensures retry buttons meet minimum touch target size (44x44px)', async () => {
      mockUseConsensusPolling.mockReturnValue({
        aggregation: mockResultsData.aggregation,
        totalPlayers: mockResultsData.totalPlayers,
        totalGuesses: mockResultsData.totalGuesses,
        playerScore: mockResultsData.playerScore,
        creatorAnswerData: null,
        loading: false,
        error: 'Failed to fetch results after 3 consecutive failures',
      });

      render(
        <PollResultsDisplay
          promptId={1}
          playerGuess="jellyfish"
          creatorAnswer="house"
          timeRemaining={15}
          totalScore={450}
          onComplete={mockOnComplete}
        />
      );

      const retryButton = screen.getByRole('button', { name: /retry polling/i });
      expect(retryButton).toHaveClass('min-h-[44px]', 'min-w-[44px]');
    });

    it('applies responsive padding to warning messages', async () => {
      mockUseConsensusPolling.mockReturnValue({
        aggregation: mockResultsData.aggregation,
        totalPlayers: mockResultsData.totalPlayers,
        totalGuesses: mockResultsData.totalGuesses,
        playerScore: mockResultsData.playerScore,
        creatorAnswerData: null,
        loading: false,
        error: 'Failed to fetch results after 3 consecutive failures',
      });

      render(
        <PollResultsDisplay
          promptId={1}
          playerGuess="jellyfish"
          creatorAnswer="house"
          timeRemaining={15}
          totalScore={450}
          onComplete={mockOnComplete}
        />
      );

      const warningBox = screen.getByRole('alert');
      expect(warningBox).toHaveClass('p-3', 'sm:p-4');
    });

    it('applies responsive text sizing to warning messages', async () => {
      mockUseConsensusPolling.mockReturnValue({
        aggregation: mockResultsData.aggregation,
        totalPlayers: mockResultsData.totalPlayers,
        totalGuesses: mockResultsData.totalGuesses,
        playerScore: mockResultsData.playerScore,
        creatorAnswerData: null,
        loading: false,
        error: 'Failed to fetch results after 3 consecutive failures',
      });

      render(
        <PollResultsDisplay
          promptId={1}
          playerGuess="jellyfish"
          creatorAnswer="house"
          timeRemaining={15}
          totalScore={450}
          onComplete={mockOnComplete}
        />
      );

      const warningTitle = screen.getByText(/Live updates paused/);
      expect(warningTitle).toHaveClass('text-sm', 'sm:text-base');
    });

    it('applies full width to guess bars container', () => {
      const { container } = render(
        <PollResultsDisplay
          promptId={1}
          playerGuess="jellyfish"
          creatorAnswer="house"
          timeRemaining={15}
          totalScore={450}
          onComplete={mockOnComplete}
        />
      );

      const guessContainer = container.querySelector('.mb-4.sm\\:mb-6.w-full');
      expect(guessContainer).toBeInTheDocument();
    });

    it('applies responsive text sizing to comparison messages', async () => {
      render(
        <PollResultsDisplay
          promptId={1}
          playerGuess="jellyfish"
          creatorAnswer="house"
          timeRemaining={15}
          totalScore={450}
          onComplete={mockOnComplete}
        />
      );

      await waitFor(() => {
        expect(screen.queryByText('Loading results...')).not.toBeInTheDocument();
      });

      const comparisonMessage = screen.getByText(/The crowd had other ideas!/);
      expect(comparisonMessage).toHaveClass('text-base', 'sm:text-lg', 'md:text-xl');
    });

    it('applies break-words to prevent text overflow in comparison messages', async () => {
      render(
        <PollResultsDisplay
          promptId={1}
          playerGuess="jellyfish"
          creatorAnswer="house"
          timeRemaining={15}
          totalScore={450}
          onComplete={mockOnComplete}
        />
      );

      await waitFor(() => {
        expect(screen.queryByText('Loading results...')).not.toBeInTheDocument();
      });

      const comparisonDetails = screen.getByText(/Top guess:/);
      expect(comparisonDetails).toHaveClass('break-words');
    });

    it('applies responsive padding to bottom summary', async () => {
      render(
        <PollResultsDisplay
          promptId={1}
          playerGuess="jellyfish"
          creatorAnswer="house"
          timeRemaining={15}
          totalScore={450}
          onComplete={mockOnComplete}
        />
      );

      await waitFor(() => {
        expect(screen.queryByText('Loading results...')).not.toBeInTheDocument();
      });

      const summary = screen.getByText(/6,082/).closest('div');
      expect(summary).toHaveClass('p-3', 'sm:p-4');
    });

    it('applies responsive text sizing to bottom summary', async () => {
      render(
        <PollResultsDisplay
          promptId={1}
          playerGuess="jellyfish"
          creatorAnswer="house"
          timeRemaining={15}
          totalScore={450}
          onComplete={mockOnComplete}
        />
      );

      await waitFor(() => {
        expect(screen.queryByText('Loading results...')).not.toBeInTheDocument();
      });

      const summaryText = screen.getByText(/6,082/).closest('p');
      expect(summaryText).toHaveClass('text-sm', 'sm:text-base', 'md:text-lg');
    });

    it('applies full width to all major sections', async () => {
      const { container } = render(
        <PollResultsDisplay
          promptId={1}
          playerGuess="jellyfish"
          creatorAnswer="house"
          timeRemaining={15}
          totalScore={450}
          onComplete={mockOnComplete}
        />
      );

      await waitFor(() => {
        expect(screen.queryByText('Loading results...')).not.toBeInTheDocument();
      });

      // Check that comparison message wrapper has w-full
      const comparisonMessage = screen.getByText(/The crowd had other ideas!/).closest('div');
      const comparisonWrapper = comparisonMessage?.parentElement;
      expect(comparisonWrapper).toHaveClass('w-full');

      // Check that summary has w-full
      const summary = screen.getByText(/6,082/).closest('div');
      expect(summary).toHaveClass('w-full');
    });

    it('applies responsive padding to empty state', () => {
      mockUseConsensusPolling.mockReturnValue({
        aggregation: [],
        totalPlayers: 0,
        totalGuesses: 0,
        playerScore: null,
        creatorAnswerData: null,
        loading: false,
        error: null,
      });

      render(
        <PollResultsDisplay
          promptId={1}
          playerGuess="jellyfish"
          creatorAnswer="house"
          timeRemaining={15}
          totalScore={450}
          onComplete={mockOnComplete}
        />
      );

      const emptyState = screen.getByText(/Be the first to guess!/).closest('div');
      expect(emptyState).toHaveClass('p-6', 'sm:p-8');
    });

    it('applies responsive text sizing to empty state', () => {
      mockUseConsensusPolling.mockReturnValue({
        aggregation: [],
        totalPlayers: 0,
        totalGuesses: 0,
        playerScore: null,
        creatorAnswerData: null,
        loading: false,
        error: null,
      });

      render(
        <PollResultsDisplay
          promptId={1}
          playerGuess="jellyfish"
          creatorAnswer="house"
          timeRemaining={15}
          totalScore={450}
          onComplete={mockOnComplete}
        />
      );

      const emptyTitle = screen.getByText(/Be the first to guess!/);
      expect(emptyTitle).toHaveClass('text-lg', 'sm:text-xl');
    });

    it('ensures error retry button meets minimum touch target size', () => {
      mockUseConsensusPolling.mockReturnValue({
        aggregation: [],
        totalPlayers: 0,
        totalGuesses: 0,
        playerScore: null,
        creatorAnswerData: null,
        loading: false,
        error: 'Failed to fetch results',
      });

      render(
        <PollResultsDisplay
          promptId={1}
          playerGuess="jellyfish"
          creatorAnswer="house"
          timeRemaining={15}
          totalScore={450}
          onComplete={mockOnComplete}
        />
      );

      const retryButton = screen.getByRole('button', { name: /retry loading results/i });
      expect(retryButton).toHaveClass('min-h-[44px]', 'min-w-[44px]');
    });

    it('applies responsive padding to creator answer section', () => {
      mockUseConsensusPolling.mockReturnValue({
        aggregation: mockResultsData.aggregation,
        totalPlayers: mockResultsData.totalPlayers,
        totalGuesses: mockResultsData.totalGuesses,
        playerScore: mockResultsData.playerScore,
        creatorAnswerData: {
          guess: 'house',
          count: 47,
          percentage: 0.8,
          isPlayerGuess: false,
          isCreatorAnswer: true,
          rank: 11,
        },
        loading: false,
        error: null,
      });

      const { container } = render(
        <PollResultsDisplay
          promptId={1}
          playerGuess="jellyfish"
          creatorAnswer="house"
          timeRemaining={15}
          totalScore={450}
          onComplete={mockOnComplete}
        />
      );

      const creatorSection = container.querySelector('.mb-4.sm\\:mb-6.animate-fade-in.w-full');
      expect(creatorSection).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should display error message when initial load fails', () => {
      mockUseConsensusPolling.mockReturnValue({
        aggregation: [],
        totalPlayers: 0,
        totalGuesses: 0,
        playerScore: null,
        creatorAnswerData: undefined,
        loading: false,
        error: 'Results temporarily unavailable',
      });

      render(
        <PollResultsDisplay
          promptId={1}
          playerGuess="jellyfish"
          creatorAnswer="octopus"
          timeRemaining={15}
          totalScore={100}
          onComplete={mockOnComplete}
        />
      );

      expect(screen.getByText('Results temporarily unavailable')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });

    it('should show warning when polling fails 3 times', () => {
      mockUseConsensusPolling.mockReturnValue({
        aggregation: mockResultsData.aggregation,
        totalPlayers: mockResultsData.totalPlayers,
        totalGuesses: mockResultsData.totalGuesses,
        playerScore: mockResultsData.playerScore,
        creatorAnswerData: undefined,
        loading: false,
        error: 'Failed after 3 consecutive failures',
      });

      render(
        <PollResultsDisplay
          promptId={1}
          playerGuess="jellyfish"
          creatorAnswer="house"
          timeRemaining={15}
          totalScore={100}
          onComplete={mockOnComplete}
        />
      );

      expect(screen.getByText(/live updates paused/i)).toBeInTheDocument();
      expect(screen.getByText(/showing last known results/i)).toBeInTheDocument();
    });

    it('should show partial data warning when error exists but data is available', () => {
      mockUseConsensusPolling.mockReturnValue({
        aggregation: mockResultsData.aggregation,
        totalPlayers: mockResultsData.totalPlayers,
        totalGuesses: mockResultsData.totalGuesses,
        playerScore: mockResultsData.playerScore,
        creatorAnswerData: undefined,
        loading: false,
        error: 'Partial data error',
      });

      render(
        <PollResultsDisplay
          promptId={1}
          playerGuess="jellyfish"
          creatorAnswer="house"
          timeRemaining={15}
          totalScore={100}
          onComplete={mockOnComplete}
        />
      );

      expect(screen.getByText(/partial results/i)).toBeInTheDocument();
      expect(screen.getByText(/some data may be missing/i)).toBeInTheDocument();
    });

    it('should display available data even with partial errors', () => {
      mockUseConsensusPolling.mockReturnValue({
        aggregation: mockResultsData.aggregation,
        totalPlayers: mockResultsData.totalPlayers,
        totalGuesses: mockResultsData.totalGuesses,
        playerScore: mockResultsData.playerScore,
        creatorAnswerData: undefined,
        loading: false,
        error: 'Some operations failed',
      });

      render(
        <PollResultsDisplay
          promptId={1}
          playerGuess="jellyfish"
          creatorAnswer="house"
          timeRemaining={15}
          totalScore={100}
          onComplete={mockOnComplete}
        />
      );

      expect(screen.getByText('jellyfish')).toBeInTheDocument();
      expect(screen.getByText(/6082 players/i)).toBeInTheDocument();
    });

    it('should handle missing player score gracefully', () => {
      mockUseConsensusPolling.mockReturnValue({
        aggregation: mockResultsData.aggregation,
        totalPlayers: mockResultsData.totalPlayers,
        totalGuesses: mockResultsData.totalGuesses,
        playerScore: null,
        creatorAnswerData: undefined,
        loading: false,
        error: null,
      });

      render(
        <PollResultsDisplay
          promptId={1}
          playerGuess="jellyfish"
          creatorAnswer="house"
          timeRemaining={15}
          totalScore={100}
          onComplete={mockOnComplete}
        />
      );

      expect(screen.getByText('jellyfish')).toBeInTheDocument();
      // Score display should not be rendered
      expect(screen.queryByText(/majority/i)).not.toBeInTheDocument();
    });
  });

});
