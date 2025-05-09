import { useState, useEffect } from 'react'
import useInvestmentStore from '../store/investmentStore'
import useWatchlistStore from '../store/watchlistStore'
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import { Radar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
} from 'chart.js'

// Register Chart.js components
ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
)

interface NewsItem {
  title: string
  date: string
  site: string
  url: string
  summary: string
}

interface TechnicalIndicators {
  sma: {
    value: number
    signal: 'bullish' | 'bearish' | 'neutral'
    price: number
  }
  ema: {
    value: number
    signal: 'bullish' | 'bearish' | 'neutral'
    price: number
  }
  rsi: {
    value: number
    signal: 'overbought' | 'oversold' | 'neutral'
  }
  macd: {
    value: number
    signal: 'bullish' | 'bearish' | 'neutral'
  }
}

interface NewsAnalysis {
  titles: Array<{
    title: string
    url: string
  }>
  advice: string
  technicalIndicators?: TechnicalIndicators
  technicalAnalysis?: string
}

interface CachedData {
  news: NewsItem[]
  analysis: NewsAnalysis
  technicalIndicators?: TechnicalIndicators
  timestamp: number
}

interface StockScore {
  trendStrength: number
  momentumStrength: number
  macdStrength: number
  priceStrength: number
  volatility: number
}

const FMP_API_KEY = import.meta.env.VITE_FMP_API_KEY
const NEWS_API_KEY = '4a44dc5b6b314553a0aed659bacdec3b'
const CACHE_DURATION = 1000 * 5 // 5-second cache duration for testing
const REPORT_QUEUE_KEY = 'stock_report_queue'
const REPORT_STORAGE_KEY = 'stock_reports'

// Local cache
const cache = new Map<string, CachedData>()

// Load reports from localStorage
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

// Save reports to localStorage
const saveReportsToStorage = (reports: Map<string, CachedData>) => {
  try {
    const data = Object.fromEntries(reports)
    localStorage.setItem(REPORT_STORAGE_KEY, JSON.stringify(data))
  } catch (error) {
    console.error('Error saving reports to storage:', error)
  }
}

// Load queue from localStorage
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

// Save queue to localStorage
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

