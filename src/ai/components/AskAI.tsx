import { useState, useRef, useEffect } from 'react'
import { aiService } from '../services/aiService'
import useInvestmentStore from '../../store/investmentStore'
import useWatchlistStore from '../../store/watchlistStore'
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import { useAuth } from '../../contexts/AuthContext'
import { userSurveyService } from '../../services/userSurveyService'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

const AskAI = () => {
  const [question, setQuestion] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [expandedSection, setExpandedSection] = useState<'portfolio' | 'watchlist' | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  // 获取投资组合和观察列表数据
  const investments = useInvestmentStore((state) => state.investments)
  const watchlist = useWatchlistStore((state) => state.watchlist)

  // 获取去重后的投资组合
  const uniqueInvestments = investments.reduce((acc, current) => {
    const existingIndex = acc.findIndex(item => item.stockCode === current.stockCode)
    if (existingIndex === -1) {
      // 如果股票不存在，添加它
      acc.push(current)
    } else {
      // 如果股票已存在，比较购买日期，保留最新的记录
      const existing = acc[existingIndex]
      if (new Date(current.purchaseDate) > new Date(existing.purchaseDate)) {
        acc[existingIndex] = current
      }
    }
    return acc
  }, [] as typeof investments)

  // 自动滚动到最新消息
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const { user } = useAuth()
  const [survey, setSurvey] = useState<any>(null)

  useEffect(() => {
    if (user?.email) {
      userSurveyService.getUserSurvey(user.email).then(setSurvey)
    }
  }, [user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!question.trim()) return

    // 添加用户消息
    const userMessage: Message = {
      role: 'user',
      content: question,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, userMessage])
    setQuestion('')
    setIsLoading(true)
    setError('')

    try {
      const response = await aiService.askQuestion(question, uniqueInvestments, watchlist, survey)
      
      // 添加AI回复
      const assistantMessage: Message = {
        role: 'assistant',
        content: response,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      setError('获取答案时出错，请稍后重试。')
      console.error('Error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const toggleSection = (section: 'portfolio' | 'watchlist') => {
    setExpandedSection(expandedSection === section ? null : section)
  }

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* 左侧边栏 */}
      <div className="w-64 bg-gray-50 border-r p-4 flex flex-col">
        <h2 className="text-lg font-semibold mb-4">投资信息</h2>
        
        {/* 投资组合部分 */}
        <div className="mb-4">
          <button
            className="w-full flex items-center justify-between p-2 rounded hover:bg-gray-100"
            onClick={() => toggleSection('portfolio')}
          >
            <span className="font-medium">投资组合</span>
            {expandedSection === 'portfolio' ? (
              <ChevronDownIcon className="w-4 h-4" />
            ) : (
              <ChevronRightIcon className="w-4 h-4" />
            )}
          </button>
          
          {expandedSection === 'portfolio' && (
            <div className="mt-2 pl-2 space-y-1">
              {uniqueInvestments.map((inv) => (
                <div
                  key={inv.stockCode}
                  className="p-2 text-sm rounded hover:bg-gray-100"
                >
                  <div className="font-medium">{inv.stockName}</div>
                  <div className="text-gray-600">
                    {inv.quantity}股 @ ${inv.purchasePrice}
                  </div>
                </div>
              ))}
              {uniqueInvestments.length === 0 && (
                <div className="text-sm text-gray-500 p-2">暂无投资</div>
              )}
            </div>
          )}
        </div>

        {/* 观察列表部分 */}
        <div>
          <button
            className="w-full flex items-center justify-between p-2 rounded hover:bg-gray-100"
            onClick={() => toggleSection('watchlist')}
          >
            <span className="font-medium">观察列表</span>
            {expandedSection === 'watchlist' ? (
              <ChevronDownIcon className="w-4 h-4" />
            ) : (
              <ChevronRightIcon className="w-4 h-4" />
            )}
          </button>
          
          {expandedSection === 'watchlist' && (
            <div className="mt-2 pl-2 space-y-1">
              {watchlist.map((stock) => (
                <div
                  key={stock.symbol}
                  className="p-2 text-sm rounded hover:bg-gray-100"
                >
                  <div className="font-medium">{stock.name}</div>
                  <div className="text-gray-600">
                    ${stock.price} ({stock.changePercent > 0 ? '+' : ''}{stock.changePercent}%)
                  </div>
                </div>
              ))}
              {watchlist.length === 0 && (
                <div className="text-sm text-gray-500 p-2">观察列表为空</div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 聊天区域 */}
      <div className="flex-1 flex flex-col">
        {/* 消息列表 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-4 ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <div className="whitespace-pre-wrap">{message.content}</div>
                <div className={`text-xs mt-2 ${message.role === 'user' ? 'text-blue-100' : 'text-gray-500'}`}>
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-lg p-4">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* 输入区域 */}
        <div className="border-t p-4 bg-white">
          {/* 建议问题 */}
          <div className="mb-4 flex flex-wrap gap-2">
            {messages.length === 0 && (
              <>
                <button
                  onClick={() => setQuestion("分析一下我的投资组合表现如何？")}
                  className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition-colors"
                >
                  分析一下我的投资组合表现如何？
                </button>
                <button
                  onClick={() => setQuestion("我的观察列表中有哪些值得关注的机会？")}
                  className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition-colors"
                >
                  我的观察列表中有哪些值得关注的机会？
                </button>
                <button
                  onClick={() => setQuestion("如何优化我的投资组合配置？")}
                  className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition-colors"
                >
                  如何优化我的投资组合配置？
                </button>
                <button
                  onClick={() => setQuestion("最近市场有什么重要变化？")}
                  className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition-colors"
                >
                  最近市场有什么重要变化？
                </button>
              </>
            )}
          </div>

          <form onSubmit={handleSubmit} className="flex space-x-4">
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="输入您的问题..."
              rows={1}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSubmit(e)
                }
              }}
            />
            <button
              type="submit"
              disabled={isLoading || !question.trim()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              发送
            </button>
          </form>
          {error && (
            <div className="mt-2 text-sm text-red-600">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AskAI 