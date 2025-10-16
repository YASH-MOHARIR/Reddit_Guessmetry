import express from 'express';
import {
  InitResponse,
  IncrementResponse,
  DecrementResponse,
  GameStartResponse,
  NextPromptResponse,
  GuessResultResponse,
  ErrorResponse,
  ConsensusGuessSubmittedResponse,
  ConsensusResultsResponse,
  HistoricalResultsResponse,
  HistoricalResultsNotFoundResponse,
} from '../shared/types/api';
import { redis, reddit, createServer, context, getServerPort } from '@devvit/web/server';
import { createPost } from './core/post';
import { generateSessionId } from './utils/sessionId';
import { selectNextPrompt } from './utils/promptSelector';
import { prompts } from './data/prompts';
import { calculateSimilarity } from './utils/stringSimilarity';
import { normalizeGuess } from './utils/guessNormalization';
import {
  storeGuess,
  addPlayerToSet,
  storePlayerGuess,
  getAggregatedGuesses,
  getTotalPlayers,
  groupSimilarGuesses,
  getFinalResults,
} from './services/redisAggregation.js';
import { calculateConsensusTier } from './utils/consensusScoring';
import { getOrCreatePromptSession } from './utils/promptSession';

const app = express();

// Middleware for JSON body parsing
app.use(express.json());
// Middleware for URL-encoded body parsing
app.use(express.urlencoded({ extended: true }));
// Middleware for plain text body parsing
app.use(express.text());

const router = express.Router();

router.get<{ postId: string }, InitResponse | { status: string; message: string }>(
  '/api/init',
  async (_req, res): Promise<void> => {
    const { postId } = context;

    if (!postId) {
      console.error('API Init Error: postId not found in devvit context');
      res.status(400).json({
        status: 'error',
        message: 'postId is required but missing from context',
      });
      return;
    }

    try {
      const username = await reddit.getCurrentUsername();
      const currentUsername = username ?? 'anonymous';

      // Try to fetch custom prompt for this post
      const { getCustomPrompt } = await import('./services/promptStorage');
      const { hasUserGuessed } = await import('./services/guessTracking');

      let customPrompt: { description: string; hasGuessed: boolean } | null = null;

      try {
        const prompt = await getCustomPrompt(redis, postId);
        if (prompt) {
          const hasGuessed = await hasUserGuessed(redis, postId, currentUsername);
          customPrompt = {
            description: prompt.description,
            hasGuessed,
          };
        }
      } catch (error) {
        console.warn(
          `[Init] Failed to fetch custom prompt for post ${postId}:`,
          error instanceof Error ? error.message : String(error)
        );
        // Continue without custom prompt data
      }

      res.json({
        type: 'init',
        postId: postId,
        username: currentUsername,
        customPrompt,
      });
    } catch (error) {
      console.error(`API Init Error for post ${postId}:`, error);
      let errorMessage = 'Unknown error during initialization';
      if (error instanceof Error) {
        errorMessage = `Initialization failed: ${error.message}`;
      }
      res.status(400).json({ status: 'error', message: errorMessage });
    }
  }
);

router.post<{ postId: string }, GameStartResponse | ErrorResponse, { postId: string }>(
  '/api/game/start',
  async (_req, res): Promise<void> => {
    const { postId } = context;

    if (!postId) {
      console.error('API Game Start Error: postId not found in context');
      res.status(400).json({
        status: 'error',
        message: 'postId is required but missing from context',
      });
      return;
    }

    try {
      const username = await reddit.getCurrentUsername();
      const sessionId = generateSessionId(postId, username ?? 'anonymous');

      // Initialize session in Redis with 1 hour TTL (3600 seconds)
      const ttl = 3600;

      // Initialize session score to 0
      await redis.set(`session:${sessionId}:score`, '0', {
        expiration: new Date(Date.now() + ttl * 1000),
      });

      // Initialize session metadata
      await redis.hSet(`session:${sessionId}:meta`, {
        username: username ?? 'anonymous',
        startTime: Date.now().toString(),
        roundsCompleted: '0',
      });
      await redis.expire(`session:${sessionId}:meta`, ttl);

      // Initialize used prompts set (will be populated as prompts are used)
      // Using zAdd with empty set to create the key with TTL
      await redis.expire(`session:${sessionId}:used`, ttl);

      res.json({
        type: 'game-start',
        sessionId,
        username: username ?? 'anonymous',
      });
    } catch (error) {
      console.error(`API Game Start Error for post ${postId}:`, error);
      let errorMessage = 'Unknown error during game start';
      if (error instanceof Error) {
        errorMessage = `Game start failed: ${error.message}`;
      }
      res.status(500).json({ status: 'error', message: errorMessage });
    }
  }
);

