import { create } from 'zustand'
import { investmentService } from '../services/investmentService'
import { authService } from '../services/authService'

interface Investment {
  investmentId: string
  userId: string
  stockName: string
  stockCode: string
  purchasePrice: number
  quantity: number
  purchaseDate: string
  currentPrice: number
  createdAt: string
  sellQuantity?: number
  sellPrice?: number
  sellDate?: string
  profitLoss?: number
}

interface InvestmentStore {
  investments: Investment[]
  addInvestment: (investment: Omit<Investment, 'investmentId' | 'userId' | 'createdAt'>) => Promise<void>
  loadInvestments: () => Promise<void>
  sellInvestment: (investmentId: string, sellQuantity: number, sellPrice: number, sellDate: string) => Promise<void>
}

const useInvestmentStore = create<InvestmentStore>((set) => ({
  investments: [],
  
  addInvestment: async (investment) => {
    try {
      const user = await authService.getCurrentUser() as { getUsername: () => string }
      if (!user) throw new Error('User not authenticated')
      
      await investmentService.addInvestment(user.getUsername(), investment)
      const investments = await investmentService.getUserInvestments(user.getUsername())
      set({ investments: (investments as any[]).map(i => i as Investment) })
    } catch (error) {
      console.error('Failed to add investment:', error)
      throw error
    }
  },

  loadInvestments: async () => {
    try {
      const user = await authService.getCurrentUser() as { getUsername: () => string }
      if (!user) throw new Error('User not authenticated')
      
      const investments = await investmentService.getUserInvestments(user.getUsername())
      set({ investments: (investments as any[]).map(i => i as Investment) })
    } catch (error) {
      console.error('Failed to load investments:', error)
      throw error
    }
  },

  sellInvestment: async (investmentId, sellQuantity, sellPrice, sellDate) => {
    try {
      const user = await authService.getCurrentUser() as { getUsername: () => string }
      if (!user) throw new Error('User not authenticated')
      await investmentService.sellInvestment(user.getUsername(), investmentId, sellQuantity, sellPrice, sellDate)
      const investments = await investmentService.getUserInvestments(user.getUsername())
      set({ investments: (investments as any[]).map(i => i as Investment) })
    } catch (error) {
      console.error('Failed to sell investment:', error)
      throw error
    }
  },
}))

export default useInvestmentStore 