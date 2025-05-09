import React, { useState, useEffect, useRef } from 'react'
import { FMP_API_KEY } from '../config'
import useInvestmentStore from '../store/investmentStore'
import AddInvestmentModal from '../components/AddInvestmentModal'
import SellInvestmentModal from '../components/SellInvestmentModal'

interface ForexData {
  symbol: string
  name: string
  price: number
  changesPercentage: number
  bid: number
  ask: number
  open: number
  high: number
  low: number
  volume: number
}

const Forex = () => {
  const { investments, loadInvestments } = useInvestmentStore()
  const [forexData, setForexData] = useState<ForexData[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showSellModal, setShowSellModal] = useState(false)
  const [selectedForex, setSelectedForex] = useState<ForexData | null>(null)
  const suggestRef = useRef<HTMLDivElement>(null)
  const suggestTimeout = useRef<any>(null)

  useEffect(() => {
    loadInvestments()
  }, [loadInvestments])

  useEffect(() => {
    const fetchForexData = async () => {
      setLoading(true)
      setError('')
      try {
        const res = await fetch(`https://financialmodelingprep.com/api/v3/forex?apikey=${FMP_API_KEY}`)
        if (!res.ok) throw new Error('Failed to fetch forex data')
        const data = await res.json()
        setForexData(data)
      } catch (err: any) {
        setError(err.message || 'Error loading forex data')
      } finally {
        setLoading(false)
      }
    }

    fetchForexData()
  }, [])

  const fetchSuggestions = async (query: string) => {
    if (!query.trim()) {
      setSuggestions([])
      return
    }

    try {
      const res = await fetch(`https://financialmodelingprep.com/api/v3/search?query=${query}&limit=5&apikey=${FMP_API_KEY}`)
      if (!res.ok) return
      const data = await res.json()
      setSuggestions(data)
    } catch {
      setSuggestions([])
    }
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim()) return

    setLoading(true)
    setError('')
    try {
      const res = await fetch(`https://financialmodelingprep.com/api/v3/forex/${searchQuery}?apikey=${FMP_API_KEY}`)
      if (!res.ok) throw new Error('Failed to fetch forex data')
      const data = await res.json()
      setForexData(Array.isArray(data) ? data : [data])
    } catch (err: any) {
      setError(err.message || 'Error searching forex')
    } finally {
      setLoading(false)
    }
  }

  const handleBuyForex = (forex: ForexData) => {
    setSelectedForex(forex)
    setShowAddModal(true)
  }

  const handleSellForex = (forex: ForexData) => {
    setSelectedForex(forex)
    setShowSellModal(true)
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

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Forex Market</h1>
      
      <form onSubmit={handleSearch} className="mb-4">
        <div className="relative" ref={suggestRef}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              if (suggestTimeout.current) {
                clearTimeout(suggestTimeout.current)
              }
              suggestTimeout.current = setTimeout(() => {
                fetchSuggestions(e.target.value)
                setShowSuggestions(true)
              }, 300)
            }}
            placeholder="Search forex pairs (e.g., EUR/USD)"
            className="w-full p-2 border rounded"
          />
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute z-10 w-full bg-white border rounded mt-1 shadow-lg">
              {suggestions.map((suggestion) => (
                <div
                  key={suggestion.symbol}
                  className="p-2 hover:bg-gray-100 cursor-pointer"
                  onClick={() => {
                    setSearchQuery(suggestion.symbol)
                    setShowSuggestions(false)
                  }}
                >
                  {suggestion.symbol} - {suggestion.name}
                </div>
              ))}
            </div>
          )}
        </div>
        <button
          type="submit"
          className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Search
        </button>
      </form>

      {error && (
        <div className="text-red-500 mb-4">{error}</div>
      )}

      {loading ? (
        <div className="text-center">Loading...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-4 py-2 text-left">Symbol</th>
                <th className="px-4 py-2 text-right">Price</th>
                <th className="px-4 py-2 text-right">Change (%)</th>
                <th className="px-4 py-2 text-right">Bid</th>
                <th className="px-4 py-2 text-right">Ask</th>
                <th className="px-4 py-2 text-right">Open</th>
                <th className="px-4 py-2 text-right">High</th>
                <th className="px-4 py-2 text-right">Low</th>
                <th className="px-4 py-2 text-right">Volume</th>
                <th className="px-4 py-2 text-right">Holdings</th>
                <th className="px-4 py-2 text-right w-32">Operation</th>
              </tr>
            </thead>
            <tbody>
              {forexData.map((forex) => {
                const forexInvestments = investments.filter(
                  (inv) => inv.stockCode === forex.symbol
                )
                const totalBuy = forexInvestments.reduce((sum, inv) => sum + inv.quantity, 0)
                const totalSell = forexInvestments.reduce((sum, inv) => sum + (inv.sellQuantity || 0), 0)
                const actualQuantity = totalBuy - totalSell
                const holdingInfo = actualQuantity > 0 ? {
                  quantity: actualQuantity,
                  investmentId: forexInvestments[0].investmentId
                } : null

                return (
                  <tr key={forex.symbol} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-2 font-bold">{forex.symbol}</td>
                    <td className="px-4 py-2 text-right">{forex.price.toFixed(4)}</td>
                    <td className={`px-4 py-2 text-right font-semibold ${
                      forex.changesPercentage > 0 ? 'text-green-600' : forex.changesPercentage < 0 ? 'text-red-600' : ''
                    }`}>
                      {forex.changesPercentage.toFixed(2)}%
                    </td>
                    <td className="px-4 py-2 text-right">{forex.bid.toFixed(4)}</td>
                    <td className="px-4 py-2 text-right">{forex.ask.toFixed(4)}</td>
                    <td className="px-4 py-2 text-right">{forex.open.toFixed(4)}</td>
                    <td className="px-4 py-2 text-right">{forex.high.toFixed(4)}</td>
                    <td className="px-4 py-2 text-right">{forex.low.toFixed(4)}</td>
                    <td className="px-4 py-2 text-right">{forex.volume.toLocaleString()}</td>
                    <td className="px-4 py-2 text-right">
                      {holdingInfo ? (
                        <div>
                          <div>Quantity: {holdingInfo.quantity}</div>
                          <div>Value: ${(holdingInfo.quantity * forex.price).toFixed(2)}</div>
                        </div>
                      ) : (
                        'No holdings'
                      )}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <div className="flex space-x-2 justify-end">
                        <button
                          onClick={() => handleBuyForex(forex)}
                          className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                          Buy
                        </button>
                        {holdingInfo && (
                          <button
                            onClick={() => handleSellForex(forex)}
                            className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                          >
                            Sell
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {showAddModal && selectedForex && (
        <AddInvestmentModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onAdd={() => {
            setShowAddModal(false)
            loadInvestments()
          }}
          defaultSymbol={selectedForex.symbol}
          defaultName={selectedForex.name}
        />
      )}

      {showSellModal && selectedForex && (
        <SellInvestmentModal
          isOpen={showSellModal}
          onClose={() => setShowSellModal(false)}
          onSell={() => {
            setShowSellModal(false)
            loadInvestments()
          }}
          investmentId={investments.find(inv => inv.stockCode === selectedForex.symbol)?.investmentId || ''}
          stockCode={selectedForex.symbol}
          stockName={selectedForex.name}
          currentQuantity={investments
            .filter(inv => inv.stockCode === selectedForex.symbol)
            .reduce((sum, inv) => sum + inv.quantity - (inv.sellQuantity || 0), 0)}
        />
      )}
    </div>
  )
}

export default Forex 