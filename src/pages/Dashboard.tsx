import { format } from 'date-fns'
import useInvestmentStore from '../store/investmentStore'
import Watchlist from '../components/Watchlist'
import SearchResults from '../components/SearchResults'
import { useState, useEffect, useRef, useCallback } from 'react'
import { stockSearchService } from '../services/stockSearchService'

const Dashboard = () => {
  const investments = useInvestmentStore((state) => state.investments)
  const loadInvestments = useInvestmentStore((state) => state.loadInvestments)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [showResults, setShowResults] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  // 加载投资数据
  useEffect(() => {
    loadInvestments().catch(error => {
      console.error('Failed to load investments:', error)
    })
  }, [loadInvestments])

  const totalInvestment = investments.reduce(
    (sum, inv) => sum + inv.purchasePrice * inv.quantity,
    0
  )
  const currentValue = investments.reduce(
    (sum, inv) => sum + inv.currentPrice * inv.quantity,
    0
  )
  const profitLoss = currentValue - totalInvestment
  const profitLossPercentage = (profitLoss / totalInvestment) * 100

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
  }, [])

  const handleCloseResults = useCallback(() => {
    setShowResults(false)
  }, [])

  return (
    <div className="space-y-6">
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
            />
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-gray-500 text-sm">总投资</h3>
          <p className="text-2xl font-bold">¥{totalInvestment.toLocaleString()}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-gray-500 text-sm">当前价值</h3>
          <p className="text-2xl font-bold">¥{currentValue.toLocaleString()}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-gray-500 text-sm">盈亏</h3>
          <p
            className={`text-2xl font-bold ${
              profitLoss >= 0 ? 'text-green-600' : 'text-red-600'
            }`}
          >
            ¥{profitLoss.toLocaleString()} ({profitLossPercentage.toFixed(2)}%)
          </p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold">最近投资</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    股票名称
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    股票代码
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    购买价格
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    数量
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    购买日期
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    当前价格
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {investments.map((investment) => (
                  <tr key={investment.investmentId}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {investment.stockName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {investment.stockCode}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      ¥{investment.purchasePrice}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {investment.quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {format(new Date(investment.purchaseDate), 'yyyy-MM-dd')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      ¥{investment.currentPrice}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <Watchlist />
      </div>
    </div>
  )
}

export default Dashboard 