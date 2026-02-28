import { PrismaClient } from '@prisma/client';
import neo4j, { Driver } from 'neo4j-driver';
import Redis from 'ioredis';
import { getEnv } from './env.js';
import { logger } from '../utils/logger.js';

let prisma: PrismaClient;
let neo4jDriver: Driver;
let redis: Redis | null = null;
let redisAvailable = false;

export function getPrisma(): PrismaClient {
  if (!prisma) {
    prisma = new PrismaClient({
      log: getEnv().NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
    });
  }
  return prisma;
}

export function getNeo4j(): Driver {
  if (!neo4jDriver) {
    const env = getEnv();
    neo4jDriver = neo4j.driver(
      env.NEO4J_URI,
      neo4j.auth.basic(env.NEO4J_USER, env.NEO4J_PASSWORD)
    );
  }
  return neo4jDriver;
}

export function getRedis(): Redis | null {
  if (redis) return redis;
  const url = getEnv().REDIS_URL;
  if (!url) return null;
  try {
    redis = new Redis(url, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      lazyConnect: true,
    });
    redis.on('error', (err) => {
      logger.warn({ err: err.message }, 'Redis error — falling back to in-memory');
      redisAvailable = false;
    });
    redis.on('ready', () => { redisAvailable = true; });
    redis.connect().catch(() => { redisAvailable = false; });
  } catch {
    redis = null;
  }
  return redis;
}

export function isRedisAvailable(): boolean {
  return redisAvailable;
}

export async function closeConnections(): Promise<void> {
  const closers: Promise<void>[] = [];
  if (prisma) closers.push(prisma.$disconnect());
  if (neo4jDriver) closers.push(neo4jDriver.close());
  if (redis) closers.push(redis.quit().then(() => {}));
  await Promise.allSettled(closers);
  logger.info('All database connections closed');
}
