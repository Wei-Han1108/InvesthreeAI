import { useState, useEffect } from 'react'

interface SellCryptoModalProps {
  isOpen: boolean
  onClose: () => void
  onSell: (crypto: {
    symbol: string
    quantity: number
    sellPrice: number
    sellDate: string
    currentPrice: number
  }) => void
  defaultSymbol?: string
  maxQuantity: number
}

const SellCryptoModal = ({ isOpen, onClose, onSell, defaultSymbol, maxQuantity }: SellCryptoModalProps) => {
  const [quantity, setQuantity] = useState('')
  const [sellDate, setSellDate] = useState(() => new Date().toISOString().split('T')[0])
  const [currentPrice, setCurrentPrice] = useState(0)
  const [sellPrice, setSellPrice] = useState(0)
  const [error, setError] = useState('')

  useEffect(() => {
    if (defaultSymbol) {
      // 自动查当前价格
      const fetchPrice = async () => {
        try {
          const response = await fetch(
            `https://financialmodelingprep.com/api/v3/quote/${defaultSymbol}?apikey=${import.meta.env.VITE_FMP_API_KEY}`
          )
          if (!response.ok) return
          const [cryptoData] = await response.json()
          setCurrentPrice(cryptoData.price)
          setSellPrice(cryptoData.price)
        } catch {}
      }
      fetchPrice()
    }
  }, [defaultSymbol])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!defaultSymbol || !quantity || !sellPrice || !sellDate) {
      setError('Please fill in all required fields')
      return
    }
    const quantityNum = Number(quantity)
    const sellPriceNum = Number(sellPrice)
    if (isNaN(quantityNum) || isNaN(sellPriceNum)) {
      setError('Please enter valid numbers')
      return
    }
    if (quantityNum <= 0) {
      setError('Sell quantity must be greater than 0')
      return
    }
    if (quantityNum > maxQuantity) {
      setError(`Sell quantity cannot exceed current holding quantity of ${maxQuantity}`)
      return
    }
    if (sellPriceNum <= 0) {
      setError('Sell price must be greater than 0')
      return
    }
    onSell({
      symbol: defaultSymbol,
      quantity: quantityNum,
      sellPrice: sellPriceNum,
      sellDate,
      currentPrice
    })
    setQuantity('')
    setSellDate(new Date().toISOString().split('T')[0])
    setCurrentPrice(0)
    setSellPrice(0)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">Sell Cryptocurrency</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Crypto Symbol</label>
            <input type="text" value={defaultSymbol || ''} readOnly className="w-full px-3 py-2 border rounded-md bg-gray-50" />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Sell Price</label>
            <input
              type="number"
              value={sellPrice}
              onChange={e => setSellPrice(Number(e.target.value))}
              className="w-full px-3 py-2 border rounded-md"
              min="0"
              step="0.0001"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
            <input
              type="number"
              value={quantity}
              onChange={e => setQuantity(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
              min="0.00000001"
              max={maxQuantity}
              step="0.00000001"
              required
            />
            <p className="mt-1 text-sm text-gray-500">
              Maximum sellable quantity: {maxQuantity}
            </p>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Sell Date</label>
            <input
              type="date"
              value={sellDate}
              onChange={e => setSellDate(e.target.value)}
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
              disabled={!quantity}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
            >
              Sell
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default SellCryptoModal 