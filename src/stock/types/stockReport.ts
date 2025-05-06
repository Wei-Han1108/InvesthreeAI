export interface TechnicalIndicator {
  date: string
  sma: number
  ema: number
  rsi: number
  macd: number
}

export interface VolatilityData {
  date: string
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export interface NewsItem {
  title: string
  date: string
  site: string
  url: string
  summary: string
}

export interface StockReport {
  symbol: string
  technicalAnalysis: TechnicalIndicator[]
  volatility: VolatilityData[]
  news: NewsItem[]
} 