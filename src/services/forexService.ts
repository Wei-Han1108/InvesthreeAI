import { FMP_API_KEY } from '../config'

export const forexService = {
  async searchForex(query: string) {
    try {
      const response = await fetch(
        `https://financialmodelingprep.com/api/v3/search?query=${query}&limit=20&exchange=FOREX&apikey=${FMP_API_KEY}`
      )
      if (!response.ok) throw new Error('Failed to fetch forex data')
      return await response.json()
    } catch (error) {
      console.error('Error searching forex:', error)
      return []
    }
  },

  async getForexQuotes(symbols: string[]) {
    try {
      const response = await fetch(
        `https://financialmodelingprep.com/api/v3/quote/${symbols.join(',')}?apikey=${FMP_API_KEY}`
      )
      if (!response.ok) throw new Error('Failed to fetch forex quotes')
      return await response.json()
    } catch (error) {
      console.error('Error fetching forex quotes:', error)
      return []
    }
  },

  async getForexProfiles(symbols: string[]) {
    try {
      const response = await fetch(
        `https://financialmodelingprep.com/api/v3/profile/${symbols.join(',')}?apikey=${FMP_API_KEY}`
      )
      if (!response.ok) throw new Error('Failed to fetch forex profiles')
      return await response.json()
    } catch (error) {
      console.error('Error fetching forex profiles:', error)
      return []
    }
  }
} 