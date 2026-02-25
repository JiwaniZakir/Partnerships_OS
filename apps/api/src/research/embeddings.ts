import OpenAI from 'openai';
import { getPrisma } from '../config/database.js';
import { logger } from '../utils/logger.js';

let openaiClient: OpenAI | null = null;

function getOpenAI(): OpenAI | null {
  if (!process.env.OPENAI_API_KEY) {
    return null;
  }
  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      timeout: 30_000,
    });
  }
  return openaiClient;
}

export async function generateEmbedding(text: string): Promise<number[] | null> {
  const openai = getOpenAI();
  if (!openai) {
    logger.warn('OPENAI_API_KEY not set — skipping embedding generation');
    return null;
  }

  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
    dimensions: 1536,
  });

  const first = response.data[0];
  if (!first) throw new Error('No embedding returned');
  return first.embedding;
}

export async function updateContactEmbedding(
  contactId: string,
  researchSummary: string,
  keyAchievements: string[]
): Promise<void> {
  const text = [researchSummary, ...keyAchievements].filter(Boolean).join('\n');
  if (!text.trim()) {
    logger.warn({ contactId }, 'No text to embed');
    return;
  }

  try {
    const embedding = await generateEmbedding(text);
    if (!embedding) {
      logger.warn({ contactId }, 'Embedding generation returned null — skipping update');
      return;
    }

    const prisma = getPrisma();

    // Store embedding via raw SQL since Prisma doesn't support vector type
    const vectorStr = `[${embedding.join(',')}]`;
    await prisma.$executeRawUnsafe(
      `UPDATE contacts SET profile_embedding = $1::vector WHERE id = $2::uuid`,
      vectorStr,
      contactId
    );

    logger.info({ contactId }, 'Contact embedding updated');
  } catch (err) {
    logger.error({ err, contactId }, 'Failed to update embedding');
  }
}

export async function semanticSearch(
  query: string,
  topK: number = 10
): Promise<Array<{ id: string; fullName: string; organization: string; score: number }>> {
  try {
    const embedding = await generateEmbedding(query);
    if (!embedding) {
      logger.warn('OPENAI_API_KEY not set — semantic search unavailable');
      return [];
    }

    const prisma = getPrisma();
    const vectorStr = `[${embedding.join(',')}]`;

    const results: any[] = await prisma.$queryRawUnsafe(
      `SELECT id, full_name as "fullName", organization,
              1 - (profile_embedding <=> $1::vector) as score
       FROM contacts
       WHERE profile_embedding IS NOT NULL
         AND status != 'ARCHIVED'
       ORDER BY profile_embedding <=> $1::vector
       LIMIT $2`,
      vectorStr,
      topK
    );

    return results;
  } catch (err) {
    logger.error({ err }, 'Semantic search failed');
    return [];
  }
}