const fetchTechnicalIndicators = async (symbol: string): Promise<TechnicalIndicators> => {
  try {
    // Get SMA (Simple Moving Average)
    const smaUrl = `https://financialmodelingprep.com/api/v3/technical_indicator/1day/${symbol}?period=20&type=sma&apikey=${FMP_API_KEY}`
    const smaRes = await fetch(smaUrl)
    const smaData = await smaRes.json()

    // Get EMA (Exponential Moving Average)
    const emaUrl = `https://financialmodelingprep.com/api/v3/technical_indicator/1day/${symbol}?period=20&type=ema&apikey=${FMP_API_KEY}`
    const emaRes = await fetch(emaUrl)
    const emaData = await emaRes.json()

    // Get RSI (Relative Strength Index)
    const rsiUrl = `https://financialmodelingprep.com/api/v3/technical_indicator/1day/${symbol}?period=14&type=rsi&apikey=${FMP_API_KEY}`
    const rsiRes = await fetch(rsiUrl)
    const rsiData = await rsiRes.json()

    // Get MACD (Moving Average Convergence Divergence)
    const macdUrl = `https://financialmodelingprep.com/api/v3/technical_indicator/1day/${symbol}?type=macd&apikey=${FMP_API_KEY}`
    const macdRes = await fetch(macdUrl)
    const macdData = await macdRes.json()

    // Analyze indicator signals
    const getSMASignal = (sma: number, price: number) => {
      if (price > sma) return 'bullish'
      if (price < sma) return 'bearish'
      return 'neutral'
    }

    const getEMASignal = (ema: number, price: number) => {
      if (price > ema) return 'bullish'
      if (price < ema) return 'bearish'
      return 'neutral'
    }

    const getRSISignal = (rsi: number) => {
      if (rsi > 70) return 'overbought'
      if (rsi < 30) return 'oversold'
      return 'neutral'
    }

    const getMACDSignal = (macd: number, signal: number) => {
      if (macd > signal) return 'bullish'
      if (macd < signal) return 'bearish'
      return 'neutral'
    }

    const latestSMA = smaData[0]?.sma || 0
    const latestEMA = emaData[0]?.ema || 0
    const latestRSI = rsiData[0]?.rsi || 0
    const latestMACD = macdData[0]?.macd || 0
    const latestSignal = macdData[0]?.signal || 0
    const latestPrice = smaData[0]?.close || 0

    // Print raw data
    console.log('=== Technical Indicators Raw Data ===')
    console.log('SMA Data:', smaData[0])
    console.log('EMA Data:', emaData[0])
    console.log('RSI Data:', rsiData[0])
    console.log('MACD Data:', macdData[0])
    console.log('Latest Price:', latestPrice)

    const indicators: TechnicalIndicators = {
      sma: {
        value: latestSMA,
        signal: getSMASignal(latestSMA, latestPrice) as 'bullish' | 'bearish' | 'neutral',
        price: latestPrice
      },
      ema: {
        value: latestEMA,
        signal: getEMASignal(latestEMA, latestPrice) as 'bullish' | 'bearish' | 'neutral',
        price: latestPrice
      },
      rsi: {
        value: latestRSI,
        signal: getRSISignal(latestRSI) as 'overbought' | 'oversold' | 'neutral'
      },
      macd: {
        value: latestMACD,
        signal: getMACDSignal(latestMACD, latestSignal) as 'bullish' | 'bearish' | 'neutral'
      }
    }

    // Print processed indicator data
    console.log('=== Processed Technical Indicators ===')
    console.log('SMA:', {
      value: indicators.sma.value.toFixed(2),
      signal: indicators.sma.signal,
      price: latestPrice.toFixed(2)
    })
    console.log('EMA:', {
      value: indicators.ema.value.toFixed(2),
      signal: indicators.ema.signal,
      price: latestPrice.toFixed(2)
    })
    console.log('RSI:', {
      value: indicators.rsi.value.toFixed(2),
      signal: indicators.rsi.signal
    })
    console.log('MACD:', {
      value: indicators.macd.value.toFixed(2),
      signal: indicators.macd.signal,
      signalLine: latestSignal.toFixed(2)
    })

    return indicators
  } catch (error) {
    console.error('Error fetching technical indicators:', error)
    throw error
  }
}

const analyzeTechnicalIndicators = (indicators: TechnicalIndicators): string => {
  const signals = []
  
  // SMA Analysis
  signals.push(`【SMA(20) Analysis】
- Current Value: ${indicators.sma.value.toFixed(2)}
- Current Price: ${indicators.sma.price.toFixed(2)}
- Signal: ${indicators.sma.signal === 'bullish' ? 'Bullish' : indicators.sma.signal === 'bearish' ? 'Bearish' : 'Neutral'}

SMA(20) is a 20-day Simple Moving Average that reflects medium-term price trends:
- Calculation: Sum of the last 20 trading days' closing prices divided by 20
- Trend Judgment: Price > SMA indicates uptrend, Price < SMA indicates downtrend
- Trading Signal: Price breaking through SMA can be considered a trend change signal`)

  // EMA Analysis
  signals.push(`【EMA(20) Analysis】
- Current Value: ${indicators.ema.value.toFixed(2)}
- Current Price: ${indicators.ema.price.toFixed(2)}
- Signal: ${indicators.ema.signal === 'bullish' ? 'Bullish' : indicators.ema.signal === 'bearish' ? 'Bearish' : 'Neutral'}

EMA(20) is a 20-day Exponential Moving Average, more sensitive to recent price changes than SMA:
- Calculation: Gives higher weight to recent prices, smoothing historical data
- Trend Judgment: Price > EMA indicates uptrend, Price < EMA indicates downtrend
- Difference from SMA: EMA reacts faster but may generate more false signals`)

  // RSI Analysis
  signals.push(`【RSI(14) Analysis】
- Current Value: ${indicators.rsi.value.toFixed(2)}
- Signal: ${indicators.rsi.signal === 'overbought' ? 'Overbought' : indicators.rsi.signal === 'oversold' ? 'Oversold' : 'Neutral'}

RSI(14) is a 14-day Relative Strength Index that measures price momentum:
- Calculation: RSI = 100 - (100 / (1 + RS)), where RS = Average Gain / Average Loss
- Range Interpretation:
  * >70: Overbought zone, possible pullback
  * <30: Oversold zone, possible bounce
  * 30-70: Neutral zone, trend continuation
- Trading Signal: Overbought/Oversold zones can be used as counter-trend trading references`)

  // MACD Analysis
  signals.push(`【MACD Analysis】
- MACD Value: ${indicators.macd.value.toFixed(2)}
- Signal: ${indicators.macd.signal === 'bullish' ? 'Bullish' : indicators.macd.signal === 'bearish' ? 'Bearish' : 'Neutral'}

MACD is a Moving Average Convergence Divergence trend indicator:
- Calculation:
  * MACD Line = EMA(12) - EMA(26)
  * Signal Line = 9-day EMA of MACD
  * Histogram = MACD Line - Signal Line
- Trading Signals:
  * Histogram turning from negative to positive: Possible uptrend
  * Histogram turning from positive to negative: Possible downtrend
  * MACD Line crossing above Signal Line: Buy signal
  * MACD Line crossing below Signal Line: Sell signal`)

  return signals.join('\n\n')
}

