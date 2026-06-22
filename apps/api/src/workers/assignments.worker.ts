import { Queue, Worker } from 'bullmq';
import { AssignmentsService } from '../services/assignments.service';
import { env } from '../config/env';
import IORedis from 'ioredis';

let assignmentsQueue: Queue | null = null;
let assignmentsWorker: Worker | null = null;

// Export a getter so other modules can enqueue jobs without crashing if not initialized
export function getAssignmentsQueue(): Queue | null {
  return assignmentsQueue;
}

// Setup the repeatable cleanup job — only called from src/index.ts (non-serverless).
// In Vercel serverless mode, this function is never invoked.
export async function setupAssignmentsWorker() {
  // Lazy-create the shared Redis connection only when actually needed
  const connection = new IORedis(env.REDIS_URL, {
    maxRetriesPerRequest: null,
  });

  assignmentsQueue = new Queue('assignments', { connection: connection as any });

  assignmentsWorker = new Worker('assignments', async (job) => {
    if (job.name === 'cleanup-expired') {
      const count = await AssignmentsService.cleanupExpiredAssignments();
      return { count };
    }
  }, { connection: connection as any });

  assignmentsWorker.on('completed', (job, returnvalue) => {
    if (returnvalue?.count > 0) {
      console.log(`[Worker] Cleaned up ${returnvalue.count} expired assignments`);
    }
  });

  assignmentsWorker.on('failed', (job, err) => {
    console.error(`[Worker] Job ${job?.id} failed:`, err);
  });

  await assignmentsQueue.add('cleanup-expired', {}, {
    repeat: {
      pattern: '*/5 * * * *' // Every 5 minutes
    }
  });
  console.log('[Worker] Assignments cleanup job scheduled.');
}
