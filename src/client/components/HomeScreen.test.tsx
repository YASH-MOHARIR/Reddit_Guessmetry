import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { HomeScreen } from './HomeScreen';

describe('HomeScreen', () => {
  it('renders game title', () => {
    const mockStartGame = vi.fn();
    render(<HomeScreen onStartGame={mockStartGame} username={null} />);

    expect(screen.getByText('Guessmetry')).toBeInTheDocument();
  });

  it('renders mode selection heading', () => {
    const mockStartGame = vi.fn();
    render(<HomeScreen onStartGame={mockStartGame} username={null} />);

    expect(screen.getByText('Choose Your Mode')).toBeInTheDocument();
    expect(screen.getByText(/geometric shape descriptions/i)).toBeInTheDocument();
  });

  it('renders Classic Mode button', () => {
    const mockStartGame = vi.fn();
    render(<HomeScreen onStartGame={mockStartGame} username={null} />);

    const classicButton = screen.getByRole('button', { name: /start classic mode/i });
    expect(classicButton).toBeInTheDocument();
    expect(classicButton).toHaveClass('bg-[#FF4500]');
    expect(screen.getByText('Classic Mode')).toBeInTheDocument();
    expect(screen.getByText(/match the creator's answer/i)).toBeInTheDocument();
  });

  it('renders Consensus Mode button', () => {
    const mockStartGame = vi.fn();
    render(<HomeScreen onStartGame={mockStartGame} username={null} />);

    const consensusButton = screen.getByRole('button', { name: /start consensus mode/i });
    expect(consensusButton).toBeInTheDocument();
    expect(consensusButton).toHaveClass('bg-[#0079D3]');
    expect(screen.getByText('Consensus Mode')).toBeInTheDocument();
    expect(screen.getByText(/match the crowd/i)).toBeInTheDocument();
  });

  it('calls onStartGame with "classic" when Classic Mode button is clicked', () => {
    const mockStartGame = vi.fn();
    render(<HomeScreen onStartGame={mockStartGame} username={null} />);

    const classicButton = screen.getByRole('button', { name: /start classic mode/i });
    fireEvent.click(classicButton);

    expect(mockStartGame).toHaveBeenCalledTimes(1);
    expect(mockStartGame).toHaveBeenCalledWith('classic');
  });

  it('calls onStartGame with "consensus" when Consensus Mode button is clicked', () => {
    const mockStartGame = vi.fn();
    render(<HomeScreen onStartGame={mockStartGame} username={null} />);

    const consensusButton = screen.getByRole('button', { name: /start consensus mode/i });
    fireEvent.click(consensusButton);

    expect(mockStartGame).toHaveBeenCalledTimes(1);
    expect(mockStartGame).toHaveBeenCalledWith('consensus');
  });

  it('displays personalized greeting when username is provided', () => {
    const mockStartGame = vi.fn();
    render(<HomeScreen onStartGame={mockStartGame} username="TestUser" />);

    expect(screen.getByText('Welcome, TestUser!')).toBeInTheDocument();
  });

  it('does not display greeting when username is null', () => {
    const mockStartGame = vi.fn();
    render(<HomeScreen onStartGame={mockStartGame} username={null} />);

    expect(screen.queryByText(/Welcome/)).not.toBeInTheDocument();
  });

  it('has mobile-friendly touch targets for both mode buttons', () => {
    const mockStartGame = vi.fn();
    render(<HomeScreen onStartGame={mockStartGame} username={null} />);

    const classicButton = screen.getByRole('button', { name: /start classic mode/i });
    const consensusButton = screen.getByRole('button', { name: /start consensus mode/i });
    
    expect(classicButton).toHaveClass('min-h-[48px]');
    expect(consensusButton).toHaveClass('min-h-[48px]');
  });

  it('applies distinct color schemes to differentiate modes', () => {
    const mockStartGame = vi.fn();
    render(<HomeScreen onStartGame={mockStartGame} username={null} />);

    const classicButton = screen.getByRole('button', { name: /start classic mode/i });
    const consensusButton = screen.getByRole('button', { name: /start consensus mode/i });
    
    // Classic mode uses Reddit orange
    expect(classicButton).toHaveClass('bg-[#FF4500]');
    expect(classicButton).toHaveClass('hover:bg-[#D93900]');
    
    // Consensus mode uses Reddit blue
    expect(consensusButton).toHaveClass('bg-[#0079D3]');
    expect(consensusButton).toHaveClass('hover:bg-[#0060A8]');
  });

  it('handles keyboard navigation for Classic Mode button', () => {
    const mockStartGame = vi.fn();
    render(<HomeScreen onStartGame={mockStartGame} username={null} />);

    const classicButton = screen.getByRole('button', { name: /start classic mode/i });
    
    fireEvent.keyDown(classicButton, { key: 'Enter' });
    expect(mockStartGame).toHaveBeenCalledWith('classic');
    
    mockStartGame.mockClear();
    
    fireEvent.keyDown(classicButton, { key: ' ' });
    expect(mockStartGame).toHaveBeenCalledWith('classic');
  });

  it('handles keyboard navigation for Consensus Mode button', () => {
    const mockStartGame = vi.fn();
    render(<HomeScreen onStartGame={mockStartGame} username={null} />);

    const consensusButton = screen.getByRole('button', { name: /start consensus mode/i });
    
    fireEvent.keyDown(consensusButton, { key: 'Enter' });
    expect(mockStartGame).toHaveBeenCalledWith('consensus');
    
    mockStartGame.mockClear();
    
    fireEvent.keyDown(consensusButton, { key: ' ' });
    expect(mockStartGame).toHaveBeenCalledWith('consensus');
  });
});
