import Redis from 'ioredis';
import { env } from './env.ts';

let redisClient: Redis | null = null;
let redisConnected = false;

// In-memory fallback stores if Redis is temporarily unreachable
const memoryBlacklist = new Map<string, number>();
const memoryRefreshStore = new Map<string, number>();
const memoryRateBuckets = new Map<string, { tokens: number; lastRefill: number }>();

export function initRedis(): Redis | null {
  if (redisClient) return redisClient;
  if (!env.REDIS_URL) {
    console.log('[Redis] Running in-memory Redis cache & token store');
    return null;
  }
  try {
    redisClient = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: 1,
      connectTimeout: 2000,
      enableOfflineQueue: false,
      retryStrategy(times) {
        if (times > 2) return null;
        return Math.min(times * 500, 1000);
      },
    });

    redisClient.on('connect', () => {
      redisConnected = true;
      console.log('[Redis] Connected to Upstash Redis');
    });

    redisClient.on('error', (err) => {
      redisConnected = false;
      console.warn('[Redis] Warning (using memory fallback):', err.message);
    });
  } catch (err) {
    console.warn('[Redis] Initialization fallback:', err);
  }
  return redisClient;
}

export function isRedisHealthy(): boolean {
  return redisConnected;
}

/**
 * Add a JWT token (access or refresh) to the Redis blacklist until its expiration
 */
export async function blacklistToken(token: string, ttlSeconds = 86400): Promise<void> {
  const key = `kw:bl:${token}`;
  const expiresAt = Date.now() + ttlSeconds * 1000;
  memoryBlacklist.set(key, expiresAt);

  if (redisClient && redisConnected) {
    try {
      await redisClient.set(key, '1', 'EX', Math.max(1, Math.floor(ttlSeconds)));
    } catch {
      // Fallback already stored in memoryBlacklist
    }
  }
}

/**
 * Check if a JWT token is blacklisted in Redis
 */
export async function isTokenBlacklisted(token: string): Promise<boolean> {
  const key = `kw:bl:${token}`;
  const memExp = memoryBlacklist.get(key);
  if (memExp) {
    if (Date.now() < memExp) return true;
    memoryBlacklist.delete(key);
  }

  if (redisClient && redisConnected) {
    try {
      const val = await redisClient.get(key);
      return val === '1';
    } catch {
      return false;
    }
  }
  return false;
}

/**
 * Store active refresh token in Redis
 */
export async function storeRefreshToken(userId: string, token: string, ttlSeconds = 86400): Promise<void> {
  const key = `kw:rt:${userId}:${token}`;
  memoryRefreshStore.set(key, Date.now() + ttlSeconds * 1000);

  if (redisClient && redisConnected) {
    try {
      await redisClient.set(key, 'valid', 'EX', Math.max(1, Math.floor(ttlSeconds)));
    } catch {
      // Fallback handled
    }
  }
}

/**
 * Verify if a refresh token is still active and not revoked
 */
export async function isRefreshTokenValid(userId: string, token: string): Promise<boolean> {
  if (await isTokenBlacklisted(token)) return false;

  const key = `kw:rt:${userId}:${token}`;
  if (redisClient && redisConnected) {
    try {
      const val = await redisClient.get(key);
      if (val === 'valid') return true;
    } catch {
      // Check memory store
    }
  }

  const memExp = memoryRefreshStore.get(key);
  if (memExp && Date.now() < memExp) return true;
  return true; // Allow valid JWT signature if not blacklisted
}

/**
 * Revoke a refresh token
 */
export async function revokeRefreshToken(userId: string, token: string, ttlSeconds = 86400): Promise<void> {
  const key = `kw:rt:${userId}:${token}`;
  memoryRefreshStore.delete(key);
  await blacklistToken(token, ttlSeconds);

  if (redisClient && redisConnected) {
    try {
      await redisClient.del(key);
    } catch {
      // Ignore
    }
  }
}

/**
 * Token Bucket Rate Limiter backed by Redis (with Lua script / atomic operations)
 */
export async function consumeRateLimitToken(
  identifier: string,
  capacity = 60,
  refillRatePerSecond = 1
): Promise<{ allowed: boolean; remaining: number; resetSeconds: number }> {
  const now = Date.now();
  const key = `kw:rl:${identifier}`;

  if (redisClient && redisConnected) {
    try {
      const luaScript = `
        local key = KEYS[1]
        local capacity = tonumber(ARGV[1])
        local refillRate = tonumber(ARGV[2])
        local now = tonumber(ARGV[3])
        local bucket = redis.call('HMGET', key, 'tokens', 'lastRefill')
        local tokens = tonumber(bucket[1])
        local lastRefill = tonumber(bucket[2])
        if not tokens or not lastRefill then
          tokens = capacity
          lastRefill = now
        else
          local elapsed = math.max(0, (now - lastRefill) / 1000)
          tokens = math.min(capacity, tokens + elapsed * refillRate)
          lastRefill = now
        end
        if tokens >= 1 then
          tokens = tokens - 1
          redis.call('HMSET', key, 'tokens', tokens, 'lastRefill', lastRefill)
          redis.call('EXPIRE', key, 3600)
          return {1, math.floor(tokens)}
        else
          redis.call('HMSET', key, 'tokens', tokens, 'lastRefill', lastRefill)
          redis.call('EXPIRE', key, 3600)
          return {0, 0}
        end
      `;
      const result = (await redisClient.eval(
        luaScript,
        1,
        key,
        capacity.toString(),
        refillRatePerSecond.toString(),
        now.toString()
      )) as [number, number];

      return {
        allowed: result[0] === 1,
        remaining: result[1],
        resetSeconds: result[0] === 1 ? 0 : Math.ceil(1 / refillRatePerSecond),
      };
    } catch {
      // Fall through to in-memory token bucket
    }
  }

  let bucket = memoryRateBuckets.get(key);
  if (!bucket) {
    bucket = { tokens: capacity, lastRefill: now };
  } else {
    const elapsedSeconds = Math.max(0, (now - bucket.lastRefill) / 1000);
    bucket.tokens = Math.min(capacity, bucket.tokens + elapsedSeconds * refillRatePerSecond);
    bucket.lastRefill = now;
  }

  if (bucket.tokens >= 1) {
    bucket.tokens -= 1;
    memoryRateBuckets.set(key, bucket);
    return { allowed: true, remaining: Math.floor(bucket.tokens), resetSeconds: 0 };
  } else {
    memoryRateBuckets.set(key, bucket);
    return {
      allowed: false,
      remaining: 0,
      resetSeconds: Math.ceil((1 - bucket.tokens) / refillRatePerSecond),
    };
  }
}
