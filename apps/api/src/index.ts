import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import { loadEnv, getEnv } from './config/env.js';
import { getPrisma, getNeo4j, getRedis, closeConnections } from './config/database.js';
import { logger } from './utils/logger.js';
import { AppError } from './utils/errors.js';
import { authRoutes } from './auth/routes.js';
import { contactRoutes } from './contacts/routes.js';
import { interactionRoutes } from './interactions/routes.js';
import { memberRoutes } from './members/routes.js';
import { graphRoutes } from './graph/routes.js';
import { researchRoutes } from './research/routes.js';
import { voiceRoutes } from './voice/routes.js';
import { notionRoutes } from './notion/routes.js';
import { adminRoutes } from './admin/routes.js';
import { initNeo4jSchema } from './graph/neo4j.service.js';
import { initWorkers, closeWorkers } from './jobs/worker.js';
import { stopSessionCleanup } from './voice/agent.js';

async function main(): Promise<void> {
  loadEnv();
  const env = getEnv();

  const app = Fastify({
    logger: false,
  });

  // Security plugins
  await app.register(helmet, {
    contentSecurityPolicy: env.NODE_ENV === 'production' ? undefined : false,
  });

  await app.register(cors, {
    origin: [
      env.WEB_URL,
      'https://partnerships.foundryphl.com',
      'https://foundryphl.com',
      ...(env.NODE_ENV === 'development' ? ['http://localhost:3000'] : []),
    ],
    credentials: true,
  });

  await app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
    redis: getRedis(),
    keyGenerator: (request) => {
      return request.member?.sub || request.ip;
    },
  });

  // Global error handler
  app.setErrorHandler((error, request, reply) => {
    if (error instanceof AppError) {
      logger.warn({ err: error, path: request.url }, error.message);
      return reply.status(error.statusCode).send({
        error: error.message,
        code: error.code,
        ...(error instanceof AppError && 'details' in error
          ? { details: (error as any).details }
          : {}),
      });
    }

    // Zod validation errors
    if (error.name === 'ZodError') {
      return reply.status(400).send({
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: (error as any).issues,
      });
    }

    // Fastify validation errors
    if (error.validation) {
      return reply.status(400).send({
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: error.validation,
      });
    }

    logger.error({ err: error, path: request.url }, 'Unexpected error');
    return reply.status(500).send({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
    });
  });

  // Health checks
  app.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));

  app.get('/health/ready', async (_request, reply) => {
    const checks: Record<string, string> = {};

    try {
      await getPrisma().$queryRaw`SELECT 1`;
      checks.postgresql = 'ok';
    } catch {
      checks.postgresql = 'error';
    }

    try {
      const neo4j = getNeo4j();
      const session = neo4j.session();
      await session.run('RETURN 1');
      await session.close();
      checks.neo4j = 'ok';
    } catch {
      checks.neo4j = 'error';
    }

    try {
      await getRedis().ping();
      checks.redis = 'ok';
    } catch {
      checks.redis = 'error';
    }

    const allOk = Object.values(checks).every((v) => v === 'ok');
    const statusCode = allOk ? 200 : 503;
    return reply.status(statusCode).send({ status: allOk ? 'ok' : 'degraded', checks });
  });

  // Register routes
  await app.register(authRoutes);
  await app.register(contactRoutes);
  await app.register(interactionRoutes);
  await app.register(memberRoutes);
  await app.register(graphRoutes);
  await app.register(researchRoutes);
  await app.register(voiceRoutes);
  await app.register(notionRoutes);
  await app.register(adminRoutes);

  // Initialize services
  try {
    await initNeo4jSchema();
    logger.info('Neo4j schema initialized');
  } catch (err) {
    logger.warn({ err }, 'Neo4j schema init failed — graph features may be unavailable');
  }

  try {
    initWorkers();
    logger.info('BullMQ workers initialized');
  } catch (err) {
    logger.warn({ err }, 'BullMQ worker init failed — background jobs may be unavailable');
  }

  // Start server
  const port = env.API_PORT;
  await app.listen({ port, host: '0.0.0.0' });
  logger.info(`API server running on http://localhost:${port}`);

  // Graceful shutdown
  const shutdown = async (signal: string): Promise<void> => {
    logger.info(`${signal} received — shutting down`);
    stopSessionCleanup();
    await closeWorkers();
    await app.close();
    await closeConnections();
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

process.on('unhandledRejection', (reason) => {
  logger.error({ err: reason }, 'Unhandled rejection');
});

process.on('uncaughtException', (err) => {
  logger.error({ err }, 'Uncaught exception');
  process.exit(1);
});

main().catch((err) => {
  logger.error({ err }, 'Failed to start server');
  process.exit(1);
});
