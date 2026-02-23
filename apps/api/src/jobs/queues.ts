import { Queue } from 'bullmq';
import { getRedis } from '../config/database.js';

let researchQueue: Queue | null = null;
let notionSyncQueue: Queue | null = null;

export function getResearchQueue(): Queue {
  if (!researchQueue) {
    researchQueue = new Queue('research', {
      connection: getRedis(),
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: { count: 100 },
        removeOnFail: { count: 50 },
      },
    });
  }
  return researchQueue;
}

export function getNotionSyncQueue(): Queue {
  if (!notionSyncQueue) {
    notionSyncQueue = new Queue('notion-sync', {
      connection: getRedis(),
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: { count: 200 },
        removeOnFail: { count: 50 },
      },
    });
  }
  return notionSyncQueue;
}
