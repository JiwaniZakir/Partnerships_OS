import Anthropic from '@anthropic-ai/sdk';
import { classifyIntent, type Intent } from './intents.js';
import { getCoreSystemPrompt } from '../voice/prompts.js';
import { handleIntake } from './handlers/intake.js';
import { handleLog } from './handlers/log.js';
import { handleQuery } from './handlers/query.js';
import { handleRecommend } from './handlers/recommend.js';
import { getPrisma } from '../config/database.js';
import { logger } from '../utils/logger.js';

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatContext {
  memberId: string;
  memberName: string;
  memberRole: string;
  conversationHistory: ConversationMessage[];
  currentIntent: Intent | null;
}

export interface ChatAction {
  type: 'contact_created' | 'interaction_logged';
  data: Record<string, unknown>;
}

export interface ChatResult {
  response: string;
  intent: string;
  action?: ChatAction;
}

/**
 * Stateless message processor. Accepts conversation history and member info,
 * returns AI response + any side-effect actions.
 */
export async function processMessage(
  message: string,
  memberId: string,
  memberName: string,
  memberRole: string,
  conversationHistory: ConversationMessage[] = [],
  intentHint?: string
): Promise<ChatResult> {
  // Build context object (replaces in-memory session)
  const history: ConversationMessage[] = [
    ...conversationHistory.slice(-38), // Keep last 38 turns to leave room for current
    { role: 'user', content: message },
  ];

  // Classify intent
  const intent = await classifyIntent(message, intentHint);
  logger.info({ intent, memberId }, 'Chat intent classified');

  const ctx: ChatContext = {
    memberId,
    memberName,
    memberRole,
    conversationHistory: history,
    currentIntent: intent,
  };

  let response: string;
  let action: ChatAction | undefined;

  switch (intent) {
    case 'NEW_CONTACT': {
      const result = await handleIntake(ctx, message);
      response = result.response;
      action = result.action;
      break;
    }
    case 'LOG_INTERACTION': {
      const result = await handleLog(ctx, message);
      response = result.response;
      action = result.action;
      break;
    }
    case 'QUERY_NETWORK':
      response = await handleQuery(ctx, message);
      break;
    case 'GET_RECOMMENDATIONS':
      response = await handleRecommend(ctx, message);
      break;
    default:
      response = await handleGeneralChat(ctx, message);
      break;
  }

  return { response, intent, action };
}

async function handleGeneralChat(
  ctx: ChatContext,
  message: string
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return "Hey! I'm here to help manage your partnerships. What can I do for you?";

  const prisma = getPrisma();
  const stats = await prisma.contact.count();
  const memberContacts = await prisma.contact.count({
    where: { onboardedById: ctx.memberId },
  });

  const systemPrompt = getCoreSystemPrompt({
    member_name: ctx.memberName,
    member_role: ctx.memberRole,
    total_contacts: stats,
    member_contact_count: memberContacts,
    last_contact_name: 'N/A',
    last_contact_org: 'N/A',
  });

  const client = new Anthropic({ apiKey });

  const response = await client.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 500,
    system: systemPrompt,
    messages: ctx.conversationHistory.map((m) => ({
      role: m.role,
      content: m.content,
    })),
  });

  const block = response.content[0];
  return block && block.type === 'text'
    ? block.text
    : "I'm here to help! Try asking about your network or tell me about a new contact.";
}