router.post<{ postId: string }, NextPromptResponse | ErrorResponse, { sessionId: string }>(
  '/api/game/next-prompt',
  async (req, res): Promise<void> => {
    const { postId } = context;

    if (!postId) {
      console.error('API Next Prompt Error: postId not found in context');
      res.status(400).json({
        status: 'error',
        message: 'postId is required but missing from context',
      });
      return;
    }

    const { sessionId } = req.body;

    if (!sessionId) {
      res.status(400).json({
        status: 'error',
        message: 'sessionId is required',
      });
      return;
    }

    try {
      // Select next unused prompt
      const selectedPrompt = await selectNextPrompt(redis, sessionId, prompts);

      if (!selectedPrompt) {
        res.status(404).json({
          status: 'error',
          message: 'No more prompts available. All prompts have been used in this session.',
        });
        return;
      }

      // Return prompt without answer field (client shouldn't see the answer)
      res.json({
        type: 'next-prompt',
        prompt: {
          id: selectedPrompt.id,
          promptText: selectedPrompt.promptText,
          difficulty: selectedPrompt.difficulty,
          category: selectedPrompt.category,
        },
      });
    } catch (error) {
      console.error(`API Next Prompt Error for session ${sessionId}:`, error);
      let errorMessage = 'Unknown error fetching next prompt';
      if (error instanceof Error) {
        errorMessage = `Failed to fetch prompt: ${error.message}`;
      }
      res.status(500).json({ status: 'error', message: errorMessage });
    }
  }
);

router.post<
  { postId: string },
  GuessResultResponse | ErrorResponse,
  { sessionId: string; promptId: number; guess: string }
>('/api/game/submit-guess', async (req, res): Promise<void> => {
  const { postId } = context;

  if (!postId) {
    console.error('API Submit Guess Error: postId not found in context');
    res.status(400).json({
      status: 'error',
      message: 'postId is required but missing from context',
    });
    return;
  }

  const { sessionId, promptId, guess } = req.body;

  if (!sessionId || promptId === undefined || guess === undefined) {
    res.status(400).json({
      status: 'error',
      message: 'sessionId, promptId, and guess are required',
    });
    return;
  }

  try {
    // Find the prompt by ID
    const prompt = prompts.find((p) => p.id === promptId);

    if (!prompt) {
      res.status(404).json({
        status: 'error',
        message: 'Prompt not found',
      });
      return;
    }

    // Normalize guess (lowercase, trim)
    const normalizedGuess = guess.toLowerCase().trim();
    const normalizedAnswer = prompt.answer.toLowerCase().trim();

    // Check for exact match against answer and alternative answers
    const allAcceptableAnswers = [
      normalizedAnswer,
      ...prompt.alternativeAnswers.map((a) => a.toLowerCase().trim()),
    ];

    let isCorrect = false;
    let isClose = false;
    let pointsEarned = 0;

    // Check exact match
    if (allAcceptableAnswers.includes(normalizedGuess)) {
      isCorrect = true;
      pointsEarned = 10;
    } else {
      // Check for close match using string similarity (≥70% threshold)
      for (const acceptableAnswer of allAcceptableAnswers) {
        const similarity = calculateSimilarity(normalizedGuess, acceptableAnswer);
        if (similarity >= 70) {
          isClose = true;
          pointsEarned = 5;
          break;
        }
      }
    }

    // Update session score in Redis
    const currentScoreStr = await redis.get(`session:${sessionId}:score`);
    const currentScore = currentScoreStr ? parseInt(currentScoreStr, 10) : 0;
    const newScore = currentScore + pointsEarned;
    await redis.set(`session:${sessionId}:score`, newScore.toString());

    // Update rounds completed
    const metaData = await redis.hGetAll(`session:${sessionId}:meta`);
    const roundsCompleted = metaData.roundsCompleted ? parseInt(metaData.roundsCompleted, 10) : 0;
    await redis.hSet(`session:${sessionId}:meta`, {
      roundsCompleted: (roundsCompleted + 1).toString(),
    });

    res.json({
      type: 'guess-result',
      isCorrect,
      isClose,
      correctAnswer: prompt.answer,
      pointsEarned,
      totalScore: newScore,
    });
  } catch (error) {
    console.error(`API Submit Guess Error for session ${sessionId}:`, error);
    let errorMessage = 'Unknown error submitting guess';
    if (error instanceof Error) {
      errorMessage = `Failed to submit guess: ${error.message}`;
    }
    res.status(500).json({ status: 'error', message: errorMessage });
  }
});

