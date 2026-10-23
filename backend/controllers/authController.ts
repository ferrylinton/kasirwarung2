import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { getCollection, ObjectId, safeObjectId } from '../config/db.ts';
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
  storeActiveAccessToken,
  removeActiveAccessToken,
  getAllActiveAccessTokens,
  blacklistAccessToken,
  type ActiveAccessTokenData,
} from '../config/redis.ts';
import type { AuthenticatedRequest } from '../middleware/authMiddleware.ts';
import { env } from '../config/env.ts';
import { sendTenantVerificationEmail } from '../config/mailer.ts';
import { recordActivity } from '../services/activityLogService.ts';

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
    const tId = safeObjectId(user.tenantId);
    if (tId) {
      tenant = await tenantsCol.findOne({ _id: tId });
    }
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

  // Store active access token in Redis with TTL matching token validity
  const accessTtl = getTokenRemainingSeconds(accessToken);
  const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
  const clientDevice = (req.headers['user-agent'] as string) || 'Browser Client';
  await storeActiveAccessToken(
    accessToken,
    {
      userId,
      email: user.email,
      username: user.username,
      name: user.name,
      role: user.role || 'SHOP_CASHIER',
      tenantId: tenantId || null,
      tenantName: tenantName || (user.role === 'ADMIN' ? 'Platform Administrator' : 'Toko'),
      ipAddress: clientIp,
      device: clientDevice,
      issuedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + accessTtl * 1000).toISOString(),
    },
    accessTtl
  );

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
      tenantName: tenantName || null,
      username: user.username || null,
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
    const uId = safeObjectId(payload.userId);
    const user = uId ? await usersCol.findOne({ _id: uId }) : null;
    if (!user) {
      res.status(401).json({ success: false, message: 'Pengguna tidak ditemukan' });
      return;
    }

    let tenant: any = null;
    if (user.tenantId && user.role !== 'ADMIN') {
      const tId = safeObjectId(user.tenantId);
      if (tId) {
        tenant = await tenantsCol.findOne({ _id: tId });
      }
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

    // Store new active access token in Redis with TTL matching token validity
    const newAccessTtl = getTokenRemainingSeconds(newAccessToken);
    const refreshIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    const refreshDevice = (req.headers['user-agent'] as string) || 'Browser Client';
    await storeActiveAccessToken(
      newAccessToken,
      {
        userId: payload.userId,
        email: user.email,
        username: user.username,
        name: user.name,
        role: user.role,
        tenantId: user.tenantId ? String(user.tenantId) : null,
        tenantName: tenant ? tenant.name : (user.role === 'ADMIN' ? 'Platform Administrator' : 'Toko'),
        ipAddress: refreshIp,
        device: refreshDevice,
        issuedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + newAccessTtl * 1000).toISOString(),
      },
      newAccessTtl
    );

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
    await blacklistAccessToken(token, remaining);
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

  const uId = safeObjectId(req.user.userId);
  const user = uId ? await usersCol.findOne({ _id: uId }) : null;
  let tenant: any = null;

  if (user?.tenantId) {
    const tId = safeObjectId(user.tenantId);
    if (tId) tenant = await tenantsCol.findOne({ _id: tId });
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

  if (tenantId && tenantId !== 'ALL') {
    const tId = safeObjectId(tenantId);
    if (tId) filter.tenantId = tId;
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
    const tId = safeObjectId(user.tenantId);
    if (tId) tenant = await tenantsCol.findOne({ _id: tId });
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

  // Store active access token in Redis with TTL matching token validity
  const switchAccessTtl = getTokenRemainingSeconds(accessToken);
  const switchIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
  const switchDevice = (req.headers['user-agent'] as string) || 'Browser Client';
  await storeActiveAccessToken(
    accessToken,
    {
      userId,
      email: user.email,
      username: user.username,
      name: user.name,
      role: user.role || 'SHOP_CASHIER',
      tenantId: payload.tenantId || null,
      tenantName: payload.tenantName || 'Toko',
      ipAddress: switchIp,
      device: switchDevice,
      issuedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + switchAccessTtl * 1000).toISOString(),
    },
    switchAccessTtl
  );

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
  const user = req.user;
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'admin';
  const isManager =
    user?.role === 'MANAGER' ||
    user?.role === 'SHOP_OWNER' ||
    user?.role === 'pemilik';

  const filter: any = {};

  if (isAdmin) {
    // Role ADMIN: can see all users from all tenants or filter by specific tenant
    const queryTenantId = req.query.tenantId as string | undefined;
    if (queryTenantId && queryTenantId !== 'ALL') {
      const safeTId = safeObjectId(queryTenantId);
      filter.tenantId = safeTId ? { $in: [queryTenantId, safeTId] } : queryTenantId;
    }
  } else if (isManager) {
    // Role MANAGER: sees all users in their own tenant
    const tenantId = user?.tenantId;
    if (!tenantId) {
      res.status(403).json({ success: false, message: 'Anda tidak terafiliasi dengan tenan manapun' });
      return;
    }
    const safeTId = safeObjectId(tenantId);
    filter.tenantId = safeTId ? { $in: [tenantId, safeTId] } : tenantId;
  } else {
    // Other roles (e.g. Kasir): can only see their own personal login history
    filter.email = user?.email;
  }

  // Date filters
  const startDate = req.query.startDate as string | undefined;
  const endDate = req.query.endDate as string | undefined;
  if (startDate || endDate) {
    const dateFilter: any = {};
    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      dateFilter.$gte = start.toISOString();
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      dateFilter.$lte = end.toISOString();
    }
    filter.createdAt = dateFilter;
  }

  // Search filter (keyword for name, email, username, device, IP address, role)
  const search = req.query.search as string | undefined;
  if (search && search.trim()) {
    const searchRegex = new RegExp(search.trim(), 'i');
    filter.$or = [
      { name: searchRegex },
      { email: searchRegex },
      { username: searchRegex },
      { role: searchRegex },
      { ipAddress: searchRegex },
      { device: searchRegex },
      { status: searchRegex },
    ];
  }

  // Role filter
  const roleFilter = req.query.role as string | undefined;
  if (roleFilter && roleFilter !== 'ALL') {
    filter.role = roleFilter;
  }

  // Query database
  let logs = await historyCol
    .find(filter)
    .sort({ createdAt: -1 })
    .limit(200)
    .toArray();

  // Tenant name lookup mapping
  const tenantsCol = getCollection('tenants');
  const allTenants = await tenantsCol.find({}).toArray();
  const tenantMap = new Map(allTenants.map((t) => [t._id.toString(), t.name]));

  // Fallback initial records if history collection is completely empty
  if (logs.length === 0 && !search && !startDate && !endDate) {
    const now = Date.now();
    const demoItems = [
      {
        id: 'seed-log-1',
        email: user?.email || 'budi@kasirwarung.id',
        name: user?.name || 'Budi Santoso',
        role: user?.role || 'SHOP_OWNER',
        tenantId: user?.tenantId || null,
        tenantName: user?.tenantId ? tenantMap.get(user.tenantId.toString()) : 'Platform Administrator',
        ipAddress: '192.168.1.100 (Warung POS Terminal)',
        device: 'POS Terminal Touchscreen (Chrome 124, Linux)',
        status: 'Berhasil',
        createdAt: new Date(now - 15 * 60 * 1000).toISOString(),
      },
      {
        id: 'seed-log-2',
        email: 'siti@kasirwarung.id',
        name: 'Siti Aminah',
        role: 'SHOP_CASHIER',
        tenantId: user?.tenantId || null,
        tenantName: user?.tenantId ? tenantMap.get(user.tenantId.toString()) : 'Warung Berkah Budi',
        ipAddress: '192.168.1.102 (Kasir Meja 1)',
        device: 'Windows 11 POS (Chrome 124)',
        status: 'Berhasil',
        createdAt: new Date(now - 3 * 3600 * 1000).toISOString(),
      },
      {
        id: 'seed-log-3',
        email: user?.email || 'budi@kasirwarung.id',
        name: user?.name || 'Budi Santoso',
        role: user?.role || 'SHOP_OWNER',
        tenantId: user?.tenantId || null,
        tenantName: user?.tenantId ? tenantMap.get(user.tenantId.toString()) : 'Platform Administrator',
        ipAddress: '182.1.22.45 (Telkomsel Mobile)',
        device: 'Samsung Galaxy Tab S9 (Android)',
        status: 'Berhasil',
        createdAt: new Date(now - 24 * 3600 * 1000).toISOString(),
      },
    ];

    if (isAdmin) {
      res.json({ success: true, data: demoItems });
      return;
    } else if (isManager) {
      res.json({ success: true, data: demoItems });
      return;
    }
  }

  const formattedLogs = logs.map((log) => {
    const tIdStr = log.tenantId ? log.tenantId.toString() : null;
    const resolvedTenantName =
      (tIdStr ? tenantMap.get(tIdStr) : null) ||
      log.tenantName ||
      (log.role === 'ADMIN' ? 'Platform Administrator' : 'Umum');

    return {
      id: log._id ? log._id.toString() : (log.id || `log-${Math.random().toString(36).substr(2, 9)}`),
      userId: log.userId ? log.userId.toString() : undefined,
      tenantId: tIdStr,
      tenantName: resolvedTenantName,
      name: log.name || (log.email ? log.email.split('@')[0] : 'User'),
      username: log.username,
      email: log.email,
      role: log.role || 'SHOP_CASHIER',
      ipAddress: log.ipAddress || '127.0.0.1',
      device: log.device || 'Browser Client',
      status: log.status || 'Berhasil',
      createdAt: log.createdAt || new Date().toISOString(),
    };
  });

  res.json({ success: true, data: formattedLogs });
}

