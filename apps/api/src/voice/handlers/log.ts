import Anthropic from '@anthropic-ai/sdk';
import { getPrisma } from '../../config/database.js';
import { createInteraction } from '../../interactions/service.js';
import type { VoiceSession } from '../agent.js';
import { logger } from '../../utils/logger.js';

export async function handleLog(
  session: VoiceSession,
  message: string
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return 'AI service unavailable.';

  const prisma = getPrisma();

  // Get recent contacts for context
  const recentContacts = await prisma.contact.findMany({
    where: { onboardedById: session.memberId },
    select: { id: true, fullName: true, organization: true },
    orderBy: { updatedAt: 'desc' },
    take: 20,
  });

  const contactList = recentContacts
    .map((c) => `${c.fullName} (${c.organization}) [id:${c.id}]`)
    .join('\n');

  const client = new Anthropic({ apiKey });

  const response = await client.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 1000,
    system: `You are helping ${session.memberName} log an interaction with an existing contact.

Known contacts:
${contactList}

Gather: which contact, type (meeting/call/email/event/coffee_chat), what happened, key takeaways, follow-ups, sentiment.

When ready, include:
\`\`\`json
{"action":"log","contactId":"...","type":"MEETING","summary":"...","keyTakeaways":["..."],"followUpItems":["..."],"sentiment":"POSITIVE"}
\`\`\`

If the contact name doesn't match anyone, ask for clarification or suggest adding them as new.`,
    messages: session.conversationHistory.map((m) => ({
      role: m.role,
      content: m.content,
    })),
  });

  const block = response.content[0];
  const text =
    block && block.type === 'text' ? block.text : '';

  const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/);
  if (jsonMatch?.[1]) {
    try {
      const data = JSON.parse(jsonMatch[1]);
      if (data.action === 'log' && data.contactId && data.summary) {
        const interaction = await createInteraction(
          {
            contactId: data.contactId,
            type: data.type || 'OTHER',
            summary: data.summary,
            keyTakeaways: data.keyTakeaways || [],
            followUpItems: data.followUpItems || [],
            sentiment: data.sentiment || 'NEUTRAL',
          },
          session.memberId
        );

        logger.info(
          { interactionId: interaction.id },
          'Interaction logged via voice'
        );

        session.currentIntent = null;
        session.handlerState = {};

        const contact = recentContacts.find((c) => c.id === data.contactId);
        return `Got it — logged your ${data.type?.toLowerCase() || 'interaction'} with ${contact?.fullName || 'the contact'}. ${data.followUpItems?.length ? `I noted ${data.followUpItems.length} follow-up item(s).` : ''} Anything else?`;
      }
    } catch (err) {
      logger.error({ err }, 'Failed to parse log action');
    }
  }

  return text.replace(/```json\n[\s\S]*?\n```/g, '').trim();
}
