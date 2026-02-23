import { z } from 'zod';

/**
 * SSRF-safe URL validation schema.
 * Rejects URLs that point to private/internal IP ranges, localhost,
 * or non-HTTP(S) protocols to prevent Server-Side Request Forgery.
 */

const PRIVATE_IP_PATTERNS = [
  // IPv4 private/internal ranges
  /^127\.\d{1,3}\.\d{1,3}\.\d{1,3}$/,           // 127.0.0.0/8 (loopback)
  /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/,             // 10.0.0.0/8
  /^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/, // 172.16.0.0/12
  /^192\.168\.\d{1,3}\.\d{1,3}$/,                // 192.168.0.0/16
  /^169\.254\.\d{1,3}\.\d{1,3}$/,                // 169.254.0.0/16 (link-local)
  /^0\.0\.0\.0$/,                                 // 0.0.0.0
];

const PRIVATE_HOSTNAMES = ['localhost', '0.0.0.0'];

export function isPrivateHost(hostname: string): boolean {
  const lower = hostname.toLowerCase();
  if (PRIVATE_HOSTNAMES.includes(lower)) return true;
  if (PRIVATE_IP_PATTERNS.some((re) => re.test(lower))) return true;
  // IPv6 loopback and private
  if (lower === '::1' || lower === '[::1]') return true;
  if (lower.startsWith('fc') || lower.startsWith('fd')) return true; // fc00::/7
  if (lower.startsWith('[fc') || lower.startsWith('[fd')) return true;
  return false;
}

export function safeUrlSchema(): z.ZodString {
  return z.string().url().refine(
    (val) => {
      try {
        const parsed = new URL(val);
        // Only allow http/https protocols
        if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
          return false;
        }
        // Reject private/internal hosts
        if (isPrivateHost(parsed.hostname)) {
          return false;
        }
        return true;
      } catch {
        return false;
      }
    },
    { message: 'URL must use http(s) and must not point to private/internal addresses' }
  ) as unknown as z.ZodString;
}

export const contactCreateSchema = z.object({
  fullName: z.string().min(1).max(200),
  email: z.string().email().optional(),
  phone: z.string().max(30).optional(),
  title: z.string().max(200).optional(),
  organization: z.string().min(1).max(200),
  organizationType: z.enum(['COMPANY', 'VC_FIRM', 'UNIVERSITY', 'NONPROFIT', 'GOVERNMENT', 'MEDIA', 'ACCELERATOR', 'OTHER']).optional(),
  industry: z.string().max(100).optional(),
  seniority: z.enum(['C_SUITE', 'VP', 'DIRECTOR', 'MANAGER', 'IC', 'FOUNDER', 'PARTNER', 'OTHER']).optional(),
  contactType: z.enum(['SPONSOR', 'MENTOR', 'SPEAKER', 'INVESTOR', 'CORPORATE_PARTNER', 'MEDIA', 'GOVERNMENT', 'ALUMNI', 'OTHER']).optional(),
  tags: z.array(z.string().max(50)).max(20).optional(),
  genres: z.array(z.string().max(50)).max(20).optional(),
  linkedinUrl: safeUrlSchema().optional(),
  twitterUrl: safeUrlSchema().optional(),
  personalWebsite: safeUrlSchema().optional(),
  warmthScore: z.number().min(0).max(1).optional(),
  context: z.string().max(5000).optional(),
});

export const contactUpdateSchema = contactCreateSchema.partial().omit({ organization: true }).extend({
  organization: z.string().min(1).max(200).optional(),
  photoUrl: safeUrlSchema().optional(),
  crunchbaseUrl: safeUrlSchema().optional(),
  githubUrl: safeUrlSchema().optional(),
  otherUrls: z.array(safeUrlSchema()).max(10).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'PROSPECT', 'ARCHIVED']).optional(),
});

export const interactionCreateSchema = z.object({
  contactId: z.string().uuid(),
  type: z.enum(['MEETING', 'CALL', 'EMAIL', 'EVENT', 'COFFEE_CHAT', 'INTRO', 'VOICE_LOG', 'OTHER']),
  date: z.string().datetime().optional(),
  summary: z.string().min(1).max(10000),
  rawTranscript: z.string().max(100000).optional(),
  keyTakeaways: z.array(z.string().max(500)).max(20).optional(),
  followUpItems: z.array(z.string().max(500)).max(20).optional(),
  sentiment: z.enum(['VERY_POSITIVE', 'POSITIVE', 'NEUTRAL', 'NEGATIVE', 'VERY_NEGATIVE']).optional(),
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const contactFilterSchema = paginationSchema.extend({
  search: z.string().max(200).optional(),
  contactType: z.enum(['SPONSOR', 'MENTOR', 'SPEAKER', 'INVESTOR', 'CORPORATE_PARTNER', 'MEDIA', 'GOVERNMENT', 'ALUMNI', 'OTHER']).optional(),
  organizationType: z.enum(['COMPANY', 'VC_FIRM', 'UNIVERSITY', 'NONPROFIT', 'GOVERNMENT', 'MEDIA', 'ACCELERATOR', 'OTHER']).optional(),
  genre: z.string().max(50).optional(),
  onboardedById: z.string().uuid().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'PROSPECT', 'ARCHIVED']).optional(),
  minWarmth: z.coerce.number().min(0).max(1).optional(),
});

export const interactionFilterSchema = paginationSchema.extend({
  contactId: z.string().uuid().optional(),
  memberId: z.string().uuid().optional(),
  type: z.enum(['MEETING', 'CALL', 'EMAIL', 'EVENT', 'COFFEE_CHAT', 'INTRO', 'VOICE_LOG', 'OTHER']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export const discoverSchema = z.object({
  description: z.string().min(10).max(5000),
  maxResults: z.number().int().min(1).max(50).optional().default(10),
});

export type ContactCreateInput = z.infer<typeof contactCreateSchema>;
export type ContactUpdateInput = z.infer<typeof contactUpdateSchema>;
export type InteractionCreateInput = z.infer<typeof interactionCreateSchema>;
export type ContactFilterInput = z.infer<typeof contactFilterSchema>;
export type InteractionFilterInput = z.infer<typeof interactionFilterSchema>;
export type DiscoverInput = z.infer<typeof discoverSchema>;
