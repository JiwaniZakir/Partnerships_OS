import { searchNews } from './web-search.js';

export interface NewsArticle {
  title: string;
  url: string;
  snippet: string;
  date?: string;
}

export async function getRecentNews(
  name: string,
  organization: string
): Promise<NewsArticle[]> {
  const results = await searchNews(name, organization);

  return results.map((r) => ({
    title: r.title,
    url: r.url,
    snippet: r.content.slice(0, 300),
  }));
}
