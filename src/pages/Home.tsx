import { Link } from 'react-router-dom'

const quickTags = [
  { label: 'Quick Insights', color: 'bg-blue-100 text-blue-700', to: '/ask-ai' },
  { label: 'Technical Expert', color: 'bg-purple-100 text-purple-700', to: '/ai-report' },
  { label: 'Crypto Analyst', color: 'bg-green-100 text-green-700', to: '/news' },
  { label: 'Fundamental Guru', color: 'bg-yellow-100 text-yellow-700', to: '/news' },
  { label: 'Sentiment Analyzer', color: 'bg-cyan-100 text-cyan-700', to: '/news' },
]

const mainFeatures = [
  {
    title: 'AI Stock Picker',
    desc: 'AI-selected top daily stocks to day trade',
    icon: '📈',
    to: '/ai-report',
    tag: 'AI Investment',
    tagColor: 'bg-blue-50 text-blue-600'
  },
  {
    title: 'Swing Trades',
    desc: 'Trade like a pro simply by following AI-guided signals',
    icon: '🔄',
    to: '/ai-report',
    tag: 'Stock & Crypto',
    tagColor: 'bg-green-50 text-green-600'
  },
  {
    title: 'Daytrading Center',
    desc: 'Real-time market tracker for fast-paced day trading decisions.',
    icon: '⚡',
    to: '/news',
    tag: 'Stock & Crypto',
    tagColor: 'bg-green-50 text-green-600'
  },
  {
    title: 'Earnings Trading',
    desc: 'Leverage earnings data for winning trades',
    icon: '💰',
    to: '/ai-report',
    tag: 'AI Investment',
    tagColor: 'bg-blue-50 text-blue-600'
  }
]

const exploreFeatures = [
  {
    title: 'Stock Monitor',
    desc: 'Real-time stock movement',
    icon: '🟩',
    to: '/',
    tagColor: 'bg-blue-100 text-blue-700'
  },
  {
    title: 'Forex',
    desc: 'Real-time forex rates and trading data',
    icon: '🏦',
    to: '/forex',
    tagColor: 'bg-green-100 text-green-700'
  },
  {
    title: 'Crypto Spotlight',
    desc: 'Provides real-time data and news for cryptocurrencies',
    icon: '💹',
    to: '/crypto-spotlight',
    tagColor: 'bg-yellow-100 text-yellow-700'
  },
  {
    title: 'ETF Holdings',
    desc: 'Track and analyze ETF portfolio compositions',
    icon: '📊',
    to: '/etf-holdings',
    tagColor: 'bg-red-100 text-red-700'
  },
  {
    title: 'Commodities',
    desc: 'Monitor precious metals, energy, and agricultural markets',
    icon: '🪙',
    to: '/commodities',
    tagColor: 'bg-orange-100 text-orange-700'
  },
  {
    title: 'Company Info',
    desc: 'Search and view detailed company profiles',
    icon: '🏢',
    to: '/company-info',
    tagColor: 'bg-purple-100 text-purple-700'
  },
  {
    title: 'Market Performance',
    desc: 'Track major indices and market trends',
    icon: '📊',
    to: '/market-performance',
    tagColor: 'bg-indigo-100 text-indigo-700'
  },
  {
    title: 'Insider Trading',
    desc: 'Monitor corporate insider transactions and activities',
    icon: '👥',
    to: '/insider-trading',
    tagColor: 'bg-pink-100 text-pink-700'
  }
]

const Home = () => {
  return (
    <div className="min-h-screen bg-white py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* 顶部大标题和搜索框 */}
        <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-2xl p-8 mb-8 shadow flex flex-col items-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-2 text-gray-900 text-center">The Most Powerful AI Platform<br />for Smarter Investing</h1>
          <p className="text-gray-500 mb-6 text-center">Combine AI and FMP data for the ultimate investment edge</p>
          <div className="w-full max-w-xl flex items-center mb-4">
            <input
              className="flex-1 px-4 py-3 rounded-l-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-200 text-lg"
              placeholder="Search symbols or ask a question"
            />
            <button className="px-5 py-3 bg-blue-600 text-white rounded-r-lg font-bold text-lg hover:bg-blue-700">🔍</button>
          </div>
          <div className="flex flex-wrap gap-2 justify-center mb-2">
            {quickTags.map(tag => (
              <Link key={tag.label} to={tag.to} className={`px-3 py-1 rounded-full text-sm font-medium ${tag.color}`}>{tag.label}</Link>
            ))}
          </div>
          <div className="w-full max-w-xl flex flex-col gap-2 mt-4">
            <button className="bg-white border border-gray-200 rounded-lg px-4 py-2 text-left text-gray-700 hover:bg-blue-50">What's the latest news sentiment around Nvidia from the past week?</button>
            <button className="bg-white border border-gray-200 rounded-lg px-4 py-2 text-left text-gray-700 hover:bg-blue-50">What is the latest news regarding FED's interest rate cut decisions?</button>
            <button className="bg-white border border-gray-200 rounded-lg px-4 py-2 text-left text-gray-700 hover:bg-blue-50">Which companies are being affected by the Trump's new tariffs?</button>
          </div>
        </div>
        {/* Trading Strategies 区块 */}
        <h2 className="text-2xl font-bold mb-4 mt-8">Trading Strategies</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {mainFeatures.map(f => (
            <Link to={f.to} key={f.title} className="bg-white border border-gray-200 rounded-xl shadow hover:shadow-lg p-6 flex flex-col gap-2 transition">
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${f.tagColor}`}>{f.tag}</span>
                <span className="text-2xl">{f.icon}</span>
              </div>
              <div className="font-bold text-lg text-gray-900">{f.title}</div>
              <div className="text-gray-500 text-sm">{f.desc}</div>
            </Link>
          ))}
        </div>
        {/* Explore the Market 区块 */}
        <h2 className="text-2xl font-bold mb-4">Explore the Market</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {exploreFeatures.map(f => (
            <Link to={f.to} key={f.title} className="bg-white border border-gray-200 rounded-xl shadow hover:shadow-lg p-6 flex flex-col gap-2 transition">
              <div className={`text-xl mb-2 flex items-center`}>
                <span className={`inline-flex items-center justify-center w-10 h-10 rounded-full ${f.tagColor}`}>{f.icon}</span>
              </div>
              <div className="font-bold text-base text-gray-900">{f.title}</div>
              <div className="text-gray-500 text-sm">{f.desc}</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Home 