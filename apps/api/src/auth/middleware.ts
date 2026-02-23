import type { FastifyRequest, FastifyReply } from 'fastify';
import { verifyAccessToken, type TokenPayload } from './jwt.js';
import { AuthError, ForbiddenError } from '../utils/errors.js';
import { getPrisma } from '../config/database.js';

declare module 'fastify' {
  interface FastifyRequest {
    member: TokenPayload;
  }
}

export async function requireAuth(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const authHeader = request.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    throw new AuthError('Missing or invalid authorization header');
  }

  const token = authHeader.slice(7);
  try {
    request.member = await verifyAccessToken(token);
  } catch {
    throw new AuthError('Invalid or expired token');
  }
}

export async function requireAdmin(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  await requireAuth(request, reply);
  if (!request.member.isAdmin) {
    throw new ForbiddenError('Admin access required');
  }

  // Re-verify admin status from the database to prevent stale JWT claims
  const prisma = getPrisma();
  const member = await prisma.member.findUnique({
    where: { id: request.member.sub },
    select: { isAdmin: true, isActive: true },
  });

  if (!member || !member.isActive || !member.isAdmin) {
    throw new ForbiddenError('Admin access required');
  }
}
