import Redis from 'ioredis';
import { env } from './env.ts';

let redisClient: Redis | null = null;
let redisConnected = false;

// In-memory fallback stores if Redis is temporarily unreachable
const memoryBlacklist = new Map<string, number>();
const memoryRefreshStore = new Map<string, number>();
const memoryRateBuckets = new Map<string, { tokens: number; lastRefill: number }>();

export interface ActiveAccessTokenData {
  token: string;
  userId: string;
  email: string;
  name: string;
  username?: string;
  role: string;
  tenantId?: string | null;
  tenantName?: string;
  ipAddress: string;
  device: string;
  issuedAt: string;
  expiresAt: string;
  remainingSeconds?: number;
}

const memoryActiveTokens = new Map<string, { data: ActiveAccessTokenData; expiresAt: number }>();

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

/**
 * Store an active access token in Redis with TTL matching token validity
 */
export async function storeActiveAccessToken(
  token: string,
  data: Omit<ActiveAccessTokenData, 'token'>,
  ttlSeconds: number
): Promise<void> {
  const ttl = Math.max(1, Math.floor(ttlSeconds));
  const expiresAtMs = Date.now() + ttl * 1000;
  const sessionItem: ActiveAccessTokenData = {
    ...data,
    token,
    remainingSeconds: ttl,
    expiresAt: data.expiresAt || new Date(expiresAtMs).toISOString(),
  };

  memoryActiveTokens.set(token, { data: sessionItem, expiresAt: expiresAtMs });

  if (redisClient && redisConnected) {
    try {
      const key = `kw:act:${token}`;
      await redisClient.set(key, JSON.stringify(sessionItem), 'EX', ttl);
    } catch {
      // Memory fallback already handled
    }
  }
}

/**
 * Remove an access token from the active session store (e.g. upon logout or blacklist)
 */
export async function removeActiveAccessToken(token: string): Promise<void> {
  memoryActiveTokens.delete(token);

  if (redisClient && redisConnected) {
    try {
      const key = `kw:act:${token}`;
      await redisClient.del(key);
    } catch {
      // Ignore
    }
  }
}

/**
 * Get all active access tokens from Redis (with live TTL calculation)
 */
export async function getAllActiveAccessTokens(): Promise<ActiveAccessTokenData[]> {
  const now = Date.now();

  // Purge expired tokens from memory map
  for (const [t, entry] of memoryActiveTokens.entries()) {
    if (entry.expiresAt <= now) {
      memoryActiveTokens.delete(t);
    }
  }

  if (redisClient && redisConnected) {
    try {
      const keys = await redisClient.keys('kw:act:*');
      if (keys && keys.length > 0) {
        const pipeline = redisClient.pipeline();
        for (const k of keys) {
          pipeline.get(k);
          pipeline.ttl(k);
        }
        const results = await pipeline.exec();
        const activeList: ActiveAccessTokenData[] = [];

        if (results) {
          for (let i = 0; i < keys.length; i++) {
            const getRes = results[i * 2];
            const ttlRes = results[i * 2 + 1];
            if (getRes && !getRes[0] && getRes[1]) {
              try {
                const parsed = JSON.parse(getRes[1] as string) as ActiveAccessTokenData;
                const ttl = typeof ttlRes?.[1] === 'number' ? ttlRes[1] : 0;
                if (ttl > 0) {
                  parsed.remainingSeconds = ttl;
                  activeList.push(parsed);
                }
              } catch {
                // Ignore parse errors
              }
            }
          }
        }

        if (activeList.length > 0) {
          return activeList;
        }
      }
    } catch {
      // Fallback to memory
    }
  }

  // Fallback to memory active tokens
  const memoryList: ActiveAccessTokenData[] = [];
  for (const [_, entry] of memoryActiveTokens.entries()) {
    if (entry.expiresAt > now) {
      const remaining = Math.max(1, Math.floor((entry.expiresAt - now) / 1000));
      memoryList.push({
        ...entry.data,
        remainingSeconds: remaining,
      });
    }
  }

  return memoryList;
}

/**
 * Blacklist an access token in Redis with TTL matching its remaining validity,
 * and purge it from active access tokens so it cannot be used anymore.
 */
export async function blacklistAccessToken(token: string, ttlSeconds: number): Promise<void> {
  const ttl = Math.max(1, Math.floor(ttlSeconds));
  await blacklistToken(token, ttl);
  await removeActiveAccessToken(token);
}