router.post<
  { postId: string },
  ConsensusGuessSubmittedResponse | ErrorResponse,
  { sessionId: string; promptId: number; guess: string }
>('/api/consensus/submit-guess', async (req, res): Promise<void> => {
  const { postId } = context;

  if (!postId) {
    console.error('API Consensus Submit Guess Error: postId not found in context');
    res.status(400).json({
      status: 'error',
      message: 'postId is required but missing from context',
    });
    return;
  }

  const { sessionId, promptId, guess } = req.body;

  // Validate request body
  if (!sessionId || promptId === undefined || guess === undefined) {
    res.status(400).json({
      status: 'error',
      message: 'sessionId, promptId, and guess are required',
    });
    return;
  }

  try {
    // Get username from Reddit API context
    const username = await reddit.getCurrentUsername();

    if (!username) {
      res.status(401).json({
        status: 'error',
        message: 'Unable to get username from Reddit context',
      });
      return;
    }

    // Get or create prompt session for this prompt
    const promptSessionId = await getOrCreatePromptSession(redis, postId, promptId);

    // Normalize the guess
    const normalizedGuess = normalizeGuess(guess);

    // Retry logic wrapper with improved error handling
    const retryOperation = async <T>(
      operation: () => Promise<T>,
      operationName: string
    ): Promise<T> => {
      try {
        return await operation();
      } catch (error) {
        console.warn(
          `[Redis Retry] ${operationName} failed, retrying once...`,
          error instanceof Error ? error.message : String(error)
        );
        // Retry once after a brief delay
        await new Promise((resolve) => setTimeout(resolve, 100));
        try {
          return await operation();
        } catch (retryError) {
          console.error(
            `[Redis Error] ${operationName} failed after retry:`,
            retryError instanceof Error ? retryError.message : String(retryError),
            retryError instanceof Error ? retryError.stack : ''
          );
          throw retryError;
        }
      }
    };

    let allOperationsSucceeded = true;
    const errors: string[] = [];

    // Store guess and increment count in Redis with retry (using prompt session)
    try {
      await retryOperation(
        () => storeGuess(redis, promptId, normalizedGuess, promptSessionId),
        'storeGuess'
      );
    } catch (error) {
      allOperationsSucceeded = false;
      errors.push('Failed to store guess');
    }

    // Add player to unique players set with retry (using prompt session)
    try {
      await retryOperation(
        () => addPlayerToSet(redis, promptId, username, promptSessionId),
        'addPlayerToSet'
      );
    } catch (error) {
      allOperationsSucceeded = false;
      errors.push('Failed to add player to set');
    }

    // Store player's specific guess with retry (using prompt session)
    try {
      await retryOperation(
        () => storePlayerGuess(redis, promptId, username, normalizedGuess, promptSessionId),
        'storePlayerGuess'
      );
    } catch (error) {
      allOperationsSucceeded = false;
      errors.push('Failed to store player guess');
    }

    // If all operations failed, return error
    if (errors.length === 3) {
      console.error(
        `[Redis Error] All Redis operations failed for prompt ${promptId}, user ${username}`
      );
      res.status(500).json({
        status: 'error',
        message: 'Failed to submit guess. Your answer was recorded locally.',
      });
      return;
    }

    // If some operations succeeded, return success with warning
    if (!allOperationsSucceeded) {
      console.warn(
        `[Redis Warning] Partial success for prompt ${promptId}, user ${username}. Errors: ${errors.join(', ')}`
      );
    }

    res.json({
      type: 'consensus-guess-submitted',
      success: true,
      message: allOperationsSucceeded
        ? 'Guess submitted successfully'
        : 'Guess submitted with partial success',
    });
  } catch (error) {
    console.error(
      `[API Error] Consensus Submit Guess Error for session ${sessionId}:`,
      error instanceof Error ? error.message : String(error),
      error instanceof Error ? error.stack : ''
    );
    let errorMessage = 'Failed to submit guess. Your answer was recorded locally.';
    if (error instanceof Error) {
      errorMessage = `Failed to submit guess: ${error.message}`;
    }
    res.status(500).json({ status: 'error', message: errorMessage });
  }
});

