import { describe, it, expect, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { Leaderboard } from './Leaderboard';

describe('Leaderboard', () => {
  it('should display current score', () => {
    render(<Leaderboard score={25} roundsCompleted={3} rank={1} />);

    expect(screen.getByText('25')).toBeInTheDocument();
  });

  it('should display rounds completed', () => {
    render(<Leaderboard score={10} roundsCompleted={2} rank={1} />);

    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('should display rank', () => {
    render(<Leaderboard score={15} roundsCompleted={1} rank={1} />);

    expect(screen.getByText('#1')).toBeInTheDocument();
  });

  it('should have Leaderboard title', () => {
    render(<Leaderboard score={0} roundsCompleted={0} rank={1} />);

    expect(screen.getByText('Leaderboard')).toBeInTheDocument();
  });

  it('should be positioned as fixed element', () => {
    const { container } = render(<Leaderboard score={10} roundsCompleted={1} rank={1} />);

    const leaderboard = container.firstChild as HTMLElement;
    expect(leaderboard.className).toContain('fixed');
  });

  it('should be positioned at top-right', () => {
    const { container } = render(<Leaderboard score={10} roundsCompleted={1} rank={1} />);

    const leaderboard = container.firstChild as HTMLElement;
    expect(leaderboard.className).toContain('top-4');
    expect(leaderboard.className).toContain('right-4');
  });

  it('should have proper z-index for layering', () => {
    const { container } = render(<Leaderboard score={10} roundsCompleted={1} rank={1} />);

    const leaderboard = container.firstChild as HTMLElement;
    expect(leaderboard.className).toContain('z-10');
  });

  it('should animate score changes', async () => {
    vi.useFakeTimers();
    const { rerender } = render(<Leaderboard score={10} roundsCompleted={1} rank={1} />);

    expect(screen.getByText('10')).toBeInTheDocument();

    // Update score
    rerender(<Leaderboard score={20} roundsCompleted={2} rank={1} />);

    // Advance timers to complete the animation (300ms total)
    act(() => {
      vi.advanceTimersByTime(300);
    });

    // Score should be updated after animation
    expect(screen.getByText('20')).toBeInTheDocument();

    vi.useRealTimers();
  });

  it('should display score label', () => {
    render(<Leaderboard score={10} roundsCompleted={1} rank={1} />);

    expect(screen.getByText('Score:')).toBeInTheDocument();
  });

  it('should display rank label', () => {
    render(<Leaderboard score={10} roundsCompleted={1} rank={1} />);

    expect(screen.getByText('Rank:')).toBeInTheDocument();
  });

  it('should display rounds label', () => {
    render(<Leaderboard score={10} roundsCompleted={1} rank={1} />);

    expect(screen.getByText('Rounds:')).toBeInTheDocument();
  });

  it('should handle zero score', () => {
    render(<Leaderboard score={0} roundsCompleted={0} rank={1} />);

    // Check that score is displayed (there will be multiple 0s for score and rounds)
    const zeros = screen.getAllByText('0');
    expect(zeros.length).toBeGreaterThan(0);
  });

  it('should handle zero rounds', () => {
    render(<Leaderboard score={0} roundsCompleted={0} rank={1} />);

    // Should show 0 for rounds
    const roundsElements = screen.getAllByText('0');
    expect(roundsElements.length).toBeGreaterThan(0);
  });

  it('should style score with orange color', () => {
    render(<Leaderboard score={25} roundsCompleted={3} rank={1} />);

    const scoreElement = screen.getByText('25');
    expect(scoreElement.className).toContain('text-orange-600');
  });

  it('should style rank with orange color', () => {
    render(<Leaderboard score={10} roundsCompleted={1} rank={1} />);

    const rankElement = screen.getByText('#1');
    expect(rankElement.className).toContain('text-orange-600');
  });
});
