import { fetchStockData } from './StockData';
import dotenv from 'dotenv';
dotenv.config();

const API_KEY = process.env.VITE_FMP_API_KEY!;

describe('StockData API Schema Validation', () => {
  it('should return a complete and correctly-typed StockData object', async () => {
    const data = await fetchStockData('AAPL', API_KEY);
    console.log(data);
    expect(data).not.toBeNull();

    // Required field type checks
    expect(typeof data!.symbol).toBe('string');
    expect(typeof data!.name).toBe('string');
    expect(typeof data!.price).toBe('number');
    expect(typeof data!.dayLow).toBe('number');
    expect(typeof data!.dayHigh).toBe('number');
    expect(typeof data!.yearLow).toBe('number');
    expect(typeof data!.yearHigh).toBe('number');
    expect(typeof data!.marketCap).toBe('number');
    expect(typeof data!.volume).toBe('number');
    expect(typeof data!.avgVolume).toBe('number');
    expect(typeof data!.pe).toBe('number');
    expect(typeof data!.eps).toBe('number');
    
    // Optional fields: check if present before validating type
    if (data!.dividend !== undefined) {
      expect(typeof data!.dividend).toBe('number');
    } else {
      console.warn('⚠️ "dividend" field is missing');
    }
    
    if (data!.dividendYield !== undefined) {
      expect(typeof data!.dividendYield).toBe('number');
    } else {
      console.warn('⚠️ "dividendYield" field is missing');
    }
    
    expect(typeof data!.exchange).toBe('string');
    
    // "timestamp" may be either a string or a number (e.g., Unix timestamp)
    expect(['string', 'number']).toContain(typeof data!.timestamp);
  });
});
