import { useState, useEffect } from 'react'

interface AddCryptoModalProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (crypto: {
    symbol: string
    name: string
    quantity: number
    purchasePrice: number
    purchaseDate: string
    currentPrice: number
  }) => void
  defaultSymbol?: string
  defaultName?: string
}

const AddCryptoModal = ({ isOpen, onClose, onAdd, defaultSymbol, defaultName }: AddCryptoModalProps) => {
  const [quantity, setQuantity] = useState('')
  const [purchaseDate, setPurchaseDate] = useState(() => new Date().toISOString().split('T')[0])
  const [currentPrice, setCurrentPrice] = useState(0)
  const [purchasePrice, setPurchasePrice] = useState(0)

  useEffect(() => {
    if (defaultSymbol) {
      // Auto-fetch current price
      const fetchPrice = async () => {
        try {
          const response = await fetch(
            `https://financialmodelingprep.com/api/v3/quote/${defaultSymbol}?apikey=${import.meta.env.VITE_FMP_API_KEY}`
          )
          if (!response.ok) return
          const [cryptoData] = await response.json()
          setCurrentPrice(cryptoData.price)
          setPurchasePrice(cryptoData.price)
        } catch {}
      }
      fetchPrice()
    }
  }, [defaultSymbol])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!defaultSymbol || !defaultName || !quantity) return
    onAdd({
      symbol: defaultSymbol,
      name: defaultName,
      quantity: Number(quantity),
      purchasePrice,
      purchaseDate,
      currentPrice
    })
    setQuantity('')
    setPurchaseDate(new Date().toISOString().split('T')[0])
    setCurrentPrice(0)
    setPurchasePrice(0)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">Buy Cryptocurrency</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Crypto Symbol</label>
            <input type="text" value={defaultSymbol || ''} readOnly className="w-full px-3 py-2 border rounded-md bg-gray-50" />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Price</label>
            <input
              type="number"
              value={purchasePrice}
              onChange={e => setPurchasePrice(Number(e.target.value))}
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
              step="0.00000001"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Date</label>
            <input
              type="date"
              value={purchaseDate}
              onChange={e => setPurchaseDate(e.target.value)}
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
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              Buy
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddCryptoModal 