import { format } from 'date-fns'
import useInvestmentStore from '../store/investmentStore'

interface Investment {
  id: string
  stockName: string
  stockCode: string
  purchasePrice: number
  quantity: number
  purchaseDate: string
  currentPrice: number
}

const Portfolio = () => {
  const investments = useInvestmentStore((state) => state.investments)

  const calculateTotalValue = (investment: Investment) => {
    return investment.currentPrice * investment.quantity
  }

  const calculateProfitLoss = (investment: Investment) => {
    const totalValue = calculateTotalValue(investment)
    const totalCost = investment.purchasePrice * investment.quantity
    return totalValue - totalCost
  }

  const calculateProfitLossPercentage = (investment: Investment) => {
    const profitLoss = calculateProfitLoss(investment)
    const totalCost = investment.purchasePrice * investment.quantity
    return (profitLoss / totalCost) * 100
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">投资组合</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  股票名称
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  股票代码
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  购买价格
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  当前价格
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  数量
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  总价值
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  盈亏
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  盈亏%
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {investments.map((investment) => {
                const profitLoss = calculateProfitLoss(investment)
                const profitLossPercentage = calculateProfitLossPercentage(investment)
                const totalValue = calculateTotalValue(investment)

                return (
                  <tr key={investment.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {investment.stockName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {investment.stockCode}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      ¥{investment.purchasePrice}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      ¥{investment.currentPrice}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {investment.quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      ¥{totalValue.toLocaleString()}
                    </td>
                    <td
                      className={`px-6 py-4 whitespace-nowrap ${
                        profitLoss >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      ¥{profitLoss.toLocaleString()}
                    </td>
                    <td
                      className={`px-6 py-4 whitespace-nowrap ${
                        profitLoss >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {profitLossPercentage.toFixed(2)}%
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default Portfolio 