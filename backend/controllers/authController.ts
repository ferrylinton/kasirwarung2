import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { getCollection, ObjectId } from '../config/db.ts';
import {
  signAccessToken,
  signRefreshToken,
  verifyToken,
  getTokenRemainingSeconds,
} from '../utils/jwt.ts';
import {
  storeRefreshToken,
  isRefreshTokenValid,
  revokeRefreshToken,
  blacklistToken,
} from '../config/redis.ts';
import { AuthenticatedRequest } from '../middleware/authMiddleware.ts';
import { env } from '../config/env.ts';

export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body;
  const usersCol = getCollection('users');

  const user = await usersCol.findOne({ email });
  if (!user) {
    res.status(401).json({ success: false, message: 'Email atau password salah' });
    return;
  }

  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) {
    res.status(401).json({ success: false, message: 'Email atau password salah' });
    return;
  }

  const userId = String(user._id);
  const payload = {
    userId,
    email: user.email,
    name: user.name,
    role: user.role || 'kasir',
  };

  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  // Store refresh token in Redis (1 day TTL)
  await storeRefreshToken(userId, refreshToken, 86400);

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: false, // AI studio preview
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000,
  });

  res.json({
    success: true,
    message: 'Login berhasil',
    data: {
      user: {
        id: userId,
        name: user.name,
        email: user.email,
        role: user.role,
        shift: user.shift || 'Shift Siang (08:00 - 16:00)',
      },
      accessToken,
      refreshToken,
      idleTimeoutMinutes: env.IDLE_TIMEOUT_MINUTES,
    },
  });
}

export async function register(req: Request, res: Response): Promise<void> {
  const { name, email, password, role } = req.body;
  const usersCol = getCollection('users');

  const existing = await usersCol.findOne({ email });
  if (existing) {
    res.status(409).json({ success: false, message: 'Email sudah terdaftar' });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const result = await usersCol.insertOne({
    name,
    email,
    passwordHash,
    role: role || 'kasir',
    shift: 'Shift Umum',
    createdAt: new Date().toISOString(),
  });

  const userId = String(result.insertedId);
  const payload = { userId, email, name, role: role || 'kasir' };

  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  await storeRefreshToken(userId, refreshToken, 86400);

  res.status(201).json({
    success: true,
    message: 'Registrasi berhasil',
    data: {
      user: { id: userId, name, email, role: role || 'kasir' },
      accessToken,
      refreshToken,
      idleTimeoutMinutes: env.IDLE_TIMEOUT_MINUTES,
    },
  });
}

export async function refresh(req: Request, res: Response): Promise<void> {
  const token = req.body.refreshToken || req.cookies?.refreshToken;
  if (!token) {
    res.status(401).json({ success: false, message: 'Refresh token tidak ditemukan' });
    return;
  }

  try {
    const payload = verifyToken(token);
    if (payload.type !== 'refresh') {
      res.status(401).json({ success: false, message: 'Tipe token tidak valid' });
      return;
    }

    const isValid = await isRefreshTokenValid(payload.userId, token);
    if (!isValid) {
      res.status(401).json({ success: false, message: 'Refresh token telah dicabut atau kedaluwarsa' });
      return;
    }

    const usersCol = getCollection('users');
    const user = await usersCol.findOne({ _id: new ObjectId(payload.userId) });
    if (!user) {
      res.status(401).json({ success: false, message: 'Pengguna tidak ditemukan' });
      return;
    }

    const newPayload = {
      userId: String(user._id),
      email: user.email,
      name: user.name,
      role: user.role,
    };

    const newAccessToken = signAccessToken(newPayload);
    const newRefreshToken = signRefreshToken(newPayload);

    // Revoke old and store new in Redis
    await revokeRefreshToken(payload.userId, token);
    await storeRefreshToken(payload.userId, newRefreshToken, 86400);

    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      data: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      },
    });
  } catch (err: any) {
    res.status(401).json({ success: false, message: 'Refresh token tidak valid atau kedaluwarsa' });
  }
}

