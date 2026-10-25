import express, { Response } from 'express';
import fs from 'fs';
import path from 'path';
import readline from 'readline';
import {
  authenticateToken,
  optionalAuthenticateToken,
  requireRole,
  type AuthenticatedRequest,
} from '../middleware/authMiddleware.ts';
import {
  logger,
  logDir,
  getCurrentLogLevel,
  setLogLevel,
  dailyRotateTransport,
  consoleTransport,
} from '../config/logger.ts';
import { env, VALID_LOG_LEVELS } from '../config/env.ts';
import { getCollection, ObjectId } from '../config/db.ts';

const router = express.Router();

const requireLogViewerRole = [
  authenticateToken,
  requireRole('ADMIN', 'admin', 'SHOP_OWNER', 'pemilik', 'MANAGER'),
];

/**
 * Format bytes to readable size (KB, MB)
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * GET /api/logs/config
 * Get current logger level and environment configuration
 */
router.get('/config', ...requireLogViewerRole, (_req: AuthenticatedRequest, res: Response) => {
  res.json({
    success: true,
    currentLogLevel: getCurrentLogLevel(),
    fileLogLevel: dailyRotateTransport.level,
    consoleLogLevel: consoleTransport.level,
    allowedLogLevels: VALID_LOG_LEVELS,
    envConfig: {
      LOG_LEVEL: env.LOG_LEVEL,
      LOG_LEVEL_CONSOLE: env.LOG_LEVEL_CONSOLE,
      LOG_LEVEL_FILE: env.LOG_LEVEL_FILE,
      NODE_ENV: process.env.NODE_ENV || 'development',
    },
  });
});

/**
 * PUT /api/logs/level
 * Dynamically adjust log level during runtime (Admin only)
 */
router.put('/level', authenticateToken, requireRole('ADMIN', 'admin'), (req: AuthenticatedRequest, res: Response) => {
  const { level } = req.body;
  if (!level || typeof level !== 'string') {
    res.status(400).json({ success: false, message: 'Field level harus diisi' });
    return;
  }
  const ok = setLogLevel(level);
  if (!ok) {
    res.status(400).json({
      success: false,
      message: `Level tidak valid. Pilihan tersedia: ${VALID_LOG_LEVELS.join(', ')}`,
    });
    return;
  }
  logger.info(`Log level diubah menjadi ${level.toLowerCase()} oleh ${req.user?.userId || 'ADMIN'}`);
  res.json({
    success: true,
    message: `Tingkat log berhasil diubah menjadi ${level.toLowerCase()}`,
    currentLogLevel: getCurrentLogLevel(),
  });
});

/**
 * GET /api/logs/files
 * List all available log files in the logs directory
 */
router.get('/files', ...requireLogViewerRole, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!fs.existsSync(logDir)) {
      res.json({
        success: true,
        files: [],
        currentLogLevel: getCurrentLogLevel(),
        allowedLogLevels: VALID_LOG_LEVELS,
      });
      return;
    }

    const fileNames = fs.readdirSync(logDir);
    const files = fileNames
      .filter((file) => file.endsWith('.log') || file.endsWith('.log.gz'))
      .map((fileName) => {
        const filePath = path.join(logDir, fileName);
        const stats = fs.statSync(filePath);
        return {
          fileName,
          sizeBytes: stats.size,
          sizeFormatted: formatBytes(stats.size),
          lastModified: stats.mtime.toISOString(),
          createdAt: stats.birthtime.toISOString(),
          isGz: fileName.endsWith('.gz'),
        };
      })
      .sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime());

    res.json({
      success: true,
      files,
      currentLogDir: logDir,
      currentLogLevel: getCurrentLogLevel(),
      allowedLogLevels: VALID_LOG_LEVELS,
    });
  } catch (error: any) {
    logger.error('Error fetching log files list', { error: error.message });
    res.status(500).json({ success: false, message: 'Gagal membaca daftar file log' });
  }
});


/**
 * GET /api/logs
 * Read, filter, and paginate log entries from a rotated log file
 */
