import { useState, useEffect, useRef } from 'react'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'
import { format } from 'date-fns'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

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

interface ChartData {
  date: string
  close: number
  high: number
  low: number
  open: number
  volume: number
}

type TimeRange = '1D' | '5D' | '1M' | '3M' | '6M' | '1Y'

const ETFHoldings = () => {
  const [etfs, setEtfs] = useState<ETFData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [lastUpdateTime, setLastUpdateTime] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedETF, setSelectedETF] = useState<ETFData | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState('')
  const [intradayData, setIntradayData] = useState<ChartData[]>([])
  const [dailyData, setDailyData] = useState<ChartData[]>([])
  const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRange>('1D')
  const searchRef = useRef<HTMLDivElement>(null)

  const fetchETFData = async () => {
    try {
      setLoading(true)
      const res = await fetch(`https://financialmodelingprep.com/api/v3/etf/list?apikey=${import.meta.env.VITE_FMP_API_KEY}`)
      if (!res.ok) throw new Error('Failed to fetch ETF list')
      const data = await res.json()
      const etfSymbols = data.slice(0, 50).map((etf: any) => etf.symbol)
      const detailsRes = await fetch(`https://financialmodelingprep.com/api/v3/etf/holdings/${etfSymbols.join(',')}?apikey=${import.meta.env.VITE_FMP_API_KEY}`)
      const details = await detailsRes.json()
      const quoteRes = await fetch(`https://financialmodelingprep.com/api/v3/quote/${etfSymbols.join(',')}?apikey=${import.meta.env.VITE_FMP_API_KEY}`)
      const quotes = await quoteRes.json()
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

  const fetchETFDetail = async (symbol: string) => {
    setDetailLoading(true)
    setDetailError('')
    setSelectedETF(null)
    try {
      const res = await fetch(`https://financialmodelingprep.com/api/v3/quote/${symbol}?apikey=${import.meta.env.VITE_FMP_API_KEY}`)
      if (!res.ok) throw new Error('Failed to fetch ETF detail')
      const data = await res.json()
      if (Array.isArray(data) && data.length > 0) {
        setSelectedETF(data[0])
      } else {
        setDetailError('No detail found for this ETF.')
      }
    } catch (err) {
      setDetailError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setDetailLoading(false)
    }
  }

  const fetchIntradayData = async (symbol: string) => {
    try {
      const response = await fetch(
        `https://financialmodelingprep.com/api/v3/historical-chart/1min/${symbol}?apikey=${import.meta.env.VITE_FMP_API_KEY}`
      )
      if (!response.ok) throw new Error('Failed to fetch intraday data')
      const data = await response.json()
      if (Array.isArray(data)) {
        const lastData = data.slice(0, 390).reverse()
        setIntradayData(lastData)
      }
    } catch (error) {
      console.error('Error fetching intraday data:', error)
    }
  }

  const fetchDailyData = async (symbol: string, timeRange: TimeRange) => {
    try {
      let limit = 30
      switch (timeRange) {
        case '1D':
          limit = 1
          break
        case '5D':
          limit = 5
          break
        case '3M':
          limit = 90
          break
        case '6M':
          limit = 180
          break
        case '1Y':
          limit = 365
          break
      }
      const response = await fetch(
        `https://financialmodelingprep.com/api/v3/historical-price-full/${symbol}?timeseries=${limit}&apikey=${import.meta.env.VITE_FMP_API_KEY}`
      )
      if (!response.ok) throw new Error('Failed to fetch daily data')
      const data = await response.json()
      if (data.historical) {
        setDailyData(data.historical.reverse())
      }
    } catch (error) {
      console.error('Error fetching daily data:', error)
    }
  }

  const handleTimeRangeChange = (range: TimeRange) => {
    setSelectedTimeRange(range)
    if (selectedETF) {
      fetchDailyData(selectedETF.symbol, range)
    }
  }

  useEffect(() => {
    fetchETFData()
    const interval = setInterval(fetchETFData, 20000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const suggestions = searchQuery.length > 0
    ? etfs.filter(e =>
        e.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.name.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 20)
    : []

  const handleSuggestionClick = (e: ETFData) => {
    setSearchQuery(e.symbol)
    setShowSuggestions(false)
    setSelectedETF(e)
    fetchETFDetail(e.symbol)
    fetchIntradayData(e.symbol)
    fetchDailyData(e.symbol, selectedTimeRange)
  }

  const getChartData = () => {
    const data = selectedTimeRange === '1D' ? intradayData : dailyData
    return {
      labels: data.map(d => format(new Date(d.date), selectedTimeRange === '1D' ? 'HH:mm' : 'MMM dd')),
      datasets: [
        {
          label: 'Price',
          data: data.map(d => d.close),
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.5)',
          tension: 0.1
        },
        {
          label: 'Volume',
          data: data.map(d => d.volume),
          borderColor: 'rgb(153, 102, 255)',
          backgroundColor: 'rgba(153, 102, 255, 0.5)',
          tension: 0.1,
          yAxisID: 'volume'
        }
      ]
    }
  }

  const chartOptions = {
    responsive: true,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: `${selectedTimeRange} Price History`
      }
    },
    scales: {
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
      },
      volume: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        grid: {
          drawOnChartArea: false,
        },
      }
    }
  }

  return (
    <div className="container mx-auto mt-6">
      <h2 className="text-3xl font-bold mb-8">ETF Holdings</h2>
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-8" ref={searchRef}>
        <div className="flex justify-center relative">
          <input
            type="text"
            placeholder="Search symbol or name..."
            value={searchQuery}
            onChange={e => {
              setSearchQuery(e.target.value)
              setShowSuggestions(true)
            }}
            onFocus={() => setShowSuggestions(true)}
            className="w-full max-w-xl px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute left-1/2 top-full mt-1 w-full max-w-xl -translate-x-1/2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto z-30">
              {suggestions.map(s => (
                <div
                  key={s.symbol}
                  className="px-4 py-2 cursor-pointer hover:bg-blue-50"
                  onClick={() => handleSuggestionClick(s)}
                >
                  <span className="font-bold mr-2">{s.symbol}</span>
                  <span className="text-gray-600">{s.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        {detailLoading && (
          <div className="flex justify-center py-4 text-blue-500">Loading details...</div>
        )}
        {detailError && (
          <div className="text-red-500 py-2">{detailError}</div>
        )}
        {selectedETF && !detailLoading && !detailError && (
          <div className="mt-6 space-y-6">
            <div className="bg-gray-50 rounded-lg p-4 shadow-inner">
              <div className="flex items-center gap-4 mb-2">
                <div className="text-xl font-bold">{selectedETF.name} ({selectedETF.symbol})</div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                <div>Current Price: <span className="font-semibold">${selectedETF.price?.toFixed(2) ?? '-'}</span></div>
                <div>Change %: <span className={`font-semibold ${selectedETF.changesPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>{selectedETF.changesPercentage?.toFixed(2) ?? '-'}%</span></div>
                <div>NAV: <span className="font-semibold">{selectedETF.nav?.toFixed(2) ?? '-'}</span></div>
                <div>Expense Ratio: <span className="font-semibold">{selectedETF.expenseRatio?.toFixed(2) ?? '-'}</span></div>
                <div>Volume: <span className="font-semibold">{selectedETF.volume?.toLocaleString() ?? '-'}</span></div>
                <div>Top 5 Holdings: <span className="font-semibold">{selectedETF.holdings ?? '-'}</span></div>
              </div>
            </div>
            {/* Price Chart */}
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="flex justify-end mb-4 space-x-2">
                {(['1D', '5D', '1M', '3M', '6M', '1Y'] as TimeRange[]).map((range) => (
                  <button
                    key={range}
                    onClick={() => handleTimeRangeChange(range)}
                    className={`px-3 py-1 rounded ${
                      selectedTimeRange === range
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {range}
                  </button>
                ))}
              </div>
              <Line data={getChartData()} options={chartOptions} />
            </div>
          </div>
        )}
      </div>
      <div className="bg-white rounded-2xl shadow-lg p-6 mt-6">
        <div className="flex justify-between items-center mb-4">
          <div></div>
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
    </div>
  )
}

export default ETFHoldings 