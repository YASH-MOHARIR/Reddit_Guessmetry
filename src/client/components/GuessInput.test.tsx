import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { GuessInput } from './GuessInput';

describe('GuessInput', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should render input field', () => {
    const onSubmit = vi.fn();
    const onComplete = vi.fn();
    render(
      <GuessInput onSubmit={onSubmit} timeRemaining={20} disabled={false} onComplete={onComplete} />
    );

    expect(screen.getByPlaceholderText('Type your guess...')).toBeInTheDocument();
  });

  it('should focus input on mount', () => {
    const onSubmit = vi.fn();
    const onComplete = vi.fn();
    render(
      <GuessInput onSubmit={onSubmit} timeRemaining={20} disabled={false} onComplete={onComplete} />
    );

    const input = screen.getByPlaceholderText('Type your guess...') as HTMLInputElement;
    expect(document.activeElement).toBe(input);
  });

  it('should display Timer component', () => {
    const onSubmit = vi.fn();
    const onComplete = vi.fn();
    render(
      <GuessInput onSubmit={onSubmit} timeRemaining={20} disabled={false} onComplete={onComplete} />
    );

    expect(screen.getByText(/20s/)).toBeInTheDocument();
  });

  it('should handle text input', () => {
    const onSubmit = vi.fn();
    const onComplete = vi.fn();
    render(
      <GuessInput onSubmit={onSubmit} timeRemaining={20} disabled={false} onComplete={onComplete} />
    );

    const input = screen.getByPlaceholderText('Type your guess...') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'tree' } });

    expect(input.value).toBe('tree');
  });

  it('should submit guess on Enter key', () => {
    const onSubmit = vi.fn();
    const onComplete = vi.fn();
    render(
      <GuessInput onSubmit={onSubmit} timeRemaining={20} disabled={false} onComplete={onComplete} />
    );

    const input = screen.getByPlaceholderText('Type your guess...') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'house' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(onSubmit).toHaveBeenCalledWith('house');
  });

  it('should submit guess on button click', () => {
    const onSubmit = vi.fn();
    const onComplete = vi.fn();
    render(
      <GuessInput onSubmit={onSubmit} timeRemaining={20} disabled={false} onComplete={onComplete} />
    );

    const input = screen.getByPlaceholderText('Type your guess...') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'bicycle' } });

    const submitButton = screen.getByText('Submit Guess');
    fireEvent.click(submitButton);

    expect(onSubmit).toHaveBeenCalledWith('bicycle');
  });

  it('should trim whitespace from guess', () => {
    const onSubmit = vi.fn();
    const onComplete = vi.fn();
    render(
      <GuessInput onSubmit={onSubmit} timeRemaining={20} disabled={false} onComplete={onComplete} />
    );

    const input = screen.getByPlaceholderText('Type your guess...') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '  tree  ' } });

    const submitButton = screen.getByText('Submit Guess');
    fireEvent.click(submitButton);

    expect(onSubmit).toHaveBeenCalledWith('tree');
  });

  it('should disable input after submission', () => {
    const onSubmit = vi.fn();
    const onComplete = vi.fn();
    render(
      <GuessInput onSubmit={onSubmit} timeRemaining={20} disabled={false} onComplete={onComplete} />
    );

    const input = screen.getByPlaceholderText('Type your guess...') as HTMLInputElement;
    const submitButton = screen.getByText('Submit Guess') as HTMLButtonElement;

    fireEvent.change(input, { target: { value: 'test' } });
    fireEvent.click(submitButton);

    expect(input.disabled).toBe(true);
    expect(submitButton.disabled).toBe(true);
  });

  it('should validate max length of 100 characters', () => {
    const onSubmit = vi.fn();
    const onComplete = vi.fn();
    render(
      <GuessInput onSubmit={onSubmit} timeRemaining={20} disabled={false} onComplete={onComplete} />
    );

    const input = screen.getByPlaceholderText('Type your guess...') as HTMLInputElement;
    expect(input.maxLength).toBe(100);
  });

  it('should show character count', () => {
    const onSubmit = vi.fn();
    const onComplete = vi.fn();
    render(
      <GuessInput onSubmit={onSubmit} timeRemaining={20} disabled={false} onComplete={onComplete} />
    );

    const input = screen.getByPlaceholderText('Type your guess...') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'test' } });

    expect(screen.getByText('4/100 characters')).toBeInTheDocument();
  });

  it('should have 16px font size for mobile', () => {
    const onSubmit = vi.fn();
    const onComplete = vi.fn();
    render(
      <GuessInput onSubmit={onSubmit} timeRemaining={20} disabled={false} onComplete={onComplete} />
    );

    const input = screen.getByPlaceholderText('Type your guess...') as HTMLInputElement;
    expect(input.style.fontSize).toBe('16px');
  });

  it('should auto-submit when timer completes', () => {
    const onSubmit = vi.fn();
    const onComplete = vi.fn();
    render(
      <GuessInput onSubmit={onSubmit} timeRemaining={3} disabled={false} onComplete={onComplete} />
    );

    const input = screen.getByPlaceholderText('Type your guess...') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'test guess' } });

    // Advance timer to completion
    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(onSubmit).toHaveBeenCalledWith('test guess');
    expect(onComplete).toHaveBeenCalled();
  });

  it('should not submit twice if already submitted', () => {
    const onSubmit = vi.fn();
    const onComplete = vi.fn();
    render(
      <GuessInput onSubmit={onSubmit} timeRemaining={20} disabled={false} onComplete={onComplete} />
    );

    const input = screen.getByPlaceholderText('Type your guess...') as HTMLInputElement;
    const submitButton = screen.getByText('Submit Guess');

    fireEvent.change(input, { target: { value: 'test' } });
    fireEvent.click(submitButton);
    fireEvent.click(submitButton);

    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('should be disabled when disabled prop is true', () => {
    const onSubmit = vi.fn();
    const onComplete = vi.fn();
    render(
      <GuessInput onSubmit={onSubmit} timeRemaining={20} disabled={true} onComplete={onComplete} />
    );

    const input = screen.getByPlaceholderText('Type your guess...') as HTMLInputElement;
    const submitButton = screen.getByText('Submit Guess') as HTMLButtonElement;

    expect(input.disabled).toBe(true);
    expect(submitButton.disabled).toBe(true);
  });
});