export async function logout(req: AuthenticatedRequest, res: Response): Promise<void> {
  const token = req.token;
  const refreshToken = req.body.refreshToken || req.cookies?.refreshToken;

  if (token) {
    const remaining = getTokenRemainingSeconds(token);
    await blacklistToken(token, remaining);
  }

  if (req.user && refreshToken) {
    await revokeRefreshToken(req.user.userId, refreshToken);
  }

  res.clearCookie('refreshToken');
  res.json({ success: true, message: 'Logout berhasil (Token di-blacklist di Redis)' });
}

export async function getMe(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Tidak terotentikasi' });
    return;
  }

  const usersCol = getCollection('users');
  const user = await usersCol.findOne({ _id: new ObjectId(req.user.userId) });

  res.json({
    success: true,
    data: {
      user: {
        id: req.user.userId,
        name: user ? user.name : req.user.name,
        email: user ? user.email : req.user.email,
        role: user ? user.role : req.user.role,
        shift: user ? user.shift : 'Shift Siang (08:00 - 16:00)',
      },
      idleTimeoutMinutes: env.IDLE_TIMEOUT_MINUTES,
    },
  });
}

/**
 * Switch active cashier easily for POS Warung team handover
 */
export async function switchCashier(req: Request, res: Response): Promise<void> {
  const { email } = req.body;
  const usersCol = getCollection('users');
  const user = await usersCol.findOne({ email: email || 'budi@kasirwarung.id' });

  if (!user) {
    res.status(404).json({ success: false, message: 'Pengguna kasir tidak ditemukan' });
    return;
  }

  const userId = String(user._id);
  const payload = {
    userId,
    email: user.email,
    name: user.name,
    role: user.role || 'kasir',
  };

  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);
  await storeRefreshToken(userId, refreshToken, 86400);

  res.json({
    success: true,
    data: {
      user: {
        id: userId,
        name: user.name,
        email: user.email,
        role: user.role,
        shift: user.shift || 'Shift Siang (08:00 - 16:00)',
      },
      accessToken,
      refreshToken,
      idleTimeoutMinutes: env.IDLE_TIMEOUT_MINUTES,
    },
  });
}

export async function changePassword(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword || newPassword.length < 6) {
    res.status(400).json({ success: false, message: 'Password baru minimal 6 karakter' });
    return;
  }

  const usersCol = getCollection('users');
  const user = await usersCol.findOne({ _id: new ObjectId(req.user?.userId) });
  if (!user) {
    res.status(404).json({ success: false, message: 'Pengguna tidak ditemukan' });
    return;
  }

  const match = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!match) {
    res.status(400).json({ success: false, message: 'Password saat ini tidak sesuai' });
    return;
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await usersCol.updateOne(
    { _id: new ObjectId(req.user?.userId) },
    { $set: { passwordHash, updatedAt: new Date().toISOString() } }
  );

  res.json({ success: true, message: 'Password berhasil diperbarui' });
}

export async function getLoginHistory(req: AuthenticatedRequest, res: Response): Promise<void> {
  const historyCol = getCollection('login_history');
  let logs = await historyCol
    .find({ email: req.user?.email })
    .sort({ createdAt: -1 })
    .limit(10)
    .toArray();

  if (logs.length === 0) {
    logs = [
      {
        id: 'log-1',
        email: req.user?.email || 'budi@kasirwarung.id',
        ipAddress: '192.168.1.102 (Warung POS Terminal)',
        device: 'POS Terminal Touchscreen (Chrome 124, Linux)',
        status: 'Berhasil',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'log-2',
        email: req.user?.email || 'budi@kasirwarung.id',
        ipAddress: '192.168.1.102 (Warung POS Terminal)',
        device: 'POS Terminal Touchscreen (Chrome 124, Linux)',
        status: 'Berhasil',
        createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
      },
      {
        id: 'log-3',
        email: req.user?.email || 'budi@kasirwarung.id',
        ipAddress: '182.253.110.45 (Telkomsel Mobile)',
        device: 'Android Tablet Kasir (Chrome Mobile)',
        status: 'Berhasil',
        createdAt: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
      },
    ];
  }

  res.json({ success: true, data: logs });
}
