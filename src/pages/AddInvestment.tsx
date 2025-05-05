import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useInvestmentStore from '../store/investmentStore'
import AddInvestmentModal from '../components/AddInvestmentModal'

const AddInvestment = () => {
  const navigate = useNavigate()
  const addInvestment = useInvestmentStore((state) => state.addInvestment)
  const [isModalOpen, setIsModalOpen] = useState(true)

  const handleAdd = async (investment: {
    symbol: string
    name: string
    shares: number
    purchasePrice: number
    purchaseDate: string
    currentPrice: number
  }) => {
    try {
      await addInvestment({
        stockName: investment.name,
        stockCode: investment.symbol,
        purchasePrice: investment.purchasePrice,
        quantity: investment.shares,
        purchaseDate: investment.purchaseDate,
        currentPrice: investment.currentPrice,
      })
      navigate('/')
    } catch (error) {
      console.error('Failed to add investment:', error)
    }
  }

  return (
    <AddInvestmentModal
      isOpen={isModalOpen}
      onClose={() => navigate('/')}
      onAdd={handleAdd}
    />
  )
}

export default AddInvestment 