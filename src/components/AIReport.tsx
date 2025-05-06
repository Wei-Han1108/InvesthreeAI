import { useState, useEffect } from 'react'
import useInvestmentStore from '../store/investmentStore'
import useWatchlistStore from '../store/watchlistStore'
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline'

interface NewsItem {
  title: string
  date: string
  site: string
  url: string
  summary: string
}

interface NewsAnalysis {
  titles: Array<{
    title: string
    url: string
  }>
  advice: string
}

interface CachedData {
  news: NewsItem[]
  analysis: NewsAnalysis
  timestamp: number
}

const FMP_API_KEY = import.meta.env.VITE_FMP_API_KEY
const NEWS_API_KEY = '4a44dc5b6b314553a0aed659bacdec3b'
const CACHE_DURATION = 1000 * 60 * 60 // 1小时的缓存时间
const REPORT_QUEUE_KEY = 'stock_report_queue'
const REPORT_STORAGE_KEY = 'stock_reports'

// 本地缓存
const cache = new Map<string, CachedData>()

// 从 localStorage 加载报告
const loadReportsFromStorage = (): Map<string, CachedData> => {
  try {
    const stored = localStorage.getItem(REPORT_STORAGE_KEY)
    if (stored) {
      const data = JSON.parse(stored)
      return new Map(Object.entries(data))
    }
  } catch (error) {
    console.error('Error loading reports from storage:', error)
  }
  return new Map()
}

// 保存报告到 localStorage
const saveReportsToStorage = (reports: Map<string, CachedData>) => {
  try {
    const data = Object.fromEntries(reports)
    localStorage.setItem(REPORT_STORAGE_KEY, JSON.stringify(data))
  } catch (error) {
    console.error('Error saving reports to storage:', error)
  }
}

// 从 localStorage 加载队列
const loadQueueFromStorage = (): string[] => {
  try {
    const stored = localStorage.getItem(REPORT_QUEUE_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (error) {
    console.error('Error loading queue from storage:', error)
  }
  return []
}

// 保存队列到 localStorage
const saveQueueToStorage = (queue: string[]) => {
  try {
    localStorage.setItem(REPORT_QUEUE_KEY, JSON.stringify(queue))
  } catch (error) {
    console.error('Error saving queue to storage:', error)
  }
}

const fetchNews = async (symbol: string): Promise<NewsItem[]> => {
  try {
    const newsApiUrl = `https://newsapi.org/v2/everything?q=${symbol}&apiKey=${NEWS_API_KEY}&language=en&sortBy=publishedAt&pageSize=5`
    const newsApiRes = await fetch(newsApiUrl)
    const newsApiData = await newsApiRes.json()
    
    if (!newsApiRes.ok) {
      throw new Error(`News fetch failed: ${newsApiRes.status}`)
    }
    
    return newsApiData.articles.map((article: any) => ({
      title: article.title,
      summary: article.description || '',
      date: article.publishedAt,
      site: article.source.name,
      url: article.url
    }))
  } catch (error) {
    console.error('Error fetching news:', error)
    return []
  }
}

const analyzeNews = async (news: NewsItem[]): Promise<NewsAnalysis> => {
  try {
    // 只取前5条新闻
    const topNews = news.slice(0, 5)
    const titles = topNews.map(item => ({
      title: item.title,
      url: item.url
    }))
    const summaries = topNews.map(item => item.summary)
    
    const prompt = `Please analyze the following news and provide investment advice (total length should not exceed 200 words):

News Titles:
${titles.map(t => t.title).join('\n')}

News Summaries:
${summaries.join('\n')}

Please respond in the following format:
【News Summary】
(Brief summary of key points)

【Investment Advice】
(Specific advice based on news analysis)`
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a professional financial analyst who excels at extracting key information from news and providing investment advice. Please maintain objectivity and professionalism in your analysis, and include risk warnings."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 300
      })
    })

    const data = await response.json()
    return {
      titles,
      advice: data.choices[0].message.content
    }
  } catch (error) {
    console.error('Error analyzing news:', error)
    return {
      titles: news.slice(0, 5).map(item => ({
        title: item.title,
        url: item.url
      })),
      advice: "Unable to generate analysis. Please try again later."
    }
  }
}

