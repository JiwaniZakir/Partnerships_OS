import { semanticSearch } from '../research/embeddings.js';
import * as neo4jService from './neo4j.service.js';
import { getPrisma } from '../config/database.js';
import { logger } from '../utils/logger.js';
import type { SearchResult } from '@fpos/shared';

interface RankedResult {
  id: string;
  name: string;
  title: string;
  organization: string;
  contactType: string;
  warmthScore: number;
  score: number;
  source: string;
}

export async function hybridSearch(
  query: string,
  filters?: { contactType?: string; genre?: string },
  topK: number = 20
): Promise<RankedResult[]> {
  // Run three searches in parallel
  const [vectorResults, graphResults, textResults] = await Promise.allSettled([
    semanticSearch(query, topK),
    neo4jService.searchNodes(query),
    fullTextSearch(query, topK),
  ]);

  const resultMap = new Map<string, { scores: number[]; data: any }>();

  // Process vector results
  if (vectorResults.status === 'fulfilled') {
    for (let i = 0; i < vectorResults.value.length; i++) {
      const r = vectorResults.value[i]!;
      const entry = resultMap.get(r.id) || { scores: [], data: r };
      entry.scores.push(1 / (i + 1)); // RRF score
      resultMap.set(r.id, entry);
    }
  }

  // Process graph results
  if (graphResults.status === 'fulfilled') {
    for (let i = 0; i < graphResults.value.length; i++) {
      const r = graphResults.value[i]!;
      const entry = resultMap.get(r.id) || { scores: [], data: r };
      entry.scores.push(1 / (i + 1));
      resultMap.set(r.id, entry);
    }
  }

  // Process text results
  if (textResults.status === 'fulfilled') {
    for (let i = 0; i < textResults.value.length; i++) {
      const r = textResults.value[i]!;
      const entry = resultMap.get(r.id) || { scores: [], data: r };
      entry.scores.push(1 / (i + 1));
      resultMap.set(r.id, entry);
    }
  }

  // Merge using Reciprocal Rank Fusion
  const merged = Array.from(resultMap.entries())
    .map(([id, { scores, data }]) => ({
      id,
      name: data.fullName || data.label || data.full_name || '',
      title: data.title || '',
      organization: data.organization || '',
      contactType: data.contactType || data.contact_type || '',
      warmthScore: data.warmthScore || data.warmth_score || 0,
      score: scores.reduce((sum: number, s: number) => sum + s, 0),
      source: scores.length > 1 ? 'multiple' : 'single',
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);

  return merged;
}

async function fullTextSearch(
  query: string,
  limit: number
): Promise<Array<{ id: string; fullName: string; organization: string; title: string }>> {
  const prisma = getPrisma();

  try {
    const results = await prisma.contact.findMany({
      where: {
        OR: [
          { fullName: { contains: query, mode: 'insensitive' } },
          { organization: { contains: query, mode: 'insensitive' } },
          { title: { contains: query, mode: 'insensitive' } },
          { tags: { has: query } },
          { genres: { has: query } },
        ],
        status: { not: 'ARCHIVED' },
      },
      select: {
        id: true,
        fullName: true,
        organization: true,
        title: true,
        contactType: true,
        warmthScore: true,
      },
      take: limit,
    });

    return results;
  } catch (err) {
    logger.error({ err }, 'Full text search failed');
    return [];
  }
}
