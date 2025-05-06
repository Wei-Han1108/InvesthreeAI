import { useState, useEffect } from 'react'
import useInvestmentStore from '../store/investmentStore'
import useWatchlistStore from '../store/watchlistStore'
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline'

const AIReport = () => {
  const [expandedSection, setExpandedSection] = useState<'portfolio' | 'watchlist' | null>(null)
  const investments = useInvestmentStore((state) => state.investments)
  const loadInvestments = useInvestmentStore((state) => state.loadInvestments)
  const watchlist = useWatchlistStore((state) => state.watchlist)
  const loadWatchlist = useWatchlistStore((state) => state.loadWatchlist)

  // 获取去重后的投资组合
  const uniqueInvestments = investments.reduce((acc, current) => {
    const existingIndex = acc.findIndex(item => item.stockCode === current.stockCode)
    if (existingIndex === -1) {
      // 如果股票不存在，添加它
      acc.push(current)
    } else {
      // 如果股票已存在，比较购买日期，保留最新的记录
      const existing = acc[existingIndex]
      if (new Date(current.purchaseDate) > new Date(existing.purchaseDate)) {
        acc[existingIndex] = current
      }
    }
    return acc
  }, [] as typeof investments)

  useEffect(() => {
    const loadData = async () => {
      try {
        await loadInvestments()
        await loadWatchlist()
      } catch (error) {
        console.error('Error loading data:', error)
      }
    }
    loadData()
  }, [loadInvestments, loadWatchlist])

  const toggleSection = (section: 'portfolio' | 'watchlist') => {
    setExpandedSection(expandedSection === section ? null : section)
  }

  return (
    <div className="w-64 bg-white shadow-lg rounded-lg p-4">
      <div className="space-y-2">
        {/* Portfolio Section */}
        <div className="border rounded-lg">
          <button
            className="w-full px-4 py-2 flex items-center justify-between hover:bg-gray-50"
            onClick={() => toggleSection('portfolio')}
          >
            <span className="font-medium">我的投资组合</span>
            {expandedSection === 'portfolio' ? (
              <ChevronDownIcon className="w-5 h-5" />
            ) : (
              <ChevronRightIcon className="w-5 h-5" />
            )}
          </button>
          {expandedSection === 'portfolio' && (
            <div className="px-4 py-2 border-t">
              {uniqueInvestments.length === 0 ? (
                <p className="text-gray-500 text-sm">暂无投资股票</p>
              ) : (
                <ul className="space-y-1">
                  {uniqueInvestments.map((investment) => (
                    <li key={investment.investmentId} className="text-sm hover:text-blue-600 cursor-pointer">
                      {investment.stockName} ({investment.stockCode})
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        {/* Watchlist Section */}
        <div className="border rounded-lg">
          <button
            className="w-full px-4 py-2 flex items-center justify-between hover:bg-gray-50"
            onClick={() => toggleSection('watchlist')}
          >
            <span className="font-medium">关注列表</span>
            {expandedSection === 'watchlist' ? (
              <ChevronDownIcon className="w-5 h-5" />
            ) : (
              <ChevronRightIcon className="w-5 h-5" />
            )}
          </button>
          {expandedSection === 'watchlist' && (
            <div className="px-4 py-2 border-t">
              {watchlist.length === 0 ? (
                <p className="text-gray-500 text-sm">暂无关注股票</p>
              ) : (
                <ul className="space-y-1">
                  {watchlist.map((stock) => (
                    <li key={stock.symbol} className="text-sm hover:text-blue-600 cursor-pointer">
                      {stock.name} ({stock.symbol})
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AIReport