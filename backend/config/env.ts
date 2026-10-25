import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

export const VALID_LOG_LEVELS = ['error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly'] as const;
export type LogLevel = (typeof VALID_LOG_LEVELS)[number];

function sanitizeLogLevel(val: string | undefined, defaultLevel: LogLevel): LogLevel {
  if (!val) return defaultLevel;
  const cleaned = val.trim().toLowerCase();
  if ((VALID_LOG_LEVELS as readonly string[]).includes(cleaned)) {
    return cleaned as LogLevel;
  }
  return defaultLevel;
}

const defaultLevel: LogLevel = process.env.NODE_ENV === 'production' ? 'warn' : 'info';
const configuredLogLevel = sanitizeLogLevel(process.env.LOG_LEVEL || process.env.VITE_LOG_LEVEL, defaultLevel);
const consoleLogLevel = sanitizeLogLevel(process.env.LOG_LEVEL_CONSOLE, configuredLogLevel);
const fileLogLevel = sanitizeLogLevel(process.env.LOG_LEVEL_FILE, configuredLogLevel);

export const env = {
  PORT: parseInt(process.env.APP_PORT || '3000', 10),
  APP_URL: process.env.APP_URL || 'http://localhost:3000',
  JWT_SECRET: process.env.JWT_SECRET || 'kasirwarung-jwt-supersecret-2026',
  ACCESS_TOKEN_EXPIRES: process.env.ACCESS_TOKEN_EXPIRES || '15m',
  REFRESH_TOKEN_EXPIRES: process.env.REFRESH_TOKEN_EXPIRES || '1d',
  IDLE_TIMEOUT_MINUTES: parseInt(process.env.IDLE_TIMEOUT_MINUTES || '5', 10),
  MONGODB_URI: process.env.MONGODB_URI || '',
  REDIS_URL: process.env.REDIS_URL || '',
  SMTP_HOST: process.env.SMTP_HOST || '',
  SMTP_PORT: parseInt(process.env.SMTP_PORT || '587', 10),
  SMTP_USER: process.env.SMTP_USER || '',
  SMTP_PASS: process.env.SMTP_PASS || '',
  SMTP_FROM: process.env.SMTP_FROM || 'KasirWarung <noreply@kasirwarung.local>',
  LOG_LEVEL: configuredLogLevel,
  LOG_LEVEL_CONSOLE: consoleLogLevel,
  LOG_LEVEL_FILE: fileLogLevel,
};

