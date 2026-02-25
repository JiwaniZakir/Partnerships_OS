import Anthropic from '@anthropic-ai/sdk';
import { hybridSearch } from './search.service.js';
import { getPrisma } from '../config/database.js';
import { logger } from '../utils/logger.js';
import type { DiscoveryResult } from '@fpos/shared';

export async function discoverForEvent(
  description: string,
  maxResults: number = 10
): Promise<DiscoveryResult> {
  // Find relevant contacts via hybrid search
  const searchResults = await hybridSearch(description, undefined, maxResults * 2);

  const prisma = getPrisma();
  const contactIds = searchResults.map((r) => r.id);

  const contacts = await prisma.contact.findMany({
    where: { id: { in: contactIds }, status: 'ACTIVE' },
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

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || contacts.length === 0) {
    return {
      contacts: contacts.map((c) => ({
        contact: {
          id: c.id,
          fullName: c.fullName,
          organization: c.organization,
          title: c.title,
        },
        score: searchResults.find((r) => r.id === c.id)?.score || 0,
        reason: 'Matched via search',
      })),
    };
  }

  const client = new Anthropic({ apiKey });

  const contactContext = contacts
    .map(
      (c) =>
        `ID: ${c.id} | ${c.fullName} — ${c.title} at ${c.organization} | Type: ${c.contactType} | Warmth: ${c.warmthScore} | Genres: ${c.genres.join(', ') || 'N/A'} | Onboarded by: ${c.onboardedBy.name}\nSummary: ${c.researchSummary?.slice(0, 200) || 'N/A'}`
    )
    .join('\n\n');

  const response = await client.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 2000,
    messages: [
      {
        role: 'user',
        content: `You are The Foundry PHL's strategic advisor. Given an event/initiative description, rank the best contacts to involve.

Event/Initiative: "${description}"

Available contacts:
${contactContext}

Respond with a JSON array (no markdown) of the top ${maxResults} contacts:
[
  {"id": "contact-uuid", "score": 0.95, "reason": "Why they're perfect for this"},
  ...
]

Rank by relevance to the event. Consider their expertise, warmth, and potential contribution.`,
      },
    ],
  });

  try {
    const firstBlock = response.content[0];
    const text = firstBlock && firstBlock.type === 'text' ? firstBlock.text : '[]';
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const ranked = JSON.parse(cleaned);

    return {
      contacts: ranked.slice(0, maxResults).map((r: any) => {
        const contact = contacts.find((c) => c.id === r.id);
        return {
          contact: contact
            ? {
                id: contact.id,
                fullName: contact.fullName,
                organization: contact.organization,
                title: contact.title,
              }
            : { id: r.id, fullName: 'Unknown', organization: '', title: '' },
          score: r.score || 0,
          reason: r.reason || 'Recommended by AI',
        };
      }),
    };
  } catch (err) {
    logger.error({ err }, 'Failed to parse discovery results');
    return {
      contacts: contacts.slice(0, maxResults).map((c) => ({
        contact: {
          id: c.id,
          fullName: c.fullName,
          organization: c.organization,
          title: c.title,
        },
        score: 0.5,
        reason: 'Matched via search',
      })),
    };
  }
}

export async function analyzeNetworkGaps(): Promise<{
  underrepresented: Array<{ category: string; count: number }>;
  recommendations: string[];
}> {
  const prisma = getPrisma();

  const [byType, byIndustry] = await Promise.all([
    prisma.contact.groupBy({
      by: ['contactType'],
      _count: true,
      where: { status: 'ACTIVE' },
    }),
    prisma.contact.groupBy({
      by: ['industry'],
      _count: true,
      where: { status: 'ACTIVE', industry: { not: null } },
    }),
  ]);

  const allTypes = [
    'SPONSOR',
    'MENTOR',
    'SPEAKER',
    'INVESTOR',
    'CORPORATE_PARTNER',
    'MEDIA',
    'GOVERNMENT',
    'ALUMNI',
  ];

  const typeCounts = allTypes.map((type) => ({
    category: type,
    count: byType.find((t) => t.contactType === type)?._count || 0,
  }));

  const underrepresented = typeCounts
    .sort((a, b) => a.count - b.count)
    .slice(0, 5);

  return {
    underrepresented,
    recommendations: underrepresented
      .filter((u) => u.count < 3)
      .map(
        (u) =>
          `Consider expanding ${u.category.toLowerCase().replace('_', ' ')} contacts (currently only ${u.count})`
      ),
  };
}
