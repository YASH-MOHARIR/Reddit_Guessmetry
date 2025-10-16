import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { HistoricalResultsDisplay } from './HistoricalResultsDisplay';
import type { HistoricalResultsResponse, HistoricalResultsNotFoundResponse } from '../../shared/types/api';

// Mock fetch globally
global.fetch = vi.fn();

describe('HistoricalResultsDisplay', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should display loading state initially', () => {
    vi.mocked(fetch).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    render(<HistoricalResultsDisplay promptId={1} />);

    expect(screen.getByText('Loading historical results...')).toBeInTheDocument();
  });

  it('should fetch and display historical results', async () => {
    const mockResponse: HistoricalResultsResponse = {
      type: 'historical-results',
      aggregation: [
        {
          guess: 'jellyfish',
          count: 100,
          percentage: 85.2,
          isPlayerGuess: false,
          isCreatorAnswer: false,
          rank: 1,
        },
        {
          guess: 'squid',
          count: 10,
          percentage: 8.5,
          isPlayerGuess: false,
          isCreatorAnswer: true,
          rank: 2,
        },
      ],
      creatorAnswer: 'squid',
      totalPlayers: 117,
      totalGuesses: 110,
      isFinal: true,
      promptText: 'What is this shape?',
    };

    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    } as Response);

    render(<HistoricalResultsDisplay promptId={1} />);

    await waitFor(() => {
      expect(screen.getByText('Final Results')).toBeInTheDocument();
    });

    expect(screen.getByText('What is this shape?')).toBeInTheDocument();
    expect(screen.getByText('117 players participated')).toBeInTheDocument();
    expect(screen.getByText(/📊 117 players • 110 total guesses/)).toBeInTheDocument();
  });

  it('should display error message when results not found', async () => {
    const mockResponse: HistoricalResultsNotFoundResponse = {
      type: 'historical-results-not-found',
      message: 'Historical results are no longer available for this prompt',
    };

    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => mockResponse,
    } as Response);

    render(<HistoricalResultsDisplay promptId={1} />);

    await waitFor(() => {
      expect(
        screen.getByText('Historical results are no longer available for this prompt')
      ).toBeInTheDocument();
    });

    expect(
      screen.getByText(/Historical results are only available for 24 hours/)
    ).toBeInTheDocument();
  });

  it('should display error message on fetch failure', async () => {
    vi.mocked(fetch).mockRejectedValue(new Error('Network error'));

    render(<HistoricalResultsDisplay promptId={1} />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load historical results')).toBeInTheDocument();
    });
  });

  it('should call onClose when close button is clicked', async () => {
    const mockResponse: HistoricalResultsNotFoundResponse = {
      type: 'historical-results-not-found',
      message: 'Historical results are no longer available for this prompt',
    };

    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => mockResponse,
    } as Response);

    const onClose = vi.fn();
    render(<HistoricalResultsDisplay promptId={1} onClose={onClose} />);

    await waitFor(() => {
      expect(screen.getByText('Close')).toBeInTheDocument();
    });

    screen.getByText('Close').click();
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('should render GuessAggregationBar components for each result', async () => {
    const mockResponse: HistoricalResultsResponse = {
      type: 'historical-results',
      aggregation: [
        {
          guess: 'jellyfish',
          count: 100,
          percentage: 85.2,
          isPlayerGuess: false,
          isCreatorAnswer: false,
          rank: 1,
        },
        {
          guess: 'squid',
          count: 10,
          percentage: 8.5,
          isPlayerGuess: false,
          isCreatorAnswer: true,
          rank: 2,
        },
        {
          guess: 'octopus',
          count: 7,
          percentage: 6.0,
          isPlayerGuess: false,
          isCreatorAnswer: false,
          rank: 3,
        },
      ],
      creatorAnswer: 'squid',
      totalPlayers: 117,
      totalGuesses: 117,
      isFinal: true,
      promptText: 'What is this shape?',
    };

    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    } as Response);

    render(<HistoricalResultsDisplay promptId={1} />);

    await waitFor(() => {
      expect(screen.getByText('Final Results')).toBeInTheDocument();
    });

    // Check that all guesses are rendered
    const aggregationBars = screen.getAllByTestId('guess-aggregation-bar');
    expect(aggregationBars).toHaveLength(3);
  });

  it('should display "Final Results" header', async () => {
    const mockResponse: HistoricalResultsResponse = {
      type: 'historical-results',
      aggregation: [
        {
          guess: 'jellyfish',
          count: 100,
          percentage: 100,
          isPlayerGuess: false,
          isCreatorAnswer: false,
          rank: 1,
        },
      ],
      creatorAnswer: 'jellyfish',
      totalPlayers: 100,
      totalGuesses: 100,
      isFinal: true,
      promptText: 'Test prompt',
    };

    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    } as Response);

    render(<HistoricalResultsDisplay promptId={1} />);

    await waitFor(() => {
      expect(screen.getByText('Final Results')).toBeInTheDocument();
    });

    expect(screen.getByText(/These are the final results from this prompt session/)).toBeInTheDocument();
  });

  it('should format large numbers with locale string', async () => {
    const mockResponse: HistoricalResultsResponse = {
      type: 'historical-results',
      aggregation: [
        {
          guess: 'jellyfish',
          count: 5000,
          percentage: 100,
          isPlayerGuess: false,
          isCreatorAnswer: false,
          rank: 1,
        },
      ],
      creatorAnswer: 'jellyfish',
      totalPlayers: 5000,
      totalGuesses: 5000,
      isFinal: true,
      promptText: 'Test prompt',
    };

    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    } as Response);

    render(<HistoricalResultsDisplay promptId={1} />);

    await waitFor(() => {
      expect(screen.getByText('5,000 players participated')).toBeInTheDocument();
    });

    expect(screen.getByText(/📊 5,000 players • 5,000 total guesses/)).toBeInTheDocument();
  });

  it('should handle non-404 error responses', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ status: 'error', message: 'Server error' }),
    } as Response);

    render(<HistoricalResultsDisplay promptId={1} />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load historical results')).toBeInTheDocument();
    });
  });

  it('should not render close button when onClose is not provided', async () => {
    const mockResponse: HistoricalResultsResponse = {
      type: 'historical-results',
      aggregation: [
        {
          guess: 'jellyfish',
          count: 100,
          percentage: 100,
          isPlayerGuess: false,
          isCreatorAnswer: false,
          rank: 1,
        },
      ],
      creatorAnswer: 'jellyfish',
      totalPlayers: 100,
      totalGuesses: 100,
      isFinal: true,
      promptText: 'Test prompt',
    };

    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    } as Response);

    render(<HistoricalResultsDisplay promptId={1} />);

    await waitFor(() => {
      expect(screen.getByText('Final Results')).toBeInTheDocument();
    });

    expect(screen.queryByText('Close')).not.toBeInTheDocument();
  });

  it('should pass correct props to GuessAggregationBar', async () => {
    const mockResponse: HistoricalResultsResponse = {
      type: 'historical-results',
      aggregation: [
        {
          guess: 'jellyfish',
          count: 100,
          percentage: 85.2,
          isPlayerGuess: false,
          isCreatorAnswer: true,
          rank: 1,
          variants: ['jelly fish', 'jely fish'],
        },
      ],
      creatorAnswer: 'jellyfish',
      totalPlayers: 117,
      totalGuesses: 100,
      isFinal: true,
      promptText: 'Test prompt',
    };

    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    } as Response);

    render(<HistoricalResultsDisplay promptId={1} />);

    await waitFor(() => {
      expect(screen.getByText('Final Results')).toBeInTheDocument();
    });

    // Verify the GuessAggregationBar is rendered with creator answer styling
    const aggregationBar = screen.getByTestId('guess-aggregation-bar');
    expect(aggregationBar).toHaveClass('border-[#FFD700]'); // Gold border for creator answer
  });
});
