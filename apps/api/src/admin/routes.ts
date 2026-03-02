import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requireAdmin } from '../auth/middleware.js';
import { discoverForEvent, analyzeNetworkGaps } from '../graph/discovery.service.js';
import { getContactStats } from '../contacts/service.js';
import { getLeaderboard } from '../members/service.js';
import { getActiveJobCount } from '../jobs/dispatcher.js';
import { discoverSchema } from '@fpos/shared';
import { getApprovedMembers, addApprovedMember, removeApprovedMember } from '../config/approved-members.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';

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

  // Member management
  app.get('/admin/members', async () => {
    return { members: getApprovedMembers() };
  });

  app.post('/admin/members', async (request) => {
    const body = z.object({ email: z.string().email() }).parse(request.body);
    const added = addApprovedMember(body.email);
    if (!added) throw new ValidationError('Member already exists');
    return { ok: true, email: body.email };
  });

  app.delete('/admin/members/:email', async (request) => {
    const { email } = request.params as { email: string };
    const removed = removeApprovedMember(decodeURIComponent(email));
    if (!removed) throw new NotFoundError('Member not found');
    return { ok: true };
  });
}
