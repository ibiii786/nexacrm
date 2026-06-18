import { Queue, Worker, QueueScheduler } from 'bullmq';
import { AssignmentsService } from '../services/assignments.service';
import { env } from '../config/env';
import IORedis from 'ioredis';

// Shared Redis connection for BullMQ
const connection = new IORedis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
});

export const assignmentsQueue = new Queue('assignments', { connection });

// Define the worker
export const assignmentsWorker = new Worker('assignments', async (job) => {
  if (job.name === 'cleanup-expired') {
    const count = await AssignmentsService.cleanupExpiredAssignments();
    return { count };
  }
}, { connection });

assignmentsWorker.on('completed', (job, returnvalue) => {
  if (returnvalue?.count > 0) {
    console.log(`[Worker] Cleaned up ${returnvalue.count} expired assignments`);
  }
});

assignmentsWorker.on('failed', (job, err) => {
  console.error(`[Worker] Job ${job?.id} failed:`, err);
});

// Setup the repeatable job to run every 5 minutes
export async function setupAssignmentsWorker() {
  await assignmentsQueue.add('cleanup-expired', {}, {
    repeat: {
      pattern: '*/5 * * * *' // Every 5 minutes
    }
  });
  console.log('[Worker] Assignments cleanup job scheduled.');
}