router.get('/', ...requireLogViewerRole, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userRole = req.user?.role;
    const isGlobalAdmin = userRole === 'ADMIN' || userRole === 'admin';
    const userTenantId = req.user?.tenantId ? String(req.user.tenantId) : null;

    const requestedFile = req.query.file as string | undefined;
    const filterLevel = (req.query.level as string || 'all').toLowerCase();
    const filterTenant = req.query.tenantId as string | undefined;
    const searchQuery = (req.query.search as string || '').toLowerCase().trim();
    const page = Math.max(1, parseInt(req.query.page as string || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string || '20', 10)));
    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;

    if (!fs.existsSync(logDir)) {
      res.json({
        success: true,
        logs: [],
        availableFiles: [],
        stats: { total: 0, info: 0, warn: 0, error: 0 },
        pagination: { page: 1, limit, total: 0, totalPages: 0 },
      });
      return;
    }

    const allFiles = fs
      .readdirSync(logDir)
      .filter((file) => file.endsWith('.log'))
      .sort((a, b) => {
        const statA = fs.statSync(path.join(logDir, a));
        const statB = fs.statSync(path.join(logDir, b));
        return statB.mtime.getTime() - statA.mtime.getTime();
      });

    // Default to the newest log file or today's active file
    let targetFileName = requestedFile ? path.basename(requestedFile) : allFiles[0];

    // Ensure valid filename and avoid path traversal
    if (!targetFileName || !allFiles.includes(targetFileName)) {
      targetFileName = allFiles[0];
    }

    if (!targetFileName) {
      res.json({
        success: true,
        logs: [],
        availableFiles: [],
        stats: { total: 0, info: 0, warn: 0, error: 0 },
        pagination: { page: 1, limit, total: 0, totalPages: 0 },
      });
      return;
    }

    const filePath = path.join(logDir, targetFileName);
    if (!fs.existsSync(filePath)) {
      res.status(404).json({ success: false, message: 'File log tidak ditemukan' });
      return;
    }

    // Read and parse log lines
    const parsedEntries: any[] = [];
    const fileStream = fs.createReadStream(filePath, { encoding: 'utf-8' });
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity,
    });

    let lineIndex = 0;
    for await (const line of rl) {
      if (!line || !line.trim()) continue;
      lineIndex++;
      try {
        const item = JSON.parse(line.trim());
        item.id = `${targetFileName}-${lineIndex}`;
        item.timestamp = item.timestamp || new Date().toISOString();
        parsedEntries.push(item);
      } catch {
        // Plain text fallback if non-JSON log line
        parsedEntries.push({
          id: `${targetFileName}-${lineIndex}`,
          timestamp: new Date().toISOString(),
          level: 'info',
          message: line,
        });
      }
    }

    // Load tenants mapping to enrich logs with tenant names
    const tenantsMap = new Map<string, string>();
    try {
      const tenants = await getCollection('tenants').find({}).toArray();
      tenants.forEach((t: any) => {
        tenantsMap.set(String(t._id), t.name || t.code);
      });
    } catch {
      // ignore
    }

    // Role-based Multi-Tenant Isolation Enforcement:
    // ADMIN: Can view all logs, or filter by specific tenant
    // SHOP_OWNER: CAN ONLY view logs belonging to their own tenant!
    const roleFiltered = parsedEntries.filter((item) => {
      // Enrich tenantName if available
      if (item.tenantId && !item.tenantName) {
        item.tenantName = tenantsMap.get(String(item.tenantId)) || `Tenan (${String(item.tenantId).slice(-6)})`;
      }

      if (isGlobalAdmin) {
        if (filterTenant && filterTenant !== 'ALL') {
          return String(item.tenantId) === String(filterTenant);
        }
        return true;
      }

      // SHOP_OWNER check: Must match own tenantId
      if (!userTenantId) return false;
      return String(item.tenantId) === userTenantId;
    });

    // Level filter
    const levelFiltered = roleFiltered.filter((item) => {
      if (filterLevel === 'all') return true;
      return String(item.level).toLowerCase() === filterLevel;
    });

    // Search query filter
    const searchFiltered = levelFiltered.filter((item) => {
      if (!searchQuery) return true;
      const haystack = [
        item.message,
        item.url,
        item.method,
        item.ip,
        item.tenantName,
        item.tenantId,
        item.role,
        item.userId,
        item.stack,
        item.status ? String(item.status) : '',
        JSON.stringify(item.meta || {}),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return haystack.includes(searchQuery);
    });

    // Date range filter
    const dateFiltered = searchFiltered.filter((item) => {
      if (!startDate && !endDate) return true;
      const itemTime = new Date(item.timestamp).getTime();
      if (startDate && itemTime < new Date(startDate).getTime()) return false;
      if (endDate && itemTime > new Date(endDate).getTime()) return false;
      return true;
    });

    // Calculate level statistics for the role-scoped file
    const stats = {
      total: roleFiltered.length,
      info: roleFiltered.filter((l) => String(l.level).toLowerCase() === 'info').length,
      warn: roleFiltered.filter((l) => String(l.level).toLowerCase() === 'warn').length,
      error: roleFiltered.filter((l) => String(l.level).toLowerCase() === 'error').length,
      debug: roleFiltered.filter((l) => ['debug', 'verbose', 'silly', 'http'].includes(String(l.level).toLowerCase())).length,
    };

    // Sort newest first
    dateFiltered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Paginate
    const total = dateFiltered.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const startIndex = (page - 1) * limit;
    const paginatedLogs = dateFiltered.slice(startIndex, startIndex + limit);

    res.json({
      success: true,
      currentFile: targetFileName,
      availableFiles: allFiles,
      currentLogLevel: getCurrentLogLevel(),
      allowedLogLevels: VALID_LOG_LEVELS,
      stats,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
      logs: paginatedLogs,
      userScope: {
        role: userRole,
        isGlobalAdmin,
        tenantId: userTenantId,
        tenantName: userTenantId ? tenantsMap.get(userTenantId) || null : null,
      },
    });
  } catch (error: any) {
    logger.error('Error reading log file entries', { error: error.message });
    res.status(500).json({ success: false, message: 'Gagal memproses dan membaca file log sistem' });
  }
});

