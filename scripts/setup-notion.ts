import { Client } from '@notionhq/client';

const NOTION_API_KEY = process.env.NOTION_API_KEY;
const PARENT_PAGE_ID = process.env.NOTION_PARENT_PAGE_ID;

if (!NOTION_API_KEY || !PARENT_PAGE_ID) {
  console.error('Set NOTION_API_KEY and NOTION_PARENT_PAGE_ID env vars');
  process.exit(1);
}

const notion = new Client({ auth: NOTION_API_KEY });

async function setup() {
  console.log('Setting up Notion workspace...');

  // Create Master Contacts Database
  const masterDb = await notion.databases.create({
    parent: { page_id: PARENT_PAGE_ID },
    title: [{ text: { content: 'Master Contacts Database' } }],
    properties: {
      Name: { title: {} },
      Organization: { rich_text: {} },
      Title: { rich_text: {} },
      Type: {
        select: {
          options: [
            { name: 'SPONSOR', color: 'green' },
            { name: 'MENTOR', color: 'blue' },
            { name: 'SPEAKER', color: 'purple' },
            { name: 'INVESTOR', color: 'yellow' },
            { name: 'CORPORATE_PARTNER', color: 'default' },
            { name: 'MEDIA', color: 'pink' },
            { name: 'GOVERNMENT', color: 'red' },
            { name: 'ALUMNI', color: 'orange' },
            { name: 'OTHER', color: 'gray' },
          ],
        },
      },
      'Organization Type': {
        select: {
          options: [
            { name: 'COMPANY', color: 'blue' },
            { name: 'VC_FIRM', color: 'green' },
            { name: 'UNIVERSITY', color: 'purple' },
            { name: 'NONPROFIT', color: 'orange' },
            { name: 'GOVERNMENT', color: 'red' },
            { name: 'MEDIA', color: 'pink' },
            { name: 'ACCELERATOR', color: 'yellow' },
            { name: 'OTHER', color: 'gray' },
          ],
        },
      },
      Industry: { rich_text: {} },
      'Warmth Score': { rich_text: {} },
      Status: {
        select: {
          options: [
            { name: 'ACTIVE', color: 'green' },
            { name: 'INACTIVE', color: 'gray' },
            { name: 'PROSPECT', color: 'yellow' },
            { name: 'ARCHIVED', color: 'red' },
          ],
        },
      },
      Email: { email: {} },
      Phone: { phone_number: {} },
      LinkedIn: { url: {} },
      'Created Date': { date: {} },
      'Research Status': {
        select: {
          options: [
            { name: 'Pending', color: 'yellow' },
            { name: 'Complete', color: 'green' },
          ],
        },
      },
    },
  });
  console.log(`Master Contacts DB: ${masterDb.id}`);

  // Create Interactions Log Database
  const interactionsDb = await notion.databases.create({
    parent: { page_id: PARENT_PAGE_ID },
    title: [{ text: { content: 'Interactions Log' } }],
    properties: {
      Summary: { title: {} },
      Type: {
        select: {
          options: [
            { name: 'MEETING', color: 'blue' },
            { name: 'CALL', color: 'green' },
            { name: 'EMAIL', color: 'yellow' },
            { name: 'EVENT', color: 'purple' },
            { name: 'COFFEE_CHAT', color: 'orange' },
            { name: 'INTRO', color: 'pink' },
            { name: 'VOICE_LOG', color: 'default' },
            { name: 'OTHER', color: 'gray' },
          ],
        },
      },
      Date: { date: {} },
      Sentiment: {
        select: {
          options: [
            { name: 'VERY_POSITIVE', color: 'green' },
            { name: 'POSITIVE', color: 'blue' },
            { name: 'NEUTRAL', color: 'gray' },
            { name: 'NEGATIVE', color: 'orange' },
            { name: 'VERY_NEGATIVE', color: 'red' },
          ],
        },
      },
      Contact: { rich_text: {} },
      Member: { rich_text: {} },
    },
  });
  console.log(`Interactions DB: ${interactionsDb.id}`);

  // Create Organizations Database
  const orgsDb = await notion.databases.create({
    parent: { page_id: PARENT_PAGE_ID },
    title: [{ text: { content: 'Organizations' } }],
    properties: {
      Name: { title: {} },
      Type: {
        select: {
          options: [
            { name: 'COMPANY', color: 'blue' },
            { name: 'VC_FIRM', color: 'green' },
            { name: 'UNIVERSITY', color: 'purple' },
            { name: 'NONPROFIT', color: 'orange' },
            { name: 'ACCELERATOR', color: 'yellow' },
            { name: 'OTHER', color: 'gray' },
          ],
        },
      },
      Industry: { rich_text: {} },
      Website: { url: {} },
    },
  });
  console.log(`Organizations DB: ${orgsDb.id}`);

  console.log('\nAdd these to your .env:');
  console.log(`NOTION_MASTER_DB_ID=${masterDb.id}`);
  console.log(`NOTION_INTERACTIONS_DB_ID=${interactionsDb.id}`);
  console.log(`NOTION_ORGS_DB_ID=${orgsDb.id}`);
}

setup().catch((err) => {
  console.error('Setup failed:', err);
  process.exit(1);
});
