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
        setError('Error fetching report data. Please try again later.')
        console.error('Error fetching report:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchReport()
  }, [selectedSymbol])

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="w-64 bg-gray-100 p-4">
        <h2 className="text-lg font-semibold mb-4">Watchlist</h2>
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

      {/* Report Content */}
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
            <h1 className="text-2xl font-bold">{report.symbol} Stock Report</h1>

            {/* Technical Analysis */}
            <section className="bg-white p-6 rounded-lg shadow-sm">
              <h2 className="text-xl font-semibold mb-4">Technical Analysis</h2>
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

            {/* Volatility Analysis */}
            <section className="bg-white p-6 rounded-lg shadow-sm">
              <h2 className="text-xl font-semibold mb-4">Volatility Analysis</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-2 text-left">Date</th>
                      <th className="px-4 py-2 text-right">Open</th>
                      <th className="px-4 py-2 text-right">High</th>
                      <th className="px-4 py-2 text-right">Low</th>
                      <th className="px-4 py-2 text-right">Close</th>
                      <th className="px-4 py-2 text-right">Volume</th>
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

            {/* Hot Events */}
            <section className="bg-white p-6 rounded-lg shadow-sm">
              <h2 className="text-xl font-semibold mb-4">Hot Events</h2>
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
            Please select a stock from the sidebar
          </div>
        )}
      </div>
    </div>
  )
}

export default StockReport 