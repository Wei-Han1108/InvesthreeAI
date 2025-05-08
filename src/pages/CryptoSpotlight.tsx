import React, { useEffect, useState, useRef } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { format } from 'date-fns';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface Crypto {
  symbol: string;
  name: string;
  price?: number;
  changesPercentage?: number;
  marketCap?: number;
  volume?: number;
  dayLow?: number;
  dayHigh?: number;
  timestamp?: string;
  image?: string;
}

interface ChartData {
  date: string;
  close: number;
  high: number;
  low: number;
  open: number;
  volume: number;
}

type TimeRange = '1D' | '5D' | '1M' | '3M' | '6M' | '1Y';

const FMP_API_KEY = import.meta.env.VITE_FMP_API_KEY;

const CryptoSpotlight = () => {
  const [cryptos, setCryptos] = useState<Crypto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdateTime, setLastUpdateTime] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedCrypto, setSelectedCrypto] = useState<Crypto | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');
  const [intradayData, setIntradayData] = useState<ChartData[]>([]);
  const [dailyData, setDailyData] = useState<ChartData[]>([]);
  const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRange>('1D');
  const searchRef = useRef<HTMLDivElement>(null);

  const fetchData = async () => {
    try {
      const response = await fetch(`https://financialmodelingprep.com/api/v3/quotes/crypto?apikey=${FMP_API_KEY}`);
      if (!response.ok) throw new Error('Failed to fetch crypto data');
      const data: Crypto[] = await response.json();
      const sortedData = data.sort((a, b) => {
        const timeA = new Date(a.timestamp || 0).getTime();
        const timeB = new Date(b.timestamp || 0).getTime();
        return timeB - timeA;
      });
      setCryptos(sortedData);
      setLastUpdateTime(new Date().toLocaleString());
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setLoading(false);
    }
  };

  const fetchCryptoDetail = async (symbol: string) => {
    setDetailLoading(true);
    setDetailError('');
    setSelectedCrypto(null);
    try {
      const res = await fetch(`https://financialmodelingprep.com/api/v3/quote/${symbol}?apikey=${FMP_API_KEY}`);
      if (!res.ok) throw new Error('Failed to fetch crypto detail');
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        setSelectedCrypto(data[0]);
      } else {
        setDetailError('No detail found for this crypto.');
      }
    } catch (err) {
      setDetailError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setDetailLoading(false);
    }
  };

  const fetchIntradayData = async (symbol: string) => {
    try {
      const response = await fetch(
        `https://financialmodelingprep.com/api/v3/historical-chart/1min/${symbol}?apikey=${FMP_API_KEY}`
      );
      if (!response.ok) throw new Error('Failed to fetch intraday data');
      const data = await response.json();
      if (Array.isArray(data)) {
        const lastData = data.slice(0, 390).reverse();
        setIntradayData(lastData);
      }
    } catch (error) {
      console.error('Error fetching intraday data:', error);
    }
  };

  const fetchDailyData = async (symbol: string, timeRange: TimeRange) => {
    try {
      let limit = 30;
      switch (timeRange) {
        case '1D':
          limit = 1;
          break;
        case '5D':
          limit = 5;
          break;
        case '3M':
          limit = 90;
          break;
        case '6M':
          limit = 180;
          break;
        case '1Y':
          limit = 365;
          break;
      }
      const response = await fetch(
        `https://financialmodelingprep.com/api/v3/historical-price-full/${symbol}?timeseries=${limit}&apikey=${FMP_API_KEY}`
      );
      if (!response.ok) throw new Error('Failed to fetch daily data');
      const data = await response.json();
      if (data.historical) {
        setDailyData(data.historical.reverse());
      }
    } catch (error) {
      console.error('Error fetching daily data:', error);
    }
  };

  const handleTimeRangeChange = (range: TimeRange) => {
    setSelectedTimeRange(range);
    if (selectedCrypto) {
      fetchDailyData(selectedCrypto.symbol, range);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const suggestions = searchQuery.length > 0
    ? cryptos.filter(c =>
        c.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.name.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 10)
    : [];

  const handleSuggestionClick = (c: Crypto) => {
    setSearchQuery(c.symbol);
    setShowSuggestions(false);
    setSelectedCrypto(c);
    fetchCryptoDetail(c.symbol);
    fetchIntradayData(c.symbol);
    fetchDailyData(c.symbol, selectedTimeRange);
  };

  const getChartData = () => {
    const data = selectedTimeRange === '1D' ? intradayData : dailyData;
    return {
      labels: data.map(d => format(new Date(d.date), selectedTimeRange === '1D' ? 'HH:mm' : 'MMM dd')),
      datasets: [
        {
          label: 'Price',
          data: data.map(d => d.close),
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.5)',
          tension: 0.1
        },
        {
          label: 'Volume',
          data: data.map(d => d.volume),
          borderColor: 'rgb(153, 102, 255)',
          backgroundColor: 'rgba(153, 102, 255, 0.5)',
          tension: 0.1,
          yAxisID: 'volume'
        }
      ]
    };
  };

  const chartOptions = {
    responsive: true,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: `${selectedTimeRange} Price History`
      }
    },
    scales: {
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
      },
      volume: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        grid: {
          drawOnChartArea: false,
        },
      }
    }
  };

  return (
    <div className="container mx-auto mt-6">
      <h2 className="text-3xl font-bold mb-8">Crypto Spotlight</h2>
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-8" ref={searchRef}>
        <div className="flex justify-center relative">
          <input
            type="text"
            placeholder="Search symbol or name..."
            value={searchQuery}
            onChange={e => {
              setSearchQuery(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => searchQuery && setShowSuggestions(true)}
            className="w-full max-w-xl px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute left-1/2 top-full mt-1 w-full max-w-xl -translate-x-1/2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto z-30">
              {suggestions.map(s => (
                <div
                  key={s.symbol}
                  className="px-4 py-2 cursor-pointer hover:bg-blue-50"
                  onClick={() => handleSuggestionClick(s)}
                >
                  <span className="font-bold mr-2">{s.symbol}</span>
                  <span className="text-gray-600">{s.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        {detailLoading && (
          <div className="flex justify-center py-4 text-blue-500">Loading details...</div>
        )}
        {detailError && (
          <div className="text-red-500 py-2">{detailError}</div>
        )}
        {selectedCrypto && !detailLoading && !detailError && (
          <div className="mt-6 space-y-6">
            <div className="bg-gray-50 rounded-lg p-4 shadow-inner">
              <div className="flex items-center gap-4 mb-2">
                <div className="text-xl font-bold">{selectedCrypto.name} ({selectedCrypto.symbol})</div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                <div>Current Price: <span className="font-semibold">${selectedCrypto.price?.toLocaleString() ?? '-'}</span></div>
                <div>Change %: <span className={`font-semibold ${selectedCrypto.changesPercentage && selectedCrypto.changesPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>{selectedCrypto.changesPercentage?.toFixed(2) ?? '-'}</span></div>
                <div>Market Cap: <span className="font-semibold">${selectedCrypto.marketCap?.toLocaleString() ?? '-'}</span></div>
                <div>Volume: <span className="font-semibold">${selectedCrypto.volume?.toLocaleString() ?? '-'}</span></div>
                <div>Day Low: <span className="font-semibold">${selectedCrypto.dayLow?.toLocaleString() ?? '-'}</span></div>
                <div>Day High: <span className="font-semibold">${selectedCrypto.dayHigh?.toLocaleString() ?? '-'}</span></div>
              </div>
            </div>
            {/* Price Chart */}
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="flex justify-end mb-4 space-x-2">
                {(['1D', '5D', '1M', '3M', '6M', '1Y'] as TimeRange[]).map((range) => (
                  <button
                    key={range}
                    onClick={() => handleTimeRangeChange(range)}
                    className={`px-3 py-1 rounded ${
                      selectedTimeRange === range
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {range}
                  </button>
                ))}
              </div>
              <Line data={getChartData()} options={chartOptions} />
            </div>
          </div>
        )}
      </div>
      <div className="bg-white rounded-2xl shadow-lg p-6 mt-6">
        <div className="flex justify-between items-center mb-4">
          <div></div>
          <div className="text-sm text-gray-500">Last Updated: {lastUpdateTime}</div>
        </div>
        {loading ? (
          <div className="text-gray-500">Loading...</div>
        ) : error ? (
          <div className="text-red-500">{error}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full rounded-xl overflow-hidden">
              <thead className="bg-gray-100 sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">Symbol</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">Price (USD)</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">24h Change (%)</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">Market Cap</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">Volume (24h)</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">Day Low</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">Day High</th>
                </tr>
              </thead>
              <tbody>
                {cryptos.slice(0, 50).map((c, idx) => (
                  <tr
                    key={c.symbol}
                    className={
                      `transition-colors duration-150 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50`
                    }
                  >
                    <td className="px-6 py-3 font-medium">{c.name}</td>
                    <td className="px-6 py-3 font-bold">{c.symbol}</td>
                    <td className="px-6 py-3">${c.price?.toLocaleString() ?? '-'}</td>
                    <td className={`px-6 py-3 font-semibold ${c.changesPercentage && c.changesPercentage > 0 ? 'text-green-600' : 'text-red-600'}`}>{c.changesPercentage?.toFixed(2) ?? '-'}</td>
                    <td className="px-6 py-3">${c.marketCap?.toLocaleString() ?? '-'}</td>
                    <td className="px-6 py-3">${c.volume?.toLocaleString() ?? '-'}</td>
                    <td className="px-6 py-3">${c.dayLow?.toLocaleString() ?? '-'}</td>
                    <td className="px-6 py-3">${c.dayHigh?.toLocaleString() ?? '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default CryptoSpotlight; 