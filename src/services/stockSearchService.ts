import axios from 'axios';

const FMP_API_KEY = import.meta.env.VITE_FMP_API_KEY;
const FMP_BASE = "https://financialmodelingprep.com/api/v3";

export interface StockSearchResult {
  symbol: string;
  name: string;
  exchange: string;
}

export interface SearchResult {
  symbol: string
  name: string
  exchange: string
  exchangeShortName: string
}

interface HistoricalData {
  date: string
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export const stockSearchService = {
  async searchStocks(query: string): Promise<StockSearchResult[]> {
    if (!query || query.length < 1) return [];
    
    try {
      const response = await axios.get(
        `${FMP_BASE}/search?query=${encodeURIComponent(query)}&limit=10&apikey=${FMP_API_KEY}`
      );
      
      return response.data.map((item: any) => ({
        symbol: item.symbol,
        name: item.name,
        exchange: item.exchange
      }));
    } catch (error) {
      console.error('Error searching stocks:', error);
      return [];
    }
  },

  async getHistoricalData(symbol: string): Promise<HistoricalData[]> {
    try {
      const response = await fetch(
        `https://financialmodelingprep.com/api/v3/historical-chart/1hour/${symbol}?apikey=${FMP_API_KEY}`
      )
      const data = await response.json()
      return data.reverse() // 反转数据，让最新的数据在最后
    } catch (error) {
      console.error('Failed to get historical data:', error)
      return []
    }
  },

  async getStockProfile(symbol: string): Promise<any | null> {
    try {
      const response = await fetch(
        `https://financialmodelingprep.com/api/v3/profile/${symbol}?apikey=${FMP_API_KEY}`
      )
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      if (Array.isArray(data) && data.length > 0) {
        return data[0]
      }
      return null
    } catch (error) {
      console.error('Failed to get stock profile:', error)
      return null
    }
  }
} 