const analyzeNews = async (news: NewsItem[], technicalIndicators?: TechnicalIndicators): Promise<NewsAnalysis> => {
  try {
    // Take only first 5 news items
    const topNews = news.slice(0, 5)
    const titles = topNews.map(item => ({
      title: item.title,
      url: item.url
    }))
    const summaries = topNews.map(item => item.summary)
    
    let technicalAnalysis = ''
    if (technicalIndicators) {
      technicalAnalysis = analyzeTechnicalIndicators(technicalIndicators)
    }
    
    const prompt = `Please analyze the following news and technical indicators, then provide investment advice (total length should not exceed 200 words):

News Titles:
${titles.map(t => t.title).join('\n')}

News Summaries:
${summaries.join('\n')}

${technicalAnalysis ? `Technical Analysis:
${technicalAnalysis}` : ''}

Please respond in the following format:
【News Summary】
(Brief summary of key points)

【Technical Analysis】
(If available, brief analysis of technical indicators)

【Investment Advice】
(Specific advice based on news and technical analysis)`
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a professional financial analyst who excels at extracting key information from news and technical indicators to provide investment advice. Please maintain objectivity and professionalism in your analysis, and include risk warnings."
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
      advice: data.choices[0].message.content,
      technicalAnalysis,
      technicalIndicators
    }
  } catch (error) {
    console.error('Error analyzing news:', error)
    return {
      titles: news.slice(0, 5).map(item => ({
        title: item.title,
        url: item.url
      })),
      advice: "Unable to generate analysis. Please try again later.",
      technicalAnalysis: technicalIndicators ? analyzeTechnicalIndicators(technicalIndicators) : undefined,
      technicalIndicators
    }
  }
}

const calculateStockScore = (indicators: TechnicalIndicators): StockScore => {
  // Trend strength (0-100)
  const trendStrength = indicators.sma.signal === 'bullish' && indicators.ema.signal === 'bullish' ? 100 :
    indicators.sma.signal === 'bearish' && indicators.ema.signal === 'bearish' ? 0 :
    indicators.sma.signal === 'bullish' || indicators.ema.signal === 'bullish' ? 75 : 25

  // Momentum strength (0-100)
  const momentumStrength = indicators.rsi.signal === 'oversold' ? 0 :
    indicators.rsi.signal === 'overbought' ? 100 :
    indicators.rsi.value

  // MACD strength (0-100)
  const macdStrength = indicators.macd.signal === 'bullish' ? 100 :
    indicators.macd.signal === 'bearish' ? 0 : 50

  // Price relative strength (0-100)
  const priceStrength = ((indicators.sma.price - indicators.sma.value) / indicators.sma.value) * 100
  const normalizedPriceStrength = Math.min(Math.max(priceStrength + 50, 0), 100)

  // Volatility (0-100, lower is better)
  const volatility = Math.abs(indicators.macd.value) * 10
  const normalizedVolatility = Math.min(Math.max(100 - volatility, 0), 100)

  return {
    trendStrength,
    momentumStrength,
    macdStrength,
    priceStrength: normalizedPriceStrength,
    volatility: normalizedVolatility
  }
}

