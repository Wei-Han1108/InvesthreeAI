import { FMP_API_KEY } from '../config'

export const cryptoService = {
  async searchCryptos(query: string) {
    try {
      const response = await fetch(
        `https://financialmodelingprep.com/api/v3/search?query=${query}&limit=20&exchange=CRYPTO&apikey=${FMP_API_KEY}`
      )
      if (!response.ok) throw new Error('Failed to fetch crypto data')
      return await response.json()
    } catch (error) {
      console.error('Error searching cryptos:', error)
      return []
    }
  },

  async getCryptoQuotes(symbols: string[]) {
    try {
      const response = await fetch(
        `https://financialmodelingprep.com/api/v3/quote/${symbols.join(',')}?apikey=${FMP_API_KEY}`
      )
      if (!response.ok) throw new Error('Failed to fetch crypto quotes')
      return await response.json()
    } catch (error) {
      console.error('Error fetching crypto quotes:', error)
      return []
    }
  },

  async getCryptoProfiles(symbols: string[]) {
    try {
      const response = await fetch(
        `https://financialmodelingprep.com/api/v3/profile/${symbols.join(',')}?apikey=${FMP_API_KEY}`
      )
      if (!response.ok) throw new Error('Failed to fetch crypto profiles')
      return await response.json()
    } catch (error) {
      console.error('Error fetching crypto profiles:', error)
      return []
    }
  }
} 