import { useEffect, useState } from 'react'
import { stockSearchService } from '../services/stockSearchService'

const HOT_STOCKS = [
  'AAPL', 'MSFT', 'GOOGL', 'TSLA', 'AMZN', 'NVDA', 'META', 'BABA', 'NFLX', 'AMD'
]

const getRandomStocks = (count: number) => {
  const shuffled = HOT_STOCKS.sort(() => 0.5 - Math.random())
  return shuffled.slice(0, count)
}

const Watchlist = () => {
  const [stocks, setStocks] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchStocks = async () => {
      setLoading(true)
      const symbols = getRandomStocks(20)
      const profiles = await Promise.all(symbols.map(symbol => stockSearchService.getStockProfile(symbol)))
      setStocks(profiles.filter(Boolean))
      setLoading(false)
    }
    fetchStocks()
  }, [])

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 mt-4">
      <h2 className="text-lg font-semibold mb-4">热门股票观察列表</h2>
      {loading ? (
        <div className="text-gray-500">加载中...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Logo</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">股票代码</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">公司名</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">当前价</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">行业</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {stocks.map(stock => (
                <tr key={stock.symbol}>
                  <td className="px-4 py-2">
                    {stock.image && <img src={stock.image} alt={stock.companyName} className="w-8 h-8 object-contain" />}
                  </td>
                  <td className="px-4 py-2 font-bold">{stock.symbol}</td>
                  <td className="px-4 py-2">{stock.companyName}</td>
                  <td className="px-4 py-2">${stock.price}</td>
                  <td className="px-4 py-2">{stock.industry}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default Watchlist 