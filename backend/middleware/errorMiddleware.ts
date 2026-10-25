import type { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger.ts';
import type { AuthenticatedRequest } from './authMiddleware.ts';

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const authReq = req as AuthenticatedRequest;
  logger.error(`Unhandled/Route Error: ${err.message || 'Unknown error'}`, {
    path: req.originalUrl,
    method: req.method,
    tenantId: authReq.user?.tenantId || null,
    userId: authReq.user?.userId || null,
    role: authReq.user?.role || null,
    stack: err.stack,
  });

  if (err?.name === 'BSONError' || err?.message?.includes('BSONError') || err?.message?.includes('24 character hex string')) {
    res.status(400).json({
      success: false,
      message: 'Format ID atau parameter data tidak valid',
    });
    return;
  }
  const status = err.status || 500;
  res.status(status).json({
    success: false,
    message: err.message || 'Terjadi kesalahan pada internal server',
  });
}

