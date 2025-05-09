import { useState, useEffect, useRef } from 'react'
import { stockSearchService } from '../services/stockSearchService'
import { format } from 'date-fns'

interface AddInvestmentModalProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (investment: {
    symbol: string
    name: string
    shares: number
    purchasePrice: number
    purchaseDate: string
    currentPrice: number
  }) => void
  defaultSymbol?: string
  defaultName?: string
  mode?: 'buy' | 'sell'
  maxQuantity?: number
}

interface SearchResult {
  symbol: string
  name: string
  exchange: string
  exchangeShortName: string
}

const AddInvestmentModal = ({ isOpen, onClose, onAdd, defaultSymbol, defaultName, mode = 'buy', maxQuantity }: AddInvestmentModalProps) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [showResults, setShowResults] = useState(false)
  const [selectedStock, setSelectedStock] = useState<SearchResult | null>(null)
  const [shares, setShares] = useState('')
  const [purchaseDate, setPurchaseDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [currentPrice, setCurrentPrice] = useState(0)
  const [purchasePrice, setPurchasePrice] = useState(0)
  const searchRef = useRef<HTMLDivElement>(null)

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    console.log('Input changed:', value)
    setSearchQuery(value)
    setSelectedStock(null)
    
    if (value.length >= 2) {
      setShowResults(true)
      searchStocks(value)
    } else {
      setShowResults(false)
      setSearchResults([])
    }
  }

  const searchStocks = async (query: string) => {
    try {
      console.log('Starting search with query:', query)
      console.log('Using API key:', import.meta.env.VITE_FMP_API_KEY)
      
      const results = await stockSearchService.searchStocks(query)
      console.log('Received search results:', results)
      
      if (results.length === 0) {
        console.log('No results found for query:', query)
      }
      
      setSearchResults(results)
    } catch (error) {
      console.error('Error searching stocks:', error)
      setSearchResults([])
    }
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (defaultSymbol && defaultName) {
      setSelectedStock({ symbol: defaultSymbol, name: defaultName, exchange: '', exchangeShortName: '' })
      setSearchQuery(defaultName)
      // Auto-fetch current price
      const fetchPrice = async () => {
        try {
          const response = await fetch(
            `https://financialmodelingprep.com/api/v3/quote/${defaultSymbol}?apikey=${import.meta.env.VITE_FMP_API_KEY}`
          )
          if (!response.ok) return
          const [stockData] = await response.json()
          setCurrentPrice(stockData.price)
          setPurchasePrice(stockData.price)
        } catch {}
      }
      fetchPrice()
    }
  }, [defaultSymbol, defaultName])

  const handleStockSelect = async (stock: SearchResult) => {
    console.log('Selected stock:', stock)
    setSelectedStock(stock)
    setSearchQuery(stock.name)
    setShowResults(false)

    // Get current price
    try {
      console.log('Fetching current price for:', stock.symbol)
      const response = await fetch(
        `https://financialmodelingprep.com/api/v3/quote/${stock.symbol}?apikey=${import.meta.env.VITE_FMP_API_KEY}`
      )
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const [stockData] = await response.json()
      console.log('Received stock data:', stockData)
      setCurrentPrice(stockData.price)
      setPurchasePrice(stockData.price)
    } catch (error) {
      console.error('Error fetching stock price:', error)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedStock || !shares) return

    onAdd({
      symbol: selectedStock.symbol,
      name: selectedStock.name,
      shares: Number(shares),
      purchasePrice,
      purchaseDate,
      currentPrice
    })

    // Reset form
    setSearchQuery('')
    setSelectedStock(null)
    setShares('')
    setPurchaseDate(format(new Date(), 'yyyy-MM-dd'))
    setCurrentPrice(0)
    setPurchasePrice(0)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">Add Investment</h2>
        <form onSubmit={handleSubmit}>
          {defaultSymbol && defaultName ? (
            <>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Stock Name</label>
                <input type="text" value={defaultName} readOnly className="w-full px-3 py-2 border rounded-md bg-gray-50" />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Stock Symbol</label>
                <input type="text" value={defaultSymbol} readOnly className="w-full px-3 py-2 border rounded-md bg-gray-50" />
              </div>
            </>
          ) : (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Stock Name</label>
              <div ref={searchRef}>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onFocus={() => {
                    if (searchQuery.length >= 2) setShowResults(true)
                  }}
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="Search stocks..."
                />
                {showResults && searchResults.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white rounded-md shadow-lg border border-gray-200 max-h-60 overflow-auto">
                    {searchResults.map((result) => (
                      <div
                        key={result.symbol}
                        className="p-2 hover:bg-gray-50 cursor-pointer"
                        onClick={() => handleStockSelect(result)}
                      >
                        <div className="font-medium">{result.symbol}</div>
                        <div className="text-sm text-gray-500">{result.name}</div>
                      </div>
                    ))}
                  </div>
                )}
                {showResults && searchQuery.length >= 2 && searchResults.length === 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white rounded-md shadow-lg border border-gray-200 p-2 text-gray-500">
                    No matching stocks found
                  </div>
                )}
              </div>
            </div>
          )}

          {selectedStock && (
            <>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Stock Symbol</label>
                <input
                  type="text"
                  value={selectedStock.symbol}
                  readOnly
                  className="w-full px-3 py-2 border rounded-md bg-gray-50"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Price</label>
                <input
                  type="number"
                  value={purchasePrice}
                  onChange={(e) => setPurchasePrice(Number(e.target.value))}
                  className="w-full px-3 py-2 border rounded-md"
                  min="0"
                  step="0.01"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                <input
                  type="number"
                  value={shares}
                  onChange={(e) => setShares(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                  min="1"
                  max={mode === 'sell' ? maxQuantity : undefined}
                  required
                />
                {mode === 'sell' && maxQuantity && (
                  <p className="mt-1 text-sm text-gray-500">
                    Maximum sellable quantity: {maxQuantity}
                  </p>
                )}
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Date</label>
                <input
                  type="date"
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
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
            </>
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
              disabled={!selectedStock || !shares}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              Add
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddInvestmentModal 