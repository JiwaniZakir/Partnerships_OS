import { InteractionType, Sentiment } from './enums.js';

export interface Interaction {
  id: string;
  contactId: string;
  memberId: string;
  type: InteractionType;
  date: Date;
  summary: string;
  rawTranscript: string | null;
  keyTakeaways: string[];
  followUpItems: string[];
  sentiment: Sentiment;
  notionPageId: string | null;
  createdAt: Date;
}

// InteractionCreateInput is derived from the Zod schema in schemas/index.ts
