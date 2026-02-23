import { ContactType, ContactStatus, Seniority, OrganizationType } from './enums.js';

export interface Contact {
  id: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  photoUrl: string | null;
  title: string;
  organization: string;
  organizationType: OrganizationType;
  industry: string | null;
  seniority: Seniority;
  contactType: ContactType;
  tags: string[];
  genres: string[];
  linkedinUrl: string | null;
  twitterUrl: string | null;
  personalWebsite: string | null;
  crunchbaseUrl: string | null;
  githubUrl: string | null;
  otherUrls: string[];
  onboardedById: string;
  researchSummary: string | null;
  researchRaw: Record<string, unknown> | null;
  researchLastUpdated: Date | null;
  researchDepthScore: number;
  keyAchievements: string[];
  mutualInterestsWithFoundry: string[];
  potentialValue: string | null;
  suggestedIntroductions: string[];
  status: ContactStatus;
  warmthScore: number;
  createdAt: Date;
  updatedAt: Date;
  notionPageId: string | null;
}

export interface ContactCreateInput {
  fullName: string;
  email?: string;
  phone?: string;
  title?: string;
  organization: string;
  organizationType?: OrganizationType;
  industry?: string;
  seniority?: Seniority;
  contactType?: ContactType;
  tags?: string[];
  genres?: string[];
  linkedinUrl?: string;
  twitterUrl?: string;
  personalWebsite?: string;
  warmthScore?: number;
  context?: string;
}

export interface ContactUpdateInput {
  fullName?: string;
  email?: string;
  phone?: string;
  photoUrl?: string;
  title?: string;
  organization?: string;
  organizationType?: OrganizationType;
  industry?: string;
  seniority?: Seniority;
  contactType?: ContactType;
  tags?: string[];
  genres?: string[];
  linkedinUrl?: string;
  twitterUrl?: string;
  personalWebsite?: string;
  crunchbaseUrl?: string;
  githubUrl?: string;
  otherUrls?: string[];
  status?: ContactStatus;
  warmthScore?: number;
}

export interface ContactFilters {
  search?: string;
  contactType?: ContactType;
  organizationType?: OrganizationType;
  genre?: string;
  onboardedById?: string;
  status?: ContactStatus;
  minWarmth?: number;
}
