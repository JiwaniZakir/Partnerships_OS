import Anthropic from '@anthropic-ai/sdk';
import { classifyIntent, type Intent } from './intents.js';
import { getCoreSystemPrompt } from './prompts.js';
import { handleIntake } from './handlers/intake.js';
import { handleLog } from './handlers/log.js';
import { handleQuery } from './handlers/query.js';
import { handleRecommend } from './handlers/recommend.js';
import { getPrisma } from '../config/database.js';
import { logger } from '../utils/logger.js';

interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface VoiceSession {
  memberId: string;
  memberName: string;
  memberRole: string;
  conversationHistory: ConversationMessage[];
  currentIntent: Intent | null;
  handlerState: Record<string, any>;
  lastActivity: number;
}

const MAX_SESSIONS = 1000;
const SESSION_TTL_MS = 30 * 60 * 1000; // 30 minutes
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

const sessions = new Map<string, VoiceSession>();

// Periodic cleanup of expired sessions
const cleanupInterval = setInterval(() => {
  const now = Date.now();
  let removed = 0;
  for (const [id, session] of sessions) {
    if (now - session.lastActivity > SESSION_TTL_MS) {
      sessions.delete(id);
      removed++;
    }
  }
  if (removed > 0) {
    logger.info({ removed, remaining: sessions.size }, 'Cleaned up expired voice sessions');
  }
}, CLEANUP_INTERVAL_MS);

// Allow the process to exit even if the interval is still active
cleanupInterval.unref();

export function stopSessionCleanup(): void {
  clearInterval(cleanupInterval);
}

export function createSession(
  sessionId: string,
  memberId: string,
  memberName: string,
  memberRole: string
): VoiceSession {
  if (sessions.size >= MAX_SESSIONS) {
    throw new Error('Maximum concurrent voice sessions reached. Please try again later.');
  }

  const session: VoiceSession = {
    memberId,
    memberName,
    memberRole,
    conversationHistory: [],
    currentIntent: null,
    handlerState: {},
    lastActivity: Date.now(),
  };
  sessions.set(sessionId, session);
  return session;
}

export function getSession(sessionId: string): VoiceSession | undefined {
  const session = sessions.get(sessionId);
  if (session) {
    session.lastActivity = Date.now();
  }
  return session;
}

export function destroySession(sessionId: string): void {
  sessions.delete(sessionId);
}

export async function processMessage(
  sessionId: string,
  userMessage: string
): Promise<string> {
  const session = sessions.get(sessionId);
  if (!session) {
    throw new Error('Session not found');
  }

  session.conversationHistory.push({ role: 'user', content: userMessage });

  // Trim conversation history to last 20 turns
  if (session.conversationHistory.length > 40) {
    session.conversationHistory = session.conversationHistory.slice(-40);
  }

  // Detect intent if not in a flow
  if (!session.currentIntent) {
    session.currentIntent = await classifyIntent(userMessage);
    logger.info(
      { sessionId, intent: session.currentIntent },
      'Intent classified'
    );
  }

  let response: string;

  switch (session.currentIntent) {
    case 'NEW_CONTACT':
      response = await handleIntake(session, userMessage);
      break;
    case 'LOG_INTERACTION':
      response = await handleLog(session, userMessage);
      break;
    case 'QUERY_NETWORK':
      response = await handleQuery(session, userMessage);
      // Queries are one-shot — reset intent
      session.currentIntent = null;
      break;
    case 'GET_RECOMMENDATIONS':
      response = await handleRecommend(session, userMessage);
      session.currentIntent = null;
      break;
    default:
      response = await handleGeneralChat(session, userMessage);
      session.currentIntent = null;
      break;
  }

  session.conversationHistory.push({ role: 'assistant', content: response });
  return response;
}

async function handleGeneralChat(
  session: VoiceSession,
  message: string
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return "Hey! I'm here to help manage your partnerships. What can I do for you?";

  const prisma = getPrisma();
  const stats = await prisma.contact.count();
  const memberContacts = await prisma.contact.count({
    where: { onboardedById: session.memberId },
  });

  const systemPrompt = getCoreSystemPrompt({
    member_name: session.memberName,
    member_role: session.memberRole,
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
    messages: session.conversationHistory.map((m) => ({
      role: m.role,
      content: m.content,
    })),
  });

  return response.content[0].type === 'text'
    ? response.content[0].text
    : "I'm here to help! Try asking about your network or tell me about a new contact.";
}
