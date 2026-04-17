import { getRedis } from '@/services/redisService';

const WINDOW_SECONDS = 60;
const MAX_REQUESTS_PER_WINDOW = 50;
const BAN_DURATION_SECONDS = 3600; // 1 hour

/**
 * Checks whether an IP is allowed to send a webhook to a specific endpoint.
 *
 * Rate limiting is scoped per IP per endpoint — hammering one endpoint does not
 * affect the same IP's access to any other endpoint. Ban state is stored in Redis
 * with TTL-based expiry so bans survive API restarts and self-clean without manual
 * intervention.
 *
 * Algorithm:
 *  1. If a ban key exists → blocked immediately, no counter increment.
 *  2. Increment the per-minute counter. On first write, set a 60-second TTL.
 *  3. If the counter exceeds the threshold → set a 1-hour ban key and block.
 *  4. Otherwise → allow.
 *
 * @param {string} ip - The source IP address of the incoming request
 * @param {string} endpointId - MongoDB ObjectId string of the target endpoint
 * @returns {Promise<{ allowed: boolean }>}
 */
export async function checkRateLimit(ip, endpointId) {
    const redis = getRedis();
    const banKey = `ratelimit:ban:${ip}:${endpointId}`;
    const countKey = `ratelimit:count:${ip}:${endpointId}`;

    // Fast-path: if the IP is already banned, reject without touching the counter
    const isBanned = await redis.exists(banKey);
    if (isBanned) {
        return { allowed: false };
    }

    // Increment the request counter for this window
    const count = await redis.incr(countKey);

    // Set the TTL only on the first request of the window so subsequent increments
    // don't reset the clock and allow unlimited requests by repeatedly resetting
    if (count === 1) {
        await redis.expire(countKey, WINDOW_SECONDS);
    }

    if (count > MAX_REQUESTS_PER_WINDOW) {
        // Promote to a ban — TTL means no permanent blocks, no manual cleanup needed
        await redis.set(banKey, '1', 'EX', BAN_DURATION_SECONDS);
        return { allowed: false };
    }

    return { allowed: true };
}
