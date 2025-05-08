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

interface CommodityData {
  symbol: string
  name: string
  price: number
  changesPercentage: number
  open?: number
  dayHigh?: number
  dayLow?: number
  previousClose?: number
  volume?: number
  description?: string
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

const Commodities = () => {
  const [commodities, setCommodities] = useState<CommodityData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [lastUpdateTime, setLastUpdateTime] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedCommodity, setSelectedCommodity] = useState<CommodityData | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState('')
  const [intradayData, setIntradayData] = useState<ChartData[]>([])
  const [dailyData, setDailyData] = useState<ChartData[]>([])
  const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRange>('1D')
  const searchRef = useRef<HTMLDivElement>(null)

  const fetchCommodities = async () => {
    try {
      setLoading(true)
      const res = await fetch(`https://financialmodelingprep.com/api/v3/quotes/commodity?apikey=${import.meta.env.VITE_FMP_API_KEY}`)
      if (!res.ok) throw new Error('Failed to fetch commodities')
      const data = await res.json()
      setCommodities(data)
      setLastUpdateTime(new Date().toLocaleString())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const fetchCommodityDetail = async (symbol: string) => {
    setDetailLoading(true)
    setDetailError('')
    setSelectedCommodity(null)
    try {
      // 查询详细信息（如有更详细的API可替换）
      const res = await fetch(`https://financialmodelingprep.com/api/v3/quote/${symbol}?apikey=${import.meta.env.VITE_FMP_API_KEY}`)
      if (!res.ok) throw new Error('Failed to fetch commodity detail')
      const data = await res.json()
      if (Array.isArray(data) && data.length > 0) {
        setSelectedCommodity(data[0])
      } else {
        setDetailError('No detail found for this commodity.')
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
        // Get last 390 minutes (6.5 hours) of data
        const lastData = data.slice(0, 390).reverse()
        setIntradayData(lastData)
      }
    } catch (error) {
      console.error('Error fetching intraday data:', error)
    }
  }

  const fetchDailyData = async (symbol: string, timeRange: TimeRange) => {
    try {
      let limit = 30 // default for 1M
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
    if (selectedCommodity) {
      fetchDailyData(selectedCommodity.symbol, range)
    }
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

  useEffect(() => {
    fetchCommodities()
    const interval = setInterval(fetchCommodities, 20000)
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
    ? commodities.filter(c =>
        c.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.name.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 10)
    : []

  const handleSuggestionClick = (s: CommodityData) => {
    setSearchQuery(s.symbol)
    setShowSuggestions(false)
    setSelectedCommodity(s)
    fetchCommodityDetail(s.symbol)
    fetchIntradayData(s.symbol)
    fetchDailyData(s.symbol, selectedTimeRange)
  }

  return (
    <div className="container mx-auto mt-6">
      <h2 className="text-3xl font-bold mb-8">Commodities</h2>
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
            onFocus={() => searchQuery && setShowSuggestions(true)}
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
        {selectedCommodity && !detailLoading && !detailError && (
          <div className="mt-6 space-y-6">
            <div className="bg-gray-50 rounded-lg p-4 shadow-inner">
              <div className="flex items-center gap-4 mb-2">
                <div className="text-xl font-bold">{selectedCommodity.name} ({selectedCommodity.symbol})</div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                <div>Current Price: <span className="font-semibold">${selectedCommodity.price?.toFixed(2)}</span></div>
                <div>Change %: <span className={`font-semibold ${selectedCommodity.changesPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>{selectedCommodity.changesPercentage?.toFixed(2)}%</span></div>
                <div>Open: <span className="font-semibold">{selectedCommodity.open?.toFixed(2) ?? '-'}</span></div>
                <div>High: <span className="font-semibold">{selectedCommodity.dayHigh?.toFixed(2) ?? '-'}</span></div>
                <div>Low: <span className="font-semibold">{selectedCommodity.dayLow?.toFixed(2) ?? '-'}</span></div>
                <div>Prev Close: <span className="font-semibold">{selectedCommodity.previousClose?.toFixed(2) ?? '-'}</span></div>
                <div>Volume: <span className="font-semibold">{selectedCommodity.volume?.toLocaleString() ?? '-'}</span></div>
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
                  <th className="px-6 py-3 text-right text-xs font-bold text-gray-600 uppercase">Open</th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-gray-600 uppercase">High</th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-gray-600 uppercase">Low</th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-gray-600 uppercase">Prev Close</th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-gray-600 uppercase">Volume</th>
                </tr>
              </thead>
              <tbody>
                {commodities.map((c, idx) => (
                  <tr key={c.symbol} className={`transition-colors duration-150 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50`}>
                    <td className="px-6 py-3 font-bold">{c.symbol}</td>
                    <td className="px-6 py-3">{c.name}</td>
                    <td className="px-6 py-3 text-right">{c.price?.toFixed(2) ?? '-'}</td>
                    <td className={`px-6 py-3 text-right font-semibold ${c.changesPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>{c.changesPercentage?.toFixed(2) ?? '-'}%</td>
                    <td className="px-6 py-3 text-right">{c.open?.toFixed(2) ?? '-'}</td>
                    <td className="px-6 py-3 text-right">{c.dayHigh?.toFixed(2) ?? '-'}</td>
                    <td className="px-6 py-3 text-right">{c.dayLow?.toFixed(2) ?? '-'}</td>
                    <td className="px-6 py-3 text-right">{c.previousClose?.toFixed(2) ?? '-'}</td>
                    <td className="px-6 py-3 text-right">{c.volume?.toLocaleString() ?? '-'}</td>
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

export default Commodities 