/**
 * POST /api/logs/simulate
 * Endpoint to generate a test log entry (info, warn, error, debug, etc.) to test rotation & filtering
 */
router.post('/simulate', optionalAuthenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { level = 'info', message, meta = {} } = req.body;
    const requestedLevel = String(level).toLowerCase();
    const selectedLevel = (VALID_LOG_LEVELS as readonly string[]).includes(requestedLevel) ? requestedLevel : 'info';

    const tenantId = req.user?.tenantId || null;
    const userId = req.user?.userId || null;
    const role = req.user?.role || 'SYSTEM';

    let tenantName: string | undefined;
    if (tenantId) {
      try {
        const tenant = await getCollection('tenants').findOne({ _id: new ObjectId(tenantId) });
        tenantName = tenant?.name;
      } catch {
        // ignore
      }
    }

    const payload = {
      tenantId,
      tenantName,
      userId,
      role,
      ip: (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1',
      simulated: true,
      ...meta,
    };

    const finalMsg = message || `Simulasi log [${selectedLevel.toUpperCase()}] dibuat oleh ${role}`;

    if (selectedLevel === 'error') {
      logger.error(finalMsg, { ...payload, stack: new Error(`Simulated Error Trace for: ${finalMsg}`).stack });
    } else if (selectedLevel === 'warn') {
      logger.warn(finalMsg, payload);
    } else if (selectedLevel === 'info') {
      logger.info(finalMsg, payload);
    } else if (selectedLevel === 'http') {
      logger.http(finalMsg, payload);
    } else if (selectedLevel === 'verbose') {
      logger.verbose(finalMsg, payload);
    } else if (selectedLevel === 'debug') {
      logger.debug(finalMsg, payload);
    } else if (selectedLevel === 'silly') {
      logger.silly(finalMsg, payload);
    } else {
      logger.log(selectedLevel, finalMsg, payload);
    }


    res.json({
      success: true,
      message: `Log simulasi level ${selectedLevel.toUpperCase()} berhasil dicatat`,
      loggedEntry: {
        timestamp: new Date().toISOString(),
        level: selectedLevel,
        message: finalMsg,
        ...payload,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Gagal membuat log simulasi' });
  }
});

export default router;
