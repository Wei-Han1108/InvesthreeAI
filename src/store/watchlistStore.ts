import { create } from 'zustand'
import { authService } from '../services/authService'
import { watchlistService } from '../services/watchlistService'

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
  loadWatchlist: () => Promise<void>
}

const useWatchlistStore = create<WatchlistStore>((set) => ({
  watchlist: [],
  
  loadWatchlist: async () => {
    try {
      const user = await authService.getCurrentUser()
      if (!user) throw new Error('User not authenticated')

      const items = await watchlistService.getWatchlist(user.getUsername())
      set({
        watchlist: items.map(item => ({
          symbol: item.stockTicker,
          name: item.name,
          price: item.price,
          change: item.change,
          changePercent: item.changePercent
        }))
      })
    } catch (error) {
      console.error('Failed to load watchlist:', error)
    }
  },

  addToWatchlist: async (symbol: string, name: string) => {
    try {
      const user = await authService.getCurrentUser()
      if (!user) throw new Error('User not authenticated')
      
      // Check if already exists
      const currentWatchlist = useWatchlistStore.getState().watchlist
      if (currentWatchlist.some(item => item.symbol === symbol)) {
        return
      }

      // Get current stock price
      const response = await fetch(
        `https://financialmodelingprep.com/api/v3/quote/${symbol}?apikey=8CaGJ1ELvam7xuTKGk7YEPlna7HB2gWc`
      )
      const [stockData] = await response.json()

      // Save to database
      await watchlistService.addItem(user.getUsername(), {
        symbol,
        name,
        price: stockData.price,
        change: stockData.change,
        changePercent: stockData.changesPercentage
      })

      // Update local state
      set((state) => ({
        watchlist: [...state.watchlist, {
          symbol,
          name,
          price: stockData.price,
          change: stockData.change,
          changePercent: stockData.changesPercentage
        }]
      }))
    } catch (error) {
      console.error('Failed to add to watchlist:', error)
      throw error
    }
  },

  removeFromWatchlist: async (symbol: string) => {
    try {
      const user = await authService.getCurrentUser()
      if (!user) throw new Error('User not authenticated')

      // Delete from database
      await watchlistService.removeItem(user.getUsername(), symbol)

      // Update local state
      set((state) => ({
        watchlist: state.watchlist.filter(item => item.symbol !== symbol)
      }))
    } catch (error) {
      console.error('Failed to remove from watchlist:', error)
      throw error
    }
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

      // Update price in database
      for (const stock of data) {
        await watchlistService.updateItem(user.getUsername(), stock.symbol, {
          price: stock.price,
          change: stock.change,
          changePercent: stock.changesPercentage
        })
      }

      // Update local state
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