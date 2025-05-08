import { useState, useEffect } from 'react'

interface ETFData {
  symbol: string
  name: string
  price: number
  changesPercentage: number
  nav?: number
  expenseRatio?: number
  volume?: number
  holdings?: string
}

const ETFHoldings = () => {
  const [etfs, setEtfs] = useState<ETFData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [lastUpdateTime, setLastUpdateTime] = useState('')

  const fetchETFData = async () => {
    try {
      setLoading(true)
      // 获取ETF列表
      const res = await fetch(`https://financialmodelingprep.com/api/v3/etf/list?apikey=${import.meta.env.VITE_FMP_API_KEY}`)
      if (!res.ok) throw new Error('Failed to fetch ETF list')
      const data = await res.json()
      // 只取前20个ETF
      const etfSymbols = data.slice(0, 20).map((etf: any) => etf.symbol)
      // 获取详细信息
      const detailsRes = await fetch(`https://financialmodelingprep.com/api/v3/etf/holdings/${etfSymbols.join(',')}?apikey=${import.meta.env.VITE_FMP_API_KEY}`)
      const details = await detailsRes.json()
      // 获取报价
      const quoteRes = await fetch(`https://financialmodelingprep.com/api/v3/quote/${etfSymbols.join(',')}?apikey=${import.meta.env.VITE_FMP_API_KEY}`)
      const quotes = await quoteRes.json()
      // 合并数据
      const etfData: ETFData[] = etfSymbols.map((symbol: string) => {
        const info = data.find((etf: any) => etf.symbol === symbol) || {}
        const quote = quotes.find((q: any) => q.symbol === symbol) || {}
        const holding = details.find((d: any) => d.symbol === symbol)
        return {
          symbol,
          name: info.name || symbol,
          price: quote.price,
          changesPercentage: quote.changesPercentage,
          nav: info.nav,
          expenseRatio: info.expenseRatio,
          volume: quote.volume,
          holdings: holding && holding.holdings ? holding.holdings.slice(0, 5).map((h: any) => h.asset).join(', ') : '-'
        }
      })
      setEtfs(etfData)
      setLastUpdateTime(new Date().toLocaleString())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchETFData()
    const interval = setInterval(fetchETFData, 20000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 mt-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">ETF Holdings</h2>
        <div className="text-sm text-gray-500">Last Updated: {lastUpdateTime}</div>
      </div>
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="text-red-500">{error}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full rounded-xl overflow-hidden">
            <thead className="bg-gray-100 sticky top-0 z-10">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">Symbol</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">Name</th>
                <th className="px-6 py-3 text-right text-xs font-bold text-gray-600 uppercase">Price</th>
                <th className="px-6 py-3 text-right text-xs font-bold text-gray-600 uppercase">Change %</th>
                <th className="px-6 py-3 text-right text-xs font-bold text-gray-600 uppercase">NAV</th>
                <th className="px-6 py-3 text-right text-xs font-bold text-gray-600 uppercase">Expense Ratio</th>
                <th className="px-6 py-3 text-right text-xs font-bold text-gray-600 uppercase">Volume</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">Top 5 Holdings</th>
              </tr>
            </thead>
            <tbody>
              {etfs.map((etf, idx) => (
                <tr key={etf.symbol} className={`transition-colors duration-150 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50`}>
                  <td className="px-6 py-3 font-bold">{etf.symbol}</td>
                  <td className="px-6 py-3">{etf.name}</td>
                  <td className="px-6 py-3 text-right">{etf.price?.toFixed(2) ?? '-'}</td>
                  <td className={`px-6 py-3 text-right font-semibold ${etf.changesPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>{etf.changesPercentage?.toFixed(2) ?? '-'}%</td>
                  <td className="px-6 py-3 text-right">{etf.nav?.toFixed(2) ?? '-'}</td>
                  <td className="px-6 py-3 text-right">{etf.expenseRatio?.toFixed(2) ?? '-'}</td>
                  <td className="px-6 py-3 text-right">{etf.volume?.toLocaleString() ?? '-'}</td>
                  <td className="px-6 py-3">{etf.holdings}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default ETFHoldings 