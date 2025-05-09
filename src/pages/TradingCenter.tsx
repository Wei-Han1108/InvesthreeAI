import { useState, useRef, useEffect } from 'react'
import useInvestmentStore from '../store/investmentStore'
import AddInvestmentModal from '../components/AddInvestmentModal'
import SellInvestmentModal from '../components/SellInvestmentModal'

const TABS = [
  { key: 'stock', label: 'Stock' },
  { key: 'forex', label: 'Forex' },
  { key: 'crypto', label: 'Crypto' },
  { key: 'etf', label: 'ETF' },
  { key: 'commodities', label: 'Commodities' },
]

const initialFilters = {
  marketCapMoreThan: '',
  marketCapLowerThan: '',
  priceMoreThan: '',
  priceLowerThan: '',
  betaMoreThan: '',
  betaLowerThan: '',
  volumeMoreThan: '',
  volumeLowerThan: '',
  dividendMoreThan: '',
  dividendLowerThan: '',
  isEtf: '',
  isFund: '',
  isActivelyTrading: '',
  sector: '',
  industry: '',
  country: '',
  exchange: '',
  limit: '',
  query: '',
}

const FMP_API_KEY = import.meta.env.VITE_FMP_API_KEY

const TradingCenter = () => {
  const [selectedTab, setSelectedTab] = useState('stock')
  const [filters, setFilters] = useState(initialFilters)
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const suggestRef = useRef<HTMLDivElement>(null)
  const suggestTimeout = useRef<any>(null)
  const [profiles, setProfiles] = useState<any[]>([])
  const [profileLoading, setProfileLoading] = useState(false)
  const [quotes, setQuotes] = useState<any[]>([])
  const investments = useInvestmentStore((state) => state.investments)
  const loadInvestments = useInvestmentStore((state) => state.loadInvestments)
  const addInvestment = useInvestmentStore((state) => state.addInvestment)
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedStockForBuy, setSelectedStockForBuy] = useState<{ symbol: string, name: string } | null>(null)
  const sellInvestment = useInvestmentStore((state) => state.sellInvestment)
  const [showSellModal, setShowSellModal] = useState(false)
  const [selectedStockForSell, setSelectedStockForSell] = useState<{
    investmentId: string
    symbol: string
    name: string
    quantity: number
  } | null>(null)

  useEffect(() => {
    const fetchInitialStocks = async () => {
      if (results.length > 0) return // Don't fetch if we already have results
      setLoading(true)
      setError('')
      try {
        const res = await fetch(`https://financialmodelingprep.com/api/v3/stock-screener?limit=50&apikey=${FMP_API_KEY}`)
        if (!res.ok) throw new Error('Failed to fetch initial stocks')
        const data = await res.json()
        setResults(data)
      } catch (err: any) {
        setError(err.message || 'Error loading initial stocks')
      } finally {
        setLoading(false)
      }
    }

    fetchInitialStocks()
  }, [])

  const fetchSuggestions = async (query: string) => {
    if (!query || query.length < 2) {
      setSuggestions([])
      return
    }
    try {
      const res = await fetch(`https://financialmodelingprep.com/api/v3/search?query=${encodeURIComponent(query)}&limit=8&apikey=${FMP_API_KEY}`)
      if (!res.ok) throw new Error('Failed to fetch suggestions')
      const data = await res.json()
      setSuggestions(data)
    } catch {
      setSuggestions([])
    }
  }

  const handleQueryInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setFilters(prev => ({ ...prev, query: value }))
    if (suggestTimeout.current) clearTimeout(suggestTimeout.current)
    if (value.length >= 2) {
      suggestTimeout.current = setTimeout(() => {
        fetchSuggestions(value)
        setShowSuggestions(true)
      }, 250)
    } else {
      setSuggestions([])
      setShowSuggestions(false)
    }
  }

  const handleSuggestionClick = (item: any) => {
    setFilters(prev => ({ ...prev, query: item.symbol }))
    setShowSuggestions(false)
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestRef.current && !suggestRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFilters(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setResults([])
    try {
      if (filters.query && filters.query.trim().length > 0) {
        // 1. 关键词优先：先用search接口
        const searchRes = await fetch(`https://financialmodelingprep.com/api/v3/search?query=${encodeURIComponent(filters.query)}&limit=50&apikey=${FMP_API_KEY}`)
        if (!searchRes.ok) throw new Error('Failed to fetch search results')
        const searchData = await searchRes.json()
        // 2. 本地用其他筛选条件过滤
        const filtered = searchData.filter((item: any) => {
          // 只对有值的筛选项做判断
          const {
            marketCapMoreThan,
            marketCapLowerThan,
            priceMoreThan,
            priceLowerThan,
            betaMoreThan,
            betaLowerThan,
            volumeMoreThan,
            volumeLowerThan,
            dividendMoreThan,
            dividendLowerThan,
            isEtf,
            isFund,
            isActivelyTrading,
            sector,
            industry,
            country,
            exchange,
          } = filters
          // 逐项判断
          if (marketCapMoreThan && item.marketCap && item.marketCap < Number(marketCapMoreThan)) return false
          if (marketCapLowerThan && item.marketCap && item.marketCap > Number(marketCapLowerThan)) return false
          if (priceMoreThan && item.price && item.price < Number(priceMoreThan)) return false
          if (priceLowerThan && item.price && item.price > Number(priceLowerThan)) return false
          if (betaMoreThan && item.beta && item.beta < Number(betaMoreThan)) return false
          if (betaLowerThan && item.beta && item.beta > Number(betaLowerThan)) return false
          if (volumeMoreThan && item.volume && item.volume < Number(volumeMoreThan)) return false
          if (volumeLowerThan && item.volume && item.volume > Number(volumeLowerThan)) return false
          if (dividendMoreThan && item.lastDiv && item.lastDiv < Number(dividendMoreThan)) return false
          if (dividendLowerThan && item.lastDiv && item.lastDiv > Number(dividendLowerThan)) return false
          if (isEtf && String(item.isEtf) !== isEtf) return false
          if (isFund && String(item.isFund) !== isFund) return false
          if (isActivelyTrading && String(item.isActivelyTrading) !== isActivelyTrading) return false
          if (sector && item.sector && !item.sector.toLowerCase().includes(sector.toLowerCase())) return false
          if (industry && item.industry && !item.industry.toLowerCase().includes(industry.toLowerCase())) return false
          if (country && item.country && !item.country.toLowerCase().includes(country.toLowerCase())) return false
          if (exchange && item.exchangeShortName && !item.exchangeShortName.toLowerCase().includes(exchange.toLowerCase())) return false
          return true
        })
        // limit
        const limited = filters.limit ? filtered.slice(0, Number(filters.limit)) : filtered
        setResults(limited)
      } else {
        // 关键词为空，直接用stock-screener API
        const params = Object.entries(filters)
          .filter(([k, v]) => v !== '' && k !== 'query')
          .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
          .join('&')
        const apiUrl = `https://financialmodelingprep.com/api/v3/stock-screener?${params}&apikey=${FMP_API_KEY}`
        const res = await fetch(apiUrl)
        if (!res.ok) throw new Error('Failed to fetch data')
        const data = await res.json()
        setResults(data)
      }
    } catch (err: any) {
      setError(err.message || 'Error')
    } finally {
      setLoading(false)
    }
  }

  const fetchProfiles = async (symbols: string[]) => {
    if (!symbols.length) return []
    try {
      const res = await fetch(`https://financialmodelingprep.com/api/v3/profile/${symbols.join(',')}?apikey=${FMP_API_KEY}`)
      if (!res.ok) return []
      return await res.json()
    } catch {
      return []
    }
  }

  useEffect(() => {
    let ignore = false
    const loadProfiles = async () => {
      if (!results.length) {
        setProfiles([])
        setProfileLoading(false)
        return
      }
      setProfileLoading(true)
      const symbols = results.map((item: any) => item.symbol).filter(Boolean)
      const data = await fetchProfiles(symbols)
      if (!ignore) {
        setProfiles(data)
        setProfileLoading(false)
      }
    }
    loadProfiles()
    return () => { ignore = true }
  }, [results])

  useEffect(() => {
    loadInvestments()
  }, [loadInvestments])

  useEffect(() => {
    if (results.length > 0) {
      loadInvestments()
    }
  }, [results, loadInvestments])

  const renderStockFilter = () => (
    <div className="bg-violet-50 rounded-xl p-6 mb-8">
      <form className="grid grid-cols-6 gap-4" onSubmit={handleSubmit}>
        <div>
          <label className="block text-violet-700 font-semibold mb-1 text-sm">Market Cap More Than</label>
          <input name="marketCapMoreThan" type="number" value={filters.marketCapMoreThan} onChange={handleInputChange} className="w-full border rounded px-2 py-1" placeholder="Enter Number" />
        </div>
        <div>
          <label className="block text-violet-700 font-semibold mb-1 text-sm">Market Cap Lower Than</label>
          <input name="marketCapLowerThan" type="number" value={filters.marketCapLowerThan} onChange={handleInputChange} className="w-full border rounded px-2 py-1" placeholder="Enter Number" />
        </div>
        <div>
          <label className="block text-violet-700 font-semibold mb-1 text-sm">Price More Than</label>
          <input name="priceMoreThan" type="number" value={filters.priceMoreThan} onChange={handleInputChange} className="w-full border rounded px-2 py-1" placeholder="Enter Number" />
        </div>
        <div>
          <label className="block text-violet-700 font-semibold mb-1 text-sm">Price Lower Than</label>
          <input name="priceLowerThan" type="number" value={filters.priceLowerThan} onChange={handleInputChange} className="w-full border rounded px-2 py-1" placeholder="Enter Number" />
        </div>
        <div>
          <label className="block text-violet-700 font-semibold mb-1 text-sm">Beta More Than</label>
          <input name="betaMoreThan" type="number" value={filters.betaMoreThan} onChange={handleInputChange} className="w-full border rounded px-2 py-1" placeholder="Enter Number" />
        </div>
        <div>
          <label className="block text-violet-700 font-semibold mb-1 text-sm">Beta Lower Than</label>
          <input name="betaLowerThan" type="number" value={filters.betaLowerThan} onChange={handleInputChange} className="w-full border rounded px-2 py-1" placeholder="Enter Number" />
        </div>
        <div>
          <label className="block text-violet-700 font-semibold mb-1 text-sm">Volume More Than</label>
          <input name="volumeMoreThan" type="number" value={filters.volumeMoreThan} onChange={handleInputChange} className="w-full border rounded px-2 py-1" placeholder="Enter Number" />
        </div>
        <div>
          <label className="block text-violet-700 font-semibold mb-1 text-sm">Volume Lower Than</label>
          <input name="volumeLowerThan" type="number" value={filters.volumeLowerThan} onChange={handleInputChange} className="w-full border rounded px-2 py-1" placeholder="Enter Number" />
        </div>
        <div>
          <label className="block text-violet-700 font-semibold mb-1 text-sm">Dividend More Than</label>
          <input name="dividendMoreThan" type="number" value={filters.dividendMoreThan} onChange={handleInputChange} className="w-full border rounded px-2 py-1" placeholder="Enter Number" />
        </div>
        <div>
          <label className="block text-violet-700 font-semibold mb-1 text-sm">Dividend Lower Than</label>
          <input name="dividendLowerThan" type="number" value={filters.dividendLowerThan} onChange={handleInputChange} className="w-full border rounded px-2 py-1" placeholder="Enter Number" />
        </div>
        <div>
          <label className="block text-violet-700 font-semibold mb-1 text-sm">Is Etf</label>
          <select name="isEtf" value={filters.isEtf} onChange={handleInputChange} className="w-full border rounded px-2 py-1">
            <option value="">-</option>
            <option value="true">True</option>
            <option value="false">False</option>
          </select>
        </div>
        <div>
          <label className="block text-violet-700 font-semibold mb-1 text-sm">Is Fund</label>
          <select name="isFund" value={filters.isFund} onChange={handleInputChange} className="w-full border rounded px-2 py-1">
            <option value="">-</option>
            <option value="true">True</option>
            <option value="false">False</option>
          </select>
        </div>
        <div>
          <label className="block text-violet-700 font-semibold mb-1 text-sm">Is Actively Trading</label>
          <select name="isActivelyTrading" value={filters.isActivelyTrading} onChange={handleInputChange} className="w-full border rounded px-2 py-1">
            <option value="">-</option>
            <option value="true">True</option>
            <option value="false">False</option>
          </select>
        </div>
        <div>
          <label className="block text-violet-700 font-semibold mb-1 text-sm">Sector</label>
          <input name="sector" value={filters.sector} onChange={handleInputChange} className="w-full border rounded px-2 py-1" placeholder="Search sector" />
        </div>
        <div>
          <label className="block text-violet-700 font-semibold mb-1 text-sm">Industry</label>
          <input name="industry" value={filters.industry} onChange={handleInputChange} className="w-full border rounded px-2 py-1" placeholder="Search industry" />
        </div>
        <div>
          <label className="block text-violet-700 font-semibold mb-1 text-sm">Country</label>
          <input name="country" value={filters.country} onChange={handleInputChange} className="w-full border rounded px-2 py-1" placeholder="Enter Text" />
        </div>
        <div>
          <label className="block text-violet-700 font-semibold mb-1 text-sm">Exchange</label>
          <input name="exchange" value={filters.exchange} onChange={handleInputChange} className="w-full border rounded px-2 py-1" placeholder="Search exchange" />
        </div>
        <div>
          <label className="block text-violet-700 font-semibold mb-1 text-sm">Limit</label>
          <input name="limit" type="number" value={filters.limit} onChange={handleInputChange} className="w-full border rounded px-2 py-1" placeholder="Enter Number" />
        </div>
        <div className="col-span-6 flex justify-end mt-2 items-center gap-2" ref={suggestRef}>
          <div className="relative w-64 mr-2">
            <input
              name="query"
              value={filters.query}
              onChange={handleQueryInput}
              className="border rounded px-3 py-2 w-full focus:ring-2 focus:ring-violet-400"
              placeholder="Search by symbol or name..."
              autoComplete="off"
              style={{ minWidth: 0 }}
              onFocus={() => { if (filters.query.length >= 2 && suggestions.length > 0) setShowSuggestions(true) }}
            />
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute left-0 top-full mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto z-30">
                {suggestions.map((s, idx) => (
                  <div
                    key={s.symbol + idx}
                    className="px-4 py-2 cursor-pointer hover:bg-violet-50 flex justify-between"
                    onClick={() => handleSuggestionClick(s)}
                  >
                    <span className="font-bold mr-2">{s.symbol}</span>
                    <span className="text-gray-600 truncate">{s.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <button type="submit" className="bg-violet-600 text-white px-6 py-2 rounded font-semibold hover:bg-violet-700 transition">Search</button>
        </div>
      </form>
    </div>
  )

  const renderStockResults = () => {
    console.log('Current investments:', investments)
    const merged = results.map((item: any) => {
      const profile = profiles.find((p: any) => p.symbol === item.symbol) || {}
      // 计算该股票的所有投资记录
      const stockInvestments = investments.filter(inv => inv.stockCode === item.symbol)
      console.log(`Stock ${item.symbol} investments:`, stockInvestments)
      // 计算总买入数量和总卖出数量
      const totalBuy = stockInvestments.reduce((sum, inv) => sum + inv.quantity, 0)
      const totalSell = stockInvestments.reduce((sum, inv) => sum + (inv.sellQuantity || 0), 0)
      console.log(`Stock ${item.symbol} totalBuy:`, totalBuy, 'totalSell:', totalSell)
      // 计算实际持仓数量
      const actualQuantity = totalBuy - totalSell
      // 如果有持仓，使用最新的投资记录ID
      const holding = actualQuantity > 0 ? {
        quantity: actualQuantity,
        investmentId: stockInvestments[0]?.investmentId
      } : null
      console.log(`Stock ${item.symbol} holding:`, holding)

      return { ...item, ...profile, holding }
    })
    merged.sort((a, b) => (b.holding ? 1 : 0) - (a.holding ? 1 : 0))

    return (
      <div className="overflow-x-auto">
        {(loading || profileLoading) && <div className="text-violet-600 py-4">Loading...</div>}
        {error && <div className="text-red-500 py-2">{error}</div>}
        {!loading && !profileLoading && !error && merged.length > 0 && (
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 text-left">LOGO</th>
                <th className="px-4 py-2 text-left">Symbol</th>
                <th className="px-4 py-2 text-left">Name</th>
                <th className="px-4 py-2 text-right">Holding</th>
                <th className="px-4 py-2 text-right">Price</th>
                <th className="px-4 py-2 text-left">Industry</th>
                <th className="px-4 py-2 text-right">Market Cap</th>
                <th className="px-4 py-2 text-right">Volume</th>
                <th className="px-4 py-2 text-center w-32">Operation</th>
              </tr>
            </thead>
            <tbody>
              {merged.map((stock: any, idx: number) => (
                <tr key={stock.symbol} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-4 py-2">
                    {stock.image ? (
                      <img
                        src={stock.image}
                        alt={stock.symbol}
                        className="w-7 h-7 object-contain"
                        onError={e => {
                          const target = e.currentTarget;
                          target.onerror = null;
                          target.style.display = 'none';
                        }}
                      />
                    ) : (
                      <span className="w-7 h-7 inline-block bg-gray-200 rounded"></span>
                    )}
                  </td>
                  <td className="px-4 py-2 font-bold">{stock.symbol}</td>
                  <td className="px-4 py-2">
                    <button
                      className="text-blue-700 hover:underline hover:text-blue-900 font-medium"
                      onClick={() => {
                        setSelectedStockForBuy({ symbol: stock.symbol, name: stock.companyName || stock.name })
                        setShowAddModal(true)
                      }}
                    >
                      {stock.companyName || stock.name}
                    </button>
                  </td>
                  <td className="px-4 py-2 text-right font-semibold">
                    {stock.holding ? stock.holding.quantity : ''}
                  </td>
                  <td className="px-4 py-2 text-right">{typeof stock.price === 'number' ? `$${stock.price.toFixed(2)}` : '-'}</td>
                  <td className="px-4 py-2">{stock.industry || '-'}</td>
                  <td className="px-4 py-2 text-right">{stock.marketCap ? `$${Number(stock.marketCap).toLocaleString()}` : (stock.mktCap ? `$${Number(stock.mktCap).toLocaleString()}` : '-')}</td>
                  <td className="px-4 py-2 text-right">{stock.volAvg ? Number(stock.volAvg).toLocaleString() : (stock.volume ? Number(stock.volume).toLocaleString() : '-')}</td>
                  <td className="px-4 py-2 text-center w-32">
                    <div className="flex justify-center space-x-2">
                      <button
                        className="px-3 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
                        onClick={() => {
                          setSelectedStockForBuy({ symbol: stock.symbol, name: stock.companyName || stock.name })
                          setShowAddModal(true)
                        }}
                      >
                        Buy
                      </button>
                      {stock.holding && (
                        <button
                          className="px-3 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleSellInvestment(
                              stock.holding.investmentId,
                              stock.symbol,
                              stock.companyName || stock.name,
                              stock.holding.quantity
                            )
                          }}
                        >
                          Sell
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!loading && !profileLoading && !error && results.length > 0 && merged.length === 0 && (
          <div className="text-gray-500 py-4">No results found.</div>
        )}
      </div>
    )
  }

  const handleAddInvestment = async (investment: {
    symbol: string
    name: string
    shares: number
    purchasePrice: number
    purchaseDate: string
    currentPrice: number
  }) => {
    try {
      await addInvestment({
        stockName: investment.name,
        stockCode: investment.symbol,
        purchasePrice: investment.purchasePrice,
        quantity: investment.shares,
        purchaseDate: investment.purchaseDate,
        currentPrice: investment.currentPrice,
      })
      setShowAddModal(false)
      setSelectedStockForBuy(null)
      await loadInvestments()
    } catch (error) {
      console.error('Failed to add investment:', error)
    }
  }

  const handleSellInvestment = (investmentId: string, symbol: string, name: string, quantity: number) => {
    // 计算实际可卖出的数量
    const stockInvestments = investments.filter(inv => inv.stockCode === symbol)
    const totalBuy = stockInvestments.reduce((sum, inv) => sum + inv.quantity, 0)
    const totalSell = stockInvestments.reduce((sum, inv) => sum + (inv.sellQuantity || 0), 0)
    const actualQuantity = totalBuy - totalSell

    if (actualQuantity <= 0) {
      console.error('No shares available to sell')
      return
    }

    setSelectedStockForSell({ investmentId, symbol, name, quantity: actualQuantity })
    setShowSellModal(true)
  }

  const handleSellComplete = async () => {
    await loadInvestments()
  }

  return (
    <div className="max-w-7xl mx-auto mt-10">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-4">
        <span className="text-green-600">⚡</span>
        Trading Center
      </h2>
      {/* Tab Bar */}
      <div className="flex border-b border-gray-200 mb-8">
        {TABS.map(tab => (
          <button
            key={tab.key}
            className={`px-6 py-2 font-medium focus:outline-none transition-colors duration-150 ${selectedTab === tab.key ? 'border-b-2 border-teal-500 text-teal-600' : 'text-gray-400 hover:text-gray-700'}`}
            onClick={() => setSelectedTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {/* Tab Content */}
      {selectedTab === 'stock' && (
        <div>
          {renderStockFilter()}
          {renderStockResults()}
          <AddInvestmentModal
            isOpen={showAddModal}
            onClose={() => { setShowAddModal(false); setSelectedStockForBuy(null) }}
            onAdd={handleAddInvestment}
            {...(selectedStockForBuy ? { defaultSymbol: selectedStockForBuy.symbol, defaultName: selectedStockForBuy.name } : {})}
          />
          <SellInvestmentModal
            isOpen={showSellModal}
            onClose={() => { setShowSellModal(false); setSelectedStockForSell(null) }}
            onSell={handleSellComplete}
            {...(selectedStockForSell ? {
              investmentId: selectedStockForSell.investmentId,
              stockCode: selectedStockForSell.symbol,
              stockName: selectedStockForSell.name,
              currentQuantity: selectedStockForSell.quantity
            } : {
              investmentId: '',
              stockCode: '',
              stockName: '',
              currentQuantity: 0
            })}
          />
        </div>
      )}
      {selectedTab === 'forex' && <div>Forex Trading Coming Soon...</div>}
      {selectedTab === 'crypto' && <div>Crypto Trading Coming Soon...</div>}
      {selectedTab === 'etf' && <div>ETF Trading Coming Soon...</div>}
      {selectedTab === 'commodities' && <div>Commodities Trading Coming Soon...</div>}
    </div>
  )
}

export default TradingCenter 