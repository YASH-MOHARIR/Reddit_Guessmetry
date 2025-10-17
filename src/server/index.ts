// src/server/index.ts
import express from 'express';
import { redis, reddit, createServer, context, getServerPort } from '@devvit/web/server';

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ====================
// MAIN API ENDPOINTS
// ====================

// Initialize endpoint
app.get('/api/init', async (_req, res) => {
  try {
    const { postId } = context;
    console.log('[Init] PostId:', postId);
    
    if (!postId) {
      res.status(400).json({
        status: 'error',
        message: 'postId is required but missing from context'
      });
      return;
    }

    // Get username
    let username = 'anonymous';
    try {
      const redditUsername = await reddit.getCurrentUsername();
      username = redditUsername || 'anonymous';
      console.log('[Init] Username:', username);
    } catch (err) {
      console.error('[Init] Error getting username:', err);
    }

    // Check for custom prompt
    let customPrompt = null;
    try {
      // Check if prompt exists
      const description = await redis.get(`prompt:${postId}:description`);
      const answer = await redis.get(`prompt:${postId}:answer`);
      
      if (description && answer) {
        // Check if user has already guessed
        const hasGuessedFlag = await redis.get(`${postId}:player:${username}:guessed`);
        const hasGuessed = hasGuessedFlag === '1';
        
        customPrompt = {
          description,
          hasGuessed
        };
        console.log('[Init] Custom prompt found, hasGuessed:', hasGuessed);
      }
    } catch (error) {
      console.error('[Init] Error fetching custom prompt:', error);
    }

    res.json({
      type: 'init',
      postId,
      username,
      customPrompt
    });
    
  } catch (error) {
    console.error('[Init] Error:', error);
    res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Submit guess endpoint
app.post('/api/prompt/submit-guess', async (req, res) => {
  try {
    const { postId } = context;
    const { guess } = req.body;
    
    console.log('[Submit] PostId:', postId, 'Guess:', guess);

    if (!postId) {
      res.status(400).json({
        status: 'error',
        message: 'postId is required'
      });
      return;
    }

    if (!guess || guess.trim() === '') {
      res.status(400).json({
        status: 'error',
        message: 'Guess cannot be empty'
      });
      return;
    }

    // Get username
    let username = 'anonymous';
    try {
      const redditUsername = await reddit.getCurrentUsername();
      username = redditUsername || 'anonymous';
    } catch (err) {
      console.error('[Submit] Error getting username:', err);
    }

    // Check if user has already guessed
    const hasGuessedFlag = await redis.get(`${postId}:player:${username}:guessed`);
    if (hasGuessedFlag === '1') {
      res.status(400).json({
        status: 'error',
        message: 'You have already guessed on this post'
      });
      return;
    }

    // Normalize guess
    const normalizedGuess = guess.toLowerCase().trim();

    // Store guess in multiple Redis keys
    try {
      // 1. Store in guesses hash (guess -> count)
      const guessesKey = `${postId}:guesses`;
      const currentCount = await redis.hGet(guessesKey, normalizedGuess);
      const newCount = (parseInt(currentCount || '0', 10) + 1).toString();
      await redis.hSet(guessesKey, { [normalizedGuess]: newCount });

      // 2. Add player to unique players set
      const playersKey = `${postId}:players`;
      await redis.zAdd(playersKey, { member: username, score: Date.now() });

      // 3. Store player's specific guess
      const playerGuessKey = `${postId}:player:${username}:guess`;
      await redis.set(playerGuessKey, normalizedGuess);

      // 4. Mark user as having guessed
      const playerGuessedKey = `${postId}:player:${username}:guessed`;
      await redis.set(playerGuessedKey, '1');

      console.log('[Submit] Successfully stored guess for', username);
      
      res.json({
        type: 'guess-submitted',
        success: true
      });
      
    } catch (error) {
      console.error('[Submit] Redis error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to store guess'
      });
    }
    
  } catch (error) {
    console.error('[Submit] Error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to submit guess'
    });
  }
});

// Get results endpoint
app.post('/api/prompt/get-results', async (_req, res) => {
  try {
    const { postId } = context;
    console.log('[Results] PostId:', postId);

    if (!postId) {
      res.status(400).json({
        status: 'error',
        message: 'postId is required'
      });
      return;
    }

    // Get username
    let username = 'anonymous';
    try {
      const redditUsername = await reddit.getCurrentUsername();
      username = redditUsername || 'anonymous';
    } catch (err) {
      console.error('[Results] Error getting username:', err);
    }

    // Get creator's answer
    const creatorAnswer = await redis.get(`prompt:${postId}:answer`) || 'unknown';

    // Get all guesses
    const guessesKey = `${postId}:guesses`;
    const guessesMap = await redis.hGetAll(guessesKey) || {};

    // Get total players
    const playersKey = `${postId}:players`;
    const totalPlayers = await redis.zCard(playersKey) || 0;

    // Get player's guess
    const playerGuessKey = `${postId}:player:${username}:guess`;
    const playerGuess = await redis.get(playerGuessKey);

    // Calculate total guesses
    const totalGuesses = Object.values(guessesMap).reduce((sum, count) => 
      sum + parseInt(count, 10), 0
    );

    // Convert to array and calculate percentages
    const guessesArray = Object.entries(guessesMap).map(([guess, count]) => {
      const countNum = parseInt(count, 10);
      const percentage = totalPlayers > 0 
        ? Math.round((countNum / totalPlayers) * 1000) / 10 
        : 0;
      
      return {
        guess,
        count: countNum,
        percentage,
        isPlayerGuess: playerGuess === guess,
        isCreatorAnswer: creatorAnswer.toLowerCase().trim() === guess,
        rank: 0
      };
    });

    // Sort by count and take top 10
    guessesArray.sort((a, b) => b.count - a.count);
    const top10 = guessesArray.slice(0, 10);
    
    // Assign ranks
    top10.forEach((guess, index) => {
      guess.rank = index + 1;
    });

    // Calculate player score
    let playerScore = {
      pointsEarned: 0,
      matchPercentage: 0,
      tier: 'unique' as const
    };

    if (playerGuess) {
      const playerGuessData = guessesArray.find(g => g.guess === playerGuess);
      if (playerGuessData) {
        playerScore.matchPercentage = playerGuessData.percentage;
        
        if (playerGuessData.percentage >= 50) {
          playerScore.pointsEarned = 100;
          playerScore.tier = 'majority' as const;
        } else if (playerGuessData.percentage >= 20) {
          playerScore.pointsEarned = 50;
          playerScore.tier = 'common' as const;
        } else if (playerGuessData.percentage >= 5) {
          playerScore.pointsEarned = 25;
          playerScore.tier = 'uncommon' as const;
        } else if (playerGuessData.percentage >= 1) {
          playerScore.pointsEarned = 10;
          playerScore.tier = 'rare' as const;
        }
      }
    }

    console.log('[Results] Returning', top10.length, 'results');

    res.json({
      type: 'consensus-results',
      aggregation: top10,
      playerGuess,
      creatorAnswer,
      totalPlayers,
      totalGuesses,
      playerScore
    });
    
  } catch (error) {
    console.error('[Results] Error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch results'
    });
  }
});

// ====================
// POST CREATION - FIXED VERSION
// ====================

// Import the post creation function
import { createPost } from './core/post';

// Menu action endpoint
app.post('/internal/menu/post-create-with-form', async (_req, res) => {
  try {
    // Create a post with default prompt for testing
    await createPost({
      description: "A big rectangle with a right angle triangle on top with its longer side as base",
      answer: "house"
    });
    
    res.json({
      status: 'success',
      message: 'Post created successf
  } });
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create post'
    });
  }
});

// App install trigger
app.post('/internal/on-app-install', async (_req, res) => {
  try {
    await createPost();
    res.json({
      status: 'success',
      message: 'Post created'
    });
  } catch (error) {
    console.error('Error on app install:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create initial post'
    });
  }
});

// ====================
// START SERVER
// ====================

const port = getServerPort();
const server = createServer(app);

server.on('error', (err) => {
  console.error('Server error:', err);
});

server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
