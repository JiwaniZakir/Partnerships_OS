import { Client } from '@notionhq/client';
import { getPrisma } from '../config/database.js';
import { contactToProperties, interactionToProperties } from './mapper.js';
import { buildContactPageBlocks } from './templates.js';
import { logger } from '../utils/logger.js';

let notionClient: Client | null = null;

function getNotion(): Client | null {
  const apiKey = process.env.NOTION_API_KEY;
  if (!apiKey) return null;

  if (!notionClient) {
    notionClient = new Client({ auth: apiKey });
  }
  return notionClient;
}

export async function syncContactToNotion(contactId: string): Promise<void> {
  const notion = getNotion();
  if (!notion) {
    logger.warn('Notion API key not set — skipping sync');
    return;
  }

  const dbId = process.env.NOTION_MASTER_DB_ID;
  if (!dbId) {
    logger.warn('NOTION_MASTER_DB_ID not set — skipping sync');
    return;
  }

  const prisma = getPrisma();
  const contact = await prisma.contact.findUnique({
    where: { id: contactId },
    include: {
      onboardedBy: { select: { id: true, name: true } },
      interactions: {
        orderBy: { date: 'desc' },
        take: 10,
        include: { member: { select: { name: true } } },
      },
    },
  });

  if (!contact) {
    logger.warn({ contactId }, 'Contact not found for Notion sync');
    return;
  }

  try {
    if (contact.notionPageId) {
      // Update existing page
      await notion.pages.update({
        page_id: contact.notionPageId,
        properties: contactToProperties(contact) as any,
      });

      // Update page content
      await replacePageContent(notion, contact.notionPageId, contact);

      logger.info({ contactId, notionPageId: contact.notionPageId }, 'Notion page updated');
    } else {
      // Create new page
      const page = await notion.pages.create({
        parent: { database_id: dbId },
        properties: contactToProperties(contact) as any,
        children: buildContactPageBlocks(contact) as any,
      });

      // Store Notion page ID back in PostgreSQL
      await prisma.contact.update({
        where: { id: contactId },
        data: { notionPageId: page.id },
      });

      logger.info({ contactId, notionPageId: page.id }, 'Notion page created');
    }
  } catch (err) {
    logger.error({ err, contactId }, 'Notion sync failed');
    throw err;
  }
}

export async function syncInteractionToNotion(
  interactionId: string
): Promise<void> {
  const notion = getNotion();
  if (!notion) return;

  const dbId = process.env.NOTION_INTERACTIONS_DB_ID;
  if (!dbId) return;

  const prisma = getPrisma();
  const interaction = await prisma.interaction.findUnique({
    where: { id: interactionId },
    include: {
      contact: { select: { id: true, fullName: true, notionPageId: true } },
      member: { select: { name: true } },
    },
  });

  if (!interaction) return;

  try {
    if (interaction.notionPageId) {
      await notion.pages.update({
        page_id: interaction.notionPageId,
        properties: interactionToProperties(interaction) as any,
      });
    } else {
      const page = await notion.pages.create({
        parent: { database_id: dbId },
        properties: interactionToProperties(interaction) as any,
      });

      await prisma.interaction.update({
        where: { id: interactionId },
        data: { notionPageId: page.id },
      });
    }

    // Also refresh the contact's Notion page to include the new interaction
    if (interaction.contact.id) {
      await syncContactToNotion(interaction.contact.id);
    }
  } catch (err) {
    logger.error({ err, interactionId }, 'Interaction Notion sync failed');
    throw err;
  }
}

async function replacePageContent(
  notion: Client,
  pageId: string,
  contact: any
): Promise<void> {
  try {
    // Get existing blocks
    const existing = await notion.blocks.children.list({
      block_id: pageId,
      page_size: 100,
    });

    // Delete existing blocks
    for (const block of existing.results) {
      try {
        await notion.blocks.delete({ block_id: (block as any).id });
      } catch {
        // Ignore deletion errors
      }
    }

    // Add new blocks
    const newBlocks = buildContactPageBlocks(contact);

    // Notion API has a limit of 100 blocks per request
    for (let i = 0; i < newBlocks.length; i += 100) {
      const chunk = newBlocks.slice(i, i + 100);
      await notion.blocks.children.append({
        block_id: pageId,
        children: chunk as any,
      });
    }
  } catch (err) {
    logger.error({ err, pageId }, 'Failed to replace Notion page content');
  }
}

export async function runReconciliation(): Promise<{
  created: number;
  updated: number;
  errors: number;
}> {
  const notion = getNotion();
  if (!notion) return { created: 0, updated: 0, errors: 0 };

  const prisma = getPrisma();
  const contacts = await prisma.contact.findMany({
    where: { status: { not: 'ARCHIVED' } },
    select: { id: true, notionPageId: true, updatedAt: true },
  });

  let created = 0;
  let updated = 0;
  let errors = 0;

  for (const contact of contacts) {
    try {
      if (!contact.notionPageId) {
        await syncContactToNotion(contact.id);
        created++;
      } else {
        // Check if Notion page exists
        try {
          await notion.pages.retrieve({ page_id: contact.notionPageId });
          await syncContactToNotion(contact.id);
          updated++;
        } catch {
          // Page doesn't exist, recreate
          await prisma.contact.update({
            where: { id: contact.id },
            data: { notionPageId: null },
          });
          await syncContactToNotion(contact.id);
          created++;
        }
      }

      // Rate limit: wait 500ms between operations
      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch {
      errors++;
    }
  }

  logger.info({ created, updated, errors }, 'Notion reconciliation complete');
  return { created, updated, errors };
}
