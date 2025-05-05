import { useEffect, useState } from 'react'
import { investmentService } from '../services/investmentService'
import { useNavigate } from 'react-router-dom'

interface UserRanking {
  userId: string
  email: string
  profitLossPercentage: number
  totalInvestment: number
  currentValue: number
}

const Ranking = () => {
  const [rankings, setRankings] = useState<UserRanking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

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
          // 从第一个投资记录中获取用户信息
          const userInfo = investments[0]
          return {
            userId,
            email: userInfo?.email || '匿名用户',
            ...performance,
          }
        })

        // 按盈利率排序，只取前10名
        userRankings.sort((a, b) => b.profitLossPercentage - a.profitLossPercentage)
        const topRankings = userRankings.slice(0, 10)
        setRankings(topRankings)
      } catch (error) {
        console.error('获取排行榜数据失败:', error)
        if (error instanceof Error && error.message.includes('ID token not found')) {
          // 如果token不存在，跳转到登录页
          navigate('/login')
        } else {
          setError('获取排行榜数据失败，请稍后重试')
        }
      } finally {
        setLoading(false)
      }
    }

    fetchRankings()
  }, [navigate])

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-red-600">{error}</div>
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
                  邮箱
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
                  <td className="px-6 py-4 whitespace-nowrap">{ranking.email}</td>
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