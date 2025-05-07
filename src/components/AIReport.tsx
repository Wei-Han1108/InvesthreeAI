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

// 注册 Chart.js 组件
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
const CACHE_DURATION = 1000 * 5 // 5秒的缓存时间，用于测试
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

const fetchTechnicalIndicators = async (symbol: string): Promise<TechnicalIndicators> => {
  try {
    // 获取 SMA (Simple Moving Average)
    const smaUrl = `https://financialmodelingprep.com/api/v3/technical_indicator/1day/${symbol}?period=20&type=sma&apikey=${FMP_API_KEY}`
    const smaRes = await fetch(smaUrl)
    const smaData = await smaRes.json()

    // 获取 EMA (Exponential Moving Average)
    const emaUrl = `https://financialmodelingprep.com/api/v3/technical_indicator/1day/${symbol}?period=20&type=ema&apikey=${FMP_API_KEY}`
    const emaRes = await fetch(emaUrl)
    const emaData = await emaRes.json()

    // 获取 RSI (Relative Strength Index)
    const rsiUrl = `https://financialmodelingprep.com/api/v3/technical_indicator/1day/${symbol}?period=14&type=rsi&apikey=${FMP_API_KEY}`
    const rsiRes = await fetch(rsiUrl)
    const rsiData = await rsiRes.json()

    // 获取 MACD (Moving Average Convergence Divergence)
    const macdUrl = `https://financialmodelingprep.com/api/v3/technical_indicator/1day/${symbol}?type=macd&apikey=${FMP_API_KEY}`
    const macdRes = await fetch(macdUrl)
    const macdData = await macdRes.json()

    // 分析指标信号
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

    // 打印原始数据
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

    // 打印处理后的指标数据
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
  
  // SMA 分析
  signals.push(`【SMA(20) 分析】
- 当前值: ${indicators.sma.value.toFixed(2)}
- 当前价格: ${indicators.sma.price.toFixed(2)}
- 信号: ${indicators.sma.signal === 'bullish' ? '看涨' : indicators.sma.signal === 'bearish' ? '看跌' : '中性'}

SMA(20)是20日简单移动平均线，反映中期价格趋势：
- 计算：取最近20个交易日的收盘价之和除以20
- 趋势判断：价格>SMA为上升趋势，价格<SMA为下降趋势
- 交易信号：价格突破SMA可视为趋势转变信号`)

  // EMA 分析
  signals.push(`【EMA(20) 分析】
- 当前值: ${indicators.ema.value.toFixed(2)}
- 当前价格: ${indicators.ema.price.toFixed(2)}
- 信号: ${indicators.ema.signal === 'bullish' ? '看涨' : indicators.ema.signal === 'bearish' ? '看跌' : '中性'}

EMA(20)是20日指数移动平均线，相比SMA对近期价格变化更敏感：
- 计算：赋予近期价格更高权重，平滑处理历史数据
- 趋势判断：价格>EMA为上升趋势，价格<EMA为下降趋势
- 与SMA差异：EMA反应更快，但可能产生更多假信号`)

  // RSI 分析
  signals.push(`【RSI(14) 分析】
- 当前值: ${indicators.rsi.value.toFixed(2)}
- 信号: ${indicators.rsi.signal === 'overbought' ? '超买' : indicators.rsi.signal === 'oversold' ? '超卖' : '中性'}

RSI(14)是14日相对强弱指标，衡量价格动量：
- 计算：RSI = 100 - (100 / (1 + RS))，其中RS = 平均上涨幅度/平均下跌幅度
- 区间解读：
  * >70：超买区域，可能回调
  * <30：超卖区域，可能反弹
  * 30-70：中性区域，趋势延续
- 交易信号：超买/超卖区域可作为反向交易参考`)

  // MACD 分析
  signals.push(`【MACD 分析】
- MACD值: ${indicators.macd.value.toFixed(2)}
- 信号: ${indicators.macd.signal === 'bullish' ? '看涨' : indicators.macd.signal === 'bearish' ? '看跌' : '中性'}

MACD是移动平均线趋势指标：
- 计算：
  * MACD线 = EMA(12) - EMA(26)
  * 信号线 = MACD的9日EMA
  * 柱状图 = MACD线 - 信号线
- 交易信号：
  * 柱状图由负转正：可能上涨
  * 柱状图由正转负：可能下跌
  * MACD线上穿信号线：买入信号
  * MACD线下穿信号线：卖出信号`)

  return signals.join('\n\n')
}

const analyzeNews = async (news: NewsItem[], technicalIndicators?: TechnicalIndicators): Promise<NewsAnalysis> => {
  try {
    // 只取前5条新闻
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
  // 趋势强度 (0-100)
  const trendStrength = indicators.sma.signal === 'bullish' && indicators.ema.signal === 'bullish' ? 100 :
    indicators.sma.signal === 'bearish' && indicators.ema.signal === 'bearish' ? 0 :
    indicators.sma.signal === 'bullish' || indicators.ema.signal === 'bullish' ? 75 : 25

  // 动量强度 (0-100)
  const momentumStrength = indicators.rsi.signal === 'oversold' ? 0 :
    indicators.rsi.signal === 'overbought' ? 100 :
    indicators.rsi.value

  // MACD强度 (0-100)
  const macdStrength = indicators.macd.signal === 'bullish' ? 100 :
    indicators.macd.signal === 'bearish' ? 0 : 50

  // 价格相对强度 (0-100)
  const priceStrength = ((indicators.sma.price - indicators.sma.value) / indicators.sma.value) * 100
  const normalizedPriceStrength = Math.min(Math.max(priceStrength + 50, 0), 100)

  // 波动性 (0-100，越低越好)
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
    labels: ['趋势强度', '动量强度', 'MACD强度', '价格强度', '稳定性'],
    datasets: [
      {
        label: '技术指标评分',
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
        const technicalIndicators = await fetchTechnicalIndicators(symbol)
        const analysis = await analyzeNews(newsData, technicalIndicators)
        
        // 更新缓存
        const now = Date.now()
        cache.set(symbol, {
          news: newsData,
          analysis,
          technicalIndicators,
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
        if (cachedData.technicalIndicators) {
          const score = calculateStockScore(cachedData.technicalIndicators)
          setStockScore(score)
        }
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
        const technicalIndicators = await fetchTechnicalIndicators(selectedStock)
        setNews(newsData)
        const analysis = await analyzeNews(newsData, technicalIndicators)
        setNewsAnalysis(analysis)
        
        // 计算并设置股票分数
        const score = calculateStockScore(technicalIndicators)
        setStockScore(score)
        
        // 更新缓存
        cache.set(selectedStock, {
          news: newsData,
          analysis,
          technicalIndicators,
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
            {/* Radar Chart */}
            {stockScore ? (
              <div className="bg-white p-4 rounded-lg border">
                <h3 className="font-medium mb-4 text-center">技术指标综合评分</h3>
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
                  <p>评分说明：</p>
                  <ul className="list-disc list-inside">
                    <li>趋势强度：基于SMA和EMA的趋势判断</li>
                    <li>动量强度：基于RSI的动量指标</li>
                    <li>MACD强度：基于MACD的趋势信号</li>
                    <li>价格强度：当前价格相对均线的位置</li>
                    <li>稳定性：价格波动的稳定性评估</li>
                  </ul>
                </div>
              </div>
            ) : (
              <div className="text-gray-500 text-center">正在计算技术指标评分...</div>
            )}

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