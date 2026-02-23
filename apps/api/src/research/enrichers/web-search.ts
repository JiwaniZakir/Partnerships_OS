import { logger } from '../../utils/logger.js';

interface WebSearchResult {
  title: string;
  url: string;
  content: string;
  score: number;
}

export async function searchPerson(
  name: string,
  organization: string
): Promise<WebSearchResult[]> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) {
    logger.warn('TAVILY_API_KEY not set — skipping web search');
    return [];
  }

  try {
    const { tavily } = await import('@tavily/core');
    const client = tavily({ apiKey });

    const response = await client.search(`${name} ${organization}`, {
      maxResults: 5,
      searchDepth: 'advanced',
      includeAnswer: false,
    });

    return (response.results || []).map((r: any) => ({
      title: r.title || '',
      url: r.url || '',
      content: r.content || '',
      score: r.score || 0,
    }));
  } catch (err) {
    logger.error({ err, name, organization }, 'Web search failed');
    return [];
  }
}

export async function searchNews(
  name: string,
  organization: string
): Promise<WebSearchResult[]> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) return [];

  try {
    const { tavily } = await import('@tavily/core');
    const client = tavily({ apiKey });

    const response = await client.search(`${name} ${organization} news`, {
      maxResults: 5,
      topic: 'news',
    });

    return (response.results || []).map((r: any) => ({
      title: r.title || '',
      url: r.url || '',
      content: r.content || '',
      score: r.score || 0,
    }));
  } catch (err) {
    logger.error({ err }, 'News search failed');
    return [];
  }
}
