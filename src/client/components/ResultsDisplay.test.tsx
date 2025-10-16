import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { ResultsDisplay } from './ResultsDisplay';

describe('ResultsDisplay', () => {
  it('should display correct answer', () => {
    const onComplete = vi.fn();
    render(
      <ResultsDisplay
        correctAnswer="tree"
        playerGuess="plant"
        isCorrect={false}
        isClose={false}
        pointsEarned={0}
        totalScore={10}
        timeRemaining={10}
        onComplete={onComplete}
      />
    );

    expect(screen.getByText('The answer was:')).toBeInTheDocument();
    expect(screen.getByText('tree')).toBeInTheDocument();
  });

  it('should display player guess', () => {
    const onComplete = vi.fn();
    render(
      <ResultsDisplay
        correctAnswer="house"
        playerGuess="home"
        isCorrect={false}
        isClose={true}
        pointsEarned={5}
        totalScore={15}
        timeRemaining={10}
        onComplete={onComplete}
      />
    );

    expect(screen.getByText('home')).toBeInTheDocument();
  });

  it('should show "Correct!" for correct answer', () => {
    const onComplete = vi.fn();
    render(
      <ResultsDisplay
        correctAnswer="bicycle"
        playerGuess="bicycle"
        isCorrect={true}
        isClose={false}
        pointsEarned={10}
        totalScore={20}
        timeRemaining={10}
        onComplete={onComplete}
      />
    );

    expect(screen.getByText('Correct!')).toBeInTheDocument();
  });

  it('should show "Close!" for close answer', () => {
    const onComplete = vi.fn();
    render(
      <ResultsDisplay
        correctAnswer="tree"
        playerGuess="three"
        isCorrect={false}
        isClose={true}
        pointsEarned={5}
        totalScore={5}
        timeRemaining={10}
        onComplete={onComplete}
      />
    );

    expect(screen.getByText('Close!')).toBeInTheDocument();
  });

  it('should show "Incorrect" for wrong answer', () => {
    const onComplete = vi.fn();
    render(
      <ResultsDisplay
        correctAnswer="house"
        playerGuess="car"
        isCorrect={false}
        isClose={false}
        pointsEarned={0}
        totalScore={10}
        timeRemaining={10}
        onComplete={onComplete}
      />
    );

    expect(screen.getByText('Incorrect')).toBeInTheDocument();
  });

  it('should display points earned with correct color for correct answer', () => {
    const onComplete = vi.fn();
    render(
      <ResultsDisplay
        correctAnswer="tree"
        playerGuess="tree"
        isCorrect={true}
        isClose={false}
        pointsEarned={10}
        totalScore={10}
        timeRemaining={10}
        onComplete={onComplete}
      />
    );

    const pointsElement = screen.getByText('+10');
    expect(pointsElement.className).toContain('text-green-600');
  });

  it('should display points earned with correct color for close answer', () => {
    const onComplete = vi.fn();
    render(
      <ResultsDisplay
        correctAnswer="house"
        playerGuess="hous"
        isCorrect={false}
        isClose={true}
        pointsEarned={5}
        totalScore={5}
        timeRemaining={10}
        onComplete={onComplete}
      />
    );

    const pointsElement = screen.getByText('+5');
    expect(pointsElement.className).toContain('text-yellow-600');
  });

  it('should display total score', async () => {
    const onComplete = vi.fn();
    render(
      <ResultsDisplay
        correctAnswer="tree"
        playerGuess="tree"
        isCorrect={true}
        isClose={false}
        pointsEarned={10}
        totalScore={25}
        timeRemaining={10}
        onComplete={onComplete}
      />
    );

    // Wait for count-up animation to complete
    await waitFor(
      () => {
        expect(screen.getByText('25')).toBeInTheDocument();
      },
      { timeout: 500 }
    );
  });

  it('should animate score count-up', async () => {
    const onComplete = vi.fn();
    render(
      <ResultsDisplay
        correctAnswer="tree"
        playerGuess="tree"
        isCorrect={true}
        isClose={false}
        pointsEarned={10}
        totalScore={20}
        timeRemaining={10}
        onComplete={onComplete}
      />
    );

    // Score should eventually reach total
    await waitFor(
      () => {
        expect(screen.getByText('20')).toBeInTheDocument();
      },
      { timeout: 500 }
    );
  });

  it('should render Timer component', () => {
    const onComplete = vi.fn();
    render(
      <ResultsDisplay
        correctAnswer="tree"
        playerGuess="tree"
        isCorrect={true}
        isClose={false}
        pointsEarned={10}
        totalScore={10}
        timeRemaining={10}
        onComplete={onComplete}
      />
    );

    expect(screen.getByText(/10s/)).toBeInTheDocument();
  });

  it('should apply correct result background color for correct answer', () => {
    const onComplete = vi.fn();
    const { container } = render(
      <ResultsDisplay
        correctAnswer="tree"
        playerGuess="tree"
        isCorrect={true}
        isClose={false}
        pointsEarned={10}
        totalScore={10}
        timeRemaining={10}
        onComplete={onComplete}
      />
    );

    const resultsCard = container.querySelector('.bg-green-50');
    expect(resultsCard).toBeInTheDocument();
  });

  it('should apply close result background color for close answer', () => {
    const onComplete = vi.fn();
    const { container } = render(
      <ResultsDisplay
        correctAnswer="tree"
        playerGuess="three"
        isCorrect={false}
        isClose={true}
        pointsEarned={5}
        totalScore={5}
        timeRemaining={10}
        onComplete={onComplete}
      />
    );

    const resultsCard = container.querySelector('.bg-yellow-50');
    expect(resultsCard).toBeInTheDocument();
  });

  it('should apply incorrect result background color for wrong answer', () => {
    const onComplete = vi.fn();
    const { container } = render(
      <ResultsDisplay
        correctAnswer="tree"
        playerGuess="car"
        isCorrect={false}
        isClose={false}
        pointsEarned={0}
        totalScore={0}
        timeRemaining={10}
        onComplete={onComplete}
      />
    );

    const resultsCard = container.querySelector('.bg-red-50');
    expect(resultsCard).toBeInTheDocument();
  });

  it('should have bounce-in animation', () => {
    const onComplete = vi.fn();
    const { container } = render(
      <ResultsDisplay
        correctAnswer="tree"
        playerGuess="tree"
        isCorrect={true}
        isClose={false}
        pointsEarned={10}
        totalScore={10}
        timeRemaining={10}
        onComplete={onComplete}
      />
    );

    const resultsCard = container.querySelector('.animate-bounce-in');
    expect(resultsCard).toBeInTheDocument();
  });

  it('should handle null player guess', () => {
    const onComplete = vi.fn();
    render(
      <ResultsDisplay
        correctAnswer="tree"
        playerGuess={null}
        isCorrect={false}
        isClose={false}
        pointsEarned={0}
        totalScore={0}
        timeRemaining={10}
        onComplete={onComplete}
      />
    );

    expect(screen.queryByText('You guessed:')).not.toBeInTheDocument();
  });
});
