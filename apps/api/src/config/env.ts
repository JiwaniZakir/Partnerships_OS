import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  API_PORT: z.coerce.number().default(3001),
  API_URL: z.string().default('http://localhost:3001'),
  WEB_URL: z.string().default('http://localhost:3000'),

  DATABASE_URL: z.string(),
  NEO4J_URI: z.string().default('bolt://localhost:7687'),
  NEO4J_USER: z.string().default('neo4j'),
  NEO4J_PASSWORD: z.string(),
  REDIS_URL: z.string().default('redis://localhost:6379'),

  GOOGLE_CLIENT_ID: z.string(),
  GOOGLE_CLIENT_SECRET: z.string(),
  JWT_PRIVATE_KEY: z.string(),
  JWT_PUBLIC_KEY: z.string(),
  ALLOWED_DOMAIN: z.string().default('example.com'),

  ANTHROPIC_API_KEY: z.string(),
  OPENAI_API_KEY: z.string(),
  DEEPGRAM_API_KEY: z.string().optional(),
  ELEVENLABS_API_KEY: z.string().optional(),

  TAVILY_API_KEY: z.string().optional(),
  PROXYCURL_API_KEY: z.string().optional(),
  SERP_API_KEY: z.string().optional(),

  NOTION_API_KEY: z.string().optional(),
  NOTION_MASTER_DB_ID: z.string().optional(),
  NOTION_INTERACTIONS_DB_ID: z.string().optional(),
  NOTION_ORGS_DB_ID: z.string().optional(),

  PII_ENCRYPTION_KEY: z.string().min(32),
});

export type Env = z.infer<typeof envSchema>;

let env: Env;

export function loadEnv(): Env {
  if (env) return env;
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error('Invalid environment variables:', result.error.flatten().fieldErrors);
    process.exit(1);
  }
  env = result.data;
  return env;
}

export function getEnv(): Env {
  if (!env) return loadEnv();
  return env;
}
