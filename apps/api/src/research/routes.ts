import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requireAuth } from '../auth/middleware.js';
import { runResearchPipeline } from './pipeline.js';
import { semanticSearch } from './embeddings.js';
import { logger } from '../utils/logger.js';
import { getResearchQueue } from '../jobs/worker.js';
import { getPrisma } from '../config/database.js';
import { NotFoundError, ForbiddenError } from '../utils/errors.js';

export async function researchRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireAuth);

  // Trigger research for a contact
  app.post<{ Params: { id: string } }>(
    '/contacts/:id/research',
    async (request, reply) => {
      const contactId = request.params.id;

      // Ownership check: only the onboarding member or an admin can trigger research
      const prisma = getPrisma();
      const contact = await prisma.contact.findUnique({
        where: { id: contactId },
        select: { onboardedById: true },
      });
      if (!contact) throw new NotFoundError();
      if (contact.onboardedById !== request.member.sub && !request.member.isAdmin) {
        throw new ForbiddenError('You can only trigger research for contacts you onboarded');
      }

      try {
        const queue = getResearchQueue();
        await queue.add('research', { contactId }, {
          attempts: 3,
          backoff: { type: 'exponential', delay: 5000 },
        });
        logger.info({ contactId }, 'Research job queued');
      } catch {
        // Fallback to direct execution if queue unavailable
        runResearchPipeline(contactId).catch((err) => {
          logger.error({ err, contactId }, 'Background research failed');
        });
      }

      reply.status(202);
      return { message: 'Research pipeline triggered', contactId };
    }
  );

  // Semantic search
  app.get('/search', async (request) => {
    const { q, limit } = z
      .object({
        q: z.string().min(1),
        limit: z.coerce.number().int().min(1).max(50).default(10),
      })
      .parse(request.query);

    return semanticSearch(q, limit);
  });
}
