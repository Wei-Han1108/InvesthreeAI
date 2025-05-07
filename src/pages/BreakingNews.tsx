import { useEffect, useState } from 'react'

const FMP_API_KEY = import.meta.env.VITE_FMP_API_KEY

const NEWS_TYPES = [
  { key: 'stock', label: 'Stock News', url: `https://financialmodelingprep.com/api/v3/stock_news?limit=50&apikey=${FMP_API_KEY}` },
  { key: 'forex', label: 'Forex News', url: `https://financialmodelingprep.com/api/v4/forex_news?apikey=${FMP_API_KEY}` },
  { key: 'crypto', label: 'Crypto News', url: `https://financialmodelingprep.com/api/v4/crypto_news?apikey=${FMP_API_KEY}` },
  { key: 'press', label: 'Press Release', url: `https://financialmodelingprep.com/api/v3/press-releases?limit=50&apikey=${FMP_API_KEY}` },
]

interface NewsItem {
  symbol?: string
  publishedDate?: string
  date?: string
  title: string
  image?: string
  site?: string
  text?: string
  url: string
  sentiment?: string
}

const BreakingNews = () => {
  const [news, setNews] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedType, setSelectedType] = useState(NEWS_TYPES[0].key)

  const fetchNews = async (typeKey: string) => {
    setLoading(true)
    setError('')
    const type = NEWS_TYPES.find(t => t.key === typeKey) || NEWS_TYPES[0]
    try {
      const res = await fetch(type.url)
      const data = await res.json()
      setNews(data)
    } catch (err) {
      setError('Failed to load news.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNews(selectedType)
  }, [selectedType])

  return (
    <div className="min-h-screen bg-white text-gray-900 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Breaking News</h1>
        {/* 新闻类型标签栏 */}
        <div className="flex gap-2 mb-6">
          {NEWS_TYPES.map(type => (
            <button
              key={type.key}
              className={`px-3 py-1 rounded-full text-sm font-medium ${selectedType === type.key ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-blue-50'}`}
              onClick={() => setSelectedType(type.key)}
            >
              {type.label}
            </button>
          ))}
        </div>
        {/* 新闻列表 */}
        <div className="space-y-6">
          {loading && <div className="text-gray-400">Loading...</div>}
          {error && <div className="text-red-400">{error}</div>}
          {!loading && !error && news.map((item, idx) => {
            // 兼容不同接口的字段，press release 可能用 date 字段
            const rawDate = item.publishedDate || item.date
            const date = rawDate ? new Date(rawDate) : undefined
            const hour = date ? date.getHours().toString().padStart(2, '0') : '--'
            const minute = date ? date.getMinutes().toString().padStart(2, '0') : '--'
            const day = date ? date.getDate().toString().padStart(2, '0') : '--'
            const month = date ? (date.getMonth() + 1).toString().padStart(2, '0') : '--'
            return (
              <div key={item.url + idx} className="flex gap-4 items-start bg-gray-50 rounded-lg p-4 shadow border border-gray-200">
                {/* 时间栏 */}
                <div className="flex flex-col items-center w-16">
                  <div className="text-lg font-bold text-gray-500">{hour}:{minute}</div>
                  <div className="text-xs text-gray-400 mt-1">{day}/{month}</div>
                </div>
                {/* 内容卡片 */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {item.sentiment === 'Positive' && <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-bold">+POS</span>}
                    {item.sentiment === 'Negative' && <span className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full font-bold">-NEG</span>}
                    {item.site && <span className="text-gray-400 text-xs">{item.site}</span>}
                  </div>
                  <a href={item.url} target="_blank" rel="noopener noreferrer" className="block text-base font-semibold text-blue-800 hover:underline mb-1">
                    {item.title}
                  </a>
                  {item.text && <div className="text-gray-700 text-sm mb-2 line-clamp-2">{item.text}</div>}
                  <div className="flex flex-wrap gap-2 mt-2">
                    {item.symbol && <span className="bg-white text-xs px-2 py-0.5 rounded-full border border-gray-300">{item.symbol}</span>}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default BreakingNews 