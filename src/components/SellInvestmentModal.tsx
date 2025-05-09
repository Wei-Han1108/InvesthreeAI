import { useState, useEffect } from 'react'
import { Dialog } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import useInvestmentStore from '../store/investmentStore'

interface SellInvestmentModalProps {
  isOpen: boolean
  onClose: () => void
  onSell: () => void
  investmentId: string
  stockCode: string
  stockName: string
  currentQuantity: number
}

const SellInvestmentModal = ({
  isOpen,
  onClose,
  onSell,
  investmentId,
  stockCode,
  stockName,
  currentQuantity,
}: SellInvestmentModalProps) => {
  const [quantity, setQuantity] = useState('')
  const [price, setPrice] = useState('')
  const [date, setDate] = useState('')
  const [error, setError] = useState('')
  const [currentPrice, setCurrentPrice] = useState(0)
  const sellInvestment = useInvestmentStore((state) => state.sellInvestment)

  useEffect(() => {
    if (isOpen) {
      // 设置默认日期为今天
      const today = new Date().toISOString().split('T')[0]
      setDate(today)
      // 获取当前价格
      const fetchPrice = async () => {
        try {
          const response = await fetch(
            `https://financialmodelingprep.com/api/v3/quote/${stockCode}?apikey=${import.meta.env.VITE_FMP_API_KEY}`
          )
          if (!response.ok) return
          const [stockData] = await response.json()
          setCurrentPrice(stockData.price)
          setPrice(stockData.price.toString())
        } catch {}
      }
      fetchPrice()
    }
  }, [isOpen, stockCode])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!quantity || !price || !date) {
      setError('Please fill in all required fields')
      return
    }

    const quantityNum = Number(quantity)
    const priceNum = Number(price)

    if (isNaN(quantityNum) || isNaN(priceNum)) {
      setError('Please enter valid numbers')
      return
    }

    if (quantityNum <= 0) {
      setError('Sell quantity must be greater than 0')
      return
    }

    if (quantityNum > currentQuantity) {
      setError(`Sell quantity cannot exceed current holding quantity of ${currentQuantity}`)
      return
    }

    if (priceNum <= 0) {
      setError('Sell price must be greater than 0')
      return
    }

    try {
      await sellInvestment(investmentId, quantityNum, priceNum, date)
      onSell()
      onClose()
    } catch (err: any) {
      console.error('Sell error:', err)
      setError(err.message || 'Failed to sell')
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">Sell Stock</h2>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Stock Name</label>
          <input type="text" value={stockName} readOnly className="w-full px-3 py-2 border rounded-md bg-gray-50" />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Stock Symbol</label>
          <input type="text" value={stockCode} readOnly className="w-full px-3 py-2 border rounded-md bg-gray-50" />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Sell Price</label>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
            min="0"
            step="0.01"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Sell Quantity</label>
          <input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
            min="1"
            max={currentQuantity}
            required
          />
          <p className="mt-1 text-sm text-gray-500">
            Maximum sellable quantity: {currentQuantity}
          </p>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Sell Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Current Price</label>
          <input
            type="number"
            value={currentPrice}
            readOnly
            className="w-full px-3 py-2 border rounded-md bg-gray-50"
          />
        </div>

        {error && (
          <div className="text-red-500 text-sm mb-4">{error}</div>
        )}

        <div className="flex justify-end space-x-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 border rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={!quantity}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            Confirm Sell
          </button>
        </div>
      </div>
    </div>
  )
}

export default SellInvestmentModal 