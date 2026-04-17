import Redis from 'ioredis';

let redis;

/**
 * Returns a singleton Redis client. The connection is lazy — it is not
 * established until the first call that actually uses the client.
 */
export function getRedis() {
    if (!redis) {
        if (!process.env.REDIS_URL) {
            throw new Error('REDIS_URL environment variable is not set.');
        }

        redis = new Redis(process.env.REDIS_URL, {
            // Retry strategy: try to reconnect up to 3 times with exponential backoff
            retryStrategy(times) {
                if (times > 10) return null; // Stop retrying after 10 attempts
                const delay = Math.min(times * 100, 3000);
                return delay;
            },
            // Don't block the app if Redis is down — let individual calls fail
            lazyConnect: true,
        });

        redis.on('error', (err) => {
            console.error('Redis error:', err.message);
        });
    }
    return redis;
}
