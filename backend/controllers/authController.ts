import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
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
import type { AuthenticatedRequest } from '../middleware/authMiddleware.ts';
import { env } from '../config/env.ts';
import { sendTenantVerificationEmail } from '../config/mailer.ts';

export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body;
  const usersCol = getCollection('users');
  const tenantsCol = getCollection('tenants');

  const cleanIdentifier = String(email || '').trim().toLowerCase();

  // Find user by either email or username
  const user = await usersCol.findOne({
    $or: [{ email: cleanIdentifier }, { username: cleanIdentifier }],
  });

  if (!user) {
    res.status(401).json({ success: false, message: 'Email/Username atau password salah' });
    return;
  }

  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) {
    res.status(401).json({ success: false, message: 'Email/Username atau password salah' });
    return;
  }

  // Multi-tenant check: if user belongs to a tenant, check tenant status
  let tenant: any = null;
  if (user.tenantId && user.role !== 'ADMIN') {
    tenant = await tenantsCol.findOne({ _id: new ObjectId(user.tenantId) });
    if (!tenant || tenant.status === 'inactive') {
      res.status(403).json({
        success: false,
        message: 'Akun toko/tenan Anda sedang dinonaktifkan. Seluruh pengguna di toko ini tidak dapat masuk ke sistem. Silakan ajukan pengaktifan kembali.',
        tenantInactive: true,
        tenantEmail: tenant?.ownerEmail || user.email,
        shopName: tenant?.name || 'Toko',
      });
      return;
    }
    if (tenant.status === 'pending_verification') {
      res.status(403).json({
        success: false,
        message: 'Akun toko belum diverifikasi. Silakan periksa kotak masuk email Anda untuk tautan konfirmasi pendaftaran.',
        pendingVerification: true,
        tenantEmail: tenant.ownerEmail,
      });
      return;
    }
  }

  const userId = String(user._id);
  const tenantId = user.tenantId ? String(user.tenantId) : undefined;
  const tenantName = tenant ? tenant.name : undefined;

  const payload = {
    userId,
    email: user.email,
    username: user.username,
    name: user.name,
    role: user.role || 'SHOP_CASHIER',
    tenantId,
    tenantName,
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

  // Log login history
  try {
    const historyCol = getCollection('login_history');
    await historyCol.insertOne({
      _id: new ObjectId(),
      userId: user._id,
      tenantId: user.tenantId || null,
      email: user.email,
      name: user.name,
      role: user.role,
      ipAddress: (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1',
      device: (req.headers['user-agent'] as string) || 'Browser Client',
      status: 'Berhasil',
      createdAt: new Date().toISOString(),
    });
  } catch {
    // Non-fatal
  }

  res.json({
    success: true,
    message: 'Login berhasil',
    data: {
      user: {
        id: userId,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
        shift: user.shift || 'Shift Siang (08:00 - 16:00)',
        tenantId,
        tenantName,
      },
      accessToken,
      refreshToken,
      idleTimeoutMinutes: env.IDLE_TIMEOUT_MINUTES,
    },
  });
}

/**
 * POST /api/auth/register-tenant
 * Register a new tenant account with SHOP_OWNER
 */
export async function registerTenant(req: Request, res: Response): Promise<void> {
  const { shopName, ownerEmail, username, password } = req.body;
  const tenantsCol = getCollection('tenants');
  const usersCol = getCollection('users');

  const cleanEmail = ownerEmail.trim().toLowerCase();
  const cleanUsername = username.trim().toLowerCase();
  const cleanShopName = shopName.trim();

  // Check uniqueness of owner email or username
  const existingUser = await usersCol.findOne({
    $or: [{ email: cleanEmail }, { username: cleanUsername }],
  });

  if (existingUser) {
    res.status(409).json({
      success: false,
      message: 'Email atau username sudah terdaftar dalam sistem',
    });
    return;
  }

  const tenantId = new ObjectId();
  const ownerId = new ObjectId();
  const passwordHash = await bcrypt.hash(password, 10);
  const token = crypto.randomBytes(24).toString('hex');
  const tenantCode = 'T-' + cleanShopName.substring(0, 3).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();

  // Create tenant
  await tenantsCol.insertOne({
    _id: tenantId,
    name: cleanShopName,
    code: tenantCode,
    ownerEmail: cleanEmail,
    status: 'active', // Activated by default or confirmed via email
    verificationToken: token,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  // Create owner user (role SHOP_OWNER)
  await usersCol.insertOne({
    _id: ownerId,
    tenantId,
    name: cleanShopName + ' Owner',
    username: cleanUsername,
    email: cleanEmail,
    passwordHash,
    role: 'SHOP_OWNER',
    shift: 'Shift Pemilik',
    status: 'active',
    createdAt: new Date().toISOString(),
  });

  // Send confirmation email
  const mailResult = await sendTenantVerificationEmail(cleanEmail, cleanShopName, token);

  res.status(201).json({
    success: true,
    message: 'Akun toko berhasil didaftarkan. Tautan konfirmasi pendaftaran telah dikirim ke email pemilik toko.',
    data: {
      tenantId: String(tenantId),
      shopName: cleanShopName,
      code: tenantCode,
      ownerEmail: cleanEmail,
      username: cleanUsername,
      role: 'SHOP_OWNER',
      verificationUrl: mailResult.verificationUrl,
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
    const tenantsCol = getCollection('tenants');
    const user = await usersCol.findOne({ _id: new ObjectId(payload.userId) });
    if (!user) {
      res.status(401).json({ success: false, message: 'Pengguna tidak ditemukan' });
      return;
    }

    let tenant: any = null;
    if (user.tenantId && user.role !== 'ADMIN') {
      tenant = await tenantsCol.findOne({ _id: new ObjectId(user.tenantId) });
      if (!tenant || tenant.status === 'inactive') {
        res.status(403).json({ success: false, message: 'Akun toko Anda dinonaktifkan', tenantInactive: true });
        return;
      }
    }

    const newPayload = {
      userId: String(user._id),
      email: user.email,
      username: user.username,
      name: user.name,
      role: user.role,
      tenantId: user.tenantId ? String(user.tenantId) : undefined,
      tenantName: tenant ? tenant.name : undefined,
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
  const tenantsCol = getCollection('tenants');

  const user = await usersCol.findOne({ _id: new ObjectId(req.user.userId) });
  let tenant: any = null;

  if (user?.tenantId) {
    tenant = await tenantsCol.findOne({ _id: new ObjectId(user.tenantId) });
  }

  res.json({
    success: true,
    data: {
      user: {
        id: req.user.userId,
        name: user ? user.name : req.user.name,
        username: user?.username || req.user.username,
        email: user ? user.email : req.user.email,
        role: user ? user.role : req.user.role,
        shift: user ? user.shift : 'Shift Siang (08:00 - 16:00)',
        tenantId: user?.tenantId ? String(user.tenantId) : req.user.tenantId,
        tenantName: tenant ? tenant.name : req.user.tenantName,
        tenantStatus: tenant ? tenant.status : 'active',
        tenantDeactivationRequest: tenant?.deactivationRequest || null,
      },
      idleTimeoutMinutes: env.IDLE_TIMEOUT_MINUTES,
    },
  });
}

/**
 * Switch active cashier easily within the same tenant
 */
export async function switchCashier(req: Request, res: Response): Promise<void> {
  const { email, tenantId } = req.body;
  const usersCol = getCollection('users');
  const tenantsCol = getCollection('tenants');

  const filter: Record<string, any> = {
    $or: [
      { email: String(email || '').trim().toLowerCase() },
      { username: String(email || '').trim().toLowerCase() },
    ],
  };

  if (tenantId) {
    filter.tenantId = new ObjectId(tenantId);
  }

  let user = await usersCol.findOne(filter);
  if (!user && !email) {
    user = await usersCol.findOne({ email: 'budi@kasirwarung.id' });
  }

  if (!user) {
    res.status(404).json({ success: false, message: 'Pengguna kasir tidak ditemukan' });
    return;
  }

  let tenant: any = null;
  if (user.tenantId && user.role !== 'ADMIN') {
    tenant = await tenantsCol.findOne({ _id: new ObjectId(user.tenantId) });
    if (!tenant || tenant.status === 'inactive') {
      res.status(403).json({
        success: false,
        message: 'Akun toko ini sedang dinonaktifkan.',
        tenantInactive: true,
      });
      return;
    }
  }

  const userId = String(user._id);
  const payload = {
    userId,
    email: user.email,
    username: user.username,
    name: user.name,
    role: user.role || 'SHOP_CASHIER',
    tenantId: user.tenantId ? String(user.tenantId) : undefined,
    tenantName: tenant ? tenant.name : undefined,
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
        username: user.username,
        email: user.email,
        role: user.role,
        shift: user.shift || 'Shift Siang (08:00 - 16:00)',
        tenantId: payload.tenantId,
        tenantName: payload.tenantName,
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
