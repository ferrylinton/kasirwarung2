import type { Request, Response, NextFunction } from 'express';
import { verifyToken, type TokenPayload } from '../utils/jwt.ts';
import { isTokenBlacklisted } from '../config/redis.ts';
import { getCollection, ObjectId } from '../config/db.ts';

export interface AuthenticatedRequest extends Request {
  user?: TokenPayload;
  token?: string;
  tenantId?: string;
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

    // If user belongs to a tenant, ensure the tenant is still active
    if (payload.tenantId && payload.role !== 'ADMIN') {
      const tenantsCol = getCollection('tenants');
      const tenant = await tenantsCol.findOne({ _id: new ObjectId(payload.tenantId) });
      if (!tenant || tenant.status === 'inactive') {
        res.status(403).json({
          success: false,
          message: 'Akun toko/tenan Anda sedang dinonaktifkan. Silakan hubungi admin atau ajukan pengaktifan kembali.',
          tenantInactive: true,
        });
        return;
      }
    }

    req.user = payload;
    req.token = token;
    req.tenantId = payload.tenantId;
    next();
  } catch (err: any) {
    res.status(401).json({ success: false, message: 'Token tidak valid atau telah kedaluwarsa' });
  }
}

export async function optionalAuthenticateToken(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    next();
    return;
  }

  try {
    const payload = verifyToken(token);
    if (payload.type === 'access') {
      req.user = payload;
      req.token = token;
      req.tenantId = payload.tenantId;
    }
  } catch {
    // Ignore invalid optional token
  }
  next();
}

export function requireRole(...allowedRoles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Tidak terotentikasi' });
      return;
    }

    const userRole = req.user.role;
    // Normalized comparison for roles
    const matches = allowedRoles.some((role) => {
      if (role === userRole) return true;
      if (role === 'ADMIN' && (userRole === 'admin' || userRole === 'ADMIN')) return true;
      if (role === 'SHOP_OWNER' && (userRole === 'pemilik' || userRole === 'SHOP_OWNER')) return true;
      if (role === 'SHOP_CASHIER' && (userRole === 'kasir' || userRole === 'SHOP_CASHIER')) return true;
      return false;
    });

    if (!matches) {
      res.status(403).json({ success: false, message: 'Anda tidak memiliki hak akses untuk aksi ini' });
      return;
    }
    next();
  };
}

export function requireTenant(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (req.user?.role === 'ADMIN') {
    // Admin can bypass tenant check or specify in query
    next();
    return;
  }
  if (!req.user?.tenantId) {
    res.status(400).json({ success: false, message: 'ID Tenan tidak ditemukan dalam sesi pengguna' });
    return;
  }
  next();
}