router.post<
  { postId: string },
  ConsensusResultsResponse | ErrorResponse,
  { promptId: number; username: string }
>('/api/consensus/get-results', async (req, res): Promise<void> => {
  const { postId } = context;

  if (!postId) {
    console.error('API Consensus Get Results Error: postId not found in context');
    res.status(400).json({
      status: 'error',
      message: 'postId is required but missing from context',
    });
    return;
  }

  const { promptId, username } = req.body;

  // Validate request body
  if (promptId === undefined || !username) {
    res.status(400).json({
      status: 'error',
      message: 'promptId and username are required',
    });
    return;
  }

  try {
    // Find the prompt by ID to get creator's answer
    const prompt = prompts.find((p) => p.id === promptId);

    if (!prompt) {
      res.status(404).json({
        status: 'error',
        message: 'Prompt not found',
      });
      return;
    }

    // Get or create prompt session for this prompt
    const promptSessionId = await getOrCreatePromptSession(redis, postId, promptId);

    // Fetch aggregated guesses from Redis with error handling
    let guessesMap: Record<string, number> = {};
    let totalPlayers = 0;
    let playerGuess: string | null = null;
    let hasPartialData = false;

    try {
      guessesMap = await getAggregatedGuesses(redis, promptId, promptSessionId);
    } catch (error) {
      console.error(
        `[Redis Error] Failed to fetch aggregated guesses for prompt ${promptId}:`,
        error instanceof Error ? error.message : String(error)
      );
      hasPartialData = true;
    }

    try {
      totalPlayers = await getTotalPlayers(redis, promptId, promptSessionId);
    } catch (error) {
      console.error(
        `[Redis Error] Failed to fetch total players for prompt ${promptId}:`,
        error instanceof Error ? error.message : String(error)
      );
      hasPartialData = true;
    }

    try {
      const playerGuessKey = `${promptSessionId}:player:${username}:guess`;
      const fetchedGuess = await redis.get(playerGuessKey);
      playerGuess = fetchedGuess ?? null;
    } catch (error) {
      console.error(
        `[Redis Error] Failed to fetch player guess for prompt ${promptId}, user ${username}:`,
        error instanceof Error ? error.message : String(error)
      );
      hasPartialData = true;
    }

    // If we have no data at all, return empty results
    if (totalPlayers === 0 && Object.keys(guessesMap).length === 0) {
      res.json({
        type: 'consensus-results',
        aggregation: [],
        playerGuess: null,
        creatorAnswer: prompt.answer,
        totalPlayers: 0,
        totalGuesses: 0,
        playerScore: {
          pointsEarned: 0,
          matchPercentage: 0,
          tier: 'unique',
        },
      });
      return;
    }

    // Calculate total guesses (sum of all counts)
    const totalGuesses = Object.values(guessesMap).reduce((sum, count) => sum + count, 0);

    // Normalize creator's answer for comparison
    const normalizedCreatorAnswer = normalizeGuess(prompt.answer);

    // Group similar guesses together (≥85% similarity)
    const groupedGuesses = groupSimilarGuesses(guessesMap, 85);

    // Convert grouped guesses to array and calculate percentages
    const guessesArray = groupedGuesses.map((group) => {
      const percentage = totalPlayers > 0 ? (group.combinedCount / totalPlayers) * 100 : 0;
      
      // Check if player's guess matches any variant in this group
      const isPlayerGuess = playerGuess
        ? group.variants.some((v) => normalizeGuess(v.guess) === normalizeGuess(playerGuess))
        : false;
      
      // Check if creator's answer matches any variant in this group
      const isCreatorAnswer = group.variants.some(
        (v) => normalizeGuess(v.guess) === normalizedCreatorAnswer
      );
      
      // Create variants array (exclude the primary guess) - only if there are multiple variants
      const variantsList: string[] | undefined =
        group.variants.length > 1
          ? group.variants.slice(1).map((v) => v.guess)
          : undefined;
      
      return {
        guess: group.primaryGuess,
        count: group.combinedCount,
        percentage: Math.round(percentage * 10) / 10, // Round to 1 decimal place
        isPlayerGuess,
        isCreatorAnswer,
        rank: 0, // Will be set after sorting
        variants: variantsList,
      };
    });

    // Sort by count descending and take top 10
    guessesArray.sort((a, b) => b.count - a.count);
    const top10 = guessesArray.slice(0, 10);

    // Assign ranks
    top10.forEach((guess, index) => {
      guess.rank = index + 1;
    });

    // Calculate player's score using consensus scoring algorithm
    const playerScore = playerGuess
      ? calculateConsensusTier(playerGuess, top10)
      : {
          pointsEarned: 0,
          matchPercentage: 0,
          tier: 'unique' as const,
        };

    // Check if creator's answer is in top 10
    const creatorAnswerInTop10 = top10.some((g) => g.isCreatorAnswer);

    // If creator's answer is not in top 10, fetch it separately
    let creatorAnswerData: typeof top10[0] | undefined = undefined;
    if (!creatorAnswerInTop10) {
      // Find creator's answer in the full guesses array
      const creatorAnswerEntry = guessesArray.find((g) => g.isCreatorAnswer);
      if (creatorAnswerEntry) {
        creatorAnswerData = {
          guess: creatorAnswerEntry.guess,
          count: creatorAnswerEntry.count,
          percentage: creatorAnswerEntry.percentage,
          isPlayerGuess: creatorAnswerEntry.isPlayerGuess,
          isCreatorAnswer: true,
          rank: guessesArray.findIndex((g) => g.isCreatorAnswer) + 1,
          variants: creatorAnswerEntry.variants,
        };
      }
    }

    // Log warning if we have partial data
    if (hasPartialData) {
      console.warn(
        `[Redis Warning] Returning partial data for prompt ${promptId} due to Redis errors`
      );
    }

    res.json({
      type: 'consensus-results',
      aggregation: top10,
      playerGuess: playerGuess || null,
      creatorAnswer: prompt.answer,
      totalPlayers,
      totalGuesses,
      playerScore,
      creatorAnswerData,
    });
  } catch (error) {
    console.error(
      `[API Error] Consensus Get Results Error for prompt ${promptId}:`,
      error instanceof Error ? error.message : String(error),
      error instanceof Error ? error.stack : ''
    );
    let errorMessage = 'Results temporarily unavailable';
    if (error instanceof Error) {
      errorMessage = `Results temporarily unavailable: ${error.message}`;
    }
    res.status(500).json({ status: 'error', message: errorMessage });
  }
});

