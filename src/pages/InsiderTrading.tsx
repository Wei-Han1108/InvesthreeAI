import { useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { format } from 'date-fns';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const FMP_API_KEY = import.meta.env.VITE_FMP_API_KEY;

const InsiderTrading = () => {
  const [trades, setTrades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    todayCount: 0,
    todayBuy: 0,
    todaySell: 0,
    maxTrade: 0,
  });
  const [topCompanies, setTopCompanies] = useState<any[]>([]);
  const [topInsiders, setTopInsiders] = useState<any[]>([]);
  const [trendData, setTrendData] = useState<{ date: string, count: number }[]>([]);

  // 获取最新内幕交易
  useEffect(() => {
    const fetchTrades = async () => {
      setLoading(true);
      const res = await fetch(`https://financialmodelingprep.com/api/v4/insider-trading?limit=200&apikey=${FMP_API_KEY}`);
      const data = await res.json();
      setTrades(data);
      setLoading(false);

      // 统计卡片
      const today = format(new Date(), 'yyyy-MM-dd');
      let todayCount = 0, todayBuy = 0, todaySell = 0, maxTrade = 0;
      const companyMap: Record<string, number> = {};
      const insiderMap: Record<string, number> = {};
      const trendMap: Record<string, number> = {};
      data.forEach((t: any) => {
        if (t.transactionDate === today) {
          todayCount++;
          if (t.transactionType === 'Buy') todayBuy += t.securitiesTransacted * t.price;
          if (t.transactionType === 'Sell') todaySell += t.securitiesTransacted * t.price;
        }
        if (t.securitiesTransacted * t.price > maxTrade) maxTrade = t.securitiesTransacted * t.price;
        // 热门公司
        companyMap[t.symbol] = (companyMap[t.symbol] || 0) + 1;
        // 高频insider
        insiderMap[t.reportedTitle] = (insiderMap[t.reportedTitle] || 0) + 1;
        // 趋势图
        trendMap[t.transactionDate] = (trendMap[t.transactionDate] || 0) + 1;
      });
      setStats({ todayCount, todayBuy, todaySell, maxTrade });
      // 热门公司榜单
      setTopCompanies(Object.entries(companyMap).sort((a, b) => b[1] - a[1]).slice(0, 5));
      // 高频insider榜单
      setTopInsiders(Object.entries(insiderMap).sort((a, b) => b[1] - a[1]).slice(0, 5));
      // 趋势图数据
      const trendArr = Object.entries(trendMap).map(([date, count]) => ({ date, count }));
      trendArr.sort((a, b) => a.date.localeCompare(b.date));
      setTrendData(trendArr.slice(-30));
    };
    fetchTrades();
  }, []);

  const trendChartData = {
    labels: trendData.map(d => d.date),
    datasets: [
      {
        label: 'Insider Trades',
        data: trendData.map(d => d.count),
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
        borderColor: 'rgb(75, 192, 192)',
        borderWidth: 1,
      },
    ],
  };

  const trendChartOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: { display: true, text: 'Insider Trades Trend (Last 30 Days)' },
    },
    scales: {
      y: { beginAtZero: true },
    },
  };

  return (
    <div className="container mx-auto mt-6">
      <h2 className="text-3xl font-bold mb-8">Insider Trading Dashboard</h2>
      {/* 统计卡片区 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow p-4">
          <div className="text-sm text-gray-500 mb-1">Today's Trades</div>
          <div className="text-2xl font-bold text-gray-900">{stats.todayCount}</div>
        </div>
        <div className="bg-white rounded-xl shadow p-4">
          <div className="text-sm text-gray-500 mb-1">Today's Buy Value</div>
          <div className="text-2xl font-bold text-green-600">${stats.todayBuy.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
        </div>
        <div className="bg-white rounded-xl shadow p-4">
          <div className="text-sm text-gray-500 mb-1">Today's Sell Value</div>
          <div className="text-2xl font-bold text-red-600">${stats.todaySell.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
        </div>
        <div className="bg-white rounded-xl shadow p-4">
          <div className="text-sm text-gray-500 mb-1">Max Single Trade</div>
          <div className="text-2xl font-bold text-blue-600">${stats.maxTrade.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
        </div>
      </div>
      {/* 趋势图 */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
        <Bar data={trendChartData} options={trendChartOptions} />
      </div>
      {/* 热门公司和高频insider榜单 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-lg font-bold mb-4">Top Companies (by # of Trades)</h3>
          <table className="min-w-full rounded-xl overflow-hidden">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-bold text-gray-600 uppercase">Symbol</th>
                <th className="px-4 py-2 text-right text-xs font-bold text-gray-600 uppercase">Trades</th>
              </tr>
            </thead>
            <tbody>
              {topCompanies.map(([symbol, count]) => (
                <tr key={symbol}>
                  <td className="px-4 py-2 font-bold">{symbol}</td>
                  <td className="px-4 py-2 text-right">{count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-lg font-bold mb-4">Top Insiders (by # of Trades)</h3>
          <table className="min-w-full rounded-xl overflow-hidden">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-bold text-gray-600 uppercase">Insider</th>
                <th className="px-4 py-2 text-right text-xs font-bold text-gray-600 uppercase">Trades</th>
              </tr>
            </thead>
            <tbody>
              {topInsiders.map(([insider, count]) => (
                <tr key={insider}>
                  <td className="px-4 py-2 font-bold">{insider}</td>
                  <td className="px-4 py-2 text-right">{count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {/* 最新内幕交易表格 */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
        <h3 className="text-lg font-bold mb-4">Latest Insider Trades</h3>
        {loading ? (
          <div className="flex justify-center py-8 text-blue-500">Loading...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full rounded-xl overflow-hidden">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-bold text-gray-600 uppercase">Symbol</th>
                  <th className="px-4 py-2 text-left text-xs font-bold text-gray-600 uppercase">Insider</th>
                  <th className="px-4 py-2 text-left text-xs font-bold text-gray-600 uppercase">Title</th>
                  <th className="px-4 py-2 text-left text-xs font-bold text-gray-600 uppercase">Type</th>
                  <th className="px-4 py-2 text-right text-xs font-bold text-gray-600 uppercase">Shares</th>
                  <th className="px-4 py-2 text-right text-xs font-bold text-gray-600 uppercase">Price</th>
                  <th className="px-4 py-2 text-right text-xs font-bold text-gray-600 uppercase">Value</th>
                  <th className="px-4 py-2 text-left text-xs font-bold text-gray-600 uppercase">Date</th>
                </tr>
              </thead>
              <tbody>
                {trades.map((t: any, idx: number) => (
                  <tr key={t._id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-4 py-2 font-bold">{t.symbol}</td>
                    <td className="px-4 py-2">{t.insiderName}</td>
                    <td className="px-4 py-2">{t.reportedTitle}</td>
                    <td className="px-4 py-2">{t.transactionType}</td>
                    <td className="px-4 py-2 text-right">{t.securitiesTransacted}</td>
                    <td className="px-4 py-2 text-right">{t.price?.toFixed(2) ?? '-'}</td>
                    <td className="px-4 py-2 text-right">{(t.securitiesTransacted * t.price).toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                    <td className="px-4 py-2">{t.transactionDate}</td>
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

export default InsiderTrading; 