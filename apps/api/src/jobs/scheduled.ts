import { CronJob } from 'cron';
import { getPrisma } from '../config/database.js';
import { logger } from '../utils/logger.js';
import { getResearchQueue, getNotionSyncQueue } from './queues.js';

let reconciliationJob: CronJob | null = null;
let researchRefreshJob: CronJob | null = null;

export function initScheduledJobs(): void {
  // Notion reconciliation every 6 hours
  reconciliationJob = new CronJob('0 */6 * * *', async () => {
    logger.info('Starting scheduled Notion reconciliation');
    try {
      await runReconciliation();
    } catch (err) {
      logger.error({ err }, 'Scheduled Notion reconciliation failed');
    }
  });
  reconciliationJob.start();

  // Research refresh: monthly on 1st at 2am
  researchRefreshJob = new CronJob('0 2 1 * *', async () => {
    logger.info('Starting scheduled research refresh');
    try {
      await refreshStaleResearch();
    } catch (err) {
      logger.error({ err }, 'Scheduled research refresh failed');
    }
  });
  researchRefreshJob.start();

  logger.info('Scheduled jobs initialized (reconciliation: 6h, research refresh: monthly)');
}

export function stopScheduledJobs(): void {
  reconciliationJob?.stop();
  researchRefreshJob?.stop();
}

async function runReconciliation(): Promise<void> {
  const prisma = getPrisma();
  const contacts = await prisma.contact.findMany({
    where: { status: 'ACTIVE', notionPageId: { not: null } },
    select: { id: true },
    take: 200,
  });

  const notionQueue = getNotionSyncQueue();
  for (const contact of contacts) {
    await notionQueue.add('sync-contact', { type: 'contact', entityId: contact.id });
  }
  logger.info({ count: contacts.length }, 'Reconciliation: queued Notion sync jobs');
}

async function refreshStaleResearch(): Promise<void> {
  const prisma = getPrisma();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const staleContacts = await prisma.contact.findMany({
    where: {
      status: 'ACTIVE',
      OR: [
        { researchLastUpdated: null },
        { researchLastUpdated: { lt: thirtyDaysAgo } },
      ],
    },
    select: { id: true },
    take: 50,
  });

  const researchQueue = getResearchQueue();
  for (const contact of staleContacts) {
    await researchQueue.add('research', { contactId: contact.id });
  }
  logger.info({ count: staleContacts.length }, 'Research refresh: queued stale contacts');
}
