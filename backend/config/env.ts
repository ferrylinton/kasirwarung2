import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

export const env = {
  PORT: parseInt(process.env.PORT || '3000', 10),
  APP_URL: process.env.APP_URL || 'http://localhost:3000',
  JWT_SECRET: process.env.JWT_SECRET || 'kasirwarung-jwt-supersecret-2026',
  ACCESS_TOKEN_EXPIRES: process.env.ACCESS_TOKEN_EXPIRES || '15m',
  REFRESH_TOKEN_EXPIRES: process.env.REFRESH_TOKEN_EXPIRES || '1d',
  IDLE_TIMEOUT_MINUTES: parseInt(process.env.IDLE_TIMEOUT_MINUTES || '5', 10),
  MONGODB_URI:
    process.env.MONGODB_URI ||
    'mongodb+srv://ferrylinton:ferry27071983@myatlasdb.7wiaa0e.mongodb.net/kasirwarungdb?appName=MyAtlasDb',
  REDIS_URL:
    process.env.REDIS_URL ||
    'rediss://default:gQAAAAAAApl_AAIgcDExYTAzY2Q0YjM0NjI0YWVhODgxODY5OTJhN2QyYWZlNA@funny-swift-170367.upstash.io:6379',
  SMTP_HOST: process.env.SMTP_HOST || 'mail.marmeam.com',
  SMTP_PORT: parseInt(process.env.SMTP_PORT || '465', 10),
  SMTP_USER: process.env.SMTP_USER || 'noreplay@marmeam.com',
  SMTP_PASS: process.env.SMTP_PASS || 'noreplay123456',
  SMTP_FROM: process.env.SMTP_FROM || 'KasirWarung <noreplay@marmeam.com>',
};
