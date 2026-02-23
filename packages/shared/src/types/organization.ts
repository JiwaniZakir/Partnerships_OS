import { OrganizationType } from './enums.js';

export interface Organization {
  id: string;
  name: string;
  type: OrganizationType;
  industry: string | null;
  website: string | null;
  description: string | null;
  logoUrl: string | null;
  researchSummary: string | null;
  notionPageId: string | null;
}