router.get<
  { promptId: string },
  HistoricalResultsResponse | HistoricalResultsNotFoundResponse | ErrorResponse
>('/api/consensus/historical-results/:promptId', async (req, res): Promise<void> => {
  const { postId } = context;

  if (!postId) {
    console.error('API Historical Results Error: postId not found in context');
    res.status(400).json({
      status: 'error',
      message: 'postId is required but missing from context',
    });
    return;
  }

  const promptId = parseInt(req.params.promptId, 10);

  // Validate promptId
  if (isNaN(promptId)) {
    res.status(400).json({
      status: 'error',
      message: 'Invalid promptId parameter',
    });
    return;
  }

  try {
    // Find the prompt by ID to get creator's answer and prompt text
    const prompt = prompts.find((p) => p.id === promptId);

    if (!prompt) {
      res.status(404).json({
        status: 'error',
        message: 'Prompt not found',
      });
      return;
    }

    // Get the prompt session ID for this prompt
    const promptSessionId = await getOrCreatePromptSession(redis, postId, promptId);

    // Try to fetch preserved final results
    const finalResults = await getFinalResults(redis, promptId, promptSessionId);

    if (!finalResults) {
      res.status(404).json({
        type: 'historical-results-not-found',
        message: 'Historical results are no longer available for this prompt',
      });
      return;
    }

    // Normalize creator's answer for comparison
    const normalizedCreatorAnswer = normalizeGuess(prompt.answer);

    // Group similar guesses together (≥85% similarity)
    const groupedGuesses = groupSimilarGuesses(finalResults.guesses, 85);

    // Convert grouped guesses to array and calculate percentages
    const guessesArray = groupedGuesses.map((group) => {
      const percentage =
        finalResults.totalPlayers > 0
          ? (group.combinedCount / finalResults.totalPlayers) * 100
          : 0;

      // Check if creator's answer matches any variant in this group
      const isCreatorAnswer = group.variants.some(
        (v) => normalizeGuess(v.guess) === normalizedCreatorAnswer
      );

      // Create variants array (exclude the primary guess) - only if there are multiple variants
      const variantsList =
        group.variants.length > 1 ? group.variants.slice(1).map((v) => v.guess) : undefined;

      const baseGuess = {
        guess: group.primaryGuess,
        count: group.combinedCount,
        percentage: Math.round(percentage * 10) / 10, // Round to 1 decimal place
        isPlayerGuess: false, // No player context in historical view
        isCreatorAnswer,
        rank: 0, // Will be set after sorting
      };

      return variantsList ? { ...baseGuess, variants: variantsList } : baseGuess;
    });

    // Sort by count descending and take top 10
    guessesArray.sort((a, b) => b.count - a.count);
    const top10 = guessesArray.slice(0, 10);

    // Assign ranks
    top10.forEach((guess, index) => {
      guess.rank = index + 1;
    });

    res.json({
      type: 'historical-results',
      aggregation: top10,
      creatorAnswer: prompt.answer,
      totalPlayers: finalResults.totalPlayers,
      totalGuesses: finalResults.totalGuesses,
      isFinal: true,
      promptText: prompt.promptText,
    });
  } catch (error) {
    console.error(
      `[API Error] Historical Results Error for prompt ${promptId}:`,
      error instanceof Error ? error.message : String(error),
      error instanceof Error ? error.stack : ''
    );
    let errorMessage = 'Failed to retrieve historical results';
    if (error instanceof Error) {
      errorMessage = `Failed to retrieve historical results: ${error.message}`;
    }
    res.status(500).json({ status: 'error', message: errorMessage });
  }
});

