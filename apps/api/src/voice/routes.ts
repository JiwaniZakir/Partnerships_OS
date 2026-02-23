import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requireAuth } from '../auth/middleware.js';
import {
  createSession,
  getSession,
  destroySession,
  processMessage,
} from './agent.js';
import { randomUUID } from 'crypto';
import { logger } from '../utils/logger.js';

export async function voiceRoutes(app: FastifyInstance): Promise<void> {
  // Create voice session
  app.post(
    '/voice/session',
    { preHandler: [requireAuth] },
    async (request) => {
      const sessionId = randomUUID();
      createSession(
        sessionId,
        request.member.sub,
        request.member.name,
        request.member.role
      );

      logger.info(
        { sessionId, memberId: request.member.sub },
        'Voice session created'
      );

      return { sessionId };
    }
  );

  // Text-based message endpoint (for testing and fallback)
  app.post(
    '/voice/message',
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const { sessionId, message } = z
        .object({
          sessionId: z.string().uuid(),
          message: z.string().min(1).max(5000),
        })
        .parse(request.body);

      const session = getSession(sessionId);
      if (!session) {
        reply.status(404);
        return { error: 'Session not found. Create a new session first.' };
      }

      const response = await processMessage(sessionId, message);
      return { response };
    }
  );

  // End voice session
  app.delete<{ Params: { sessionId: string } }>(
    '/voice/session/:sessionId',
    { preHandler: [requireAuth] },
    async (request, reply) => {
      destroySession(request.params.sessionId);
      reply.status(204);
    }
  );

  // WebSocket endpoint for real-time voice
  try {
    const websocket = await import('@fastify/websocket');
    await app.register(websocket.default);

    // WebSocket close codes
    const WS_CLOSE_AUTH_FAILED = 4001;
    const WS_CLOSE_RATE_LIMIT = 4002;
    const WS_CLOSE_MSG_TOO_LARGE = 4003;

    // Configuration
    const AUTH_TIMEOUT_MS = 5000;
    const MAX_MSG_SIZE_BYTES = 64 * 1024; // 64KB
    const MAX_MESSAGES_PER_SECOND = 30;

    app.get(
      '/voice/ws',
      { websocket: true },
      (socket, request) => {
        const sessionId = randomUUID();
        let memberId: string | null = null;
        let authenticated = false;

        // Rate limiting state
        let messageTimestamps: number[] = [];

        // Auth timeout: close connection if not authenticated within 5 seconds
        const authTimer = setTimeout(() => {
          if (!authenticated) {
            logger.warn({ sessionId }, 'WebSocket auth timeout — closing');
            socket.close(WS_CLOSE_AUTH_FAILED, 'Authentication timeout');
          }
        }, AUTH_TIMEOUT_MS);

        socket.on('message', async (raw: Buffer) => {
          try {
            // Message size limit check (64KB)
            if (raw.byteLength > MAX_MSG_SIZE_BYTES) {
              logger.warn(
                { sessionId, size: raw.byteLength },
                'WebSocket message too large'
              );
              socket.close(WS_CLOSE_MSG_TOO_LARGE, 'Message too large');
              return;
            }

            // Rate limiting: max 30 messages/second
            const now = Date.now();
            messageTimestamps = messageTimestamps.filter(
              (ts) => now - ts < 1000
            );
            messageTimestamps.push(now);
            if (messageTimestamps.length > MAX_MESSAGES_PER_SECOND) {
              logger.warn({ sessionId, memberId }, 'WebSocket rate limit exceeded');
              socket.close(WS_CLOSE_RATE_LIMIT, 'Rate limit exceeded');
              return;
            }

            const msg = JSON.parse(raw.toString());

            if (msg.type === 'auth') {
              // Authenticate WebSocket connection
              const { verifyAccessToken } = await import('../auth/jwt.js');
              const payload = await verifyAccessToken(msg.token);
              memberId = payload.sub;
              authenticated = true;
              clearTimeout(authTimer);
              createSession(sessionId, payload.sub, payload.name, payload.role);
              socket.send(
                JSON.stringify({ type: 'authenticated', sessionId })
              );
              return;
            }

            // All messages below require authentication
            if (!authenticated) {
              socket.send(
                JSON.stringify({
                  type: 'error',
                  message: 'Not authenticated. Send an auth message first.',
                })
              );
              return;
            }

            if (msg.type === 'text') {
              // Session ownership validation
              const session = getSession(sessionId);
              if (!session) {
                socket.send(
                  JSON.stringify({ type: 'error', message: 'Session not found' })
                );
                return;
              }

              const response = await processMessage(sessionId, msg.content);
              socket.send(
                JSON.stringify({ type: 'response', content: response })
              );
              return;
            }

            if (msg.type === 'audio') {
              // Session ownership validation
              const session = getSession(sessionId);
              if (!session) {
                socket.send(
                  JSON.stringify({ type: 'error', message: 'Session not found' })
                );
                return;
              }

              // Audio data would be sent to Deepgram STT here
              // For now, acknowledge receipt
              socket.send(
                JSON.stringify({
                  type: 'status',
                  status: 'processing',
                })
              );
            }
          } catch (err) {
            logger.error({ err }, 'WebSocket message error');
            if (!authenticated) {
              socket.close(WS_CLOSE_AUTH_FAILED, 'Authentication failed');
            } else {
              socket.send(
                JSON.stringify({ type: 'error', message: 'Processing error' })
              );
            }
          }
        });

        socket.on('close', () => {
          clearTimeout(authTimer);
          destroySession(sessionId);
          logger.info({ sessionId, memberId }, 'Voice session closed');
        });
      }
    );
  } catch (err) {
    logger.warn('WebSocket plugin not available — voice WS disabled');
  }
}
