import { useEffect, useState } from 'react'
import { investmentService } from '../services/investmentService'

interface UserRanking {
  userId: string
  username: string
  profitLossPercentage: number
  totalInvestment: number
  currentValue: number
}

const Ranking = () => {
  const [rankings, setRankings] = useState<UserRanking[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchRankings = async () => {
      try {
        const allInvestments = await investmentService.getAllUsersInvestments()

        // 按用户分组
        const userInvestments = allInvestments.reduce((acc: { [key: string]: any[] }, investment) => {
          if (!acc[investment.userId]) {
            acc[investment.userId] = []
          }
          acc[investment.userId].push(investment)
          return acc
        }, {})

        // 计算每个用户的性能
        const userRankings = Object.entries(userInvestments).map(([userId, investments]) => {
          const performance = investmentService.calculateUserPerformance(investments)
          return {
            userId,
            username: investments[0].username || '匿名用户',
            ...performance,
          }
        })

        // 按盈利率排序
        userRankings.sort((a, b) => b.profitLossPercentage - a.profitLossPercentage)
        setRankings(userRankings)
      } catch (error) {
        console.error('获取排行榜数据失败:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchRankings()
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">用户投资排行榜</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  排名
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  用户名
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  总投资
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  当前价值
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  盈利率
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {rankings.map((ranking, index) => (
                <tr key={ranking.userId}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-lg font-bold">{index + 1}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{ranking.username}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    ¥{ranking.totalInvestment.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    ¥{ranking.currentValue.toLocaleString()}
                  </td>
                  <td
                    className={`px-6 py-4 whitespace-nowrap ${
                      ranking.profitLossPercentage >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {ranking.profitLossPercentage.toFixed(2)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default Ranking 