export async function getActiveTokens(req: AuthenticatedRequest, res: Response): Promise<void> {
  const user = req.user;
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'admin';
  const isManager =
    user?.role === 'MANAGER' ||
    user?.role === 'SHOP_OWNER' ||
    user?.role === 'pemilik';

  let allTokens = await getAllActiveAccessTokens();

  // If no tokens in Redis yet, generate initial active demo sessions
  if (allTokens.length === 0) {
    const now = Date.now();
    const demoPayloads = [
      {
        userId: '6ace8019cb267df584bd00a1',
        email: 'admin@kasirwarung.id',
        username: 'admin',
        name: 'Super Administrator',
        role: 'ADMIN',
        tenantId: null,
        tenantName: 'Platform Administrator',
        ipAddress: '182.253.14.88 (Kantor Pusat)',
        device: 'Chrome 124 (macOS Sonoma)',
        issuedAt: new Date(now - 120 * 1000).toISOString(),
      },
      {
        userId: '6ace8019cb267df584bd00a8',
        email: 'budi@kasirwarung.id',
        username: 'budi',
        name: 'Budi Santoso',
        role: 'SHOP_OWNER',
        tenantId: '6ace8019cb267df584bd0001',
        tenantName: 'Warung Berkah Budi',
        ipAddress: '192.168.1.100 (Warung POS Terminal)',
        device: 'POS Terminal Touchscreen (Linux POS)',
        issuedAt: new Date(now - 250 * 1000).toISOString(),
      },
      {
        userId: '6ace8019cb267df584bd00a9',
        email: 'siti@kasirwarung.id',
        username: 'siti',
        name: 'Siti Aminah',
        role: 'SHOP_CASHIER',
        tenantId: '6ace8019cb267df584bd0001',
        tenantName: 'Warung Berkah Budi',
        ipAddress: '192.168.1.102 (Kasir Meja 1)',
        device: 'Chrome 124 (Windows 11 POS)',
        issuedAt: new Date(now - 400 * 1000).toISOString(),
      },
      {
        userId: '6ace8019cb267df584bd00b5',
        email: 'hendra@kelontong.id',
        username: 'hendra',
        name: 'Hendra Gunawan',
        role: 'SHOP_OWNER',
        tenantId: '6ace8019cb267df584bd0002',
        tenantName: 'Toko Kelontong Sejahtera',
        ipAddress: '192.168.2.50 (Kelontong Terminal)',
        device: 'Safari 17 (iPadOS Tablet POS)',
        issuedAt: new Date(now - 550 * 1000).toISOString(),
      },
    ];

    for (const d of demoPayloads) {
      const tok = signAccessToken({
        userId: d.userId,
        email: d.email,
        username: d.username,
        name: d.name,
        role: d.role,
        tenantId: d.tenantId || undefined,
        tenantName: d.tenantName,
      });
      const ttl = getTokenRemainingSeconds(tok);
      await storeActiveAccessToken(
        tok,
        {
          userId: d.userId,
          email: d.email,
          username: d.username,
          name: d.name,
          role: d.role,
          tenantId: d.tenantId,
          tenantName: d.tenantName,
          ipAddress: d.ipAddress,
          device: d.device,
          issuedAt: d.issuedAt,
          expiresAt: new Date(Date.now() + ttl * 1000).toISOString(),
        },
        ttl
      );
    }
    allTokens = await getAllActiveAccessTokens();
  }

  // Filter based on role permissions
  let filtered = allTokens.filter((item) => {
    if (isAdmin) {
      const qTenant = req.query.tenantId as string | undefined;
      if (qTenant && qTenant !== 'ALL') {
        if (item.tenantId !== qTenant) return false;
      }
      return true;
    } else if (isManager) {
      const userTenant = user?.tenantId;
      if (!userTenant || item.tenantId !== userTenant) return false;
      return true;
    } else {
      return item.email === user?.email;
    }
  });

  // Filter by role
  const roleQuery = req.query.role as string | undefined;
  if (roleQuery && roleQuery !== 'ALL') {
    filtered = filtered.filter((item) => {
      if (roleQuery === 'SHOP_OWNER' || roleQuery === 'MANAGER') {
        return (
          item.role === 'SHOP_OWNER' ||
          item.role === 'MANAGER' ||
          item.role === 'pemilik'
        );
      }
      return item.role === roleQuery;
    });
  }

  // Filter by date (issuedAt)
  const startDate = req.query.startDate as string | undefined;
  const endDate = req.query.endDate as string | undefined;
  if (startDate || endDate) {
    const startMs = startDate ? new Date(startDate).setHours(0, 0, 0, 0) : 0;
    const endMs = endDate
      ? new Date(endDate).setHours(23, 59, 59, 999)
      : Number.MAX_SAFE_INTEGER;

    filtered = filtered.filter((item) => {
      const itemTime = new Date(item.issuedAt).getTime();
      return itemTime >= startMs && itemTime <= endMs;
    });
  }

  // Filter by search query
  const search = req.query.search as string | undefined;
  if (search && search.trim()) {
    const q = search.toLowerCase().trim();
    filtered = filtered.filter((item) => {
      return (
        item.name?.toLowerCase().includes(q) ||
        item.email?.toLowerCase().includes(q) ||
        item.username?.toLowerCase().includes(q) ||
        item.device?.toLowerCase().includes(q) ||
        item.ipAddress?.toLowerCase().includes(q) ||
        item.role?.toLowerCase().includes(q) ||
        item.tenantName?.toLowerCase().includes(q) ||
        item.token?.toLowerCase().includes(q)
      );
    });
  }

  // Sort by newest issuedAt first
  filtered.sort((a, b) => new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime());

  res.json({ success: true, data: filtered });
}

