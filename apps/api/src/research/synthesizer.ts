import Anthropic from '@anthropic-ai/sdk';
import { logger } from '../utils/logger.js';

let anthropicClient: Anthropic | null = null;

function getAnthropicClient(): Anthropic | null {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  if (!anthropicClient) {
    anthropicClient = new Anthropic({ apiKey, timeout: 60_000 });
  }
  return anthropicClient;
}

interface SynthesisInput {
  name: string;
  title: string;
  organization: string;
  webResults: Array<{ title: string; content: string; url: string }>;
  linkedinProfile: any | null;
  socialProfiles: any[];
  newsArticles: any[];
  crunchbaseData?: any | null;
  existingContext?: string;
}

interface SynthesisOutput {
  researchSummary: string;
  keyAchievements: string[];
  mutualInterests: string[];
  potentialValue: string;
  suggestedIntroductions: string[];
}

export async function synthesizeResearch(
  input: SynthesisInput
): Promise<SynthesisOutput> {
  const client = getAnthropicClient();
  if (!client) {
    logger.warn('ANTHROPIC_API_KEY not set — returning empty synthesis');
    return {
      researchSummary: '',
      keyAchievements: [],
      mutualInterests: [],
      potentialValue: '',
      suggestedIntroductions: [],
    };
  }

  const dataContext = [
    input.linkedinProfile
      ? `LinkedIn Profile:\n${JSON.stringify(input.linkedinProfile, null, 2)}`
      : '',
    input.webResults.length > 0
      ? `Web Research:\n${input.webResults.map((r) => `- ${r.title}: ${r.content}`).join('\n')}`
      : '',
    input.socialProfiles.length > 0
      ? `Social Profiles:\n${JSON.stringify(input.socialProfiles, null, 2)}`
      : '',
    input.newsArticles.length > 0
      ? `Recent News:\n${input.newsArticles.map((a: any) => `- ${a.title}: ${a.snippet}`).join('\n')}`
      : '',
    input.crunchbaseData
      ? `Crunchbase Data:\n${JSON.stringify(input.crunchbaseData, null, 2)}`
      : '',
    input.existingContext ? `Existing Context:\n${input.existingContext}` : '',
  ]
    .filter(Boolean)
    .join('\n\n');

  const response = await client.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 4096,
    messages: [
      {
        role: 'user',
        content: `You are a research analyst for a nonprofit connecting East Coast college founders with VCs, corporate partners, and industry leaders.

Research the following person and produce a comprehensive profile:

**Name:** ${input.name}
**Title:** ${input.title}
**Organization:** ${input.organization}

**Collected Data:**
${dataContext || 'No additional data available — use what you know.'}

Please respond with a JSON object (no markdown) containing:
{
  "researchSummary": "A 500-1000 word comprehensive profile covering career trajectory, notable achievements, expertise areas, and professional reputation.",
  "keyAchievements": ["Achievement 1", "Achievement 2", ...],
  "mutualInterests": ["Interest/synergy 1", ...],
  "potentialValue": "Analysis of how this person could benefit the organization and vice versa.",
  "suggestedIntroductions": ["Person/org they could connect us to", ...]
}`,
      },
    ],
  });

  try {
    const firstBlock = response.content[0];
    const text =
      firstBlock && firstBlock.type === 'text' ? firstBlock.text : '';
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleaned);

    return {
      researchSummary: parsed.researchSummary || '',
      keyAchievements: parsed.keyAchievements || [],
      mutualInterests: parsed.mutualInterests || [],
      potentialValue: parsed.potentialValue || '',
      suggestedIntroductions: parsed.suggestedIntroductions || [],
    };
  } catch (err) {
    logger.error({ err }, 'Failed to parse synthesis response');
    return {
      researchSummary: response.content[0] && response.content[0].type === 'text' ? response.content[0].text : '',
      keyAchievements: [],
      mutualInterests: [],
      potentialValue: '',
      suggestedIntroductions: [],
    };
  }
}
