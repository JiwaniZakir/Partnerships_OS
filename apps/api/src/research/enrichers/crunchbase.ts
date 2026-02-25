import { logger } from '../../utils/logger.js';

export interface CrunchbaseData {
  foundedCompanies: Array<{
    name: string;
    url: string;
    description: string;
  }>;
  investments: Array<{
    company: string;
    round: string;
    url: string;
  }>;
  boardPositions: Array<{
    organization: string;
    role: string;
  }>;
  profileUrl: string | null;
  bio: string;
}

export async function enrichCrunchbase(
  name: string,
  organization: string
): Promise<CrunchbaseData | null> {
  const apiKey = process.env.SERP_API_KEY;
  if (!apiKey) {
    logger.warn('SERP_API_KEY not set — skipping Crunchbase enrichment');
    return null;
  }

  try {
    const query = `${name} ${organization} site:crunchbase.com`;
    const url = new URL('https://serpapi.com/search.json');
    url.searchParams.set('q', query);
    url.searchParams.set('api_key', apiKey);
    url.searchParams.set('num', '5');

    const response = await fetch(url.toString(), {
      signal: AbortSignal.timeout(15_000),
    });

    if (!response.ok) {
      logger.warn(
        { status: response.status },
        'SerpAPI Crunchbase search request failed'
      );
      return null;
    }

    const data = await response.json();
    const organicResults: any[] = data.organic_results || [];

    if (organicResults.length === 0) {
      logger.info({ name, organization }, 'No Crunchbase results found');
      return null;
    }

    const result: CrunchbaseData = {
      foundedCompanies: [],
      investments: [],
      boardPositions: [],
      profileUrl: null,
      bio: '',
    };

    for (const item of organicResults) {
      const itemUrl: string = item.link || '';
      const snippet: string = item.snippet || '';
      const title: string = item.title || '';

      // Extract Crunchbase person profile URL
      if (itemUrl.includes('crunchbase.com/person/') && !result.profileUrl) {
        result.profileUrl = itemUrl;
        result.bio = snippet;
      }

      // Extract founded companies from snippets
      if (
        snippet.toLowerCase().includes('founded') ||
        snippet.toLowerCase().includes('co-founded') ||
        title.toLowerCase().includes('founder')
      ) {
        const companyMatch = title.match(/^(.+?)\s*[-|]\s*Crunchbase/i);
        if (companyMatch?.[1] && itemUrl.includes('/organization/')) {
          result.foundedCompanies.push({
            name: companyMatch[1].trim(),
            url: itemUrl,
            description: snippet.slice(0, 200),
          });
        }
      }

      // Extract investments from snippets
      if (
        snippet.toLowerCase().includes('invested') ||
        snippet.toLowerCase().includes('investment') ||
        snippet.toLowerCase().includes('funding')
      ) {
        const roundMatch = snippet.match(
          /(seed|series\s+[a-z]|pre-seed|angel)\s+(round|funding)/i
        );
        const companyInTitle = title.match(/^(.+?)\s*[-|]\s*Crunchbase/i);
        if (companyInTitle?.[1]) {
          result.investments.push({
            company: companyInTitle[1].trim(),
            round: roundMatch ? roundMatch[0] : 'Unknown round',
            url: itemUrl,
          });
        }
      }

      // Extract board positions from snippets
      if (
        snippet.toLowerCase().includes('board member') ||
        snippet.toLowerCase().includes('board of directors') ||
        snippet.toLowerCase().includes('advisory board') ||
        snippet.toLowerCase().includes('advisor')
      ) {
        const orgMatch = title.match(/^(.+?)\s*[-|]\s*Crunchbase/i);
        if (orgMatch?.[1]) {
          const role = snippet.toLowerCase().includes('advisory')
            ? 'Advisory Board Member'
            : 'Board Member';
          result.boardPositions.push({
            organization: orgMatch[1].trim(),
            role,
          });
        }
      }
    }

    logger.info(
      {
        name,
        organization,
        foundedCount: result.foundedCompanies.length,
        investmentCount: result.investments.length,
        boardCount: result.boardPositions.length,
        hasProfile: !!result.profileUrl,
      },
      'Crunchbase enrichment completed'
    );

    return result;
  } catch (err) {
    logger.error({ err, name, organization }, 'Crunchbase enrichment failed');
    return null;
  }
}
