import type { FastifyInstance } from 'fastify';
import { interactionCreateSchema, interactionFilterSchema } from '@fpos/shared';
import { requireAuth } from '../auth/middleware.js';
import * as interactionService from './service.js';
import { dispatchNotionSync } from '../jobs/dispatcher.js';
import { logger } from '../utils/logger.js';

export async function interactionRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireAuth);

  app.get('/interactions', async (request) => {
    const filters = interactionFilterSchema.parse(request.query);
    return interactionService.listInteractions(filters);
  });

  app.get<{ Params: { id: string } }>('/interactions/:id', async (request) => {
    return interactionService.getInteraction(request.params.id);
  });

  app.post('/interactions', async (request, reply) => {
    const data = interactionCreateSchema.parse(request.body);
    const interaction = await interactionService.createInteraction(
      data,
      request.member.sub
    );

    logger.info(
      { interactionId: interaction.id, contactId: data.contactId },
      'Interaction logged'
    );

    // Fire-and-forget: sync interaction to Notion
    dispatchNotionSync('interaction', interaction.id);

    reply.status(201);
    return interaction;
  });
}
