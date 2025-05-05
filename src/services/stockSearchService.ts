interface SearchResult {
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

const API_KEY = import.meta.env.VITE_FMP_API_KEY

export const stockSearchService = {
  async searchStocks(query: string): Promise<SearchResult[]> {
    try {
      const response = await fetch(
        `https://financialmodelingprep.com/api/v3/search?query=${encodeURIComponent(query)}&limit=10&apikey=${API_KEY}`
      )
      const data = await response.json()
      return data
    } catch (error) {
      console.error('Failed to search stocks:', error)
      return []
    }
  },

  async getHistoricalData(symbol: string): Promise<HistoricalData[]> {
    try {
      const response = await fetch(
        `https://financialmodelingprep.com/api/v3/historical-chart/1hour/${symbol}?apikey=${API_KEY}`
      )
      const data = await response.json()
      return data.reverse() // 反转数据，让最新的数据在最后
    } catch (error) {
      console.error('Failed to get historical data:', error)
      return []
    }
  }
} 