import { getCollection } from '../config/db.ts';

/**
 * Clean up sales transactions (orders) older than 3 months (90 days).
 * This runs automatically every day at 00:00 (midnight).
 */
export async function cleanupOrdersOlderThanThreeMonths(): Promise<{ deletedCount: number; cutoffDate: string }> {
  try {
    const ordersCol = getCollection('orders');
    const cutoffDate = new Date();
    // 3 calendar months retention
    cutoffDate.setMonth(cutoffDate.getMonth() - 3);
    const cutoffIso = cutoffDate.toISOString();

    const result = await ordersCol.deleteMany({
      status: { $in: ['paid', 'cancelled'] },
      createdAt: { $lt: cutoffIso },
    });

    const deleted = result?.deletedCount || 0;
    console.log(`[Cleanup Scheduler] Midnight 00:00 check completed. Cutoff: ${cutoffIso}. Deleted ${deleted} transaction orders older than 3 months.`);
    return { deletedCount: deleted, cutoffDate: cutoffIso };
  } catch (err: any) {
    console.error('[Cleanup Scheduler] Error cleaning up old orders:', err.message);
    return { deletedCount: 0, cutoffDate: new Date().toISOString() };
  }
}

let midnightTimer: NodeJS.Timeout | null = null;

/**
 * Initializes the recurring daily scheduler at 00:00 (midnight).
 */
export function initMidnightCleanupScheduler(): void {
  function scheduleNextMidnight() {
    const now = new Date();
    // Calculate next 00:00:00
    const nextMidnight = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1,
      0,
      0,
      0,
      0
    );

    const msUntilMidnight = Math.max(1000, nextMidnight.getTime() - now.getTime());
    const hours = (msUntilMidnight / (1000 * 60 * 60)).toFixed(2);
    console.log(`[Cleanup Scheduler] Initialized. Next run scheduled at 00:00 (in ${hours} hours).`);

    if (midnightTimer) {
      clearTimeout(midnightTimer);
    }

    midnightTimer = setTimeout(async () => {
      console.log('[Cleanup Scheduler] Triggering daily 00:00 midnight order history retention cleanup...');
      await cleanupOrdersOlderThanThreeMonths();
      // Re-arm for subsequent midnights
      scheduleNextMidnight();
    }, msUntilMidnight);
  }

  // Initial startup execution to prune any legacy orders beyond 3 months
  cleanupOrdersOlderThanThreeMonths().catch((err) =>
    console.warn('[Cleanup Scheduler] Initial startup cleanup warning:', err.message)
  );

  scheduleNextMidnight();
}
