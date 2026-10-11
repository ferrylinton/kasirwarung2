import jwt from 'jsonwebtoken';
import { env } from '../config/env.ts';

export interface TokenPayload {
  userId: string;
  email: string;
  name: string;
  role: string;
  type: 'access' | 'refresh';
  exp?: number;
  iat?: number;
}

export function signAccessToken(user: { userId: string; email: string; name: string; role: string }): string {
  return jwt.sign(
    { ...user, type: 'access' },
    env.JWT_SECRET,
    { expiresIn: env.ACCESS_TOKEN_EXPIRES as any }
  );
}

export function signRefreshToken(user: { userId: string; email: string; name: string; role: string }): string {
  return jwt.sign(
    { ...user, type: 'refresh' },
    env.JWT_SECRET,
    { expiresIn: env.REFRESH_TOKEN_EXPIRES as any }
  );
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, env.JWT_SECRET) as TokenPayload;
}

export function getTokenRemainingSeconds(token: string): number {
  try {
    const decoded = jwt.decode(token) as { exp?: number } | null;
    if (!decoded || !decoded.exp) return 900;
    const diff = decoded.exp - Math.floor(Date.now() / 1000);
    return Math.max(1, diff);
  } catch {
    return 900;
  }
}