// Custom Prompt Endpoints
router.post<
  { postId: string },
  ConsensusResultsResponse | ErrorResponse,
  unknown
>('/api/prompt/get-results', async (_req, res): Promise<void> => {
  const { postId } = context;

  if (!postId) {
    console.error('API Prompt Get Results Error: postId not found in context');
    res.status(400).json({
      status: 'error',
      message: 'postId is required but missing from context',
    });
    return;
  }

  try {
    // Get username from Reddit API context
    const username = await reddit.getCurrentUsername();

    if (!username) {
      res.status(401).json({
        status: 'error',
        message: 'Unable to get username from Reddit context',
      });
      return;
    }

    // Fetch custom prompt from Redis
    const { getCustomPrompt } = await import('./services/promptStorage');
    const customPrompt = await getCustomPrompt(redis, postId);

    if (!customPrompt) {
      res.status(404).json({
        status: 'error',
        message: 'Custom prompt not found for this post',
      });
      return;
    }

    // Fetch aggregated guesses from Redis (using postId as session)
    const guessesMap = await getAggregatedGuesses(redis, 0, postId);
    const totalPlayers = await getTotalPlayers(redis, 0, postId);

    // Get player's guess
    const playerGuessKey = `${postId}:player:${username}:guess`;
    const playerGuess = await redis.get(playerGuessKey);

    // Calculate total guesses
    const totalGuesses = Object.values(guessesMap).reduce((sum, count) => sum + count, 0);

    // Normalize creator's answer for comparison
    const normalizedCreatorAnswer = normalizeGuess(customPrompt.answer);

    // Group similar guesses together (≥85% similarity)
    const groupedGuesses = groupSimilarGuesses(guessesMap, 85);

    // Convert grouped guesses to array and calculate percentages
    const guessesArray = groupedGuesses.map((group) => {
      const percentage = totalPlayers > 0 ? (group.combinedCount / totalPlayers) * 100 : 0;

      // Check if player's guess matches any variant in this group
      const isPlayerGuess = playerGuess
        ? group.variants.some((v) => normalizeGuess(v.guess) === normalizeGuess(playerGuess))
        : false;

      // Check if creator's answer matches any variant in this group
      const isCreatorAnswer = group.variants.some(
        (v) => normalizeGuess(v.guess) === normalizedCreatorAnswer
      );

      // Create variants array (exclude the primary guess) - only if there are multiple variants
      const variantsList: string[] | undefined =
        group.variants.length > 1 ? group.variants.slice(1).map((v) => v.guess) : undefined;

      return {
        guess: group.primaryGuess,
        count: group.combinedCount,
        percentage: Math.round(percentage * 10) / 10,
        isPlayerGuess,
        isCreatorAnswer,
        rank: 0,
        variants: variantsList,
      };
    });

    // Sort by count descending and take top 10
    guessesArray.sort((a, b) => b.count - a.count);
    const top10 = guessesArray.slice(0, 10);

    // Assign ranks
    top10.forEach((guess, index) => {
      guess.rank = index + 1;
    });

    // Calculate player's score using consensus scoring algorithm
    const playerScore = playerGuess
      ? calculateConsensusTier(playerGuess, top10)
      : {
          pointsEarned: 0,
          matchPercentage: 0,
          tier: 'unique' as const,
        };

    // Check if creator's answer is in top 10
    const creatorAnswerInTop10 = top10.some((g) => g.isCreatorAnswer);

    // If creator's answer is not in top 10, fetch it separately
    let creatorAnswerData: (typeof top10)[0] | undefined = undefined;
    if (!creatorAnswerInTop10) {
      const creatorAnswerEntry = guessesArray.find((g) => g.isCreatorAnswer);
      if (creatorAnswerEntry) {
        creatorAnswerData = {
          ...creatorAnswerEntry,
          rank: guessesArray.findIndex((g) => g.isCreatorAnswer) + 1,
        };
      }
    }

    res.json({
      type: 'consensus-results',
      aggregation: top10,
      playerGuess: playerGuess || null,
      creatorAnswer: customPrompt.answer,
      totalPlayers,
      totalGuesses,
      playerScore,
      creatorAnswerData,
    });
  } catch (error) {
    console.error(
      `[API Error] Prompt Get Results Error for post ${postId}:`,
      error instanceof Error ? error.message : String(error),
      error instanceof Error ? error.stack : ''
    );
    let errorMessage = 'Results temporarily unavailable';
    if (error instanceof Error) {
      errorMessage = `Results temporarily unavailable: ${error.message}`;
    }
    res.status(500).json({ status: 'error', message: errorMessage });
  }
});

