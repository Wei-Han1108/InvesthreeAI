import { useState, useEffect } from 'react';
// @ts-ignore
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

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const FMP_API_KEY = import.meta.env.VITE_FMP_API_KEY;

const CompanyInfo = () => {
  const [search, setSearch] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // 数据区块
  const [marketCap, setMarketCap] = useState<any[]>([]);
  const [analystEst, setAnalystEst] = useState<any>(null);
  const [analystRec, setAnalystRec] = useState<any[]>([]);
  const [financials, setFinancials] = useState<{income:any[],balance:any[],cashflow:any[]}>({income:[],balance:[],cashflow:[]});
  const [financialType, setFinancialType] = useState<'income'|'balance'|'cashflow'>('income');
  // 新增区块
  const [profile, setProfile] = useState<any>(null);
  const [executives, setExecutives] = useState<any[]>([]);
  const [rating, setRating] = useState<any>(null);
  const [dcf, setDcf] = useState<any>(null);
  const [enterprise, setEnterprise] = useState<any>(null);
  const [dividends, setDividends] = useState<any[]>([]);
  const [esg, setEsg] = useState<any>(null);
  const [news, setNews] = useState<any[]>([]);

  const COMMON_COMPANIES = [
    { symbol: 'AAPL', name: 'Apple Inc.' },
    { symbol: 'MSFT', name: 'Microsoft Corporation' },
    { symbol: 'GOOGL', name: 'Alphabet Inc.' },
    { symbol: 'AMZN', name: 'Amazon.com Inc.' },
    { symbol: 'TSLA', name: 'Tesla Inc.' },
    { symbol: 'META', name: 'Meta Platforms Inc.' },
    { symbol: 'NVDA', name: 'NVIDIA Corporation' },
    { symbol: 'BRK.B', name: 'Berkshire Hathaway Inc.' },
    { symbol: 'JPM', name: 'JPMorgan Chase & Co.' },
    { symbol: 'V', name: 'Visa Inc.' },
  ];

  // 搜索建议
  useEffect(() => {
    if (search.length < 2) {
      setSuggestions([]);
      return;
    }
    const fetchSuggestions = async () => {
      const res = await fetch(`https://financialmodelingprep.com/api/v3/search?query=${search}&limit=8&exchange=NASDAQ&apikey=${FMP_API_KEY}`);
      const data = await res.json();
      setSuggestions(data);
    };
    const timer = setTimeout(fetchSuggestions, 400);
    return () => clearTimeout(timer);
  }, [search]);

  // 选中公司后加载全部数据
  useEffect(() => {
    if (!selected) return;
    setLoading(true);
    const symbol = selected.symbol;
    Promise.all([
      fetch(`https://financialmodelingprep.com/api/v3/profile/${symbol}?apikey=${FMP_API_KEY}`).then(r=>r.json()),
      fetch(`https://financialmodelingprep.com/api/v3/key-executives/${symbol}?apikey=${FMP_API_KEY}`).then(r=>r.json()),
      fetch(`https://financialmodelingprep.com/api/v3/rating/${symbol}?apikey=${FMP_API_KEY}`).then(r=>r.json()),
      fetch(`https://financialmodelingprep.com/api/v3/discounted-cash-flow/${symbol}?apikey=${FMP_API_KEY}`).then(r=>r.json()),
      fetch(`https://financialmodelingprep.com/api/v3/enterprise-values/${symbol}?limit=1&apikey=${FMP_API_KEY}`).then(r=>r.json()),
      fetch(`https://financialmodelingprep.com/api/v3/stock_dividend/${symbol}?apikey=${FMP_API_KEY}`).then(r=>r.json()),
      fetch(`https://financialmodelingprep.com/api/v4/esg-environmental-social-governance-data?symbol=${symbol}&apikey=${FMP_API_KEY}`).then(r=>r.json()),
      fetch(`https://financialmodelingprep.com/api/v3/stock_news?tickers=${symbol}&limit=5&apikey=${FMP_API_KEY}`).then(r=>r.json()),
      fetch(`https://financialmodelingprep.com/api/v3/historical-market-capitalization/${symbol}?apikey=${FMP_API_KEY}`).then(r=>r.json()),
      fetch(`https://financialmodelingprep.com/api/v3/analyst-estimates/${symbol}?apikey=${FMP_API_KEY}`).then(r=>r.json()),
      fetch(`https://financialmodelingprep.com/api/v3/analyst-stock-recommendations/${symbol}?apikey=${FMP_API_KEY}`).then(r=>r.json()),
      fetch(`https://financialmodelingprep.com/api/v3/income-statement/${symbol}?limit=4&apikey=${FMP_API_KEY}`).then(r=>r.json()),
      fetch(`https://financialmodelingprep.com/api/v3/balance-sheet-statement/${symbol}?limit=4&apikey=${FMP_API_KEY}`).then(r=>r.json()),
      fetch(`https://financialmodelingprep.com/api/v3/cash-flow-statement/${symbol}?limit=4&apikey=${FMP_API_KEY}`).then(r=>r.json()),
    ]).then(([
      profileData,
      executivesData,
      ratingData,
      dcfData,
      enterpriseData,
      dividendsData,
      esgData,
      newsData,
      marketCapData,
      analystEstData,
      analystRecData,
      incomeData,
      balanceData,
      cashflowData
    ]) => {
      setProfile(profileData && profileData[0] ? profileData[0] : null);
      setExecutives(executivesData || []);
      setRating(ratingData && ratingData[0] ? ratingData[0] : null);
      setDcf(dcfData && dcfData[0] ? dcfData[0] : null);
      setEnterprise(enterpriseData && enterpriseData[0] ? enterpriseData[0] : null);
      setDividends(dividendsData || []);
      setEsg(esgData && esgData[0] ? esgData[0] : null);
      setNews(newsData || []);
      setMarketCap(marketCapData || []);
      setAnalystEst(analystEstData);
      setAnalystRec(analystRecData || []);
      setFinancials({ income: incomeData, balance: balanceData, cashflow: cashflowData });
    }).finally(() => setLoading(false));
  }, [selected]);

  return (
    <div className="container mx-auto mt-6">
      <h2 className="text-3xl font-bold mb-8">Company Info</h2>
      {/* 搜索框 */}
      <div className="mb-6 max-w-xl">
        <input
          className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200"
          placeholder="Search company name or symbol..."
          value={search}
          onChange={e => { setSearch(e.target.value); setSelected(null); }}
        />
        {/* 建议列表 */}
        {(search.length === 0 ? COMMON_COMPANIES : suggestions).length > 0 && (
          <div className="bg-white border rounded-lg shadow mt-1 z-10 relative">
            {(search.length === 0 ? COMMON_COMPANIES : suggestions).map(s => (
              <div key={s.symbol} className="px-4 py-2 cursor-pointer hover:bg-blue-50" onClick={() => { setSelected(s); setSearch(s.symbol); setSuggestions([]); }}>
                {s.symbol} - {s.name}
              </div>
            ))}
          </div>
        )}
      </div>
      {/* 选中公司后展示数据区块 */}
      {selected && (
        <div className="space-y-8">
          {/* 公司简介/基本信息 */}
          {profile && (
            <div className="bg-white rounded-xl shadow p-4">
              <div className="flex items-center gap-4 mb-2">
                {profile.image && <img src={profile.image} alt="logo" className="w-12 h-12 rounded-full" />}
                <div>
                  <div className="text-xl font-bold">{profile.companyName} ({profile.symbol})</div>
                  <div className="text-gray-500">{profile.exchange} | {profile.industry} | {profile.sector}</div>
                </div>
              </div>
              <div className="text-gray-700 mb-2">{profile.description}</div>
              <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                <div>CEO: {profile.ceo}</div>
                <div>IPO: {profile.ipoDate}</div>
                <div>Market Cap: {profile.mktCap?.toLocaleString()}</div>
                <div>Employees: {profile.fullTimeEmployees}</div>
                <div>Country: {profile.country}</div>
                <div>Website: <a href={profile.website} className="text-blue-600 underline" target="_blank" rel="noreferrer">{profile.website}</a></div>
              </div>
            </div>
          )}
          {/* 高管 */}
          {executives && executives.length > 0 && (
            <div className="bg-white rounded-xl shadow p-4">
              <div className="font-bold mb-2">Key Executives</div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-xs">
                  <thead><tr>{Object.keys(executives[0]||{}).map(k=>(<th key={k} className="px-2 py-1 text-left text-gray-500 whitespace-nowrap">{k}</th>))}</tr></thead>
                  <tbody>
                    {executives.map((row:any,i:number)=>(
                      <tr key={i}>{Object.values(row).map((v:any,ii:number)=>(<td key={ii} className="px-2 py-1 whitespace-nowrap">{v}</td>))}</tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {/* 公司评级 */}
          {rating && (
            <div className="bg-white rounded-xl shadow p-4">
              <div className="font-bold mb-2">Company Rating</div>
              <div>Rating: <span className="font-bold">{rating.rating}</span> ({rating.ratingScore})</div>
              <div>Recommendation: {rating.ratingRecommendation}</div>
              <div>Last Update: {rating.date}</div>
            </div>
          )}
          {/* 估值（DCF） */}
          {dcf && (
            <div className="bg-white rounded-xl shadow p-4">
              <div className="font-bold mb-2">Discounted Cash Flow (DCF)</div>
              <div>DCF: <span className="font-bold">{dcf.dcf}</span></div>
              <div>Date: {dcf.date}</div>
            </div>
          )}
          {/* 企业价值 */}
          {enterprise && (
            <div className="bg-white rounded-xl shadow p-4">
              <div className="font-bold mb-2">Enterprise Value</div>
              <div>Enterprise Value: <span className="font-bold">{enterprise.enterpriseValue?.toLocaleString()}</span></div>
              <div>Date: {enterprise.date}</div>
            </div>
          )}
          {/* 分红 */}
          {dividends && dividends.length > 0 && (
            <div className="bg-white rounded-xl shadow p-4">
              <div className="font-bold mb-2">Dividends</div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-xs">
                  <thead><tr>{Object.keys(dividends[0]||{}).map(k=>(<th key={k} className="px-2 py-1 text-left text-gray-500 whitespace-nowrap">{k}</th>))}</tr></thead>
                  <tbody>
                    {dividends.map((row:any,i:number)=>(
                      <tr key={i}>{Object.values(row).map((v:any,ii:number)=>(<td key={ii} className="px-2 py-1 whitespace-nowrap">{v}</td>))}</tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {/* ESG评分 */}
          {esg && (
            <div className="bg-white rounded-xl shadow p-4">
              <div className="font-bold mb-2">ESG Score</div>
              <div>Environment: {esg.environmentScore}</div>
              <div>Social: {esg.socialScore}</div>
              <div>Governance: {esg.governanceScore}</div>
              <div>Total: <span className="font-bold">{esg.totalScore}</span></div>
            </div>
          )}
          {/* 公司新闻 */}
          {news && news.length > 0 && (
            <div className="bg-white rounded-xl shadow p-4">
              <div className="font-bold mb-2">Latest News</div>
              <div className="space-y-4">
                {news.map((n:any) => {
                  // 提取一句摘要
                  const summary = n.summary || n.description || (n.text ? n.text.split(/[.!?。！]/)[0] : '');
                  // 发布时间格式化
                  const dateObj = n.publishedDate ? new Date(n.publishedDate) : null;
                  const timeStr = dateObj ? dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
                  const dateStr = dateObj ? `${String(dateObj.getMonth()+1).padStart(2,'0')}/${String(dateObj.getDate()).padStart(2,'0')}` : '';
                  // 来源域名
                  let domain = '';
                  try { domain = n.site || (n.url ? new URL(n.url).hostname.replace(/^www\./, '') : ''); } catch { domain = ''; }
                  // 股票代码
                  const symbol = n.symbol || n.tickers?.[0] || selected?.symbol || '';
                  return (
                    <div key={n.url} className="flex bg-gray-50 rounded-lg p-4 items-center gap-4 shadow-sm">
                      <div className="flex flex-col items-center w-16 flex-shrink-0">
                        <div className="text-lg font-bold text-gray-500">{timeStr}</div>
                        <div className="text-xs text-gray-400">{dateStr}</div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-gray-400 mb-1">{domain}</div>
                        <a href={n.url} className="text-lg font-bold text-blue-800 hover:underline block mb-1" target="_blank" rel="noreferrer">{n.title}</a>
                        <div className="text-gray-700 mb-2 truncate">{summary}</div>
                        {symbol && <span className="inline-block bg-gray-200 text-gray-800 text-xs px-3 py-1 rounded-full font-semibold">{symbol}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {/* 市值历史图表 */}
          <div className="bg-white rounded-xl shadow p-4">
            <div className="font-bold mb-2">Market Cap History</div>
            {marketCap && marketCap.length > 0 ? (
              <Line
                data={{
                  labels: marketCap.map((d:any) => d.date),
                  datasets: [{
                    label: 'Market Cap',
                    data: marketCap.map((d:any) => d.marketCap),
                    borderColor: 'rgb(75,192,192)',
                    backgroundColor: 'rgba(75,192,192,0.2)',
                  }]
                }}
                options={{
                  responsive: true,
                  plugins: { legend: { display: false }, title: { display: false } },
                  scales: { y: { beginAtZero: false } }
                }}
                height={80}
              />
            ) : <div className="h-64 flex items-center justify-center text-gray-400">No Data</div>}
          </div>
          {/* 财务报表切换区块 */}
          <div className="bg-white rounded-xl shadow p-4">
            <div className="font-bold mb-2 flex items-center gap-4">
              Financial Statements
              <div className="flex gap-2 ml-4">
                <button className={`px-3 py-1 rounded ${financialType==='income'?'bg-blue-600 text-white':'bg-gray-100 text-gray-700'}`} onClick={()=>setFinancialType('income')}>Income</button>
                <button className={`px-3 py-1 rounded ${financialType==='balance'?'bg-blue-600 text-white':'bg-gray-100 text-gray-700'}`} onClick={()=>setFinancialType('balance')}>Balance</button>
                <button className={`px-3 py-1 rounded ${financialType==='cashflow'?'bg-blue-600 text-white':'bg-gray-100 text-gray-700'}`} onClick={()=>setFinancialType('cashflow')}>Cash Flow</button>
              </div>
            </div>
            {financials && financials[financialType] && financials[financialType].length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full text-xs">
                  <thead><tr>{Object.keys(financials[financialType][0]||{}).map(k=>(<th key={k} className="px-2 py-1 text-left text-gray-500 whitespace-nowrap">{k}</th>))}</tr></thead>
                  <tbody>
                    {financials[financialType].map((row:any,i:number)=>(
                      <tr key={i}>{Object.values(row).map((v:any,ii:number)=>(<td key={ii} className="px-2 py-1 whitespace-nowrap">{v}</td>))}</tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : <div className="text-gray-400">No Data</div>}
          </div>
          {/* Analyst Recommendations 区块，格式美化 */}
          <div className="bg-white rounded-xl shadow p-4">
            <div className="font-bold mb-2">Analyst Recommendations</div>
            {analystRec && analystRec.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm text-center">
                  <thead className="bg-gray-50">
                    <tr>
                      {Object.keys(analystRec[0]||{}).map(k=>(<th key={k} className="px-3 py-2 text-gray-600 font-semibold">{k.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}</th>))}
                    </tr>
                  </thead>
                  <tbody>
                    {analystRec.map((row:any,i:number)=>(
                      <tr key={i} className={i%2===0?"bg-white":"bg-gray-50"}>
                        {Object.values(row).map((v:any,ii:number)=>(<td key={ii} className="px-3 py-2 whitespace-nowrap">{v}</td>))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : <div className="text-gray-400">No Data</div>}
          </div>
        </div>
      )}
      {loading && <div className="text-blue-500 mt-8">Loading...</div>}
    </div>
  );
};

export default CompanyInfo; 