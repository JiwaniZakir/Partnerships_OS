import { logger } from '../../utils/logger.js';

interface LinkedInProfile {
  fullName: string;
  headline: string;
  summary: string;
  experiences: Array<{
    title: string;
    company: string;
    startDate: string;
    endDate: string | null;
    description: string | null;
  }>;
  education: Array<{
    school: string;
    degree: string;
    fieldOfStudy: string;
  }>;
  skills: string[];
  certifications: string[];
}

export async function enrichLinkedIn(
  linkedinUrl?: string | null,
  email?: string | null
): Promise<LinkedInProfile | null> {
  const apiKey = process.env.PROXYCURL_API_KEY;
  if (!apiKey) {
    logger.warn('PROXYCURL_API_KEY not set — skipping LinkedIn enrichment');
    return null;
  }

  if (!linkedinUrl && !email) return null;

  try {
    const url = new URL('https://nubela.co/proxycurl/api/v2/linkedin');
    if (linkedinUrl) {
      url.searchParams.set('url', linkedinUrl);
    } else if (email) {
      url.searchParams.set('email', email);
    }

    const response = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(15_000),
    });

    if (!response.ok) {
      logger.warn({ status: response.status }, 'Proxycurl request failed');
      return null;
    }

    const data = await response.json();

    return {
      fullName: data.full_name || '',
      headline: data.headline || '',
      summary: data.summary || '',
      experiences: (data.experiences || []).map((e: any) => ({
        title: e.title || '',
        company: e.company || '',
        startDate: e.starts_at
          ? `${e.starts_at.year}-${e.starts_at.month || 1}`
          : '',
        endDate: e.ends_at
          ? `${e.ends_at.year}-${e.ends_at.month || 1}`
          : null,
        description: e.description || null,
      })),
      education: (data.education || []).map((e: any) => ({
        school: e.school || '',
        degree: e.degree_name || '',
        fieldOfStudy: e.field_of_study || '',
      })),
      skills: data.skills || [],
      certifications: (data.certifications || []).map((c: any) => c.name || ''),
    };
  } catch (err) {
    logger.error({ err }, 'LinkedIn enrichment failed');
    return null;
  }
}
