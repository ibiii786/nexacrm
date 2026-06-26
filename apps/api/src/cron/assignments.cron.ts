import prisma from '../config/database';
import { logger } from '../config/logger';

// Clean up expired assignments every 10 minutes
const INTERVAL_MS = 10 * 60 * 1000; 

export function startAssignmentsCron() {
  logger.info('Starting Assignments cleanup cron (native interval)...');
  
  setInterval(async () => {
    try {
      const now = new Date();
      // Only delete assignments where expiresAt is strictly in the past
      const { count } = await prisma.userPermission.deleteMany({
        where: {
          expiresAt: { lt: now }
        }
      });
      if (count > 0) {
        logger.info(`Cron: Cleaned up ${count} expired assignments`);
      }
    } catch (err) {
      logger.error('Cron: Failed to clean up expired assignments', err);
    }
  }, INTERVAL_MS);
}
