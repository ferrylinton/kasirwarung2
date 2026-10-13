import { startServer } from './backend/server.ts';

startServer().catch((err) => {
  console.error('[KasirWarung] Failed to start server:', err);
  process.exit(1);
});
