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

const API_KEY = import.meta.env.VITE_FMP_API_KEY

export const stockSearchService = {
  async searchStocks(query: string): Promise<SearchResult[]> {
    try {
      console.log('Searching stocks with query:', query)
      console.log('Using API key:', API_KEY)
      
      const response = await fetch(
        `https://financialmodelingprep.com/api/v3/search?query=${encodeURIComponent(query)}&limit=10&apikey=${API_KEY}`
      )
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      console.log('Search results:', data)
      
      if (!Array.isArray(data)) {
        console.error('Invalid response format:', data)
        return []
      }
      
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
  },

  async getStockProfile(symbol: string): Promise<any | null> {
    try {
      const response = await fetch(
        `https://financialmodelingprep.com/api/v3/profile/${symbol}?apikey=${API_KEY}`
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