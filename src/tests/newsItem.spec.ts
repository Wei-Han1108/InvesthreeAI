import dotenv from 'dotenv';
import { fetchNews } from './NewsItem';
dotenv.config();

const API_KEY = process.env.VITE_NEWS_API_KEY!;
const SYMBOL = 'AAPL';

function expectStringField(field: any, name: string) {
  if (field != null) {
    expect(typeof field).toBe('string');
  } else {
    console.warn(`⚠️ ${name} is null or undefined`);
  }
}

describe('NewsItem API Schema Validation', () => {
  it('should return an array of properly structured NewsItem objects', async () => {
    const response = await fetchNews(SYMBOL, API_KEY);
    const news = response.articles;
    console.log(news);
    

    expect(Array.isArray(news)).toBe(true);
    expect(news.length).toBeGreaterThan(0);

    for (const item of news) {
      
      expectStringField(item.title, 'title');
      expectStringField(item.publishedAt, 'publishedAt');
      expectStringField(item.source?.name, 'source.name');
      expectStringField(item.url, 'url');
      expectStringField(item.description, 'description');
    }
  });
});
