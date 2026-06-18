import Redis from 'ioredis';
import { env } from './env';
import { logger } from './logger';

// Redis singleton — used for session storage, permission caching, rate limiting, and Bull queues

const globalForRedis = globalThis as unknown as { redis: Redis | undefined };

function createRedisClient(): Redis {
  const client = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
    lazyConnect: true,
  });

  client.on('connect', () => {
    logger.info('Redis connected');
  });

  client.on('error', (err) => {
    logger.error('Redis error:', err);
  });

  client.on('close', () => {
    logger.warn('Redis connection closed');
  });

  return client;
}

export const redis = globalForRedis.redis ?? createRedisClient();

if (env.NODE_ENV !== 'production') {
  globalForRedis.redis = redis;
}

// Connect Redis (call on app startup)
export async function connectRedis(): Promise<void> {
  try {
    await redis.connect();
  } catch (err) {
    // ioredis may already be connected via auto-connect
    if ((err as Error).message?.includes('already connected')) {
      return;
    }
    throw err;
  }
}

export default redis;
