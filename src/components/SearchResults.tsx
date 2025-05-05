import { SearchResult } from '../services/stockSearchService'
import useWatchlistStore from '../store/watchlistStore'

interface SearchResultsProps {
  results: SearchResult[]
  onClose: () => void
}

const SearchResults = ({ results, onClose }: SearchResultsProps) => {
  const { addToWatchlist } = useWatchlistStore()

  const handleAddToWatchlist = async (symbol: string, name: string) => {
    await addToWatchlist(symbol, name)
    onClose()
  }

  if (results.length === 0) return null

  return (
    <div className="absolute z-10 w-full mt-2 bg-white rounded-lg shadow-lg border border-gray-200">
      <div className="p-2">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-sm font-medium text-gray-700">搜索结果</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            ×
          </button>
        </div>
        <div className="space-y-1">
          {results.map((result) => (
            <div
              key={result.symbol}
              className="flex justify-between items-center p-2 hover:bg-gray-50 rounded cursor-pointer"
              onClick={() => handleAddToWatchlist(result.symbol, result.name)}
            >
              <div>
                <p className="font-medium">{result.symbol}</p>
                <p className="text-sm text-gray-500">{result.name}</p>
              </div>
              <div className="text-sm text-gray-500">
                {result.exchangeShortName}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default SearchResults 