import Anthropic from '@anthropic-ai/sdk';
import { semanticSearch } from '../../research/embeddings.js';
import { getPrisma } from '../../config/database.js';
import type { VoiceSession } from '../agent.js';

export async function handleRecommend(
  session: VoiceSession,
  message: string
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return 'AI service unavailable.';

  const searchResults = await semanticSearch(message, 20);

  const prisma = getPrisma();
  const topContacts = await prisma.contact.findMany({
    where: {
      id: { in: searchResults.map((r) => r.id) },
      status: 'ACTIVE',
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
      potentialValue: true,
      onboardedBy: { select: { name: true } },
    },
  });

  const context = topContacts
    .map(
      (c) =>
        `${c.fullName} — ${c.title} at ${c.organization}
Type: ${c.contactType} | Warmth: ${c.warmthScore} | Onboarded by: ${c.onboardedBy.name}
Genres: ${c.genres.join(', ') || 'N/A'}
${c.researchSummary ? 'Summary: ' + c.researchSummary.slice(0, 200) + '...' : ''}
${c.potentialValue ? 'Value: ' + c.potentialValue.slice(0, 150) : ''}`
    )
    .join('\n\n');

  const client = new Anthropic({ apiKey });

  const response = await client.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 1000,
    system: `You are the organization's strategic advisor. Given a request, recommend 3-5 people from the network.

For each recommendation:
1. Name and why they're relevant
2. How to reach them (who onboarded them)
3. Warmth level and best approach

Network contacts:
${context || 'No matching contacts in the network.'}

Be specific about WHY each person fits. Suggest warm intro paths when possible.`,
    messages: [{ role: 'user', content: message }],
  });

  const block = response.content[0];
  return block && block.type === 'text'
    ? block.text
    : 'I couldn\'t generate recommendations for that request. Try being more specific.';
}
