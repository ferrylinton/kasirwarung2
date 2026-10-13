import express, { Express } from 'express';
import cookieParser from 'cookie-parser';
import { env } from './config/env.ts';
import { connectMongoDB, isMongoNativeConnected } from './config/db.ts';
import { initRedis, isRedisHealthy } from './config/redis.ts';
import { seedInitialData } from './models/seed.ts';
import authRoutes from './routes/authRoutes.ts';
import productRoutes from './routes/productRoutes.ts';
import orderRoutes from './routes/orderRoutes.ts';
import reportRoutes from './routes/reportRoutes.ts';
import { errorHandler } from './middleware/errorMiddleware.ts';

export async function createApp(): Promise<Express> {
  const app = express();

  app.use(express.json());
  app.use(cookieParser());

  // Initialize DB and Redis
  await connectMongoDB();
  initRedis();
  await seedInitialData();

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
  app.use('/api/products', productRoutes);
  app.use('/api/orders', orderRoutes);
  app.use('/api/reports', reportRoutes);

  app.use(errorHandler);

  return app;
}

export async function startServer() {
  const app = await createApp();
  const port = env.PORT || 3000;

  // In development, hook Vite middleware
  if (process.env.NODE_ENV !== 'production') {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
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

  app.listen(port, '0.0.0.0', () => {
    console.log(`[KasirWarung] Server running on http://0.0.0.0:${port}`);
  });
}

if (process.env.NODE_ENV !== 'test' && !process.env.AIS_BUILD_MODE) {
  // Can be invoked directly if started as server entrypoint
}
