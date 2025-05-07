import { format } from 'date-fns'
import useInvestmentStore from '../store/investmentStore'
import Watchlist from '../components/Watchlist'
import SearchResults from '../components/SearchResults'
import { useState, useEffect, useRef, useCallback } from 'react'
import { stockSearchService } from '../services/stockSearchService'

const Dashboard = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [showResults, setShowResults] = useState(false)
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null)
  const [stockProfile, setStockProfile] = useState<any | null>(null)
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
    const search = async () => {
      if (searchQuery.length >= 2) {
        const results = await stockSearchService.searchStocks(searchQuery)
        setSearchResults(results)
        setShowResults(true)
      } else {
        setSearchResults([])
        setShowResults(false)
      }
    }
    const debounceTimer = setTimeout(search, 500)
    return () => clearTimeout(debounceTimer)
  }, [searchQuery])

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
    setSelectedSymbol(null)
    setStockProfile(null)
  }, [])

  const handleResultSelect = useCallback(async (symbol: string) => {
    setSelectedSymbol(symbol)
    setShowResults(false)
    setSearchQuery(symbol)
    const profile = await stockSearchService.getStockProfile(symbol)
    setStockProfile(profile)
  }, [])

  const handleCloseResults = useCallback(() => {
    setShowResults(false)
  }, [])

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Stock Monitor</h1>
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <div className="max-w-2xl mx-auto relative" ref={searchRef}>
          <input
            type="text"
            placeholder="搜索股票代码或名称..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {showResults && (
            <SearchResults
              results={searchResults}
              onClose={handleCloseResults}
              onSelect={handleResultSelect}
            />
          )}
        </div>
        {stockProfile && (
          <div className="mt-6 bg-gray-50 p-4 rounded-lg shadow-inner">
            <div className="flex items-center gap-4 mb-2">
              {stockProfile.image && <img src={stockProfile.image} alt={stockProfile.companyName} className="w-12 h-12 object-contain" />}
              <div>
                <div className="text-xl font-bold">{stockProfile.companyName} ({stockProfile.symbol})</div>
                <div className="text-gray-500 text-sm">{stockProfile.exchangeShortName} | {stockProfile.industry}</div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              <div>当前价: <span className="font-semibold">${stockProfile.price}</span></div>
              <div>市值: <span className="font-semibold">{stockProfile.mktCap?.toLocaleString()}</span></div>
              <div>行业: <span className="font-semibold">{stockProfile.industry}</span></div>
              <div>CEO: <span className="font-semibold">{stockProfile.ceo}</span></div>
              <div>国家: <span className="font-semibold">{stockProfile.country}</span></div>
              <div>官网: <a href={stockProfile.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">{stockProfile.website}</a></div>
            </div>
            <div className="mt-2 text-gray-700 text-sm">{stockProfile.description}</div>
          </div>
        )}
      </div>
      <Watchlist />
    </div>
  )
}

export default Dashboard 