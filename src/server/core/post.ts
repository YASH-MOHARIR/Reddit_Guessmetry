import { context, reddit, redis } from '@devvit/web/server';
import { storeCustomPrompt } from '../services/promptStorage';

export type CreatePostOptions = {
  description?: string;
  answer?: string;
};

export const createPost = async (options?: CreatePostOptions) => {
  const { subredditName } = context;
  if (!subredditName) {
    throw new Error('subredditName is required');
  }

  // Get username for creator tracking
  const username = await reddit.getCurrentUsername();
  const createdBy = username || 'anonymous';

  // Determine title and splash based on whether custom prompt is provided
  const title = options?.description
    ? `Geometric Pictionary: ${options.description.substring(0, 50)}${options.description.length > 50 ? '...' : ''}`
    : 'Geometric Pictionary Challenge';

  const splashDescription = options?.description
    ? 'Can you guess what this geometric description represents?'
    : 'An exciting geometric guessing game';

  // Create the post
  const post = await reddit.submitCustomPost({
    splash: {
      appDisplayName: 'Geometric Pictionary',
      backgroundUri: 'default-splash.png',
      buttonLabel: 'Play Now',
      description: splashDescription,
      heading: 'Geometric Pictionary',
      appIconUri: 'default-icon.png',
    },
    postData: {
      hasCustomPrompt: !!options?.description,
    },
    subredditName: subredditName,
    title: title,
  });

  // If custom prompt provided, store it in Redis
  if (options?.description && options?.answer && post.id) {
    try {
      await storeCustomPrompt(
        redis,
        post.id,
        options.description,
        options.answer,
        createdBy
      );
      console.log(`[Post Creation] Stored custom prompt for post ${post.id}`);
    } catch (error) {
      console.error(
        `[Post Creation Error] Failed to store prompt for post ${post.id}:`,
        error instanceof Error ? error.message : String(error)
      );
      // Don't throw - post is already created, just log the error
    }
  }

  return post;
};
