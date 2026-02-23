import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requireAuth, requireAdmin } from '../auth/middleware.js';
import * as neo4jService from './neo4j.service.js';

const uuidSchema = z.string().uuid('Invalid UUID format');

export async function graphRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireAuth);

  // Full graph is admin-only (expensive query, exposes entire network)
  app.get('/graph/full', { preHandler: requireAdmin }, async () => {
    return neo4jService.getFullGraph();
  });

  app.get('/graph/search', async (request) => {
    const { q } = z.object({ q: z.string().min(1) }).parse(request.query);
    return neo4jService.searchNodes(q);
  });

  app.get<{ Params: { id: string } }>(
    '/graph/neighborhood/:id',
    async (request) => {
      uuidSchema.parse(request.params.id);
      const { depth } = z
        .object({ depth: z.coerce.number().int().min(1).max(3).default(2) })
        .parse(request.query);
      return neo4jService.getContactNeighborhood(request.params.id, depth);
    }
  );

  app.get<{ Params: { from: string; to: string } }>(
    '/graph/path/:from/:to',
    async (request) => {
      uuidSchema.parse(request.params.from);
      uuidSchema.parse(request.params.to);
      const result = await neo4jService.findShortestPath(
        request.params.from,
        request.params.to
      );
      if (!result) {
        return { found: false, path: null };
      }
      return { found: true, path: result };
    }
  );
}
