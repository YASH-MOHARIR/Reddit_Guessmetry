// src/client/App.tsx
import { useEffect, useState, useCallback } from 'react';

type AppState = 'loading' | 'prompt' | 'results' | 'error' | 'no-prompt';

type GuessAggregation = {
  guess: string;
  count: number;
  percentage: number;
  isPlayerGuess: boolean;
  isCreatorAnswer: boolean;
  rank: number;
  variants?: string[];
};

type ConsensusScore = {
  pointsEarned: number;
  matchPercentage: number;
  tier: 'majority' | 'common' | 'uncommon' | 'rare' | 'unique';
};

export const App = () => {
  const [appState, setAppState] = useState<AppState>('loading');
  const [error, setError] = useState<string | null>(null);
  const [customPrompt, setCustomPrompt] = useState<{
    description: string;
    hasGuessed: boolean;
  } | null>(null);
  const [postId, setPostId] = useState<string | null>(null);
  const [guess, setGuess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resultsData, setResultsData] = useState<{
    aggregation: GuessAggregation[];
    playerGuess: string | null;
    creatorAnswer: string;
    totalPlayers: number;
    totalGuesses: number;
    playerScore: ConsensusScore;
  } | null>(null);

  // Initialize app
  useEffect(() => {
    const initialize = async () => {
      try {
        console.log('Starting initialization...');
        const response = await fetch('/api/init');
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to initialize');
        }

        const data = await response.json();
        console.log('Init data:', data);
        
        setPostId(data.postId);

        if (!data.customPrompt) {
          setAppState('no-prompt');
          setError('This post does not have a custom prompt. Please create a challenge first.');
          return;
        }

        setCustomPrompt(data.customPrompt);

        // If user already guessed, fetch results
        if (data.customPrompt.hasGuessed) {
          await fetchResults();
          setAppState('results');
        } else {
          setAppState('prompt');
        }
      } catch (err) {
        console.error('Initialization error:', err);
        setError(err instanceof Error ? err.message : 'Failed to load');
        setAppState('error');
      }
    };

    void initialize();
  }, []);

  // Fetch results
  const fetchResults = useCallback(async () => {
    if (!postId) return;

    try {
      const response = await fetch('/api/prompt/get-results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch results');
      }

      const data = await response.json();
      console.log('Results data:', data);
      
      setResultsData({
        aggregation: data.aggregation || [],
        playerGuess: data.playerGuess,
        creatorAnswer: data.creatorAnswer,
        totalPlayers: data.totalPlayers || 0,
        totalGuesses: data.totalGuesses || 0,
        playerScore: data.playerScore || {
          pointsEarned: 0,
          matchPercentage: 0,
          tier: 'unique'
        },
      });
    } catch (err) {
      console.error('Failed to fetch results:', err);
    }
  }, [postId]);

  // Handle guess submission
  const handleSubmitGuess = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedGuess = guess.trim();
    if (!trimmedGuess || isSubmitting) return;

    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/prompt/submit-guess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guess: trimmedGuess }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit guess');
      }

      // Fetch results after successful submission
      await fetchResults();
      setAppState('results');
    } catch (err) {
      console.error('Failed to submit guess:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit guess. Please try again.');
      setIsSubmitting(false);
    }
  };

  // Handle refresh
  const handleRefresh = useCallback(() => {
    void fetchResults();
  }, [fetchResults]);

  // Auto-refresh for results
  useEffect(() => {
    if (appState !== 'results') return;
    
    const interval = setInterval(() => {
      handleRefresh();
    }, 5000);

    return () => clearInterval(interval);
  }, [appState, handleRefresh]);

  // Loading state
  if (appState === 'loading') {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        fontFamily: 'system-ui, sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '48px',
            height: '48px',
            border: '3px solid #FF4500',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            margin: '0 auto 16px',
            animation: 'spin 1s linear infinite'
          }}></div>
          <p>Loading...</p>
        </div>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // Error state
  if (appState === 'error' || appState === 'no-prompt') {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        fontFamily: 'system-ui, sans-serif'
      }}>
        <div style={{
          maxWidth: '400px',
          width: '100%',
          background: '#FEE',
          borderRadius: '12px',
          padding: '32px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
          <h2 style={{ marginBottom: '16px' }}>Oops!</h2>
          <p style={{ marginBottom: '24px' }}>{error || 'Something went wrong'}</p>
          <button
            onClick={() => window.location.reload()}
            style={{
              width: '100%',
              padding: '12px',
              background: '#FF4500',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              cursor: 'pointer'
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Prompt view (user hasn't guessed yet)
  if (appState === 'prompt' && customPrompt) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        fontFamily: 'system-ui, sans-serif'
      }}>
        <div style={{ maxWidth: '600px', width: '100%' }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '32px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }}>
            <h1 style={{ textAlign: 'center', marginBottom: '8px', color: '#1a1a1a' }}>
              Geometric Pictionary
            </h1>
            <p style={{ textAlign: 'center', marginBottom: '32px', color: '#666' }}>
              What does this description represent?
            </p>

            <div style={{
              background: '#E3F2FD',
              borderRadius: '8px',
              padding: '20px',
              marginBottom: '32px'
            }}>
              <div style={{ display: 'flex', gap: '12px' }}>
                <span style={{ fontSize: '24px' }}>📐</span>
                <div>
                  <h3 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#666' }}>
                    Description:
                  </h3>
                  <p style={{ margin: 0, fontSize: '18px', lineHeight: '1.5' }}>
                    {customPrompt.description}
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmitGuess}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  fontWeight: 'bold',
                  color: '#333'
                }}>
                  Your Guess
                </label>
                <input
                  type="text"
                  value={guess}
                  onChange={(e) => setGuess(e.target.value)}
                  placeholder="Enter your guess..."
                  disabled={isSubmitting}
                  maxLength={100}
                  style={{
                    width: '100%',
                    padding: '12px',
                    fontSize: '16px',
                    border: '2px solid #ddd',
                    borderRadius: '8px',
                    outline: 'none'
                  }}
                  autoFocus
                />
              </div>
              
              <button
                type="submit"
                disabled={!guess.trim() || isSubmitting}
                style={{
                  width: '100%',
                  padding: '16px',
                  background: !guess.trim() || isSubmitting ? '#ccc' : '#FF4500',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  cursor: !guess.trim() || isSubmitting ? 'not-allowed' : 'pointer'
                }}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Guess'}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Results view
  if (appState === 'results' && resultsData) {
    return (
      <div style={{
        minHeight: '100vh',
        padding: '20px',
        fontFamily: 'system-ui, sans-serif',
        background: '#f5f5f5'
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h1 style={{ textAlign: 'center', marginBottom: '32px' }}>Top Guesses</h1>

          {/* Leaderboard */}
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '24px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            {resultsData.aggregation.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#666' }}>
                Be the first to guess!
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {resultsData.aggregation.map((item, index) => {
                  const maxCount = resultsData.aggregation[0]?.count || 1;
                  const barWidth = (item.count / maxCount) * 100;

                  return (
                    <div
                      key={index}
                      style={{
                        position: 'relative',
                        border: item.isPlayerGuess ? '2px solid #FF4500' : 'none',
                        borderRadius: '8px',
                        padding: item.isPlayerGuess ? '8px' : '0'
                      }}
                    >
                      <div style={{
                        position: 'relative',
                        height: '56px',
                        background: '#f0f0f0',
                        borderRadius: '8px',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          position: 'absolute',
                          left: 0,
                          top: 0,
                          bottom: 0,
                          width: `${barWidth}%`,
                          background: item.isPlayerGuess ? '#FF4500' : '#2196F3',
                          transition: 'width 0.3s'
                        }} />
                        
                        <div style={{
                          position: 'relative',
                          height: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0 16px'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span style={{ fontWeight: 'bold', fontSize: '18px' }}>
                              {item.guess}
                            </span>
                            {item.isPlayerGuess && (
                              <span style={{
                                background: '#FFE0DC',
                                color: '#FF4500',
                                padding: '2px 8px',
                                borderRadius: '12px',
                                fontSize: '12px',
                                fontWeight: 'bold'
                              }}>
                                You
                              </span>
                            )}
                          </div>
                          <div style={{ display: 'flex', gap: '12px', fontWeight: 'bold' }}>
                            <span>{item.count}</span>
                            <span style={{ color: '#666' }}>{item.percentage}%</span>
                          </div>
                        </div>
                      </div>
                      
                      {item.variants && item.variants.length > 0 && (
                        <div style={{ marginTop: '4px', marginLeft: '16px', fontSize: '12px', color: '#666' }}>
                          Also: {item.variants.join(', ')}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Stats */}
          <div style={{
            background: '#f0f0f0',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '16px',
            textAlign: 'center'
          }}>
            <strong>{resultsData.totalPlayers}</strong> players • <strong>{resultsData.totalGuesses}</strong> guesses
          </div>

          {/* Creator's Answer */}
          <div style={{
            background: '#E8F5E9',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '16px',
            textAlign: 'center'
          }}>
            Creator's Answer: <strong style={{ color: '#4CAF50' }}>{resultsData.creatorAnswer}</strong>
          </div>

          {/* Player Score */}
          {resultsData.playerGuess && (
            <div style={{
              background: '#E3F2FD',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '16px'
            }}>
              <h3 style={{ marginTop: 0 }}>Your Score</h3>
              <p>You guessed: <strong style={{ color: '#FF4500' }}>{resultsData.playerGuess}</strong></p>
              <p>Points earned: <strong style={{ fontSize: '20px', color: '#FF4500' }}>
                {resultsData.playerScore.pointsEarned}
              </strong></p>
              {resultsData.playerScore.matchPercentage > 0 && (
                <p style={{ fontSize: '14px', color: '#666' }}>
                  {resultsData.playerScore.matchPercentage.toFixed(1)}% of players guessed the same
                </p>
              )}
            </div>
          )}

          {/* Refresh Button */}
          <div style={{ textAlign: 'center', marginTop: '24px' }}>
            <button
              onClick={handleRefresh}
              style={{
                padding: '12px 24px',
                background: 'white',
                border: '2px solid #ddd',
                borderRadius: '8px',
                fontSize: '16px',
                cursor: 'pointer'
              }}
            >
              🔄 Refresh Results
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};