const createRadarChartData = (score: StockScore) => {
  return {
    labels: ['Trend Strength', 'Momentum Strength', 'MACD Strength', 'Price Strength', 'Stability'],
    datasets: [
      {
        label: 'Technical Indicator Score',
        data: [
          score.trendStrength,
          score.momentumStrength,
          score.macdStrength,
          score.priceStrength,
          score.volatility
        ],
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 2,
        pointBackgroundColor: 'rgba(54, 162, 235, 1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(54, 162, 235, 1)'
      }
    ]
  }
}

const radarChartOptions = {
  scales: {
    r: {
      angleLines: {
        display: true
      },
      suggestedMin: 0,
      suggestedMax: 100
    }
  },
  plugins: {
    legend: {
      display: false
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
  const [stockScore, setStockScore] = useState<StockScore | null>(null)
  const investments = useInvestmentStore((state) => state.investments)
  const loadInvestments = useInvestmentStore((state) => state.loadInvestments)
  const watchlist = useWatchlistStore((state) => state.watchlist)
  const loadWatchlist = useWatchlistStore((state) => state.loadWatchlist)

  // Get deduplicated portfolio
  const uniqueInvestments = investments.reduce((acc, current) => {
    const existingIndex = acc.findIndex(item => item.stockCode === current.stockCode)
    if (existingIndex === -1) {
      // If stock doesn't exist, add it
      acc.push(current)
    } else {
      // If stock exists, compare purchase dates, keep the latest record
      const existing = acc[existingIndex]
      if (new Date(current.purchaseDate) > new Date(existing.purchaseDate)) {
        acc[existingIndex] = current
      }
    }
    return acc
  }, [] as typeof investments)

  // Initialize by loading saved reports
  useEffect(() => {
    const savedReports = loadReportsFromStorage()
    savedReports.forEach((value, key) => {
      cache.set(key, value)
    })
  }, [])

  // Process report queue
  useEffect(() => {
    const processQueue = async () => {
      if (processingQueue) return

      const queue = loadQueueFromStorage()
      if (queue.length === 0) return

      setProcessingQueue(true)
      const symbol = queue[0]

      try {
        const newsData = await fetchNews(symbol)
        const technicalIndicators = await fetchTechnicalIndicators(symbol)
        const analysis = await analyzeNews(newsData, technicalIndicators)
        
        // Update cache
        const now = Date.now()
        cache.set(symbol, {
          news: newsData,
          analysis,
          technicalIndicators,
          timestamp: now
        })

        // Save to localStorage
        saveReportsToStorage(cache)

        // Update queue
        const newQueue = queue.slice(1)
        saveQueueToStorage(newQueue)

        // If the currently selected stock is the one being processed, update display
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

  // Initialize data and start generating report
  useEffect(() => {
    const loadData = async () => {
      try {
        await loadInvestments()
        await loadWatchlist()
        
        // Get all stocks that need to generate reports
        const allStocks = new Set([
          ...uniqueInvestments.map(inv => inv.stockCode),
          ...watchlist.map(stock => stock.symbol)
        ])

        // Check which stocks need to update reports
        const now = Date.now()
        const queue = Array.from(allStocks).filter(symbol => {
          const cached = cache.get(symbol)
          return !cached || (now - cached.timestamp) >= CACHE_DURATION
        })

        // Save queue
        saveQueueToStorage(queue)

        // Default display AAPL news
        setSelectedStock('AAPL')
        // Default expand portfolio section
        setExpandedSection('portfolio')
      } catch (error) {
        console.error('Error loading data:', error)
      }
    }
    loadData()
  }, [loadInvestments, loadWatchlist])

  // Get stock news
  useEffect(() => {
    const loadNews = async () => {
      if (!selectedStock) return
      
      // Check cache
      const cachedData = cache.get(selectedStock)
      const now = Date.now()
      
      if (cachedData && (now - cachedData.timestamp) < CACHE_DURATION) {
        // Use cached data
        setNews(cachedData.news)
        setNewsAnalysis(cachedData.analysis)
        if (cachedData.technicalIndicators) {
          const score = calculateStockScore(cachedData.technicalIndicators)
          setStockScore(score)
        }
        return
      }
      
      // If cache doesn't have data or expired, add stock to queue
      const queue = loadQueueFromStorage()
      if (!queue.includes(selectedStock)) {
        queue.push(selectedStock)
        saveQueueToStorage(queue)
      }
      
      setLoading(true)
      try {
        const newsData = await fetchNews(selectedStock)
        const technicalIndicators = await fetchTechnicalIndicators(selectedStock)
        setNews(newsData)
        const analysis = await analyzeNews(newsData, technicalIndicators)
        setNewsAnalysis(analysis)
        
        // Calculate and set stock score
        const score = calculateStockScore(technicalIndicators)
        setStockScore(score)
        
        // Update cache
        cache.set(selectedStock, {
          news: newsData,
          analysis,
          technicalIndicators,
          timestamp: now
        })
        
        // Save to localStorage
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
              <span className="font-medium">My Portfolio</span>
              {expandedSection === 'portfolio' ? (
                <ChevronDownIcon className="w-5 h-5" />
              ) : (
                <ChevronRightIcon className="w-5 h-5" />
              )}
            </button>
            {expandedSection === 'portfolio' && (
              <div className="px-4 py-2 border-t">
                {uniqueInvestments.length === 0 ? (
                  <p className="text-gray-500 text-sm">No investments yet</p>
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
              <span className="font-medium">Watchlist</span>
              {expandedSection === 'watchlist' ? (
                <ChevronDownIcon className="w-5 h-5" />
              ) : (
                <ChevronRightIcon className="w-5 h-5" />
              )}
            </button>
            {expandedSection === 'watchlist' && (
              <div className="px-4 py-2 border-t">
                {watchlist.length === 0 ? (
                  <p className="text-gray-500 text-sm">No stocks in watchlist</p>
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
        <h2 className="text-lg font-semibold mb-4">Related News & Analysis</h2>
        {loading ? (
          <p className="text-gray-500">Loading...</p>
        ) : newsAnalysis ? (
          <div className="space-y-6">
            {/* Radar Chart */}
            {stockScore ? (
              <div className="bg-white p-4 rounded-lg border">
                <h3 className="font-medium mb-4 text-center">Technical Indicator Score</h3>
                <div className="w-full max-w-md mx-auto" style={{ height: '400px' }}>
                  <Radar 
                    data={createRadarChartData(stockScore)} 
                    options={{
                      ...radarChartOptions,
                      maintainAspectRatio: false,
                      responsive: true
                    }} 
                  />
                </div>
                <div className="mt-4 text-sm text-gray-600 text-center">
                  <p>Score Description:</p>
                  <ul className="list-disc list-inside">
                    <li>Trend Strength: Based on SMA and EMA trend analysis</li>
                    <li>Momentum Strength: Based on RSI momentum indicator</li>
                    <li>MACD Strength: Based on MACD trend signals</li>
                    <li>Price Strength: Current price position relative to moving averages</li>
                    <li>Stability: Assessment of price volatility stability</li>
                  </ul>
                </div>
              </div>
            ) : (
              <div className="text-gray-500 text-center">Calculating technical indicator scores...</div>
            )}

            {/* News Titles */}
            <div>
              <h3 className="font-medium mb-2">Latest News Headlines:</h3>
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
              <h3 className="font-medium mb-2 text-blue-800">News Analysis & Investment Advice:</h3>
              <div className="text-sm text-blue-900 whitespace-pre-line">
                {newsAnalysis.advice}
              </div>
            </div>
          </div>
        ) : (
          <p className="text-gray-500">No related news available</p>
        )}
      </div>
    </div>
  )
}

export default AIReport