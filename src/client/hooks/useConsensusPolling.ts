import { useState, useEffect, useRef, useCallback } from 'react';
import type { GuessAggregation, ConsensusScore } from '../../shared/types/game';

type UseConsensusPollingOptions = {
  promptId: number;
  enabled: boolean;
  interval?: number;
};

type UseConsensusPollingReturn = {
  aggregation: GuessAggregation[];
  totalPlayers: number;
  totalGuesses: number;
  playerScore: ConsensusScore | null;
  creatorAnswerData: GuessAggregation | null;
  loading: boolean;
  error: string | null;
};

const DEFAULT_INTERVAL = 2000;
const MAX_CONSECUTIVE_FAILURES = 3;

export function useConsensusPolling({
  promptId,
  enabled,
  interval = DEFAULT_INTERVAL,
}: UseConsensusPollingOptions): UseConsensusPollingReturn {
  const [aggregation, setAggregation] = useState<GuessAggregation[]>([]);
  const [totalPlayers, setTotalPlayers] = useState(0);
  const [totalGuesses, setTotalGuesses] = useState(0);
  const [playerScore, setPlayerScore] = useState<ConsensusScore | null>(null);
  const [creatorAnswerData, setCreatorAnswerData] = useState<GuessAggregation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const intervalRef = useRef<number | null>(null);
  const consecutiveFailuresRef = useRef(0);
  const isMountedRef = useRef(true);

  const fetchResults = useCallback(async () => {
    if (!enabled) return;

    try {
      setLoading(true);
      const response = await fetch('/api/consensus/get-results', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          promptId,
          username: '', // Will be populated by server from context
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch results: ' + response.statusText);
      }

      const data = await response.json();

      if (!isMountedRef.current) return;

      consecutiveFailuresRef.current = 0;
      setError(null);

      setAggregation(data.aggregation || []);
      setTotalPlayers(data.totalPlayers || 0);
      setTotalGuesses(data.totalGuesses || 0);
      setPlayerScore(data.playerScore || null);
      setCreatorAnswerData(data.creatorAnswerData || null);
    } catch (err) {
      if (!isMountedRef.current) return;

      consecutiveFailuresRef.current += 1;
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);

      if (consecutiveFailuresRef.current >= MAX_CONSECUTIVE_FAILURES) {
        if (intervalRef.current !== null) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        setError('Polling stopped after ' + MAX_CONSECUTIVE_FAILURES + ' consecutive failures');
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [promptId, enabled]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (enabled) {
      consecutiveFailuresRef.current = 0;
      fetchResults();
      intervalRef.current = window.setInterval(() => {
        fetchResults();
      }, interval);
    }

    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, interval, fetchResults]);

  return {
    aggregation,
    totalPlayers,
    totalGuesses,
    playerScore,
    creatorAnswerData,
    loading,
    error,
  };
}
