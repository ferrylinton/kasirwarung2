import { Request, Response, NextFunction } from 'express';
import { consumeRateLimitToken } from '../config/redis.ts';

/**
 * Redis-backed Token Bucket rate limiter
 */
export function rateLimiter(capacity = 60, refillRatePerSecond = 2) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const identifier =
      (req.headers['x-forwarded-for'] as string) ||
      req.socket.remoteAddress ||
      'anonymous-client';

    const pathKey = req.baseUrl || req.path;
    const rateKey = `${identifier}:${pathKey}`;

    const { allowed, remaining, resetSeconds } = await consumeRateLimitToken(
      rateKey,
      capacity,
      refillRatePerSecond
    );

    res.setHeader('X-RateLimit-Limit', capacity.toString());
    res.setHeader('X-RateLimit-Remaining', remaining.toString());

    if (!allowed) {
      res.setHeader('Retry-After', resetSeconds.toString());
      res.status(429).json({
        success: false,
        message: `Terlalu banyak permintaan (Rate limit terlampaui). Coba lagi dalam ${resetSeconds} detik.`,
        retryAfter: resetSeconds,
      });
      return;
    }

    next();
  };
}