export async function blacklistActiveTokenController(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { token, reason } = req.body;
  if (!token) {
    res.status(400).json({ success: false, message: 'Parameter token wajib disertakan' });
    return;
  }

  const user = req.user;
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'admin';
  const isManager =
    user?.role === 'MANAGER' ||
    user?.role === 'SHOP_OWNER' ||
    user?.role === 'pemilik';

  const allTokens = await getAllActiveAccessTokens();
  const targetToken = allTokens.find((t) => t.token === token);

  if (targetToken) {
    if (!isAdmin) {
      if (isManager) {
        if (targetToken.tenantId !== user?.tenantId) {
          res.status(403).json({
            success: false,
            message: 'Anda hanya dapat memblacklist token pengguna di tenan Anda sendiri',
          });
          return;
        }
      } else {
        if (targetToken.email !== user?.email) {
          res.status(403).json({
            success: false,
            message: 'Anda tidak memiliki hak untuk memblacklist token ini',
          });
          return;
        }
      }
    }
  }

  const remainingTtl = getTokenRemainingSeconds(token);

  // Blacklist in Redis with TTL matching remaining validity
  await blacklistAccessToken(token, remainingTtl);

  // Audit log to login_history
  try {
    const historyCol = getCollection('login_history');
    await historyCol.insertOne({
      _id: new ObjectId(),
      userId: targetToken?.userId ? safeObjectId(targetToken.userId) : null,
      tenantId: targetToken?.tenantId || user?.tenantId || null,
      tenantName: targetToken?.tenantName || user?.tenantName || null,
      email: targetToken?.email || user?.email || 'unknown',
      name: targetToken?.name || user?.name || 'User',
      role: targetToken?.role || user?.role || 'SHOP_CASHIER',
      ipAddress: targetToken?.ipAddress || (req.headers['x-forwarded-for'] as string) || '127.0.0.1',
      device: targetToken?.device || 'Browser',
      status: `Diblacklist oleh ${user?.role || 'Admin'} (${reason || 'Pencabutan manual'})`,
      createdAt: new Date().toISOString(),
    });
  } catch {
    // Non-fatal
  }

  // Record Activity Log
  await recordActivity(req, {
    action: 'REVOKE_TOKEN',
    entity: 'REVOKE_TOKEN',
    entityId: targetToken?.userId ? String(targetToken.userId) : null,
    entityName: targetToken?.name || targetToken?.email || 'Sesi Token',
    details: `Mencabut (blacklist) sesi token aktif pengguna "${targetToken?.name || targetToken?.email || 'User'}"` + (reason ? ` (${reason})` : ''),
    tenantId: targetToken?.tenantId || user?.tenantId || null,
    tenantName: targetToken?.tenantName || user?.tenantName || null,
    previousData: targetToken ? {
      email: targetToken.email,
      name: targetToken.name,
      role: targetToken.role,
      device: targetToken.device,
      ipAddress: targetToken.ipAddress,
      issuedAt: targetToken.issuedAt,
    } : null,
    newData: {
      status: 'BLACKLISTED',
      remainingTtl,
      reason: reason || 'Pencabutan manual',
    },
  });

  res.json({
    success: true,
    message: `Access token berhasil dimasukkan ke blacklist token di Redis dengan TTL ${remainingTtl} detik`,
    data: {
      token,
      ttlSeconds: remainingTtl,
      blacklistedAt: new Date().toISOString(),
    },
  });
}
