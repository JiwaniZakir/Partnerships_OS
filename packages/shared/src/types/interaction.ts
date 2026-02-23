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

export interface InteractionCreateInput {
  contactId: string;
  type: InteractionType;
  date?: Date;
  summary: string;
  rawTranscript?: string;
  keyTakeaways?: string[];
  followUpItems?: string[];
  sentiment?: Sentiment;
}
