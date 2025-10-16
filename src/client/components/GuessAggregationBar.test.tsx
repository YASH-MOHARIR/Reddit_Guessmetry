import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { GuessAggregationBar } from './GuessAggregationBar';

describe('GuessAggregationBar', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders rank, guess text, count, and percentage', () => {
    render(
      <GuessAggregationBar
        guess="jellyfish"
        count={5183}
        percentage={85.2}
        isPlayerGuess={false}
        isCreatorAnswer={false}
        rank={1}
      />
    );

    expect(screen.getByText('#1')).toBeInTheDocument();
    expect(screen.getByText('jellyfish')).toBeInTheDocument();
    expect(screen.getByText('5,183 players')).toBeInTheDocument();
    expect(screen.getByText('85.2%')).toBeInTheDocument();
  });

  it('renders singular "player" for count of 1', () => {
    render(
      <GuessAggregationBar
        guess="unique"
        count={1}
        percentage={0.5}
        isPlayerGuess={false}
        isCreatorAnswer={false}
        rank={10}
      />
    );

    expect(screen.getByText('1 player')).toBeInTheDocument();
  });

  it('applies orange border when isPlayerGuess is true', () => {
    render(
      <GuessAggregationBar
        guess="squid"
        count={193}
        percentage={35.0}
        isPlayerGuess={true}
        isCreatorAnswer={false}
        rank={2}
      />
    );

    const container = screen.getByTestId('guess-aggregation-bar');
    expect(container).toHaveClass('border-2', 'border-[#FF4500]');
  });

  it('applies gold border and star icon when isCreatorAnswer is true', () => {
    render(
      <GuessAggregationBar
        guess="house"
        count={47}
        percentage={0.8}
        isPlayerGuess={false}
        isCreatorAnswer={true}
        rank={8}
      />
    );

    const container = screen.getByTestId('guess-aggregation-bar');
    expect(container).toHaveClass('border-2', 'border-[#FFD700]');
    expect(screen.getByLabelText("Creator's answer")).toBeInTheDocument();
    expect(screen.getByText('⭐')).toBeInTheDocument();
  });

  it('applies green bar color for majority (≥50%)', () => {
    render(
      <GuessAggregationBar
        guess="jellyfish"
        count={5183}
        percentage={85.2}
        isPlayerGuess={false}
        isCreatorAnswer={false}
        rank={1}
      />
    );

    const progressBar = screen.getByTestId('progress-bar');
    expect(progressBar).toHaveClass('bg-green-500');
  });

  it('applies blue bar color for common (20-49%)', () => {
    render(
      <GuessAggregationBar
        guess="squid"
        count={193}
        percentage={35.0}
        isPlayerGuess={false}
        isCreatorAnswer={false}
        rank={2}
      />
    );

    const progressBar = screen.getByTestId('progress-bar');
    expect(progressBar).toHaveClass('bg-blue-500');
  });

  it('applies yellow bar color for uncommon (5-19%)', () => {
    render(
      <GuessAggregationBar
        guess="octopus"
        count={95}
        percentage={12.0}
        isPlayerGuess={false}
        isCreatorAnswer={false}
        rank={3}
      />
    );

    const progressBar = screen.getByTestId('progress-bar');
    expect(progressBar).toHaveClass('bg-yellow-500');
  });

  it('applies gray bar color for rare (<5%)', () => {
    render(
      <GuessAggregationBar
        guess="cephalopod"
        count={23}
        percentage={3.0}
        isPlayerGuess={false}
        isCreatorAnswer={false}
        rank={4}
      />
    );

    const progressBar = screen.getByTestId('progress-bar');
    expect(progressBar).toHaveClass('bg-gray-400');
  });

  it('animates bar width from 0 to percentage', () => {
    render(
      <GuessAggregationBar
        guess="jellyfish"
        count={5183}
        percentage={85.2}
        isPlayerGuess={false}
        isCreatorAnswer={false}
        rank={1}
      />
    );

    const progressBar = screen.getByTestId('progress-bar');
    
    // Initially should be at 0%
    expect(progressBar).toHaveStyle({ width: '0%' });

    // After animation delay, should be at target percentage
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(progressBar).toHaveStyle({ width: '85.2%' });
  });

  it('applies transition classes for smooth animation', () => {
    render(
      <GuessAggregationBar
        guess="jellyfish"
        count={5183}
        percentage={85.2}
        isPlayerGuess={false}
        isCreatorAnswer={false}
        rank={1}
      />
    );

    const progressBar = screen.getByTestId('progress-bar');
    expect(progressBar).toHaveClass('transition-all', 'duration-500', 'ease-out');
  });

  it('handles both isPlayerGuess and isCreatorAnswer being true', () => {
    render(
      <GuessAggregationBar
        guess="jellyfish"
        count={5183}
        percentage={85.2}
        isPlayerGuess={true}
        isCreatorAnswer={true}
        rank={1}
      />
    );

    const container = screen.getByTestId('guess-aggregation-bar');
    // isPlayerGuess takes precedence in the current implementation
    expect(container).toHaveClass('border-2', 'border-[#FF4500]');
  });

  it('truncates long guess text with ellipsis', () => {
    render(
      <GuessAggregationBar
        guess="this is a very long guess that should be truncated"
        count={10}
        percentage={5.0}
        isPlayerGuess={false}
        isCreatorAnswer={false}
        rank={5}
      />
    );

    const guessText = screen.getByText(
      'this is a very long guess that should be truncated'
    );
    expect(guessText).toHaveClass('truncate');
    expect(guessText).toHaveAttribute(
      'title',
      'this is a very long guess that should be truncated'
    );
  });

  it('formats large numbers with commas', () => {
    render(
      <GuessAggregationBar
        guess="popular"
        count={12345}
        percentage={95.0}
        isPlayerGuess={false}
        isCreatorAnswer={false}
        rank={1}
      />
    );

    expect(screen.getByText('12,345 players')).toBeInTheDocument();
  });

  it('displays percentage with one decimal place', () => {
    render(
      <GuessAggregationBar
        guess="precise"
        count={123}
        percentage={12.345}
        isPlayerGuess={false}
        isCreatorAnswer={false}
        rank={3}
      />
    );

    expect(screen.getByText('12.3%')).toBeInTheDocument();
  });

  it('handles edge case of 0% percentage', () => {
    render(
      <GuessAggregationBar
        guess="rare"
        count={0}
        percentage={0}
        isPlayerGuess={false}
        isCreatorAnswer={false}
        rank={10}
      />
    );

    expect(screen.getByText('0.0%')).toBeInTheDocument();
    const progressBar = screen.getByTestId('progress-bar');
    expect(progressBar).toHaveClass('bg-gray-400');
  });

  it('handles edge case of 100% percentage', () => {
    render(
      <GuessAggregationBar
        guess="unanimous"
        count={1000}
        percentage={100}
        isPlayerGuess={false}
        isCreatorAnswer={false}
        rank={1}
      />
    );

    expect(screen.getByText('100.0%')).toBeInTheDocument();
    const progressBar = screen.getByTestId('progress-bar');
    expect(progressBar).toHaveClass('bg-green-500');
    
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(progressBar).toHaveStyle({ width: '100%' });
  });

  it('applies default border when neither isPlayerGuess nor isCreatorAnswer', () => {
    render(
      <GuessAggregationBar
        guess="normal"
        count={50}
        percentage={10.0}
        isPlayerGuess={false}
        isCreatorAnswer={false}
        rank={5}
      />
    );

    const container = screen.getByTestId('guess-aggregation-bar');
    expect(container).toHaveClass('border', 'border-gray-300');
    expect(container).not.toHaveClass('border-2');
  });

  describe('Variants Display', () => {
    it('displays variants note when variants are provided', () => {
      render(
        <GuessAggregationBar
          guess="jellyfish"
          count={180}
          percentage={85.2}
          isPlayerGuess={false}
          isCreatorAnswer={false}
          rank={1}
          variants={['jelly fish', 'jellyf1sh']}
        />
      );

      expect(screen.getByText(/includes:/)).toBeInTheDocument();
      expect(screen.getByText(/'jelly fish', 'jellyf1sh'/)).toBeInTheDocument();
    });

    it('does not display variants note when variants array is empty', () => {
      render(
        <GuessAggregationBar
          guess="jellyfish"
          count={100}
          percentage={85.2}
          isPlayerGuess={false}
          isCreatorAnswer={false}
          rank={1}
          variants={[]}
        />
      );

      expect(screen.queryByText(/includes:/)).not.toBeInTheDocument();
    });

    it('does not display variants note when variants prop is undefined', () => {
      render(
        <GuessAggregationBar
          guess="jellyfish"
          count={100}
          percentage={85.2}
          isPlayerGuess={false}
          isCreatorAnswer={false}
          rank={1}
        />
      );

      expect(screen.queryByText(/includes:/)).not.toBeInTheDocument();
    });

    it('formats multiple variants correctly', () => {
      render(
        <GuessAggregationBar
          guess="jellyfish"
          count={200}
          percentage={90.0}
          isPlayerGuess={false}
          isCreatorAnswer={false}
          rank={1}
          variants={['jelly fish', 'jellyf1sh', 'jelly-fish']}
        />
      );

      expect(screen.getByText(/'jelly fish', 'jellyf1sh', 'jelly-fish'/)).toBeInTheDocument();
    });

    it('applies correct styling to variants note', () => {
      render(
        <GuessAggregationBar
          guess="jellyfish"
          count={180}
          percentage={85.2}
          isPlayerGuess={false}
          isCreatorAnswer={false}
          rank={1}
          variants={['jelly fish']}
        />
      );

      const variantsNote = screen.getByText(/includes:/);
      expect(variantsNote).toHaveClass('text-xs', 'text-gray-500', 'italic');
    });
  });

  describe('Mobile Responsiveness', () => {
    it('applies full width styling', () => {
      render(
        <GuessAggregationBar
          guess="jellyfish"
          count={5183}
          percentage={85.2}
          isPlayerGuess={false}
          isCreatorAnswer={false}
          rank={1}
        />
      );

      const container = screen.getByTestId('guess-aggregation-bar');
      expect(container).toHaveClass('w-full');
    });

    it('applies responsive padding classes', () => {
      render(
        <GuessAggregationBar
          guess="jellyfish"
          count={5183}
          percentage={85.2}
          isPlayerGuess={false}
          isCreatorAnswer={false}
          rank={1}
        />
      );

      const container = screen.getByTestId('guess-aggregation-bar');
      expect(container).toHaveClass('p-3', 'md:p-4');
    });

    it('applies responsive text sizing for rank', () => {
      render(
        <GuessAggregationBar
          guess="jellyfish"
          count={5183}
          percentage={85.2}
          isPlayerGuess={false}
          isCreatorAnswer={false}
          rank={1}
        />
      );

      const rank = screen.getByText('#1');
      expect(rank).toHaveClass('text-sm', 'sm:text-base');
    });

    it('applies responsive text sizing for guess text', () => {
      render(
        <GuessAggregationBar
          guess="jellyfish"
          count={5183}
          percentage={85.2}
          isPlayerGuess={false}
          isCreatorAnswer={false}
          rank={1}
        />
      );

      const guessText = screen.getByText('jellyfish');
      expect(guessText).toHaveClass('text-base', 'sm:text-lg');
    });

    it('applies responsive layout for content (flex-col on mobile, flex-row on desktop)', () => {
      render(
        <GuessAggregationBar
          guess="jellyfish"
          count={5183}
          percentage={85.2}
          isPlayerGuess={false}
          isCreatorAnswer={false}
          rank={1}
        />
      );

      const container = screen.getByTestId('guess-aggregation-bar');
      const contentDiv = container.querySelector('.flex.flex-col.sm\\:flex-row');
      expect(contentDiv).toBeInTheDocument();
    });

    it('makes percentage prominent on mobile with larger text', () => {
      render(
        <GuessAggregationBar
          guess="jellyfish"
          count={5183}
          percentage={85.2}
          isPlayerGuess={false}
          isCreatorAnswer={false}
          rank={1}
        />
      );

      const percentage = screen.getByText('85.2%');
      // On mobile, percentage is text-lg, on desktop it's text-base
      expect(percentage).toHaveClass('text-lg', 'sm:text-base');
    });

    it('applies responsive text sizing for count', () => {
      render(
        <GuessAggregationBar
          guess="jellyfish"
          count={5183}
          percentage={85.2}
          isPlayerGuess={false}
          isCreatorAnswer={false}
          rank={1}
        />
      );

      const count = screen.getByText('5,183 players');
      expect(count).toHaveClass('text-xs', 'sm:text-sm');
    });

    it('ensures progress bar is full width', () => {
      render(
        <GuessAggregationBar
          guess="jellyfish"
          count={5183}
          percentage={85.2}
          isPlayerGuess={false}
          isCreatorAnswer={false}
          rank={1}
        />
      );

      const progressBar = screen.getByTestId('progress-bar');
      const progressBarContainer = progressBar.parentElement;
      expect(progressBarContainer).toHaveClass('w-full');
    });

    it('truncates long text to prevent horizontal overflow', () => {
      render(
        <GuessAggregationBar
          guess="this is an extremely long guess text that should be truncated to prevent horizontal scrolling on mobile devices"
          count={100}
          percentage={10.0}
          isPlayerGuess={false}
          isCreatorAnswer={false}
          rank={5}
        />
      );

      const guessText = screen.getByText(
        'this is an extremely long guess text that should be truncated to prevent horizontal scrolling on mobile devices'
      );
      expect(guessText).toHaveClass('truncate');
    });

    it('applies responsive star icon sizing', () => {
      render(
        <GuessAggregationBar
          guess="house"
          count={47}
          percentage={0.8}
          isPlayerGuess={false}
          isCreatorAnswer={true}
          rank={8}
        />
      );

      const star = screen.getByText('⭐');
      expect(star).toHaveClass('text-lg', 'sm:text-xl');
    });
  });
});