router.post<
  { postId: string },
  { type: 'guess-submitted'; success: boolean } | ErrorResponse,
  { guess: string }
>('/api/prompt/submit-guess', async (req, res): Promise<void> => {
  const { postId } = context;

  if (!postId) {
    console.error('API Prompt Submit Guess Error: postId not found in context');
    res.status(400).json({
      status: 'error',
      message: 'postId is required but missing from context',
    });
    return;
  }

  const { guess } = req.body;

  // Validate request body
  if (guess === undefined || guess === null) {
    res.status(400).json({
      status: 'error',
      message: 'guess is required',
    });
    return;
  }

  try {
    // Get username from Reddit API context
    const username = await reddit.getCurrentUsername();

    if (!username) {
      res.status(401).json({
        status: 'error',
        message: 'Unable to get username from Reddit context',
      });
      return;
    }

    // Check if user has already guessed
    const { hasUserGuessed, markUserAsGuessed } = await import('./services/guessTracking');
    const alreadyGuessed = await hasUserGuessed(redis, postId, username);

    if (alreadyGuessed) {
      res.status(400).json({
        status: 'error',
        message: 'You have already guessed on this post',
      });
      return;
    }

    // Normalize the guess
    const normalizedGuess = normalizeGuess(guess);

    // Store guess using existing aggregation service
    // Use postId as the "promptId" for custom prompts
    await storeGuess(redis, 0, normalizedGuess, postId);
    await addPlayerToSet(redis, 0, username, postId);
    await storePlayerGuess(redis, 0, username, normalizedGuess, postId);

    // Mark user as having guessed
    await markUserAsGuessed(redis, postId, username);

    res.json({
      type: 'guess-submitted',
      success: true,
    });
  } catch (error) {
    console.error(
      `[API Error] Prompt Submit Guess Error for post ${postId}:`,
      error instanceof Error ? error.message : String(error),
      error instanceof Error ? error.stack : ''
    );
    let errorMessage = 'Failed to submit guess';
    if (error instanceof Error) {
      errorMessage = `Failed to submit guess: ${error.message}`;
    }
    res.status(500).json({ status: 'error', message: errorMessage });
  }
});

