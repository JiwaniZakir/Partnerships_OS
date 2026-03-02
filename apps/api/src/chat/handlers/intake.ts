import Anthropic from '@anthropic-ai/sdk';
import { createContact } from '../../contacts/service.js';
import { dispatchResearch, dispatchNotionSync } from '../../jobs/dispatcher.js';
import type { ChatContext, ChatAction } from '../agent.js';
import { logger } from '../../utils/logger.js';
import { contactCreateSchema } from '@fpos/shared';

interface IntakeResult {
  response: string;
  action?: ChatAction;
}

export async function handleIntake(
  ctx: ChatContext,
  message: string
): Promise<IntakeResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return { response: 'AI service unavailable. Please try again later.' };

  const client = new Anthropic({ apiKey });

  const response = await client.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 1000,
    system: `You are the Partnership Intelligence Assistant helping ${ctx.memberName} add a new contact.

Your job is to gather contact details through conversation. You need:
- Full name (REQUIRED)
- Organization (REQUIRED)
- Title/role
- How they connected
- What they discussed
- Contact info (LinkedIn, email)
- Warmth level (1-10)
- Follow-up items

When you have enough info (at minimum name and organization), include a JSON block in your response like:
\`\`\`json
{"action":"save","fullName":"...","organization":"...","title":"...","contactType":"OTHER","warmthScore":0.5,"context":"...","linkedinUrl":null,"email":null}
\`\`\`

If you still need more info, ask naturally. Be conversational and efficient.`,
    messages: ctx.conversationHistory.map((m) => ({
      role: m.role,
      content: m.content,
    })),
  });

  const block = response.content[0];
  const text =
    block && block.type === 'text' ? block.text : '';

  // Check if the response contains a save action
  const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/);
  if (jsonMatch?.[1]) {
    try {
      const data = JSON.parse(jsonMatch[1]);
      if (data.action === 'save' && data.fullName && data.organization) {
        // Validate AI-generated data through Zod schema (SSRF-safe URLs, enum checks, length limits)
        const parsed = contactCreateSchema.safeParse({
          fullName: data.fullName,
          organization: data.organization,
          title: data.title || undefined,
          contactType: data.contactType || undefined,
          warmthScore: data.warmthScore || 0.5,
          linkedinUrl: data.linkedinUrl || undefined,
          email: data.email || undefined,
        });

        if (!parsed.success) {
          logger.warn({ errors: parsed.error.issues }, 'AI-generated contact data failed validation');
          return { response: text.replace(/```json\n[\s\S]*?\n```/g, '').trim() };
        }

        const contact = await createContact(parsed.data, ctx.memberId);

        logger.info(
          { contactId: contact.id, name: data.fullName },
          'Contact created via chat'
        );

        // Fire-and-forget: run research and Notion sync inline
        dispatchResearch(contact.id);
        dispatchNotionSync('contact', contact.id);

        return {
          response: `Done — ${data.fullName} from ${data.organization} is now in our network under your contacts. I'll dig into their background and have a full research profile ready shortly. Anything else?`,
          action: {
            type: 'contact_created',
            data: {
              id: contact.id,
              fullName: data.fullName,
              organization: data.organization,
              title: data.title || null,
            },
          },
        };
      }
    } catch (err) {
      logger.error({ err }, 'Failed to parse intake save action');
    }
  }

  // Remove any JSON blocks from the displayed response
  return { response: text.replace(/```json\n[\s\S]*?\n```/g, '').trim() };
}
