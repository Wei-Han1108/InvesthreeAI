import React, { useEffect, useState, useRef } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { predictStockMultiAgent, PredictionDay, HistoricalDay } from '../ai/services/predict';
import { stockSearchService, StockSearchResult } from '../services/stockSearchService';

const RANGE_OPTIONS = [
  { label: 'Tomorrow', value: 1 },
  { label: 'Next 7 Days', value: 7 },
  { label: 'Next 22 Days', value: 22 },
];

const DEFAULT_SYMBOL = 'AAPL';

const NextWinningTradesPage = () => {
  const [symbol, setSymbol] = useState(DEFAULT_SYMBOL);
  const [days, setDays] = useState(7);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchResults, setSearchResults] = useState<StockSearchResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const searchTimeout = useRef<NodeJS.Timeout>();
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = async (query: string) => {
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    searchTimeout.current = setTimeout(async () => {
      if (query.length > 0) {
        const results = await stockSearchService.searchStocks(query);
        setSearchResults(results);
        setShowResults(true);
      } else {
        setSearchResults([]);
        setShowResults(false);
      }
    }, 300);
  };

  const handleSelectStock = (result: StockSearchResult) => {
    setSymbol(result.symbol);
    setShowResults(false);
    setSearchResults([]);
  };

  const fetchPredictions = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await predictStockMultiAgent({ symbol, days });
      setData(res);
    } catch (e: any) {
      setError('Failed to get predictions.');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPredictions();
    // eslint-disable-next-line
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPredictions();
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">Next Winning Trades</h1>
      <p className="text-gray-600 mb-2">Follow AI-guided signals to catch the next big swing opportunity.</p>
      <form className="mb-4 flex flex-wrap gap-2 items-center" onSubmit={handleSubmit}>
        <div className="relative" ref={searchRef}>
          <input
            value={symbol}
            onChange={e => {
              const value = e.target.value.toUpperCase();
              setSymbol(value);
              handleSearch(value);
            }}
            className="border px-2 py-1 rounded mr-2 w-48"
            placeholder="Enter stock symbol"
          />
          {showResults && searchResults.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
              {searchResults.map((result) => (
                <div
                  key={result.symbol}
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                  onClick={() => handleSelectStock(result)}
                >
                  <div className="font-medium">{result.symbol}</div>
                  <div className="text-sm text-gray-600">{result.name}</div>
                  <div className="text-xs text-gray-500">{result.exchange}</div>
                </div>
              ))}
            </div>
          )}
        </div>
        <select
          value={days}
          onChange={e => setDays(Number(e.target.value))}
          className="border px-2 py-1 rounded mr-2"
        >
          {RANGE_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <button 
          type="submit" 
          className={`px-4 py-1 rounded ${
            loading 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700'
          } text-white transition-colors`}
          disabled={loading}
        >
          {loading ? 'Predicting...' : 'Predict'}
        </button>
      </form>
      {error && <div className="text-red-500 mb-4">{error}</div>}
      {data && data.predictions && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
          {data.predictions.map((pred: any) => {
            const chartData = [
              ...data.historical.map((h: HistoricalDay) => ({
                date: h.date,
                close: h.close,
                predicted_close: null,
                reason: null
              })),
              ...pred.result.map((p: PredictionDay) => ({
                date: p.date,
                close: null,
                predicted_close: p.predicted_close,
                reason: p.reason
              }))
            ];

            return (
              <div key={pred.model} className="border rounded-lg p-4 bg-white shadow">
                <div className="font-bold text-lg mb-2 text-gray-800">
                  {pred.model}
                </div>
                {pred.result.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height={260}>
                      <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="date" 
                          tickFormatter={formatDate}
                          tick={{ fontSize: 12 }}
                        />
                        <YAxis domain={['auto', 'auto']} />
                        <Tooltip 
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const d = payload[0].payload;
                              return (
                                <div className="bg-white p-2 border rounded shadow text-xs">
                                  <div><b>{formatDate(d.date)}</b></div>
                                  {d.close && (
                                    <div>Historical Close: <b>${d.close.toFixed(2)}</b></div>
                                  )}
                                  {d.predicted_close && (
                                    <div>Predicted Close: <b>${d.predicted_close.toFixed(2)}</b></div>
                                  )}
                                  {d.reason && <div>Reason: {d.reason}</div>}
                                </div>
                              );
                            }
                            return null;
                          }} 
                        />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="close" 
                          stroke="#888888"
                          dot={true} 
                          name="Historical Close" 
                        />
                        <Line 
                          type="monotone" 
                          dataKey="predicted_close" 
                          stroke="#2563eb"
                          dot={true} 
                          name="Predicted Close" 
                        />
                      </LineChart>
                    </ResponsiveContainer>
                    <div className="mt-2 text-xs text-gray-500">
                      <b>Reasons:</b>
                      <ul className="list-disc ml-4">
                        {pred.result.map((d: PredictionDay, idx: number) => (
                          <li key={idx}><b>{formatDate(d.date)}:</b> {d.reason}</li>
                        ))}
                      </ul>
                    </div>
                  </>
                ) : (
                  <div className="text-gray-500">No valid prediction data.</div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default NextWinningTradesPage; 