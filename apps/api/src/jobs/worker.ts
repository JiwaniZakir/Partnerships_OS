import { Worker, type Job } from 'bullmq';
import { getRedis } from '../config/database.js';
import { runResearchPipeline } from '../research/pipeline.js';
import { logger } from '../utils/logger.js';

// Re-export queues from the dedicated module for backwards compatibility
export { getResearchQueue, getNotionSyncQueue } from './queues.js';

const workers: Worker[] = [];

export function initWorkers(): void {
  const connection = getRedis();

  // Research worker
  const researchWorker = new Worker(
    'research',
    async (job: Job) => {
      const { contactId } = job.data;
      logger.info({ contactId, jobId: job.id }, 'Processing research job');
      await runResearchPipeline(contactId);
    },
    {
      connection,
      concurrency: 3,
      limiter: { max: 5, duration: 60000 },
    }
  );

  researchWorker.on('completed', (job) => {
    logger.info({ jobId: job.id }, 'Research job completed');
  });

  researchWorker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, err }, 'Research job failed');
  });

  workers.push(researchWorker);

  // Notion sync worker
  const notionWorker = new Worker(
    'notion-sync',
    async (job: Job) => {
      const { type, entityId } = job.data;
      logger.info({ type, entityId, jobId: job.id }, 'Processing Notion sync job');

      const { syncContactToNotion, syncInteractionToNotion } = await import(
        '../notion/sync.service.js'
      );

      switch (type) {
        case 'contact':
          await syncContactToNotion(entityId);
          break;
        case 'interaction':
          await syncInteractionToNotion(entityId);
          break;
        default:
          logger.warn({ type }, 'Unknown Notion sync type');
      }
    },
    {
      connection,
      concurrency: 1,
      limiter: { max: 2, duration: 1000 }, // 2 per second (Notion rate limit)
    }
  );

  notionWorker.on('completed', (job) => {
    logger.info({ jobId: job.id }, 'Notion sync job completed');
  });

  notionWorker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, err }, 'Notion sync job failed');
  });

  workers.push(notionWorker);

  logger.info('BullMQ workers initialized');
}

export async function closeWorkers(): Promise<void> {
  logger.info(`Closing ${workers.length} BullMQ workers`);
  await Promise.all(workers.map((w) => w.close()));
  logger.info('All BullMQ workers closed');
}
