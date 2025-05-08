import { useEffect, useState } from 'react';
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

const FMP_API_KEY = import.meta.env.VITE_FMP_API_KEY;

const majorIndices = [
  { symbol: '^GSPC', name: 'S&P 500' },
  { symbol: '^IXIC', name: 'Nasdaq' },
  { symbol: '^DJI', name: 'Dow Jones' },
  { symbol: '^RUT', name: 'Russell 2000' },
  { symbol: '^FTSE', name: 'FTSE 100' },
  { symbol: '^GDAXI', name: 'DAX' },
  { symbol: '^N225', name: 'Nikkei 225' },
  { symbol: '^HSI', name: 'Hang Seng' },
  { symbol: '000001.SS', name: 'Shanghai Composite' },
];

const MarketPerformance = () => {
  const [indices, setIndices] = useState<any[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(majorIndices[0]);
  const [indexHistory, setIndexHistory] = useState<any[]>([]);
  const [sectorPerf, setSectorPerf] = useState<any[]>([]);
  const [gainers, setGainers] = useState<any[]>([]);
  const [losers, setLosers] = useState<any[]>([]);
  const [actives, setActives] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(false);

  // 获取主要指数最新行情
  useEffect(() => {
    const fetchIndices = async () => {
      setLoading(true);
      const res = await fetch(`https://financialmodelingprep.com/api/v3/quotes/index?apikey=${FMP_API_KEY}`);
      const data = await res.json();
      setIndices(data);
      setLoading(false);
    };
    fetchIndices();
  }, []);

  // 获取选中指数历史数据
  useEffect(() => {
    const fetchHistory = async () => {
      setChartLoading(true);
      const res = await fetch(`https://financialmodelingprep.com/api/v3/historical-price-full/${selectedIndex.symbol}?serietype=line&apikey=${FMP_API_KEY}`);
      const data = await res.json();
      setIndexHistory(data.historical ? data.historical.slice(0, 180).reverse() : []);
      setChartLoading(false);
    };
    fetchHistory();
  }, [selectedIndex]);

  // 获取行业板块表现
  useEffect(() => {
    const fetchSectors = async () => {
      const res = await fetch(`https://financialmodelingprep.com/api/v3/stock/sectors-performance?apikey=${FMP_API_KEY}`);
      const data = await res.json();
      setSectorPerf(data.sectorPerformance || []);
    };
    fetchSectors();
  }, []);

  // 获取热门股票榜单
  useEffect(() => {
    const fetchHot = async () => {
      const [g, l, a] = await Promise.all([
        fetch(`https://financialmodelingprep.com/api/v3/stock_market/gainers?apikey=${FMP_API_KEY}`).then(r => r.json()),
        fetch(`https://financialmodelingprep.com/api/v3/stock_market/losers?apikey=${FMP_API_KEY}`).then(r => r.json()),
        fetch(`https://financialmodelingprep.com/api/v3/stock_market/actives?apikey=${FMP_API_KEY}`).then(r => r.json()),
      ]);
      setGainers(g);
      setLosers(l);
      setActives(a);
    };
    fetchHot();
  }, []);

  const getChartData = () => {
    return {
      labels: indexHistory.map(d => format(new Date(d.date), 'yyyy-MM-dd')),
      datasets: [
        {
          label: selectedIndex.name,
          data: indexHistory.map(d => d.close),
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.5)',
          tension: 0.1
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
        text: `${selectedIndex.name} History`
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
      <h2 className="text-3xl font-bold mb-8">Market Performance</h2>
      {/* 指数卡片区 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mb-8">
        {majorIndices.map(idx => {
          const info = indices.find(i => i.symbol === idx.symbol);
          return (
            <div
              key={idx.symbol}
              className={`bg-white rounded-xl shadow p-4 cursor-pointer border-2 transition hover:border-blue-500 ${selectedIndex.symbol === idx.symbol ? 'border-blue-500' : 'border-transparent'}`}
              onClick={() => setSelectedIndex(idx)}
            >
              <div className="text-sm text-gray-500 mb-1">{idx.name}</div>
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {info?.price ?? '--'}
              </div>
              <div className={`text-sm font-semibold ${info?.changesPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>{info?.changesPercentage?.toFixed(2) ?? '--'}%</div>
            </div>
          );
        })}
      </div>
      {/* 指数历史K线图 */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
        {chartLoading ? (
          <div className="flex justify-center py-8 text-blue-500">Loading chart...</div>
        ) : (
          <Line data={getChartData()} options={chartOptions} />
        )}
      </div>
      {/* 行业板块表现和热门股票榜单 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* 行业板块表现 */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-lg font-bold mb-4">US Sector Performance</h3>
          <table className="min-w-full rounded-xl overflow-hidden">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-bold text-gray-600 uppercase">Sector</th>
                <th className="px-4 py-2 text-right text-xs font-bold text-gray-600 uppercase">Change %</th>
              </tr>
            </thead>
            <tbody>
              {sectorPerf.map((s: any, idx: number) => (
                <tr key={s.sector} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-4 py-2 font-bold">{s.sector}</td>
                  <td className={`px-4 py-2 text-right font-semibold ${parseFloat(s.changesPercentage) >= 0 ? 'text-green-600' : 'text-red-600'}`}>{s.changesPercentage}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* 热门股票榜单 */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-lg font-bold mb-4">US Hot Stocks</h3>
          <div className="mb-2 font-semibold">Top Gainers</div>
          <table className="min-w-full mb-4">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-2 py-1 text-left text-xs font-bold text-gray-600 uppercase">Symbol</th>
                <th className="px-2 py-1 text-right text-xs font-bold text-gray-600 uppercase">Price</th>
                <th className="px-2 py-1 text-right text-xs font-bold text-gray-600 uppercase">Change %</th>
              </tr>
            </thead>
            <tbody>
              {gainers.slice(0, 5).map((s: any) => (
                <tr key={s.symbol}>
                  <td className="px-2 py-1 font-bold">{s.symbol}</td>
                  <td className="px-2 py-1 text-right">{s.price?.toFixed(2) ?? '-'}</td>
                  <td className={`px-2 py-1 text-right font-semibold ${s.changesPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>{s.changesPercentage?.toFixed(2) ?? '-'}%</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mb-2 font-semibold">Top Losers</div>
          <table className="min-w-full mb-4">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-2 py-1 text-left text-xs font-bold text-gray-600 uppercase">Symbol</th>
                <th className="px-2 py-1 text-right text-xs font-bold text-gray-600 uppercase">Price</th>
                <th className="px-2 py-1 text-right text-xs font-bold text-gray-600 uppercase">Change %</th>
              </tr>
            </thead>
            <tbody>
              {losers.slice(0, 5).map((s: any) => (
                <tr key={s.symbol}>
                  <td className="px-2 py-1 font-bold">{s.symbol}</td>
                  <td className="px-2 py-1 text-right">{s.price?.toFixed(2) ?? '-'}</td>
                  <td className={`px-2 py-1 text-right font-semibold ${s.changesPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>{s.changesPercentage?.toFixed(2) ?? '-'}%</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mb-2 font-semibold">Most Actives</div>
          <table className="min-w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-2 py-1 text-left text-xs font-bold text-gray-600 uppercase">Symbol</th>
                <th className="px-2 py-1 text-right text-xs font-bold text-gray-600 uppercase">Price</th>
                <th className="px-2 py-1 text-right text-xs font-bold text-gray-600 uppercase">Volume</th>
              </tr>
            </thead>
            <tbody>
              {actives.slice(0, 5).map((s: any) => (
                <tr key={s.symbol}>
                  <td className="px-2 py-1 font-bold">{s.symbol}</td>
                  <td className="px-2 py-1 text-right">{s.price?.toFixed(2) ?? '-'}</td>
                  <td className="px-2 py-1 text-right">{s.volume?.toLocaleString() ?? '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {/* 详细表格区 */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
        <h3 className="text-lg font-bold mb-4">All Major Indices</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full rounded-xl overflow-hidden">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-bold text-gray-600 uppercase">Symbol</th>
                <th className="px-4 py-2 text-left text-xs font-bold text-gray-600 uppercase">Name</th>
                <th className="px-4 py-2 text-right text-xs font-bold text-gray-600 uppercase">Price</th>
                <th className="px-4 py-2 text-right text-xs font-bold text-gray-600 uppercase">Change %</th>
              </tr>
            </thead>
            <tbody>
              {indices.map((idx: any, i: number) => (
                <tr key={idx.symbol} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-4 py-2 font-bold">{idx.symbol}</td>
                  <td className="px-4 py-2">{idx.name}</td>
                  <td className="px-4 py-2 text-right">{idx.price ?? '-'}</td>
                  <td className={`px-4 py-2 text-right font-semibold ${idx.changesPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>{idx.changesPercentage?.toFixed(2) ?? '-'}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MarketPerformance; 