const AIReport = () => {
  const [expandedSection, setExpandedSection] = useState<'portfolio' | 'watchlist' | null>(null)
  const [selectedStock, setSelectedStock] = useState<string | null>(null)
  const [news, setNews] = useState<NewsItem[]>([])
  const [newsAnalysis, setNewsAnalysis] = useState<NewsAnalysis | null>(null)
  const [loading, setLoading] = useState(false)
  const [processingQueue, setProcessingQueue] = useState(false)
  const investments = useInvestmentStore((state) => state.investments)
  const loadInvestments = useInvestmentStore((state) => state.loadInvestments)
  const watchlist = useWatchlistStore((state) => state.watchlist)
  const loadWatchlist = useWatchlistStore((state) => state.loadWatchlist)

  // 获取去重后的投资组合
  const uniqueInvestments = investments.reduce((acc, current) => {
    const existingIndex = acc.findIndex(item => item.stockCode === current.stockCode)
    if (existingIndex === -1) {
      // 如果股票不存在，添加它
      acc.push(current)
    } else {
      // 如果股票已存在，比较购买日期，保留最新的记录
      const existing = acc[existingIndex]
      if (new Date(current.purchaseDate) > new Date(existing.purchaseDate)) {
        acc[existingIndex] = current
      }
    }
    return acc
  }, [] as typeof investments)

  // 初始化时加载已保存的报告
  useEffect(() => {
    const savedReports = loadReportsFromStorage()
    savedReports.forEach((value, key) => {
      cache.set(key, value)
    })
  }, [])

  // 处理报告队列
  useEffect(() => {
    const processQueue = async () => {
      if (processingQueue) return

      const queue = loadQueueFromStorage()
      if (queue.length === 0) return

      setProcessingQueue(true)
      const symbol = queue[0]

      try {
        const newsData = await fetchNews(symbol)
        const analysis = await analyzeNews(newsData)
        
        // 更新缓存
        const now = Date.now()
        cache.set(symbol, {
          news: newsData,
          analysis,
          timestamp: now
        })

        // 保存到 localStorage
        saveReportsToStorage(cache)

        // 更新队列
        const newQueue = queue.slice(1)
        saveQueueToStorage(newQueue)

        // 如果当前选中的股票就是正在处理的股票，更新显示
        if (selectedStock === symbol) {
          setNews(newsData)
          setNewsAnalysis(analysis)
        }
      } catch (error) {
        console.error('Error processing queue:', error)
      } finally {
        setProcessingQueue(false)
      }
    }

    processQueue()
  }, [processingQueue, selectedStock])

  // 初始化数据并开始生成报告
  useEffect(() => {
    const loadData = async () => {
      try {
        await loadInvestments()
        await loadWatchlist()
        
        // 获取所有需要生成报告的股票代码
        const allStocks = new Set([
          ...uniqueInvestments.map(inv => inv.stockCode),
          ...watchlist.map(stock => stock.symbol)
        ])

        // 检查哪些股票需要更新报告
        const now = Date.now()
        const queue = Array.from(allStocks).filter(symbol => {
          const cached = cache.get(symbol)
          return !cached || (now - cached.timestamp) >= CACHE_DURATION
        })

        // 保存队列
        saveQueueToStorage(queue)

        // 默认显示 AAPL 的新闻
        setSelectedStock('AAPL')
        // 默认展开投资组合部分
        setExpandedSection('portfolio')
      } catch (error) {
        console.error('Error loading data:', error)
      }
    }
    loadData()
  }, [loadInvestments, loadWatchlist])

  // 获取股票新闻
  useEffect(() => {
    const loadNews = async () => {
      if (!selectedStock) return
      
      // 检查缓存
      const cachedData = cache.get(selectedStock)
      const now = Date.now()
      
      if (cachedData && (now - cachedData.timestamp) < CACHE_DURATION) {
        // 使用缓存的数据
        setNews(cachedData.news)
        setNewsAnalysis(cachedData.analysis)
        return
      }
      
      // 如果缓存中没有数据或已过期，将股票添加到队列
      const queue = loadQueueFromStorage()
      if (!queue.includes(selectedStock)) {
        queue.push(selectedStock)
        saveQueueToStorage(queue)
      }
      
      setLoading(true)
      try {
        const newsData = await fetchNews(selectedStock)
        setNews(newsData)
        const analysis = await analyzeNews(newsData)
        setNewsAnalysis(analysis)
        
        // 更新缓存
        cache.set(selectedStock, {
          news: newsData,
          analysis,
          timestamp: now
        })
        
        // 保存到 localStorage
        saveReportsToStorage(cache)
      } catch (error) {
        console.error('Error loading news:', error)
      } finally {
        setLoading(false)
      }
    }

    loadNews()
  }, [selectedStock])

  const toggleSection = (section: 'portfolio' | 'watchlist') => {
    setExpandedSection(expandedSection === section ? null : section)
  }

  const handleStockClick = (stockCode: string) => {
    setSelectedStock(stockCode)
  }

  return (
    <div className="flex gap-8">
      <div className="w-64 bg-white shadow-lg rounded-lg p-4">
        <div className="space-y-2">
          {/* Portfolio Section */}
          <div className="border rounded-lg">
            <button
              className="w-full px-4 py-2 flex items-center justify-between hover:bg-gray-50"
              onClick={() => toggleSection('portfolio')}
            >
              <span className="font-medium">我的投资组合</span>
              {expandedSection === 'portfolio' ? (
                <ChevronDownIcon className="w-5 h-5" />
              ) : (
                <ChevronRightIcon className="w-5 h-5" />
              )}
            </button>
            {expandedSection === 'portfolio' && (
              <div className="px-4 py-2 border-t">
                {uniqueInvestments.length === 0 ? (
                  <p className="text-gray-500 text-sm">暂无投资股票</p>
                ) : (
                  <ul className="space-y-1">
                    {uniqueInvestments.map((investment) => (
                      <li 
                        key={investment.investmentId} 
                        className={`text-sm hover:text-blue-600 cursor-pointer ${
                          selectedStock === investment.stockCode ? 'text-blue-600 font-medium' : ''
                        }`}
                        onClick={() => handleStockClick(investment.stockCode)}
                      >
                        {investment.stockName} ({investment.stockCode})
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          {/* Watchlist Section */}
          <div className="border rounded-lg">
            <button
              className="w-full px-4 py-2 flex items-center justify-between hover:bg-gray-50"
              onClick={() => toggleSection('watchlist')}
            >
              <span className="font-medium">关注列表</span>
              {expandedSection === 'watchlist' ? (
                <ChevronDownIcon className="w-5 h-5" />
              ) : (
                <ChevronRightIcon className="w-5 h-5" />
              )}
            </button>
            {expandedSection === 'watchlist' && (
              <div className="px-4 py-2 border-t">
                {watchlist.length === 0 ? (
                  <p className="text-gray-500 text-sm">暂无关注股票</p>
                ) : (
                  <ul className="space-y-1">
                    {watchlist.map((stock) => (
                      <li 
                        key={stock.symbol} 
                        className={`text-sm hover:text-blue-600 cursor-pointer ${
                          selectedStock === stock.symbol ? 'text-blue-600 font-medium' : ''
                        }`}
                        onClick={() => handleStockClick(stock.symbol)}
                      >
                        {stock.name} ({stock.symbol})
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* News Section */}
      <div className="flex-1 bg-white shadow-lg rounded-lg p-4">
        <h2 className="text-lg font-semibold mb-4">相关新闻与分析</h2>
        {loading ? (
          <p className="text-gray-500">加载中...</p>
        ) : newsAnalysis ? (
          <div className="space-y-6">
            {/* News Titles */}
            <div>
              <h3 className="font-medium mb-2">最新新闻标题：</h3>
              <ul className="space-y-2">
                {newsAnalysis.titles.map((item, index) => (
                  <li key={index} className="text-sm">
                    <a 
                      href={item.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      {item.title}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            
            {/* Analysis */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-medium mb-2 text-blue-800">新闻分析与投资建议：</h3>
              <div className="text-sm text-blue-900 whitespace-pre-line">
                {newsAnalysis.advice}
              </div>
            </div>
          </div>
        ) : (
          <p className="text-gray-500">暂无相关新闻</p>
        )}
      </div>
    </div>
  )
}

export default AIReport