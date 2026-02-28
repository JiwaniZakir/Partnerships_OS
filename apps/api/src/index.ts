import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import { randomUUID } from 'crypto';
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
import { registerJobHandler } from './jobs/dispatcher.js';
import { stopSessionCleanup } from './voice/agent.js';

async function main(): Promise<void> {
  loadEnv();
  const env = getEnv();

  const app = Fastify({
    logger: false,
    trustProxy: env.NODE_ENV === 'production',
    requestIdHeader: 'x-request-id',
    genReqId: () => randomUUID(),
  });

  // Request ID tracking for audit trail
  app.addHook('onRequest', (request, reply, done) => {
    reply.header('X-Request-Id', request.id);
    done();
  });

  // Security plugins
  await app.register(helmet, {
    contentSecurityPolicy: env.NODE_ENV === 'production' ? undefined : false,
    hsts: env.NODE_ENV === 'production'
      ? { maxAge: 63072000, includeSubDomains: true, preload: true }
      : false,
  });

  // CORS: use env-driven origins, no hardcoded production URLs
  const allowedOrigins = [env.WEB_URL];
  if (env.NODE_ENV === 'development') {
    allowedOrigins.push('http://localhost:3000', 'http://localhost:19006');
  }

  await app.register(cors, {
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
    maxAge: 86400,
  });

  // Rate limiting — in-memory (no Redis dependency)
  await app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
    keyGenerator: (request) => request.member?.sub || request.ip,
  });

  await app.register(
    async function authRateLimitPlugin(instance) {
      await instance.register(rateLimit, {
        max: 10,
        timeWindow: '5 minutes',
        keyGenerator: (request) => `auth:${request.ip}`,
      });
    },
    { prefix: '/auth' }
  );

  await app.register(
    async function researchRateLimitPlugin(instance) {
      await instance.register(rateLimit, {
        max: 20,
        timeWindow: '1 minute',
        keyGenerator: (request) => `research:${request.member?.sub || request.ip}`,
      });
    },
    { prefix: '/contacts' }
  );

  // Global error handler
  app.setErrorHandler((error: Error & { validation?: unknown; statusCode?: number; code?: string }, request, reply) => {
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

    logger.error({ err: error, path: request.url, requestId: request.id }, 'Unexpected error');
    return reply.status(500).send({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
      requestId: request.id,
    });
  });

  // Health checks
  app.get('/health', async () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '0.1.0',
  }));

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

    const redisClient = getRedis();
    if (redisClient) {
      try {
        await redisClient.ping();
        checks.redis = 'ok';
      } catch {
        checks.redis = 'error';
      }
    } else {
      checks.redis = 'disabled';
    }

    const apiKeys = {
      anthropic: !!process.env.ANTHROPIC_API_KEY,
      openai: !!process.env.OPENAI_API_KEY,
      notion: !!process.env.NOTION_API_KEY,
      deepgram: !!process.env.DEEPGRAM_API_KEY,
      tavily: !!process.env.TAVILY_API_KEY,
      proxycurl: !!process.env.PROXYCURL_API_KEY,
    };

    const allOk = Object.values(checks).every((v) => v === 'ok');
    const statusCode = allOk ? 200 : 503;
    return reply.status(statusCode).send({ status: allOk ? 'ok' : 'degraded', checks, apiKeys });
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

  // Register inline job handlers (replaces BullMQ workers)
  registerJobHandler('research', async (data) => {
    const { runResearchPipeline } = await import('./research/pipeline.js');
    await runResearchPipeline(data.contactId as string);
  });

  registerJobHandler('notion-sync', async (data) => {
    const { syncContactToNotion, syncInteractionToNotion } = await import('./notion/sync.service.js');
    if (data.type === 'contact') await syncContactToNotion(data.entityId as string);
    else if (data.type === 'interaction') await syncInteractionToNotion(data.entityId as string);
  });

  logger.info('Inline job handlers registered');

  // Start server
  const port = env.API_PORT;
  await app.listen({ port, host: '0.0.0.0' });
  logger.info(`API server running on http://localhost:${port}`);

  // Graceful shutdown
  const shutdown = async (signal: string): Promise<void> => {
    logger.info(`${signal} received — shutting down`);
    stopSessionCleanup();
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
