import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { recommendStocks } from "../ai/services/stockRecommender";
import { finmemBuyDecision } from "../ai/services/finmemAgent";

// Example FMP stock profile API
async function fetchFmpStockProfile(symbol: string) {
  const apiKey = import.meta.env.VITE_FMP_API_KEY;
  const res = await fetch(
    `https://financialmodelingprep.com/api/v3/profile/${symbol}?apikey=${apiKey}`
  );
  const data = await res.json();
  return data[0] || { symbol };
}

const mockUserProfile = {
  age: 30,
  ai_needs: ["Stock picking", "Risk analysis"],
  annual_income: "$100,000-$200,000",
  available_fund: "$100,000-$500,000",
  investing_years: "3-5 years",
  investment_goals: ["Wealth Building"],
  investment_knowledge: "Intermediate",
  investment_strategies: ["Long-term holding"],
  monthly_expenses: 5000,
  risk_tolerance: "Moderate"
};
const mockInvestments = [
  { stockCode: "AAPL", stockName: "Apple Inc.", quantity: 10, purchasePrice: 150, currentPrice: 170 },
  { stockCode: "MSFT", stockName: "Microsoft Corp.", quantity: 5, purchasePrice: 300, currentPrice: 320 }
];
const mockFmpData = {};

const AIStockPickerPage = () => {
  const [loading, setLoading] = useState(false);
  const [stockList, setStockList] = useState<string[]>([]);
  const [stockDetails, setStockDetails] = useState<any[]>([]);
  const [error, setError] = useState<string>("");

  // For search and AI decision
  const [characterType, setCharacterType] = useState("balanced");
  const [searchInput, setSearchInput] = useState("");
  const [searchedStock, setSearchedStock] = useState<any | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [searchDecision, setSearchDecision] = useState<{decision: string, reason: string, loading: boolean} | null>(null);

  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError("");
      try {
        const recommended = await recommendStocks({
          investments: mockInvestments,
          survey: mockUserProfile,
          fmpData: mockFmpData,
        });
        setStockList(recommended.slice(0, 10));
        const details = await Promise.all(
          recommended.slice(0, 10).map(symbol => fetchFmpStockProfile(symbol))
        );
        setStockDetails(details);
      } catch (e: any) {
        setError(e.message || "Error fetching data");
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  // Fetch suggestions from FMP symbol search API
  const fetchSuggestions = async (query: string) => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }
    try {
      const apiKey = import.meta.env.VITE_FMP_API_KEY;
      const res = await fetch(`https://financialmodelingprep.com/api/v3/search?query=${encodeURIComponent(query)}&limit=8&exchange=NASDAQ,NYSE,AMEX&apikey=${apiKey}`);
      const data = await res.json();
      setSuggestions(data || []);
    } catch {
      setSuggestions([]);
    }
  };

  // Search stock handler
  const handleSearch = async () => {
    setSearchLoading(true);
    setSearchError("");
    setSearchedStock(null);
    setSearchDecision(null);
    try {
      const stock = await fetchFmpStockProfile(searchInput.trim().toUpperCase());
      if (!stock || !stock.symbol) throw new Error("Stock not found");
      setSearchedStock(stock);
    } catch (e: any) {
      setSearchError(e.message || "Stock not found");
    }
    setSearchLoading(false);
  };

  // Buy decision for searched stock
  const handleSearchBuyDecision = async () => {
    if (!searchedStock) return;
    setSearchDecision({ decision: '', reason: '', loading: true });
    const result = await finmemBuyDecision({
      userProfile: mockUserProfile,
      investments: mockInvestments,
      fmpData: searchedStock,
      stock: searchedStock.symbol,
      characterType
    });
    setSearchDecision({ ...result, loading: false });
  };

  return (
    <div className="p-8 space-y-8">
      <h1 className="text-3xl font-bold mb-4">AI Stock Picker</h1>
      {/* Top 10 Recommended Stocks Card */}
      <div className="bg-white rounded shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Top 10 Recommended Stocks</h2>
        {loading && <div>Loading...</div>}
        {error && <div className="text-red-500">{error}</div>}
        {!loading && !error && stockDetails.length > 0 && (
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-700">
                <th className="px-2 py-2 text-left">LOGO</th>
                <th className="px-2 py-2 text-left">Symbol</th>
                <th className="px-2 py-2 text-left">Name</th>
                <th className="px-2 py-2 text-left">Price</th>
                <th className="px-2 py-2 text-left">Change (%)</th>
                <th className="px-2 py-2 text-left">Industry</th>
                <th className="px-2 py-2 text-left">Market Cap</th>
                <th className="px-2 py-2 text-left">52W High</th>
                <th className="px-2 py-2 text-left">52W Low</th>
                <th className="px-2 py-2 text-left">Volume</th>
              </tr>
            </thead>
            <tbody>
              {stockDetails.map(stock => (
                <tr key={stock.symbol} className="border-b">
                  <td className="px-2 py-2">
                    <img src={stock.image} alt={stock.symbol} style={{ width: 28, height: 28, borderRadius: 4 }} />
                  </td>
                  <td className="px-2 py-2 font-bold">{stock.symbol}</td>
                  <td className="px-2 py-2">{stock.companyName}</td>
                  <td className="px-2 py-2">${stock.price}</td>
                  <td className="px-2 py-2" style={{ color: Number((stock.changesPercentage || '').replace(/[^\d.-]/g, '')) > 0 ? '#16a34a' : '#dc2626', fontWeight: 600 }}>
                    {stock.changesPercentage ? `${Number((stock.changesPercentage || '').replace(/[^\d.-]/g, '')).toFixed(2)}%` : '-'}
                  </td>
                  <td className="px-2 py-2">{stock.industry}</td>
                  <td className="px-2 py-2">${Number(stock.mktCap).toLocaleString()}</td>
                  <td className="px-2 py-2">{stock['52WeekHigh'] ? Number((stock['52WeekHigh'] || '').replace(/[^\d.]/g, '')).toLocaleString() : '-'}</td>
                  <td className="px-2 py-2">{stock['52WeekLow'] ? Number((stock['52WeekLow'] || '').replace(/[^\d.]/g, '')).toLocaleString() : '-'}</td>
                  <td className="px-2 py-2">{Number(stock.volAvg || stock.volume).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* AI Trades Decision Card */}
      <div className="bg-white rounded shadow p-6">
        <h2 className="text-xl font-semibold mb-4">AI Trades Decision</h2>
        <div className="mb-4 flex items-center gap-4">
          <label className="font-medium">Advisor Character:</label>
          <select value={characterType} onChange={e => setCharacterType(e.target.value)} className="border rounded px-2 py-1">
            <option value="aggressive">Aggressive</option>
            <option value="conservative">Conservative</option>
            <option value="balanced">Balanced</option>
          </select>
        </div>
        <div className="mb-4 flex gap-2 relative">
          <input
            type="text"
            className="border rounded px-2 py-1 flex-1"
            placeholder="Search stock symbol or name (e.g. AAPL)"
            value={searchInput}
            onChange={e => {
              setSearchInput(e.target.value);
              fetchSuggestions(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => { if (searchInput) setShowSuggestions(true); }}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 100)}
            onKeyDown={e => { if (e.key === 'Enter') handleSearch(); }}
          />
          <button
            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center justify-center"
            onClick={handleSearch}
            disabled={searchLoading || !searchInput.trim()}
            style={{ minWidth: 40 }}
          >
            {/* Magnifier icon (SVG) */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-6 h-6"
              onClick={e => {
                e.stopPropagation();
                if (searchInput.trim()) {
                  handleSearch();
                }
              }}
              style={{ cursor: searchInput.trim() ? 'pointer' : 'not-allowed' }}
            >
              <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
              <line x1="16.5" y1="16.5" x2="21" y2="21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
          {showSuggestions && suggestions.length > 0 && (
            <ul className="absolute left-0 top-full z-10 w-full bg-white border rounded shadow text-sm max-h-56 overflow-y-auto">
              {suggestions.map(s => (
                <li
                  key={s.symbol}
                  className="px-3 py-2 hover:bg-blue-50 cursor-pointer"
                  onMouseDown={() => {
                    setSearchInput(s.symbol);
                    setShowSuggestions(false);
                  }}
                >
                  <span className="font-bold">{s.symbol}</span> <span className="text-gray-500">{s.name}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="text-gray-400 text-xs mb-2">
          Please enter a stock symbol (e.g. AAPL, MSFT) and click Search.
        </div>
        {searchError && <div className="text-red-500 mb-2">{searchError}</div>}
        {searchedStock && (
          <div className="border rounded p-4 mb-2 bg-gray-50">
            <div className="flex items-center gap-4 mb-2">
              <img src={searchedStock.image} alt={searchedStock.symbol} style={{ width: 32, height: 32, borderRadius: 4 }} />
              <div>
                <div className="font-bold text-lg">{searchedStock.symbol} - {searchedStock.companyName}</div>
                <div className="text-gray-600 text-sm">{searchedStock.industry}</div>
              </div>
            </div>
            <div className="flex gap-8 text-sm mb-2">
              <div>Price: <b>${searchedStock.price}</b></div>
              <div>Change: <b>{searchedStock.changesPercentage ? `${Number((searchedStock.changesPercentage || '').replace(/[^\d.-]/g, '')).toFixed(2)}%` : '-'}</b></div>
              <div>Market Cap: <b>${Number(searchedStock.mktCap).toLocaleString()}</b></div>
              <div>52W High: <b>{searchedStock['52WeekHigh'] ? Number((searchedStock['52WeekHigh'] || '').replace(/[^\d.]/g, '')).toLocaleString() : '-'}</b></div>
              <div>52W Low: <b>{searchedStock['52WeekLow'] ? Number((searchedStock['52WeekLow'] || '').replace(/[^\d.]/g, '')).toLocaleString() : '-'}</b></div>
              <div>Volume: <b>{Number(searchedStock.volAvg || searchedStock.volume).toLocaleString()}</b></div>
              <div className="flex-1 flex justify-end items-center">
                <button
                  className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                  onClick={handleSearchBuyDecision}
                  disabled={searchDecision?.loading}
                >
                  {searchDecision?.loading ? 'Thinking...' : 'AI Decision'}
                </button>
              </div>
            </div>
            {searchDecision && !searchDecision.loading && (
              <div className="mt-2 text-xs">
                <b>Decision:</b> {searchDecision.decision}<br />
                <b>Reason:</b> {searchDecision.reason}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AIStockPickerPage; 