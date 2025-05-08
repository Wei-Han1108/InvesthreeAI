import { useEffect, useState, useRef } from 'react';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
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
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface IndicatorMeta {
  name: string;
  country?: string;
  category?: string;
  symbol: string;
  [key: string]: any;
}

interface IndicatorData {
  date: string;
  value: number;
}

const FMP_API_KEY = import.meta.env.VITE_FMP_API_KEY;

type ChartType = 'line' | 'bar';

// 重要指标symbol及展示名
const importantIndicators = [
  { symbol: 'GDPUSA', label: 'GDP (US)' },
  { symbol: 'CPIUSA', label: 'CPI (US)' },
  { symbol: 'UNRATEUSA', label: 'Unemployment Rate (US)' },
  { symbol: 'FEDFUNDS', label: 'Fed Funds Rate' },
  { symbol: 'M2USA', label: 'M2 Money Supply (US)' },
  { symbol: 'PMIUSA', label: 'PMI (US)' },
];

const EconomicData = () => {
  const [indicators, setIndicators] = useState<IndicatorMeta[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndicator, setSelectedIndicator] = useState<IndicatorMeta | null>(null);
  const [indicatorData, setIndicatorData] = useState<IndicatorData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');
  const [chartType, setChartType] = useState<ChartType>('line');
  const [importantData, setImportantData] = useState<Record<string, { meta: IndicatorMeta|null, latest: IndicatorData|null }>>({});
  const searchRef = useRef<HTMLDivElement>(null);

  // 获取所有经济指标元数据
  useEffect(() => {
    const fetchIndicators = async () => {
      setLoading(true);
      try {
        const res = await fetch(`https://financialmodelingprep.com/api/v3/economic?apikey=${FMP_API_KEY}`);
        if (!res.ok) throw new Error('Failed to fetch indicators');
        const data = await res.json();
        setIndicators(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };
    fetchIndicators();
  }, []);

  // 获取重要指标最新数据
  useEffect(() => {
    const fetchImportant = async () => {
      const result: Record<string, { meta: IndicatorMeta|null, latest: IndicatorData|null }> = {};
      for (const item of importantIndicators) {
        try {
          // 查找元数据
          const meta = indicators.find(i => i.symbol === item.symbol) || null;
          let latest: IndicatorData|null = null;
          if (meta) {
            const res = await fetch(`https://financialmodelingprep.com/api/v3/economic/${item.symbol}?apikey=${FMP_API_KEY}`);
            if (res.ok) {
              const data = await res.json();
              if (Array.isArray(data) && data.length > 0) {
                latest = data[0];
              }
            }
          }
          result[item.symbol] = { meta, latest };
        } catch {
          result[item.symbol] = { meta: null, latest: null };
        }
      }
      setImportantData(result);
    };
    if (indicators.length > 0) fetchImportant();
  }, [indicators]);

  // 搜索建议
  const suggestions = searchQuery.length > 0
    ? indicators.filter(i =>
        i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (i.country && i.country.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (i.category && i.category.toLowerCase().includes(searchQuery.toLowerCase()))
      ).slice(0, 100)
    : indicators.slice(0, 100);

  // 获取某一经济指标的历史数据
  const fetchIndicatorData = async (symbol: string) => {
    setDetailLoading(true);
    setDetailError('');
    setIndicatorData([]);
    try {
      const res = await fetch(`https://financialmodelingprep.com/api/v3/economic/${symbol}?apikey=${FMP_API_KEY}`);
      if (!res.ok) throw new Error('Failed to fetch indicator data');
      const data = await res.json();
      setIndicatorData(data);
    } catch (err) {
      setDetailError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setDetailLoading(false);
    }
  };

  // 处理点击建议
  const handleSuggestionClick = (indicator: IndicatorMeta) => {
    setSearchQuery(indicator.name);
    setShowSuggestions(false);
    setSelectedIndicator(indicator);
    fetchIndicatorData(indicator.symbol);
  };

  // 处理点击重要指标卡片
  const handleImportantClick = (symbol: string) => {
    const meta = indicators.find(i => i.symbol === symbol) || null;
    setSelectedIndicator(meta);
    setSearchQuery(meta?.name || '');
    fetchIndicatorData(symbol);
  };

  // 处理点击外部关闭建议
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 图表数据
  const getChartData = () => {
    return {
      labels: indicatorData.map(d => d.date),
      datasets: [
        {
          label: selectedIndicator?.name || 'Value',
          data: indicatorData.map(d => d.value),
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.5)',
          fill: chartType === 'line',
        }
      ]
    };
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' as const },
      title: {
        display: true,
        text: selectedIndicator?.name || 'Economic Data',
      },
    },
    scales: {
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
      },
    },
  };

  return (
    <div className="container mx-auto mt-6">
      <h2 className="text-3xl font-bold mb-8">Economic Data</h2>
      {/* 重要指标卡片区 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        {importantIndicators.map(item => {
          const info = importantData[item.symbol];
          return (
            <div
              key={item.symbol}
              className={`bg-white rounded-xl shadow p-4 cursor-pointer border-2 transition hover:border-blue-500 ${selectedIndicator?.symbol === item.symbol ? 'border-blue-500' : 'border-transparent'}`}
              onClick={() => handleImportantClick(item.symbol)}
            >
              <div className="text-sm text-gray-500 mb-1">{item.label}</div>
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {info?.latest?.value ?? '--'}
              </div>
              <div className="text-xs text-gray-400">{info?.latest?.date ?? ''}</div>
            </div>
          );
        })}
      </div>
      {/* 搜索区 */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-8" ref={searchRef}>
        <div className="flex justify-center relative">
          <input
            type="text"
            placeholder="Search economic indicator..."
            value={searchQuery}
            onChange={e => {
              setSearchQuery(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
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
                  <span className="font-bold mr-2">{s.name}</span>
                  <span className="text-gray-600">{s.country ? `(${s.country})` : ''}</span>
                  <span className="text-gray-400 ml-2 text-xs">{s.category}</span>
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
        {selectedIndicator && !detailLoading && !detailError && (
          <div className="mt-6 space-y-6">
            <div className="bg-gray-50 rounded-lg p-4 shadow-inner">
              <div className="flex items-center gap-4 mb-2">
                <div className="text-xl font-bold">{selectedIndicator.name} {selectedIndicator.country ? `(${selectedIndicator.country})` : ''}</div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                <div>Category: <span className="font-semibold">{selectedIndicator.category ?? '-'}</span></div>
                <div>Symbol: <span className="font-semibold">{selectedIndicator.symbol}</span></div>
                {/* 可扩展更多字段 */}
              </div>
            </div>
            {/* Chart Type Switch */}
            <div className="flex justify-end mb-2 space-x-2">
              <button
                className={`px-3 py-1 rounded ${chartType === 'line' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                onClick={() => setChartType('line')}
              >
                Line
              </button>
              <button
                className={`px-3 py-1 rounded ${chartType === 'bar' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                onClick={() => setChartType('bar')}
              >
                Bar
              </button>
            </div>
            {/* Chart */}
            <div className="bg-white p-4 rounded-lg shadow">
              {chartType === 'line' ? (
                <Line data={getChartData()} options={chartOptions} />
              ) : (
                <Bar data={getChartData()} options={chartOptions} />
              )}
            </div>
          </div>
        )}
      </div>
      {/* Data Table */}
      {selectedIndicator && indicatorData.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg p-6 mt-6">
          <div className="flex justify-between items-center mb-4">
            <div className="text-lg font-bold">{selectedIndicator.name} History</div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full rounded-xl overflow-hidden">
              <thead className="bg-gray-100 sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">Value</th>
                </tr>
              </thead>
              <tbody>
                {indicatorData.map((d, idx) => (
                  <tr key={d.date} className={`transition-colors duration-150 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50`}>
                    <td className="px-6 py-3">{d.date}</td>
                    <td className="px-6 py-3">{d.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default EconomicData; 