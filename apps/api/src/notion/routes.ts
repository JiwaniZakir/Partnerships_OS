import type { FastifyInstance } from 'fastify';
import { requireAdmin } from '../auth/middleware.js';
import { runReconciliation } from './sync.service.js';

export async function notionRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireAdmin);

  app.post('/notion/sync', async (request, reply) => {
    // Run reconciliation in background
    runReconciliation().catch((err) => {
      request.log.error({ err }, 'Notion reconciliation failed');
    });

    reply.status(202);
    return { message: 'Notion sync initiated' };
  });

  app.get('/notion/status', async () => {
    const apiKey = process.env.NOTION_API_KEY;
    const masterDbId = process.env.NOTION_MASTER_DB_ID;

    return {
      configured: !!apiKey && !!masterDbId,
      apiKeySet: !!apiKey,
      masterDbIdSet: !!masterDbId,
      interactionsDbIdSet: !!process.env.NOTION_INTERACTIONS_DB_ID,
      orgsDbIdSet: !!process.env.NOTION_ORGS_DB_ID,
    };
  });
}
