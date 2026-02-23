import type { FastifyInstance } from 'fastify';
import { paginationSchema } from '@fpos/shared';
import { requireAuth, requireAdmin } from '../auth/middleware.js';
import * as memberService from './service.js';

export async function memberRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireAuth);

  app.get('/members', async () => {
    return memberService.listMembers();
  });

  app.get('/members/leaderboard', async () => {
    return memberService.getLeaderboard();
  });

  app.get<{ Params: { id: string } }>('/members/:id', async (request) => {
    return memberService.getMember(request.params.id);
  });

  app.get<{ Params: { id: string } }>(
    '/members/:id/contacts',
    async (request) => {
      const { page, limit } = paginationSchema.parse(request.query);
      return memberService.getMemberContacts(request.params.id, page, limit);
    }
  );
}
