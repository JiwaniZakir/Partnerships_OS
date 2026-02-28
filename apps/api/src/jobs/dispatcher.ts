import { logger } from '../utils/logger.js';

/**
 * Simple async job dispatcher that replaces BullMQ.
 * Runs jobs inline (fire-and-forget) — no Redis polling, no workers.
 * For a low-traffic app, this is simpler and cheaper than a full job queue.
 */

type JobHandler = (data: Record<string, unknown>) => Promise<void>;

const handlers: Record<string, JobHandler> = {};
let activeJobs = 0;

export function registerJobHandler(name: string, handler: JobHandler): void {
  handlers[name] = handler;
}

export function dispatchJob(name: string, data: Record<string, unknown>): void {
  const handler = handlers[name];
  if (!handler) {
    logger.warn({ name, data }, 'No handler registered for job — skipping');
    return;
  }

  activeJobs++;
  handler(data)
    .catch((err) => logger.error({ err, job: name, data }, `Job "${name}" failed`))
    .finally(() => { activeJobs--; });
}

export function getActiveJobCount(): number {
  return activeJobs;
}

/**
 * Dispatch a research job for a contact.
 */
export function dispatchResearch(contactId: string): void {
  dispatchJob('research', { contactId });
}

/**
 * Dispatch a Notion sync job for a contact or interaction.
 */
export function dispatchNotionSync(type: 'contact' | 'interaction', entityId: string): void {
  dispatchJob('notion-sync', { type, entityId });
}
