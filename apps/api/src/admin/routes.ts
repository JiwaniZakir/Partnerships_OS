import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requireAdmin } from '../auth/middleware.js';
import { discoverForEvent, analyzeNetworkGaps } from '../graph/discovery.service.js';
import { getContactStats } from '../contacts/service.js';
import { getLeaderboard } from '../members/service.js';
import { getActiveJobCount } from '../jobs/dispatcher.js';
import { discoverSchema } from '@fpos/shared';

export async function adminRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireAdmin);

  app.get('/admin/stats', async () => {
    const stats = await getContactStats();
    const leaderboard = await getLeaderboard();
    return { ...stats, leaderboard };
  });

  app.post('/graph/discover', async (request) => {
    const { description, maxResults } = discoverSchema.parse(request.body);
    return discoverForEvent(description, maxResults);
  });

  app.get('/graph/gaps', async () => {
    return analyzeNetworkGaps();
  });

  app.get('/health/queues', async () => {
    return { activeJobs: getActiveJobCount() };
  });
}
