import React, { useState, useEffect, useRef } from 'react'
import { FMP_API_KEY } from '../config'

interface CommodityData {
  symbol: string
  name: string
  price: number
  changesPercentage: number
  exchange: string
  open: number
  high: number
  low: number
  volume: number
  previousClose: number
}

const Commodities = () => {
  const [commodityData, setCommodityData] = useState<CommodityData[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const suggestRef = useRef<HTMLDivElement>(null)
  const suggestTimeout = useRef<any>(null)

  useEffect(() => {
    const fetchCommodityData = async () => {
      setLoading(true)
      setError('')
      try {
        const res = await fetch(`https://financialmodelingprep.com/api/v3/quotes/commodity?apikey=${FMP_API_KEY}`)
        if (!res.ok) throw new Error('Failed to fetch commodity data')
        const data = await res.json()
        setCommodityData(data)
      } catch (err: any) {
        setError(err.message || 'Error loading commodity data')
      } finally {
        setLoading(false)
      }
    }

    fetchCommodityData()
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
      const res = await fetch(`https://financialmodelingprep.com/api/v3/quote/${searchQuery}?apikey=${FMP_API_KEY}`)
      if (!res.ok) throw new Error('Failed to fetch commodity data')
      const data = await res.json()
      setCommodityData(Array.isArray(data) ? data : [data])
    } catch (err: any) {
      setError(err.message || 'Error searching commodity')
    } finally {
      setLoading(false)
    }
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
      <h1 className="text-2xl font-bold mb-4">Commodities Market</h1>
      
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
            placeholder="Search commodities (e.g., GC for Gold)"
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
                <th className="px-4 py-2 text-left">Name</th>
                <th className="px-4 py-2 text-right">Price</th>
                <th className="px-4 py-2 text-right">Change (%)</th>
                <th className="px-4 py-2 text-right">Open</th>
                <th className="px-4 py-2 text-right">High</th>
                <th className="px-4 py-2 text-right">Low</th>
                <th className="px-4 py-2 text-right">Volume</th>
                <th className="px-4 py-2 text-right">Previous Close</th>
                <th className="px-4 py-2 text-left">Exchange</th>
              </tr>
            </thead>
            <tbody>
              {commodityData.map((commodity) => (
                <tr key={commodity.symbol} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-2 font-bold">{commodity.symbol}</td>
                  <td className="px-4 py-2">{commodity.name}</td>
                  <td className="px-4 py-2 text-right">${commodity.price.toFixed(2)}</td>
                  <td className={`px-4 py-2 text-right font-semibold ${
                    commodity.changesPercentage > 0 ? 'text-green-600' : commodity.changesPercentage < 0 ? 'text-red-600' : ''
                  }`}>
                    {commodity.changesPercentage.toFixed(2)}%
                  </td>
                  <td className="px-4 py-2 text-right">${commodity.open.toFixed(2)}</td>
                  <td className="px-4 py-2 text-right">${commodity.high.toFixed(2)}</td>
                  <td className="px-4 py-2 text-right">${commodity.low.toFixed(2)}</td>
                  <td className="px-4 py-2 text-right">{commodity.volume.toLocaleString()}</td>
                  <td className="px-4 py-2 text-right">${commodity.previousClose.toFixed(2)}</td>
                  <td className="px-4 py-2">{commodity.exchange}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default Commodities 