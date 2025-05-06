import axios from 'axios'

const FMP_API_KEY = import.meta.env.VITE_FMP_API_KEY
const BASE_URL = 'https://financialmodelingprep.com/api/v3'

export const stockReportService = {
  async getTechnicalAnalysis(symbol: string) {
    try {
      const response = await axios.get(`${BASE_URL}/technical_indicator/daily/${symbol}`, {
        params: {
          apikey: FMP_API_KEY,
          type: 'sma,ema,rsi,macd'
        }
      })
      return response.data
    } catch (error) {
      console.error('Error fetching technical analysis:', error)
      throw error
    }
  },

  async getVolatility(symbol: string) {
    try {
      const response = await axios.get(`${BASE_URL}/historical-chart/1hour/${symbol}`, {
        params: {
          apikey: FMP_API_KEY
        }
      })
      return response.data
    } catch (error) {
      console.error('Error fetching volatility data:', error)
      throw error
    }
  },

  async getNews(symbol: string) {
    try {
      const response = await axios.get(`${BASE_URL}/stock_news`, {
        params: {
          apikey: FMP_API_KEY,
          tickers: symbol,
          limit: 5
        }
      })
      return response.data
    } catch (error) {
      console.error('Error fetching news:', error)
      throw error
    }
  }
} 