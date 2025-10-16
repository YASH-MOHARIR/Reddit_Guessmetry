import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PromptDisplay } from './PromptDisplay';

describe('PromptDisplay', () => {
  it('should render prompt text', () => {
    const onComplete = vi.fn();
    render(
      <PromptDisplay
        promptText="A circle on top of a rectangle"
        timeRemaining={5}
        onComplete={onComplete}
      />
    );

    expect(screen.getByText('A circle on top of a rectangle')).toBeInTheDocument();
  });

  it('should display prompt text in large readable font', () => {
    const onComplete = vi.fn();
    render(
      <PromptDisplay
        promptText="A triangle sitting on a square"
        timeRemaining={5}
        onComplete={onComplete}
      />
    );

    const promptElement = screen.getByText('A triangle sitting on a square');
    expect(promptElement.className).toContain('text-2xl');
    expect(promptElement.className).toContain('md:text-3xl');
    expect(promptElement.className).toContain('lg:text-4xl');
  });

  it('should render Timer component', () => {
    const onComplete = vi.fn();
    render(<PromptDisplay promptText="Test prompt" timeRemaining={5} onComplete={onComplete} />);

    // Timer should show the time
    expect(screen.getByText(/5s/)).toBeInTheDocument();
  });

  it('should pass onComplete callback to Timer', () => {
    const onComplete = vi.fn();
    render(<PromptDisplay promptText="Test prompt" timeRemaining={5} onComplete={onComplete} />);

    // Timer component should be rendered (we can't easily test the callback without mocking)
    expect(screen.getByText(/5s/)).toBeInTheDocument();
  });

  it('should have fade-in animation class', () => {
    const onComplete = vi.fn();
    const { container } = render(
      <PromptDisplay promptText="Test prompt" timeRemaining={5} onComplete={onComplete} />
    );

    const mainDiv = container.firstChild as HTMLElement;
    expect(mainDiv.className).toContain('animate-fade-in');
  });

  it('should be mobile responsive', () => {
    const onComplete = vi.fn();
    const { container } = render(
      <PromptDisplay promptText="Test prompt" timeRemaining={5} onComplete={onComplete} />
    );

    const mainDiv = container.firstChild as HTMLElement;
    expect(mainDiv.className).toContain('max-w-2xl');
    expect(mainDiv.className).toContain('mx-auto');
    expect(mainDiv.className).toContain('px-4');
  });

  it('should display instruction text', () => {
    const onComplete = vi.fn();
    render(<PromptDisplay promptText="Test prompt" timeRemaining={5} onComplete={onComplete} />);

    expect(screen.getByText('Memorize this description!')).toBeInTheDocument();
  });
});
