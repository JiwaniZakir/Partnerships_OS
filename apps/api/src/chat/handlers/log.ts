import Anthropic from '@anthropic-ai/sdk';
import { getPrisma } from '../../config/database.js';
import { createInteraction } from '../../interactions/service.js';
import type { ChatContext, ChatAction } from '../agent.js';
import { logger } from '../../utils/logger.js';
import { interactionCreateSchema } from '@fpos/shared';

interface LogResult {
  response: string;
  action?: ChatAction;
}

export async function handleLog(
  ctx: ChatContext,
  message: string
): Promise<LogResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return { response: 'AI service unavailable.' };

  const prisma = getPrisma();

  // Get recent contacts for context
  const recentContacts = await prisma.contact.findMany({
    where: { onboardedById: ctx.memberId },
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
    system: `You are helping ${ctx.memberName} log an interaction with an existing contact.

Known contacts:
${contactList}

Gather: which contact, type (meeting/call/email/event/coffee_chat), what happened, key takeaways, follow-ups, sentiment.

When ready, include:
\`\`\`json
{"action":"log","contactId":"...","type":"MEETING","summary":"...","keyTakeaways":["..."],"followUpItems":["..."],"sentiment":"POSITIVE"}
\`\`\`

If the contact name doesn't match anyone, ask for clarification or suggest adding them as new.`,
    messages: ctx.conversationHistory.map((m) => ({
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
        // Validate AI-generated data through Zod schema (UUID check, enum validation, length limits)
        const parsed = interactionCreateSchema.safeParse({
          contactId: data.contactId,
          type: data.type || 'OTHER',
          summary: data.summary,
          keyTakeaways: data.keyTakeaways || [],
          followUpItems: data.followUpItems || [],
          sentiment: data.sentiment || 'NEUTRAL',
        });

        if (!parsed.success) {
          logger.warn({ errors: parsed.error.issues }, 'AI-generated interaction data failed validation');
          return { response: text.replace(/```json\n[\s\S]*?\n```/g, '').trim() };
        }

        const interaction = await createInteraction(parsed.data, ctx.memberId);

        logger.info(
          { interactionId: interaction.id },
          'Interaction logged via chat'
        );

        const contact = recentContacts.find((c) => c.id === data.contactId);
        return {
          response: `Got it — logged your ${data.type?.toLowerCase() || 'interaction'} with ${contact?.fullName || 'the contact'}. ${data.followUpItems?.length ? `I noted ${data.followUpItems.length} follow-up item(s).` : ''} Anything else?`,
          action: {
            type: 'interaction_logged',
            data: {
              id: interaction.id,
              contactId: data.contactId,
              contactName: contact?.fullName || null,
              type: data.type,
            },
          },
        };
      }
    } catch (err) {
      logger.error({ err }, 'Failed to parse log action');
    }
  }

  return { response: text.replace(/```json\n[\s\S]*?\n```/g, '').trim() };
}
