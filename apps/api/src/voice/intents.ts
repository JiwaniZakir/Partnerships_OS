import Anthropic from '@anthropic-ai/sdk';
import { logger } from '../utils/logger.js';

export type Intent =
  | 'NEW_CONTACT'
  | 'LOG_INTERACTION'
  | 'QUERY_NETWORK'
  | 'GET_RECOMMENDATIONS'
  | 'GENERAL_CHAT';

const VALID_INTENTS: Intent[] = [
  'NEW_CONTACT',
  'LOG_INTERACTION',
  'QUERY_NETWORK',
  'GET_RECOMMENDATIONS',
  'GENERAL_CHAT',
];

export async function classifyIntent(message: string): Promise<Intent> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return 'GENERAL_CHAT';

  try {
    const client = new Anthropic({ apiKey });

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 50,
      messages: [
        {
          role: 'user',
          content: `Classify the following user message into exactly one intent category. Respond with ONLY the category name, nothing else.

Categories:
- NEW_CONTACT: User wants to add a new person to the network
- LOG_INTERACTION: User wants to record a meeting/call/conversation with an existing contact
- QUERY_NETWORK: User is asking about the network, a specific contact, or organization
- GET_RECOMMENDATIONS: User wants suggestions for who to reach out to or connect with
- GENERAL_CHAT: Greetings, small talk, or anything else

User message: "${message}"`,
        },
      ],
    });

    const text =
      response.content[0].type === 'text'
        ? response.content[0].text.trim()
        : '';

    const intent = text as Intent;
    if (VALID_INTENTS.includes(intent)) {
      return intent;
    }

    logger.warn({ text, message }, 'Unexpected intent classification');
    return 'GENERAL_CHAT';
  } catch (err) {
    logger.error({ err }, 'Intent classification failed');
    return 'GENERAL_CHAT';
  }
}
