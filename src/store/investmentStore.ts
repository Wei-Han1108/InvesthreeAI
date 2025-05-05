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
}

interface InvestmentStore {
  investments: Investment[]
  addInvestment: (investment: Omit<Investment, 'investmentId' | 'userId' | 'createdAt'>) => Promise<void>
  loadInvestments: () => Promise<void>
}

const useInvestmentStore = create<InvestmentStore>((set) => ({
  investments: [],
  
  addInvestment: async (investment) => {
    try {
      const user = await authService.getCurrentUser()
      if (!user) throw new Error('User not authenticated')
      
      const newInvestment = await investmentService.addInvestment(user.getUsername(), investment)
      set((state) => ({
        investments: [...state.investments, newInvestment],
      }))
    } catch (error) {
      console.error('Failed to add investment:', error)
      throw error
    }
  },

  loadInvestments: async () => {
    try {
      const user = await authService.getCurrentUser()
      if (!user) throw new Error('User not authenticated')
      
      const investments = await investmentService.getUserInvestments(user.getUsername())
      set({ investments })
    } catch (error) {
      console.error('Failed to load investments:', error)
      throw error
    }
  },
}))

export default useInvestmentStore 