export interface NewsItem {
    title: string
    publishedAt: string
    description: string
    url: string
    content: string
    source: {
        id: string,
        name: string
    }
  }

  // 假设你使用 newsapi.org 或类似 API
export async function fetchNews(symbol: string, apiKey: string): Promise<{
    status: string;
    totalResults: number;
    articles: NewsItem[];
  }> {
    const res = await fetch(`https://newsapi.org/v2/everything?q=${symbol}&apiKey=${apiKey}&language=en&sortBy=publishedAt&pageSize=5`);
    if (!res.ok) throw new Error('Failed to fetch news');
    return await res.json();
  }
  

