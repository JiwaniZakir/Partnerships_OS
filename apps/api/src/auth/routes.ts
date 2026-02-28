import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { verifyGoogleToken } from './google.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from './jwt.js';
import { isApprovedMember, isAdminMember } from '../config/approved-members.js';
import { getPrisma } from '../config/database.js';
import { getRedis } from '../config/database.js';
import { requireAuth } from './middleware.js';
import { AuthError, ForbiddenError } from '../utils/errors.js';
import { randomUUID } from 'crypto';
import { logger } from '../utils/logger.js';

const googleAuthSchema = z.object({
  idToken: z.string().min(1),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

const devLoginSchema = z.object({
  email: z.string().email(),
});

export async function authRoutes(app: FastifyInstance): Promise<void> {
  const prisma = getPrisma();
  const redis = getRedis();

  // Dev login bypass — enabled in development OR when DEV_LOGIN_ENABLED=true
  // Safe: still restricted to approved members list
  const devLoginEnabled =
    process.env.NODE_ENV === 'development' ||
    process.env.DEV_LOGIN_ENABLED === 'true';

  if (devLoginEnabled) {
    app.post('/auth/dev-login', async (request) => {
      const body = devLoginSchema.parse(request.body);
      const email = body.email.toLowerCase();

      if (!isApprovedMember(email)) {
        throw new ForbiddenError('Access restricted to approved members');
      }

      const isAdmin = isAdminMember(email);
      const tokenFamily = randomUUID();
      const name = email.split('@')[0]!;

      const member = await prisma.member.upsert({
        where: { email },
        update: {
          refreshTokenFamily: tokenFamily,
        },
        create: {
          email,
          name,
          googleId: `dev-${randomUUID()}`,
          isAdmin,
          refreshTokenFamily: tokenFamily,
        },
      });

      const accessToken = await signAccessToken({
        sub: member.id,
        email: member.email,
        name: member.name,
        role: member.role,
        isAdmin: member.isAdmin,
      });

      const refreshToken = await signRefreshToken({
        sub: member.id,
        family: tokenFamily,
      });

      await redis.set(`refresh:${tokenFamily}`, member.id, 'EX', 30 * 24 * 60 * 60);

      logger.info({ memberId: member.id, email: member.email }, 'Member authenticated via dev-login');

      return {
        accessToken,
        refreshToken,
        member: {
          id: member.id,
          email: member.email,
          name: member.name,
          role: member.role,
          isAdmin: member.isAdmin,
          avatarUrl: member.avatarUrl,
        },
      };
    });
  }

  app.post('/auth/google', async (request, reply) => {
    const body = googleAuthSchema.parse(request.body);
    const googleUser = await verifyGoogleToken(body.idToken);

    if (!isApprovedMember(googleUser.email)) {
      throw new ForbiddenError('Access restricted to approved members');
    }

    const isAdmin = isAdminMember(googleUser.email);
    const tokenFamily = randomUUID();

    const member = await prisma.member.upsert({
      where: { googleId: googleUser.googleId },
      update: {
        name: googleUser.name,
        avatarUrl: googleUser.avatarUrl,
        refreshTokenFamily: tokenFamily,
      },
      create: {
        email: googleUser.email,
        name: googleUser.name,
        googleId: googleUser.googleId,
        avatarUrl: googleUser.avatarUrl,
        isAdmin,
        refreshTokenFamily: tokenFamily,
      },
    });

    const accessToken = await signAccessToken({
      sub: member.id,
      email: member.email,
      name: member.name,
      role: member.role,
      isAdmin: member.isAdmin,
    });

    const refreshToken = await signRefreshToken({
      sub: member.id,
      family: tokenFamily,
    });

    await redis.set(`refresh:${tokenFamily}`, member.id, 'EX', 30 * 24 * 60 * 60);

    logger.info({ memberId: member.id, email: member.email }, 'Member authenticated');

    return {
      accessToken,
      refreshToken,
      member: {
        id: member.id,
        email: member.email,
        name: member.name,
        role: member.role,
        isAdmin: member.isAdmin,
        avatarUrl: member.avatarUrl,
      },
    };
  });

  app.get('/auth/me', { preHandler: [requireAuth] }, async (request) => {
    const member = await prisma.member.findUnique({
      where: { id: request.member.sub },
    });
    if (!member) throw new AuthError('Member not found');

    return {
      id: member.id,
      email: member.email,
      name: member.name,
      role: member.role,
      isAdmin: member.isAdmin,
      avatarUrl: member.avatarUrl,
      joinedAt: member.joinedAt,
    };
  });

  app.post('/auth/refresh', async (request) => {
    const body = refreshSchema.parse(request.body);

    let payload;
    try {
      payload = await verifyRefreshToken(body.refreshToken);
    } catch {
      throw new AuthError('Invalid refresh token');
    }

    const storedMemberId = await redis.get(`refresh:${payload.family}`);
    if (!storedMemberId || storedMemberId !== payload.sub) {
      // Token family compromise detected — revoke entire family
      await redis.del(`refresh:${payload.family}`);
      logger.warn({ family: payload.family }, 'Refresh token replay detected');
      throw new AuthError('Token revoked — please re-authenticate');
    }

    const member = await prisma.member.findUnique({
      where: { id: payload.sub },
    });
    if (!member || !member.isActive) {
      throw new AuthError('Member not found or inactive');
    }

    // Rotate token family
    const newFamily = randomUUID();
    await redis.del(`refresh:${payload.family}`);
    await redis.set(`refresh:${newFamily}`, member.id, 'EX', 30 * 24 * 60 * 60);
    await prisma.member.update({
      where: { id: member.id },
      data: { refreshTokenFamily: newFamily },
    });

    const accessToken = await signAccessToken({
      sub: member.id,
      email: member.email,
      name: member.name,
      role: member.role,
      isAdmin: member.isAdmin,
    });

    const refreshToken = await signRefreshToken({
      sub: member.id,
      family: newFamily,
    });

    return { accessToken, refreshToken };
  });
}
