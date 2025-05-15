export interface StockData {
    symbol: string;
    price: number;
    name: string;
    changes: number;
    changesPercentage: number;
    dayLow: number;
    dayHigh: number;
    yearLow: number;
    yearHigh: number;
    marketCap: number;
    volume: number;
    avgVolume: number;
    pe: number;
    eps: number;
    dividend: number;
    dividendYield: number;
    exchange: string;
    exchangeShortName: string;
    timestamp: string;

  }
  
  export async function fetchStockData(symbol: string, apiKey: string): Promise<StockData | null> {
    const url = `https://financialmodelingprep.com/api/v3/quote/${symbol}?apikey=${apiKey}`;
    const response = await fetch(url);
  
    if (!response.ok) {
      throw new Error(`Failed to fetch stock data: ${response.statusText}`);
    }
  
    const data = await response.json();
    return Array.isArray(data) && data.length > 0 ? data[0] : null;
  }
  