import { useState, useEffect, useRef } from 'react'
import { stockSearchService } from '../services/stockSearchService'

interface AddInvestmentModalProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (investment: {
    symbol: string
    name: string
    shares: number
    purchasePrice: number
    purchaseDate: string
  }) => void
}

interface SearchResult {
  symbol: string
  name: string
  exchange: string
  exchangeShortName: string
}

const AddInvestmentModal = ({ isOpen, onClose, onAdd }: AddInvestmentModalProps) => {
  const [symbol, setSymbol] = useState('')
  const [name, setName] = useState('')
  const [shares, setShares] = useState('')
  const [purchasePrice, setPurchasePrice] = useState('')
  const [purchaseDate, setPurchaseDate] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

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
    const searchStocks = async () => {
      if (searchQuery.length < 2) {
        setSearchResults([])
        return
      }

      setIsSearching(true)
      try {
        const results = await stockSearchService.searchStocks(searchQuery)
        setSearchResults(results)
      } catch (error) {
        console.error('Failed to search stocks:', error)
        setSearchResults([])
      } finally {
        setIsSearching(false)
      }
    }

    const debounceTimer = setTimeout(searchStocks, 300)
    return () => clearTimeout(debounceTimer)
  }, [searchQuery])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onAdd({
      symbol,
      name,
      shares: parseFloat(shares),
      purchasePrice: parseFloat(purchasePrice),
      purchaseDate
    })
    resetForm()
  }

  const resetForm = () => {
    setSymbol('')
    setName('')
    setShares('')
    setPurchasePrice('')
    setPurchaseDate('')
    setSearchQuery('')
    setSearchResults([])
    setShowResults(false)
  }

  const handleStockSelect = (stock: SearchResult) => {
    setSymbol(stock.symbol)
    setName(stock.name)
    setSearchQuery(`${stock.symbol} - ${stock.name}`)
    setShowResults(false)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">添加新投资</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative" ref={searchRef}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setShowResults(true)
              }}
              onFocus={() => setShowResults(true)}
              placeholder="搜索股票代码或名称"
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {showResults && (
              <div className="absolute z-10 w-full mt-1 bg-white border rounded shadow-lg max-h-60 overflow-auto">
                {isSearching ? (
                  <div className="p-2 text-gray-500">搜索中...</div>
                ) : searchResults.length > 0 ? (
                  searchResults.map((stock) => (
                    <div
                      key={stock.symbol}
                      className="p-2 hover:bg-gray-100 cursor-pointer border-b last:border-b-0"
                      onClick={() => handleStockSelect(stock)}
                    >
                      <div className="font-medium">{stock.symbol}</div>
                      <div className="text-sm text-gray-500">{stock.name}</div>
                    </div>
                  ))
                ) : searchQuery.length >= 2 ? (
                  <div className="p-2 text-gray-500">未找到匹配的股票</div>
                ) : null}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">股票代码</label>
            <input
              type="text"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              required
              className="w-full p-2 border rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">股票名称</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full p-2 border rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">购买数量</label>
            <input
              type="number"
              value={shares}
              onChange={(e) => setShares(e.target.value)}
              required
              min="0"
              step="0.01"
              className="w-full p-2 border rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">购买价格</label>
            <input
              type="number"
              value={purchasePrice}
              onChange={(e) => setPurchasePrice(e.target.value)}
              required
              min="0"
              step="0.01"
              className="w-full p-2 border rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">购买日期</label>
            <input
              type="date"
              value={purchaseDate}
              onChange={(e) => setPurchaseDate(e.target.value)}
              required
              className="w-full p-2 border rounded"
            />
          </div>

          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => {
                onClose()
                resetForm()
              }}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              添加
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddInvestmentModal 