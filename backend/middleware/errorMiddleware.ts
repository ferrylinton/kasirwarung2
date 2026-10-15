import type { Request, Response, NextFunction } from 'express';

export function errorHandler(
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error('[Error]', err);
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
