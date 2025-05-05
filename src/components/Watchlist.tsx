import { useEffect, useMemo, useState } from 'react'
import useWatchlistStore from '../store/watchlistStore'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
} from 'chart.js'
import 'chartjs-adapter-date-fns'
import { stockSearchService } from '../services/stockSearchService'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
)

const Watchlist = () => {
  const { watchlist, removeFromWatchlist, updateStockPrices } = useWatchlistStore()
  const [historicalData, setHistoricalData] = useState<Record<string, any[]>>({})

  useEffect(() => {
    // 初始加载数据
    updateStockPrices()
    
    // 每60秒更新一次价格
    const interval = setInterval(updateStockPrices, 60000)
    return () => clearInterval(interval)
  }, [])

  // 为每个股票获取历史数据
  useEffect(() => {
    const fetchHistoricalData = async () => {
      const newData: Record<string, any[]> = {}
      for (const stock of watchlist) {
        if (!historicalData[stock.symbol]) {
          const data = await stockSearchService.getHistoricalData(stock.symbol)
          newData[stock.symbol] = data
        }
      }
      if (Object.keys(newData).length > 0) {
        setHistoricalData(prev => ({ ...prev, ...newData }))
      }
    }

    fetchHistoricalData()
  }, [watchlist])

  const getChartData = (symbol: string) => {
    const data = historicalData[symbol] || []
    
    return {
      labels: data.map(item => new Date(item.date)),
      datasets: [
        {
          label: 'Price',
          data: data.map(item => item.close),
          borderColor: 'rgb(75, 192, 192)',
          tension: 0.1,
          pointRadius: 0
        }
      ]
    }
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        type: 'time' as const,
        time: {
          unit: 'hour' as const,
          displayFormats: {
            hour: 'HH:mm'
          }
        },
        title: {
          display: true,
          text: 'Time'
        }
      },
      y: {
        title: {
          display: true,
          text: 'Price'
        }
      }
    },
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const data = historicalData[context.dataset.label]
            if (data && data[context.dataIndex]) {
              const item = data[context.dataIndex]
              return [
                `Open: ${item.open}`,
                `High: ${item.high}`,
                `Low: ${item.low}`,
                `Close: ${item.close}`,
                `Volume: ${item.volume}`
              ]
            }
            return context.parsed.y
          }
        }
      }
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">股票观察列表</h2>
      </div>

      <div className="space-y-4">
        {watchlist.map((stock) => (
          <div key={stock.symbol} className="border rounded p-4">
            <div className="flex justify-between items-center mb-2">
              <div>
                <h3 className="font-semibold">{stock.name}</h3>
                <p className="text-gray-500">{stock.symbol}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold">${stock.price.toFixed(2)}</p>
                <p className={stock.change >= 0 ? 'text-green-600' : 'text-red-600'}>
                  {stock.change >= 0 ? '+' : ''}{stock.change.toFixed(2)} ({stock.changePercent.toFixed(2)}%)
                </p>
              </div>
              <button
                onClick={() => removeFromWatchlist(stock.symbol)}
                className="text-red-500 hover:text-red-700"
              >
                删除
              </button>
            </div>
            <div className="h-40">
              <Line data={getChartData(stock.symbol)} options={chartOptions} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Watchlist 