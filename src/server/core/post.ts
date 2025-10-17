// src/server/core/post.ts
import { reddit, redis, context } from '@devvit/web/server';

export async function createPost(options?: { description?: string; answer?: string }) {
  try {
    // Use provided options or defaults
    const description =
      options?.description ||
      'A big rectangle with a right angle triangle on top with its longer side as base';
    const answer = options?.answer || 'house';

    console.log('[CreatePost] Creating post with:', { description, answer });

    // Create the Reddit post - THIS IS THE KEY PART
    // The post must be created as a "custom post" type to display the web view
    const post = await reddit.submitPost({
      title: `🎨 Guess the Shape: ${description.substring(0, 60)}${description.length > 60 ? '...' : ''}`,
      subredditName: context.subredditName || '',
      // This tells Reddit to create a custom post that will display our app
      kind: 'self',
      richTextJson: JSON.stringify({
        document: [
          {
            e: 'text',
            t: 'Click the button below to play!',
          },
        ],
      }),
    });

    console.log('[CreatePost] Post created with ID:', post.id);

    // Store the prompt data in Redis
    if (post.id) {
      try {
        await redis.set(`prompt:${post.id}:description`, description);
        await redis.set(`prompt:${post.id}:answer`, answer);

        const username = await reddit.getCurrentUsername();
        await redis.set(`prompt:${post.id}:creator`, username || 'anonymous');

        console.log('[CreatePost] Stored prompt data for post:', post.id);
      } catch (error) {
        console.error('[CreatePost] Failed to store prompt in Redis:', error);
      }
    }

    return post;
  } catch (error) {
    console.error('[CreatePost] Error creating post:', error);
    throw error;
  }
}
