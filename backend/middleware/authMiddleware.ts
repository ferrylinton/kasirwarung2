import { Request, Response, NextFunction } from 'express';
import { verifyToken, TokenPayload } from '../utils/jwt.ts';
import { isTokenBlacklisted } from '../config/redis.ts';

export interface AuthenticatedRequest extends Request {
  user?: TokenPayload;
  token?: string;
}

export async function authenticateToken(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    res.status(401).json({ success: false, message: 'Akses ditolak: Token autentikasi tidak ditemukan' });
    return;
  }

  // Redis Token Blacklist check
  const blacklisted = await isTokenBlacklisted(token);
  if (blacklisted) {
    res.status(401).json({ success: false, message: 'Sesi kedaluwarsa atau token telah diblacklist. Silakan masuk kembali.' });
    return;
  }

  try {
    const payload = verifyToken(token);
    if (payload.type !== 'access') {
      res.status(401).json({ success: false, message: 'Tipe token tidak valid untuk otorisasi' });
      return;
    }
    req.user = payload;
    req.token = token;
    next();
  } catch (err: any) {
    res.status(401).json({ success: false, message: 'Token tidak valid atau telah kedaluwarsa' });
  }
}

export function requireRole(...allowedRoles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      res.status(403).json({ success: false, message: 'Anda tidak memiliki hak akses untuk aksi ini' });
      return;
    }
    next();
  };
}
