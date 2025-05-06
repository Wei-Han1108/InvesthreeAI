import { create } from 'zustand'
import { authService } from '../services/authService'
import { portfolioService } from '../services/portfolioService'

interface Stock {
  symbol: string
  name: string
  shares: number
  averagePrice: number
}

interface PortfolioState {
  portfolio: Stock[]
  addToPortfolio: (stock: Stock) => void
  removeFromPortfolio: (symbol: string) => void
  updatePortfolio: (stocks: Stock[]) => void
  loadPortfolio: () => Promise<void>
}

export const usePortfolioStore = create<PortfolioState>((set) => ({
  portfolio: [],
  
  addToPortfolio: (stock) =>
    set((state) => ({
      portfolio: [...state.portfolio, stock]
    })),
    
  removeFromPortfolio: (symbol) =>
    set((state) => ({
      portfolio: state.portfolio.filter((stock) => stock.symbol !== symbol)
    })),
    
  updatePortfolio: (stocks) =>
    set(() => ({
      portfolio: stocks
    })),
    
  loadPortfolio: async () => {
    try {
      const user = await authService.getCurrentUser()
      if (!user) throw new Error('User not authenticated')

      const items = await portfolioService.getPortfolio(user.getUsername())
      set({
        portfolio: items.map(item => ({
          symbol: item.symbol,
          name: item.name,
          shares: item.shares,
          averagePrice: item.averagePrice
        }))
      })
    } catch (error) {
      console.error('Failed to load portfolio:', error)
    }
  }
})) 