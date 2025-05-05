import { create } from 'zustand'
import { authService } from '../services/authService'

interface WatchlistItem {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
}

interface WatchlistStore {
  watchlist: WatchlistItem[]
  addToWatchlist: (symbol: string, name: string) => Promise<void>
  removeFromWatchlist: (symbol: string) => void
  updateStockPrices: () => Promise<void>
}

const useWatchlistStore = create<WatchlistStore>((set) => ({
  watchlist: [],
  
  addToWatchlist: async (symbol: string, name: string) => {
    try {
      const user = await authService.getCurrentUser()
      if (!user) throw new Error('User not authenticated')
      
      // 检查是否已经存在
      set((state) => {
        if (state.watchlist.some(item => item.symbol === symbol)) {
          return state
        }
        return {
          watchlist: [...state.watchlist, { symbol, name, price: 0, change: 0, changePercent: 0 }]
        }
      })
    } catch (error) {
      console.error('Failed to add to watchlist:', error)
      throw error
    }
  },

  removeFromWatchlist: (symbol: string) => {
    set((state) => ({
      watchlist: state.watchlist.filter(item => item.symbol !== symbol)
    }))
  },

  updateStockPrices: async () => {
    try {
      const user = await authService.getCurrentUser()
      if (!user) throw new Error('User not authenticated')
      
      const symbols = useWatchlistStore.getState().watchlist.map(item => item.symbol)
      if (symbols.length === 0) return

      const response = await fetch(
        `https://financialmodelingprep.com/api/v3/quote/${symbols.join(',')}?apikey=8CaGJ1ELvam7xuTKGk7YEPlna7HB2gWc`
      )
      const data = await response.json()

      set((state) => ({
        watchlist: state.watchlist.map(item => {
          const stockData = data.find((stock: any) => stock.symbol === item.symbol)
          if (stockData) {
            return {
              ...item,
              price: stockData.price,
              change: stockData.change,
              changePercent: stockData.changesPercentage
            }
          }
          return item
        })
      }))
    } catch (error) {
      console.error('Failed to update stock prices:', error)
    }
  }
}))

export default useWatchlistStore 