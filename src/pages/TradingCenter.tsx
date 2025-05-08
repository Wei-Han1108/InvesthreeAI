import { useState } from 'react'

const TABS = [
  { key: 'stock', label: 'Stock' },
  { key: 'forex', label: 'Forex' },
  { key: 'crypto', label: 'Crypto' },
  { key: 'etf', label: 'ETF' },
  { key: 'commodities', label: 'Commodities' },
]

const TradingCenter = () => {
  const [selectedTab, setSelectedTab] = useState('stock')

  return (
    <div className="max-w-3xl mx-auto mt-10">
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
      {selectedTab === 'stock' && <div>Stock Trading Coming Soon...</div>}
      {selectedTab === 'forex' && <div>Forex Trading Coming Soon...</div>}
      {selectedTab === 'crypto' && <div>Crypto Trading Coming Soon...</div>}
      {selectedTab === 'etf' && <div>ETF Trading Coming Soon...</div>}
      {selectedTab === 'commodities' && <div>Commodities Trading Coming Soon...</div>}
    </div>
  )
}

export default TradingCenter 