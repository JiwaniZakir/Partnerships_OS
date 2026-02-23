import Anthropic from '@anthropic-ai/sdk';
import { semanticSearch } from '../../research/embeddings.js';
import { getPrisma } from '../../config/database.js';
import type { VoiceSession } from '../agent.js';
import { logger } from '../../utils/logger.js';

export async function handleQuery(
  session: VoiceSession,
  message: string
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return 'AI service unavailable.';

  // Search for relevant contacts
  const searchResults = await semanticSearch(message, 10);

  // Also do a direct name/org search
  const prisma = getPrisma();
  const directResults = await prisma.contact.findMany({
    where: {
      OR: [
        { fullName: { contains: message.split(' ').slice(-2).join(' '), mode: 'insensitive' } },
        { organization: { contains: message, mode: 'insensitive' } },
      ],
    },
    select: {
      id: true,
      fullName: true,
      organization: true,
      title: true,
      contactType: true,
      warmthScore: true,
      researchSummary: true,
      genres: true,
    },
    take: 10,
  });

  const context = [
    ...directResults.map(
      (c) =>
        `${c.fullName} — ${c.title} at ${c.organization} (${c.contactType}, warmth: ${c.warmthScore})\n${c.researchSummary ? c.researchSummary.slice(0, 200) + '...' : 'No research yet'}`
    ),
    ...searchResults
      .filter((r) => !directResults.some((d) => d.id === r.id))
      .map(
        (r) =>
          `${r.fullName} at ${r.organization} (semantic match score: ${r.score.toFixed(2)})`
      ),
  ].join('\n\n');

  const client = new Anthropic({ apiKey });

  const response = await client.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 800,
    system: `You are the Foundry's network intelligence assistant. Answer questions about the network concisely.

Network context:
${context || 'No matching contacts found.'}

Be specific with names and details. If no matches, say so honestly and suggest alternatives.`,
    messages: [{ role: 'user', content: message }],
  });

  return response.content[0].type === 'text'
    ? response.content[0].text
    : 'I couldn\'t find relevant contacts. Try rephrasing your question.';
}
