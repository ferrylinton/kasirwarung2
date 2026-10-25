import express, { type Express } from 'express';
import http from 'http';
import cookieParser from 'cookie-parser';
import { env } from './config/env.ts';
import { connectMongoDB, isMongoNativeConnected } from './config/db.ts';
import { initRedis, isRedisHealthy } from './config/redis.ts';
import { seedInitialData } from './models/seed.ts';
import authRoutes from './routes/authRoutes.ts';
import productRoutes from './routes/productRoutes.ts';
import orderRoutes from './routes/orderRoutes.ts';
import reportRoutes from './routes/reportRoutes.ts';
import tenantRoutes from './routes/tenantRoutes.ts';
import cashierRoutes from './routes/cashierRoutes.ts';
import categoryRoutes from './routes/categoryRoutes.ts';
import activityLogRoutes from './routes/activityLogRoutes.ts';
import logRoutes from './routes/logRoutes.ts';
import { errorHandler } from './middleware/errorMiddleware.ts';
import { initMidnightCleanupScheduler } from './services/cleanupScheduler.ts';
import { i18nMiddleware } from './config/i18n.ts';
import { httpLogger, logger } from './config/logger.ts';

export async function createApp(): Promise<Express> {
  const app = express();

  app.use(express.json());
  app.use(cookieParser());
  app.use(i18nMiddleware);
  app.use(httpLogger);

  // Initialize DB, Redis, and Midnight Cleanup Scheduler (3-month retention)
  await connectMongoDB();
  initRedis();
  await seedInitialData();
  initMidnightCleanupScheduler();

  logger.info('Kasir Warung initialized: DB, Redis, and Midnight Cleanup Scheduler ready', {
    env: process.env.NODE_ENV || 'development',
    port: env.PORT,
  });

  // Health and System Status Endpoint
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      mongodb: isMongoNativeConnected() ? 'connected (Atlas native)' : 'fallback (in-memory engine)',
      redis: isRedisHealthy() ? 'connected (Upstash)' : 'fallback (in-memory store)',
      port: env.PORT,
    });
  });

  // Mount API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/tenants', tenantRoutes);
  app.use('/api/cashiers', cashierRoutes);
  app.use('/api/categories', categoryRoutes);
  app.use('/api/products', productRoutes);
  app.use('/api/orders', orderRoutes);
  app.use('/api/reports', reportRoutes);
  app.use('/api/activity-logs', activityLogRoutes);
  app.use('/api/logs', logRoutes);

  // 404 handler for unhandled API routes
  app.all('/api/*', (req, res) => {
    res.status(404).json({
      success: false,
      message: `API endpoint ${req.method} ${req.originalUrl} tidak ditemukan`,
      code: 'ROUTE_NOT_FOUND',
    });
  });

  app.use(errorHandler);

  return app;
}

export async function startServer() {
  const app = await createApp();
  const port = 3000;
  const httpServer = http.createServer(app);

  // In development, hook Vite middleware
  if (process.env.NODE_ENV !== 'production') {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production static serving
    const path = await import('path');
    app.use(express.static(path.resolve(process.cwd(), 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(process.cwd(), 'dist', 'index.html'));
    });
  }

  httpServer.listen(port, '0.0.0.0', () => {
    console.log(`[KasirWarung] Server running on http://0.0.0.0:${port}`);
  });
}

if (process.env.NODE_ENV !== 'test' && !process.env.AIS_BUILD_MODE) {
  // Can be invoked directly if started as server entrypoint
}