router.post<{ postId: string }, IncrementResponse | { status: string; message: string }, unknown>(
  '/api/increment',
  async (_req, res): Promise<void> => {
    const { postId } = context;
    if (!postId) {
      res.status(400).json({
        status: 'error',
        message: 'postId is required',
      });
      return;
    }

    res.json({
      count: await redis.incrBy('count', 1),
      postId,
      type: 'increment',
    });
  }
);

router.post<{ postId: string }, DecrementResponse | { status: string; message: string }, unknown>(
  '/api/decrement',
  async (_req, res): Promise<void> => {
    const { postId } = context;
    if (!postId) {
      res.status(400).json({
        status: 'error',
        message: 'postId is required',
      });
      return;
    }

    res.json({
      count: await redis.incrBy('count', -1),
      postId,
      type: 'decrement',
    });
  }
);

router.post('/internal/on-app-install', async (_req, res): Promise<void> => {
  try {
    const post = await createPost();

    res.json({
      status: 'success',
      message: `Post created in subreddit ${context.subredditName} with id ${post.id}`,
    });
  } catch (error) {
    console.error(`Error creating post: ${error}`);
    res.status(400).json({
      status: 'error',
      message: 'Failed to create post',
    });
  }
});

router.post('/internal/menu/post-create', async (_req, res): Promise<void> => {
  try {
    const post = await createPost();

    res.json({
      navigateTo: `https://reddit.com/r/${context.subredditName}/comments/${post.id}`,
    });
  } catch (error) {
    console.error(`Error creating post: ${error}`);
    res.status(400).json({
      status: 'error',
      message: 'Failed to create post',
    });
  }
});

router.post<
  unknown,
  { navigateTo: string } | { status: string; message: string },
  { description?: string; answer?: string }
>('/internal/menu/post-create-with-form', async (req, res): Promise<void> => {
  try {
    // For now, use default prompts since Devvit menu items don't support forms
    // In the future, this could be enhanced with a custom form UI
    const description = req.body?.description || 'Two circles connected by a rectangle';
    const answer = req.body?.answer || 'dumbbell';

    console.log('[Post Creation] Creating post with prompt:', { description, answer });

    // Create post with custom prompt
    const post = await createPost({
      description: description.trim(),
      answer: answer.trim(),
    });

    res.json({
      navigateTo: `https://reddit.com/r/${context.subredditName}/comments/${post.id}`,
    });
  } catch (error) {
    console.error(`Error creating post with form: ${error}`);
    res.status(400).json({
      status: 'error',
      message: 'Failed to create post',
    });
  }
});

// Use router middleware
app.use(router);

// Get port from environment variable with fallback
const port = getServerPort();

const server = createServer(app);
server.on('error', (err) => console.error(`server error; ${err.stack}`));
server.listen(port);
