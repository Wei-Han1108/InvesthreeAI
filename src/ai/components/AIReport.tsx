import { useState } from 'react'
import { useWatchlistStore } from '../../store/watchlistStore'
import { usePortfolioStore } from '../../store/portfolioStore'
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline'

const AIReport = () => {
  const [expandedSection, setExpandedSection] = useState<'portfolio' | 'watchlist' | null>(null)
  const watchlist = useWatchlistStore((state) => state.watchlist)
  const portfolio = usePortfolioStore((state) => state.portfolio)

  const toggleSection = (section: 'portfolio' | 'watchlist') => {
    setExpandedSection(expandedSection === section ? null : section)
  }

  return (
    <div className="flex h-screen">
      {/* 左侧栏 */}
      <div className="w-64 bg-gray-100 p-4">
        <h2 className="text-lg font-semibold mb-4">AI 分析报告</h2>
        
        {/* 已购买股票手风琴 */}
        <div className="mb-4">
          <button
            className="w-full flex items-center justify-between p-2 rounded hover:bg-gray-200"
            onClick={() => toggleSection('portfolio')}
          >
            <span className="font-medium">已购买的股票</span>
            {expandedSection === 'portfolio' ? (
              <ChevronDownIcon className="w-5 h-5" />
            ) : (
              <ChevronRightIcon className="w-5 h-5" />
            )}
          </button>
          
          {expandedSection === 'portfolio' && (
            <div className="mt-2 pl-4 space-y-1">
              {portfolio.map((stock) => (
                <div
                  key={stock.symbol}
                  className="p-2 rounded cursor-pointer hover:bg-gray-200"
                >
                  <div className="font-medium">{stock.symbol}</div>
                  <div className="text-sm text-gray-600">{stock.name}</div>
                </div>
              ))}
              {portfolio.length === 0 && (
                <div className="text-sm text-gray-500 p-2">暂无已购买的股票</div>
              )}
            </div>
          )}
        </div>

        {/* 观察列表手风琴 */}
        <div>
          <button
            className="w-full flex items-center justify-between p-2 rounded hover:bg-gray-200"
            onClick={() => toggleSection('watchlist')}
          >
            <span className="font-medium">观察列表</span>
            {expandedSection === 'watchlist' ? (
              <ChevronDownIcon className="w-5 h-5" />
            ) : (
              <ChevronRightIcon className="w-5 h-5" />
            )}
          </button>
          
          {expandedSection === 'watchlist' && (
            <div className="mt-2 pl-4 space-y-1">
              {watchlist.map((stock) => (
                <div
                  key={stock.symbol}
                  className="p-2 rounded cursor-pointer hover:bg-gray-200"
                >
                  <div className="font-medium">{stock.symbol}</div>
                  {stock.name && (
                    <div className="text-sm text-gray-600">{stock.name}</div>
                  )}
                </div>
              ))}
              {watchlist.length === 0 && (
                <div className="text-sm text-gray-500 p-2">观察列表为空</div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 右侧内容区域 - 暂时为空 */}
      <div className="flex-1 p-6">
        <div className="text-gray-500 text-center mt-8">
          请从左侧选择一只股票查看 AI 分析报告
        </div>
      </div>
    </div>
  )
}

export default AIReport 