import { format } from 'date-fns'
import useInvestmentStore from '../store/investmentStore'
import SearchResults from '../components/SearchResults'
import { useState, useEffect, useRef, useCallback } from 'react'
import { stockSearchService } from '../services/stockSearchService'
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

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

interface StockData {
  symbol: string;
  name: string;
  price: number;
  changes: number;
  changesPercentage: number;
  dayLow: number;
  dayHigh: number;
  yearLow: number;
  yearHigh: number;
  marketCap: number;
  volume: number;
  avgVolume: number;
  pe: number;
  eps: number;
  dividend: number;
  dividendYield: number;
  exchange: string;
  timestamp: string;
}

interface ChartData {
  date: string;
  close: number;
  high: number;
  low: number;
  open: number;
  volume: number;
}

type TimeRange = '1D' | '5D' | '1M' | '3M' | '6M' | '1Y';

// Enhanced HotStocksTable component
const HotStocksTable = () => {
  const [stocks, setStocks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchHotStocks = async () => {
      setLoading(true)
      try {
        // Get top 25 actives
        const res = await fetch(`https://financialmodelingprep.com/api/v3/stock_market/actives?apikey=${import.meta.env.VITE_FMP_API_KEY}`)
        const data = await res.json()
        // Fetch profiles for logos and more info
        const symbols = data.slice(0, 25).map((item: any) => item.symbol)
        const profileRes = await fetch(`https://financialmodelingprep.com/api/v3/profile/${symbols.join(',')}?apikey=${import.meta.env.VITE_FMP_API_KEY}`)
        const profiles = await profileRes.json()
        // Merge data
        const merged = data.slice(0, 25).map((item: any) => {
          const profile = profiles.find((p: any) => p.symbol === item.symbol) || {}
          return {
            ...item,
            ...profile
          }
        })
        setStocks(merged)
      } catch (e) {
        setStocks([])
      } finally {
        setLoading(false)
      }
    }
    fetchHotStocks()
  }, [])

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm mt-8">
      <h2 className="text-xl font-semibold mb-4">Hot Stocks Watchlist</h2>
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 text-left">LOGO</th>
                <th className="px-4 py-2 text-left">Symbol</th>
                <th className="px-4 py-2 text-left">Name</th>
                <th className="px-4 py-2 text-right">Price</th>
                <th className="px-4 py-2 text-right">Change (%)</th>
                <th className="px-4 py-2 text-left">Industry</th>
                <th className="px-4 py-2 text-right">Market Cap</th>
                <th className="px-4 py-2 text-right">52W High</th>
                <th className="px-4 py-2 text-right">52W Low</th>
                <th className="px-4 py-2 text-right">Volume</th>
              </tr>
            </thead>
            <tbody>
              {stocks.map((stock, idx) => (
                <tr key={stock.symbol} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-4 py-2">
                    {stock.image ? (
                      <img src={stock.image} alt={stock.symbol} className="w-7 h-7 object-contain" />
                    ) : (
                      <span className="w-7 h-7 inline-block bg-gray-200 rounded"></span>
                    )}
                  </td>
                  <td className="px-4 py-2 font-bold">{stock.symbol}</td>
                  <td className="px-4 py-2">{stock.companyName || stock.name}</td>
                  <td className="px-4 py-2 text-right">${stock.price?.toFixed(2)}</td>
                  <td className={`px-4 py-2 text-right font-semibold ${stock.changesPercentage > 0 ? 'text-green-600' : stock.changesPercentage < 0 ? 'text-red-600' : ''}`}>{stock.changesPercentage?.toFixed(2)}%</td>
                  <td className="px-4 py-2">{stock.industry || '-'}</td>
                  <td className="px-4 py-2 text-right">{stock.mktCap ? `$${Number(stock.mktCap).toLocaleString()}` : '-'}</td>
                  <td className="px-4 py-2 text-right">{stock.range ? stock.range.split('-')[1]?.trim() : (stock['52WeekHigh'] || stock['yearHigh'] || '-')}</td>
                  <td className="px-4 py-2 text-right">{stock.range ? stock.range.split('-')[0]?.trim() : (stock['52WeekLow'] || stock['yearLow'] || '-')}</td>
                  <td className="px-4 py-2 text-right">{stock.volAvg ? Number(stock.volAvg).toLocaleString() : (stock.volume ? Number(stock.volume).toLocaleString() : '-')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

const Dashboard = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [showResults, setShowResults] = useState(false)
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null)
  const [stockProfile, setStockProfile] = useState<any | null>(null)
  const [stockData, setStockData] = useState<StockData | null>(null)
  const [intradayData, setIntradayData] = useState<ChartData[]>([])
  const [dailyData, setDailyData] = useState<ChartData[]>([])
  const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRange>('1D')
  const [lastUpdateTime, setLastUpdateTime] = useState<string>('')
  const [loading, setLoading] = useState(false)
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

  const fetchStockData = async (symbol: string) => {
    try {
      setLoading(true)
      console.log('Fetching stock data for:', symbol)
      const response = await fetch(`https://financialmodelingprep.com/api/v3/quote/${symbol}?apikey=${import.meta.env.VITE_FMP_API_KEY}`)
      if (!response.ok) throw new Error('Failed to fetch stock data')
      const data = await response.json()
      console.log('Received stock data:', data)
      if (Array.isArray(data) && data.length > 0) {
        setStockData(data[0])
        setLastUpdateTime(new Date().toLocaleString())
      }
    } catch (error) {
      console.error('Error fetching stock data:', error)
    } finally {
      setLoading(false)
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

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
    setSelectedSymbol(null)
    setStockProfile(null)
    setStockData(null)
  }, [])

  const handleResultSelect = useCallback(async (symbol: string) => {
    console.log('Selected symbol:', symbol)
    setSelectedSymbol(symbol)
    setShowResults(false)
    setSearchQuery(symbol)
    setLoading(true)
    try {
      const [profile, data] = await Promise.all([
        stockSearchService.getStockProfile(symbol),
        fetchStockData(symbol),
        fetchIntradayData(symbol),
        fetchDailyData(symbol, selectedTimeRange)
      ])
      console.log('Profile data:', profile)
      setStockProfile(profile)
    } catch (error) {
      console.error('Error loading stock data:', error)
    } finally {
      setLoading(false)
    }
  }, [selectedTimeRange])

  const handleCloseResults = useCallback(() => {
    setShowResults(false)
  }, [])

  const handleTimeRangeChange = (range: TimeRange) => {
    setSelectedTimeRange(range)
    if (selectedSymbol) {
      fetchDailyData(selectedSymbol, range)
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

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Stock Monitor</h1>
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <div className="max-w-2xl mx-auto relative" ref={searchRef}>
          <input
            type="text"
            placeholder="Search stock symbol or name..."
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
        {loading ? (
          <div className="mt-6 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : stockProfile && stockData ? (
          <div className="mt-6 space-y-6">
            <div className="bg-gray-50 p-4 rounded-lg shadow-inner">
              <div className="flex items-center gap-4 mb-2">
                {stockProfile.image && <img src={stockProfile.image} alt={stockProfile.companyName} className="w-12 h-12 object-contain" />}
                <div>
                  <div className="text-xl font-bold">{stockProfile.companyName} ({stockProfile.symbol})</div>
                  <div className="text-gray-500 text-sm">{stockProfile.exchangeShortName} | {stockProfile.industry}</div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                <div>Current Price: <span className="font-semibold">${stockData.price?.toFixed(2)}</span></div>
                <div>Market Cap: <span className="font-semibold">${stockData.marketCap?.toLocaleString()}</span></div>
                <div>Industry: <span className="font-semibold">{stockProfile.industry}</span></div>
                <div>CEO: <span className="font-semibold">{stockProfile.ceo}</span></div>
                <div>Country: <span className="font-semibold">{stockProfile.country}</span></div>
                <div>Website: <a href={stockProfile.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">{stockProfile.website}</a></div>
              </div>
              <div className="mt-2 text-gray-700 text-sm">{stockProfile.description}</div>
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

            <div className="overflow-x-auto">
              <table className="min-w-full rounded-xl overflow-hidden">
                <thead className="bg-gray-100 sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">Metric</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">Value</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">Metric</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">Value</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-white">
                    <td className="px-6 py-3 text-sm">Price Change</td>
                    <td className={`px-6 py-3 text-sm font-semibold ${stockData.changes >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {stockData.changes?.toFixed(2)} ({stockData.changesPercentage?.toFixed(2)}%)
                    </td>
                    <td className="px-6 py-3 text-sm">Day Low</td>
                    <td className="px-6 py-3 text-sm">${stockData.dayLow?.toFixed(2)}</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="px-6 py-3 text-sm">Day High</td>
                    <td className="px-6 py-3 text-sm">${stockData.dayHigh?.toFixed(2)}</td>
                    <td className="px-6 py-3 text-sm">52 Week Low</td>
                    <td className="px-6 py-3 text-sm">${stockData.yearLow?.toFixed(2)}</td>
                  </tr>
                  <tr className="bg-white">
                    <td className="px-6 py-3 text-sm">52 Week High</td>
                    <td className="px-6 py-3 text-sm">${stockData.yearHigh?.toFixed(2)}</td>
                    <td className="px-6 py-3 text-sm">Volume</td>
                    <td className="px-6 py-3 text-sm">{stockData.volume?.toLocaleString()}</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="px-6 py-3 text-sm">Avg Volume</td>
                    <td className="px-6 py-3 text-sm">{stockData.avgVolume?.toLocaleString()}</td>
                    <td className="px-6 py-3 text-sm">P/E Ratio</td>
                    <td className="px-6 py-3 text-sm">{stockData.pe?.toFixed(2)}</td>
                  </tr>
                  <tr className="bg-white">
                    <td className="px-6 py-3 text-sm">EPS</td>
                    <td className="px-6 py-3 text-sm">${stockData.eps?.toFixed(2)}</td>
                    <td className="px-6 py-3 text-sm">Dividend</td>
                    <td className="px-6 py-3 text-sm">${stockData.dividend?.toFixed(2)}</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="px-6 py-3 text-sm">Dividend Yield</td>
                    <td className="px-6 py-3 text-sm">{stockData.dividendYield?.toFixed(2)}%</td>
                    <td className="px-6 py-3 text-sm">Exchange</td>
                    <td className="px-6 py-3 text-sm">{stockData.exchange}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="text-sm text-gray-500 text-right">
              Last Updated: {lastUpdateTime}
            </div>
          </div>
        ) : null}
      </div>
      <HotStocksTable />
    </div>
  )
}

export default Dashboard 