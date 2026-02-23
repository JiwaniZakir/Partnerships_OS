import type { FastifyInstance } from 'fastify';
import { contactCreateSchema, contactUpdateSchema, contactFilterSchema } from '@fpos/shared';
import { requireAuth, requireAdmin } from '../auth/middleware.js';
import * as contactService from './service.js';
import { getResearchQueue, getNotionSyncQueue } from '../jobs/queues.js';
import { logger } from '../utils/logger.js';

export async function contactRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireAuth);

  app.get('/contacts', async (request) => {
    const filters = contactFilterSchema.parse(request.query);
    return contactService.listContacts(filters);
  });

  app.get('/contacts/stats', async () => {
    return contactService.getContactStats();
  });

  app.get<{ Params: { id: string } }>('/contacts/:id', async (request) => {
    return contactService.getContact(request.params.id);
  });

  app.post('/contacts', async (request, reply) => {
    const data = contactCreateSchema.parse(request.body);
    const contact = await contactService.createContact(data, request.member.sub);

    logger.info(
      { contactId: contact.id, memberId: request.member.sub },
      'Contact created'
    );

    // Fire-and-forget: enqueue research and Notion sync jobs
    getResearchQueue()
      .add('research', { contactId: contact.id })
      .catch((err) => logger.error({ err, contactId: contact.id }, 'Failed to enqueue research job'));
    getNotionSyncQueue()
      .add('sync-contact', { type: 'contact', entityId: contact.id })
      .catch((err) => logger.error({ err, contactId: contact.id }, 'Failed to enqueue Notion sync job'));

    reply.status(201);
    return contact;
  });

  app.patch<{ Params: { id: string } }>('/contacts/:id', async (request) => {
    const data = contactUpdateSchema.parse(request.body);
    const requestingMember = { sub: request.member.sub, isAdmin: request.member.isAdmin };
    return contactService.updateContact(request.params.id, data, requestingMember);
  });

  app.delete<{ Params: { id: string } }>(
    '/contacts/:id',
    async (request, reply) => {
      const requestingMember = { sub: request.member.sub, isAdmin: request.member.isAdmin };
      await contactService.archiveContact(request.params.id, requestingMember);
      reply.status(204);
    }
  );
}
