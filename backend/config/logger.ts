import fs from 'fs';
import path from 'path';
import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import type { Request, Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from '../middleware/authMiddleware.ts';
import { env, VALID_LOG_LEVELS, type LogLevel } from './env.ts';

// Ensure logs directory exists
export const logDir = path.resolve(process.cwd(), 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const isProduction = process.env.NODE_ENV === 'production';
const logLevel = env.LOG_LEVEL;
const fileLogLevel = env.LOG_LEVEL_FILE;
const consoleLogLevel = env.LOG_LEVEL_CONSOLE;

// JSON formatter for file transport ensuring consistent structured fields
const jsonLogFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DDTHH:mm:ss.SSSZ' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Formatter for console transport in development
const consoleLogFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(({ timestamp, level, message, tenantId, tenantName, role, method, url, status, durationMs, stack, ...meta }) => {
    const tenantBadge = tenantName ? `[${tenantName}]` : tenantId ? `[Tenant:${String(tenantId).slice(-6)}]` : '';
    const httpInfo = method && url ? ` [${method} ${url} ${status || ''} ${durationMs ? `${durationMs}ms` : ''}]` : '';
    const metaStr = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
    const errStack = stack ? `\n${stack}` : '';
    return `${timestamp} ${level} ${tenantBadge}${httpInfo} ${message}${metaStr}${errStack}`;
  })
);

// Async Daily Rotate File Transport (Max 1 month retention, Max 10MB per file)
export const dailyRotateTransport = new DailyRotateFile({
  dirname: logDir,
  filename: 'application-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '10m', // max 10 mb
  maxFiles: '30d', // max 1 month
  level: fileLogLevel,
  format: jsonLogFormat,
  handleExceptions: true,
  handleRejections: true,
});

// Console transport respecting env configuration
export const consoleTransport = new winston.transports.Console({
  level: consoleLogLevel,
  format: isProduction ? jsonLogFormat : consoleLogFormat,
  handleExceptions: true,
  handleRejections: true,
});

// Configure transports
const transports: winston.transport[] = [dailyRotateTransport, consoleTransport];

// Create winston logger instance
export const logger = winston.createLogger({
  level: logLevel,
  format: jsonLogFormat,
  defaultMeta: { service: 'kasir-warung' },
  transports,
  exitOnError: false,
});

/**
 * Dynamically change the log level at runtime across logger and all transports
 */
export function setLogLevel(newLevel: string): boolean {
  const cleaned = newLevel.trim().toLowerCase();
  if ((VALID_LOG_LEVELS as readonly string[]).includes(cleaned)) {
    logger.level = cleaned;
    dailyRotateTransport.level = cleaned;
    consoleTransport.level = cleaned;
    return true;
  }
  return false;
}

/**
 * Returns current effective log level
 */
export function getCurrentLogLevel(): string {
  return logger.level;
}


/**
 * Express middleware to automatically log HTTP requests and responses
 */
export function httpLogger(req: Request, res: Response, next: NextFunction): void {
  const startTime = Date.now();
  const authReq = req as AuthenticatedRequest;

  // Listen for the response finish event to record status and latency
  res.on('finish', () => {
    const durationMs = Date.now() - startTime;
    const statusCode = res.statusCode;

    const url = req.originalUrl || req.url;

    // Skip verbose health checks, static asset polling, and Vite internal dev/source modules unless error
    if (
      (url === '/api/health' && statusCode < 400) ||
      url.startsWith('/@') ||
      url.startsWith('/node_modules') ||
      url.startsWith('/frontend/src') ||
      url.startsWith('/src') ||
      /\.(tsx|ts|jsx|js|mjs|css|map|svg|png|jpg|jpeg|gif|ico|woff|woff2|ttf|eot)(\?.*)?$/.test(url)
    ) {
      if (statusCode < 400) {
        return;
      }
    }

    const tenantId = authReq.user?.tenantId || (req.headers['x-tenant-id'] as string) || null;
    const userId = authReq.user?.userId || null;
    const role = authReq.user?.role || null;
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';

    const logData = {
      message: `${req.method} ${req.originalUrl} -> ${statusCode} (${durationMs}ms)`,
      method: req.method,
      url: req.originalUrl,
      status: statusCode,
      durationMs,
      tenantId,
      userId,
      role,
      ip: ip.replace('::ffff:', ''),
      userAgent: req.get('user-agent'),
    };

    if (statusCode >= 500) {
      logger.error(`Server Error: ${req.method} ${req.originalUrl}`, logData);
    } else if (statusCode >= 400) {
      logger.warn(`Client Request Warning: ${req.method} ${req.originalUrl}`, logData);
    } else {
      logger.info(`HTTP Request: ${req.method} ${req.originalUrl}`, logData);
    }
  });

  next();
}
