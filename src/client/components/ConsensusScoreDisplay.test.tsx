import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { ConsensusScoreDisplay } from './ConsensusScoreDisplay';

describe('ConsensusScoreDisplay', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Tier Badge Display', () => {
    it('should display majority tier with trophy emoji', () => {
      render(
        <ConsensusScoreDisplay
          pointsEarned={100}
          matchPercentage={85}
          tier="majority"
          totalScore={450}
        />
      );

      expect(screen.getByText('🏆')).toBeInTheDocument();
      expect(screen.getByText('MAJORITY')).toBeInTheDocument();
    });

    it('should display common tier with silver medal emoji', () => {
      render(
        <ConsensusScoreDisplay
          pointsEarned={50}
          matchPercentage={35}
          tier="common"
          totalScore={400}
        />
      );

      expect(screen.getByText('🥈')).toBeInTheDocument();
      expect(screen.getByText('COMMON')).toBeInTheDocument();
    });

    it('should display uncommon tier with bronze medal emoji', () => {
      render(
        <ConsensusScoreDisplay
          pointsEarned={25}
          matchPercentage={12}
          tier="uncommon"
          totalScore={375}
        />
      );

      expect(screen.getByText('🥉')).toBeInTheDocument();
      expect(screen.getByText('UNCOMMON')).toBeInTheDocument();
    });

    it('should display rare tier with diamond emoji', () => {
      render(
        <ConsensusScoreDisplay
          pointsEarned={10}
          matchPercentage={3}
          tier="rare"
          totalScore={360}
        />
      );

      expect(screen.getByText('💎')).toBeInTheDocument();
      expect(screen.getByText('RARE')).toBeInTheDocument();
    });

    it('should display unique tier with snowflake emoji', () => {
      render(
        <ConsensusScoreDisplay
          pointsEarned={0}
          matchPercentage={0.5}
          tier="unique"
          totalScore={350}
        />
      );

      expect(screen.getByText('❄️')).toBeInTheDocument();
      expect(screen.getByText('UNIQUE')).toBeInTheDocument();
    });
  });

  describe('Points Display', () => {
    it('should display points earned', () => {
      render(
        <ConsensusScoreDisplay
          pointsEarned={100}
          matchPercentage={85}
          tier="majority"
          totalScore={450}
        />
      );

      expect(screen.getByText(/\+\d+ POINTS/)).toBeInTheDocument();
    });

    it('should animate points from 0 to earned value', async () => {
      render(
        <ConsensusScoreDisplay
          pointsEarned={100}
          matchPercentage={85}
          tier="majority"
          totalScore={450}
        />
      );

      // Initially should show 0
      expect(screen.getByText('+0 POINTS')).toBeInTheDocument();

      // After animation completes (200ms badge + 500ms points)
      await act(async () => {
        vi.advanceTimersByTime(750);
      });

      expect(screen.getByText('+100 POINTS')).toBeInTheDocument();
    });

    it('should handle zero points', () => {
      render(
        <ConsensusScoreDisplay
          pointsEarned={0}
          matchPercentage={0.5}
          tier="unique"
          totalScore={350}
        />
      );

      vi.advanceTimersByTime(700);

      expect(screen.getByText('+0 POINTS')).toBeInTheDocument();
    });
  });

  describe('Match Percentage Display', () => {
    it('should display match percentage message', () => {
      render(
        <ConsensusScoreDisplay
          pointsEarned={100}
          matchPercentage={85}
          tier="majority"
          totalScore={450}
        />
      );

      expect(
        screen.getByText('You matched 85.0% of players!')
      ).toBeInTheDocument();
    });

    it('should format percentage to one decimal place', () => {
      render(
        <ConsensusScoreDisplay
          pointsEarned={50}
          matchPercentage={35.678}
          tier="common"
          totalScore={400}
        />
      );

      expect(
        screen.getByText('You matched 35.7% of players!')
      ).toBeInTheDocument();
    });

    it('should handle low percentages', () => {
      render(
        <ConsensusScoreDisplay
          pointsEarned={10}
          matchPercentage={2.3}
          tier="rare"
          totalScore={360}
        />
      );

      expect(
        screen.getByText('You matched 2.3% of players!')
      ).toBeInTheDocument();
    });
  });

  describe('Total Score Display', () => {
    it('should display total score', () => {
      render(
        <ConsensusScoreDisplay
          pointsEarned={100}
          matchPercentage={85}
          tier="majority"
          totalScore={450}
        />
      );

      expect(screen.getByText(/Total Score: \d+/)).toBeInTheDocument();
    });

    it('should animate total score from previous to current', async () => {
      render(
        <ConsensusScoreDisplay
          pointsEarned={100}
          matchPercentage={85}
          tier="majority"
          totalScore={450}
        />
      );

      // Initially should show previous score (450 - 100 = 350)
      expect(screen.getByText('Total Score: 350')).toBeInTheDocument();

      // After full animation sequence (200 + 500 + 200 + 300 = 1200ms)
      await act(async () => {
        vi.advanceTimersByTime(1250);
      });

      expect(screen.getByText('Total Score: 450')).toBeInTheDocument();
    });

    it('should handle first round with zero previous score', async () => {
      render(
        <ConsensusScoreDisplay
          pointsEarned={100}
          matchPercentage={85}
          tier="majority"
          totalScore={100}
        />
      );

      // Initially should show 0
      expect(screen.getByText('Total Score: 0')).toBeInTheDocument();

      // After animation
      await act(async () => {
        vi.advanceTimersByTime(1250);
      });

      expect(screen.getByText('Total Score: 100')).toBeInTheDocument();
    });
  });

  describe('Animation Sequence', () => {
    it('should fade in badge first', async () => {
      const { container } = render(
        <ConsensusScoreDisplay
          pointsEarned={100}
          matchPercentage={85}
          tier="majority"
          totalScore={450}
        />
      );

      const badgeContainer = container.querySelector('.transition-opacity');
      expect(badgeContainer).toHaveClass('opacity-0');

      await act(async () => {
        vi.advanceTimersByTime(10);
      });

      expect(badgeContainer).toHaveClass('opacity-100');
    });

    it('should fade in percentage after points animation', async () => {
      const { container } = render(
        <ConsensusScoreDisplay
          pointsEarned={100}
          matchPercentage={85}
          tier="majority"
          totalScore={450}
        />
      );

      const percentageElements = container.querySelectorAll('.transition-opacity');
      const percentageElement = percentageElements[1]; // Second transition-opacity element

      expect(percentageElement).toHaveClass('opacity-0');

      // After badge (200ms) + points (500ms) = 700ms
      await act(async () => {
        vi.advanceTimersByTime(750);
      });

      expect(percentageElement).toHaveClass('opacity-100');
    });

    it('should complete all animations in correct order', async () => {
      render(
        <ConsensusScoreDisplay
          pointsEarned={100}
          matchPercentage={85}
          tier="majority"
          totalScore={450}
        />
      );

      // Badge should be visible immediately
      await act(async () => {
        vi.advanceTimersByTime(10);
      });
      expect(screen.getByText('MAJORITY')).toBeInTheDocument();

      // Points should animate by 700ms
      await act(async () => {
        vi.advanceTimersByTime(750);
      });
      expect(screen.getByText('+100 POINTS')).toBeInTheDocument();

      // Percentage should be visible by 700ms
      expect(
        screen.getByText('You matched 85.0% of players!')
      ).toBeInTheDocument();

      // Total should animate by 1200ms
      await act(async () => {
        vi.advanceTimersByTime(550);
      });
      expect(screen.getByText('Total Score: 450')).toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    it('should apply correct color for majority tier', () => {
      render(
        <ConsensusScoreDisplay
          pointsEarned={100}
          matchPercentage={85}
          tier="majority"
          totalScore={450}
        />
      );

      const tierLabel = screen.getByText('MAJORITY');
      expect(tierLabel).toHaveClass('text-yellow-500');
    });

    it('should apply correct color for common tier', () => {
      render(
        <ConsensusScoreDisplay
          pointsEarned={50}
          matchPercentage={35}
          tier="common"
          totalScore={400}
        />
      );

      const tierLabel = screen.getByText('COMMON');
      expect(tierLabel).toHaveClass('text-gray-400');
    });

    it('should apply correct color for uncommon tier', () => {
      render(
        <ConsensusScoreDisplay
          pointsEarned={25}
          matchPercentage={12}
          tier="uncommon"
          totalScore={375}
        />
      );

      const tierLabel = screen.getByText('UNCOMMON');
      expect(tierLabel).toHaveClass('text-orange-600');
    });

    it('should use centered layout', () => {
      const { container } = render(
        <ConsensusScoreDisplay
          pointsEarned={100}
          matchPercentage={85}
          tier="majority"
          totalScore={450}
        />
      );

      const mainContainer = container.firstChild;
      expect(mainContainer).toHaveClass('flex', 'flex-col', 'items-center', 'justify-center');
    });
  });
});
