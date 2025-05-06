import { useState, useEffect } from 'react'
import { stockReportService } from '../services/stockReportService'
import { StockReport as StockReportType } from '../types/stockReport'
import { useWatchlistStore } from '../../store/watchlistStore'

const StockReport = () => {
  const [selectedSymbol, setSelectedSymbol] = useState<string>('')
  const [report, setReport] = useState<StockReportType | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const watchlist = useWatchlistStore((state) => state.watchlist)

  useEffect(() => {
    if (watchlist.length > 0 && !selectedSymbol) {
      setSelectedSymbol(watchlist[0].symbol)
    }
  }, [watchlist])

  useEffect(() => {
    const fetchReport = async () => {
      if (!selectedSymbol) return

      setLoading(true)
      setError('')
      try {
        const [technicalAnalysis, volatility, news] = await Promise.all([
          stockReportService.getTechnicalAnalysis(selectedSymbol),
          stockReportService.getVolatility(selectedSymbol),
          stockReportService.getNews(selectedSymbol)
        ])

        setReport({
          symbol: selectedSymbol,
          technicalAnalysis,
          volatility,
          news
        })
      } catch (error) {
        setError('获取报告数据时出错，请稍后重试。')
        console.error('Error fetching report:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchReport()
  }, [selectedSymbol])

  return (
    <div className="flex h-screen">
      {/* 侧边栏 */}
      <div className="w-64 bg-gray-100 p-4">
        <h2 className="text-lg font-semibold mb-4">观察列表</h2>
        <ul className="space-y-2">
          {watchlist.map((stock) => (
            <li
              key={stock.symbol}
              className={`p-2 rounded cursor-pointer ${
                selectedSymbol === stock.symbol ? 'bg-blue-100' : 'hover:bg-gray-200'
              }`}
              onClick={() => setSelectedSymbol(stock.symbol)}
            >
              {stock.symbol}
            </li>
          ))}
        </ul>
      </div>

      {/* 报告内容 */}
      <div className="flex-1 p-6 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="p-4 bg-red-50 text-red-700 rounded-md">
            {error}
          </div>
        ) : report ? (
          <div className="space-y-6">
            <h1 className="text-2xl font-bold">{report.symbol} 股票报告</h1>

            {/* 技术面分析 */}
            <section className="bg-white p-6 rounded-lg shadow-sm">
              <h2 className="text-xl font-semibold mb-4">技术面分析</h2>
              <div className="grid grid-cols-4 gap-4">
                {report.technicalAnalysis.slice(0, 1).map((data) => (
                  <>
                    <div className="p-3 bg-gray-50 rounded">
                      <div className="text-sm text-gray-500">SMA</div>
                      <div className="text-lg font-semibold">{data.sma.toFixed(2)}</div>
                    </div>
                    <div className="p-3 bg-gray-50 rounded">
                      <div className="text-sm text-gray-500">EMA</div>
                      <div className="text-lg font-semibold">{data.ema.toFixed(2)}</div>
                    </div>
                    <div className="p-3 bg-gray-50 rounded">
                      <div className="text-sm text-gray-500">RSI</div>
                      <div className="text-lg font-semibold">{data.rsi.toFixed(2)}</div>
                    </div>
                    <div className="p-3 bg-gray-50 rounded">
                      <div className="text-sm text-gray-500">MACD</div>
                      <div className="text-lg font-semibold">{data.macd.toFixed(2)}</div>
                    </div>
                  </>
                ))}
              </div>
            </section>

            {/* 波动率分析 */}
            <section className="bg-white p-6 rounded-lg shadow-sm">
              <h2 className="text-xl font-semibold mb-4">波动率分析</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-2 text-left">日期</th>
                      <th className="px-4 py-2 text-right">开盘</th>
                      <th className="px-4 py-2 text-right">最高</th>
                      <th className="px-4 py-2 text-right">最低</th>
                      <th className="px-4 py-2 text-right">收盘</th>
                      <th className="px-4 py-2 text-right">成交量</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.volatility.slice(0, 5).map((data) => (
                      <tr key={data.date} className="border-t">
                        <td className="px-4 py-2">{new Date(data.date).toLocaleDateString()}</td>
                        <td className="px-4 py-2 text-right">{data.open.toFixed(2)}</td>
                        <td className="px-4 py-2 text-right">{data.high.toFixed(2)}</td>
                        <td className="px-4 py-2 text-right">{data.low.toFixed(2)}</td>
                        <td className="px-4 py-2 text-right">{data.close.toFixed(2)}</td>
                        <td className="px-4 py-2 text-right">{data.volume.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* 热点事件 */}
            <section className="bg-white p-6 rounded-lg shadow-sm">
              <h2 className="text-xl font-semibold mb-4">热点事件</h2>
              <div className="space-y-4">
                {report.news.map((item) => (
                  <div key={item.url} className="border-b pb-4">
                    <h3 className="text-lg font-medium mb-2">
                      <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        {item.title}
                      </a>
                    </h3>
                    <div className="text-sm text-gray-500 mb-2">
                      {new Date(item.date).toLocaleDateString()} - {item.site}
                    </div>
                    <p className="text-gray-700">{item.summary}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            请从侧边栏选择一只股票
          </div>
        )}
      </div>
    </div>
  )
}

export default StockReport 