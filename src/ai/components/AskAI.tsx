import { useState, useRef, useEffect } from 'react'
import { aiService } from '../services/aiService'
import useInvestmentStore from '../../store/investmentStore'
import useWatchlistStore from '../../store/watchlistStore'
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import { useAuth } from '../../contexts/AuthContext'
import { userSurveyService } from '../../services/userSurveyService'
import { useLocation } from 'react-router-dom'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

const AskAI = () => {
  const location = useLocation();
  const [question, setQuestion] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [expandedSection, setExpandedSection] = useState<'portfolio' | 'watchlist' | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  // Get portfolio and watchlist data
  const investments = useInvestmentStore((state) => state.investments)
  const watchlist = useWatchlistStore((state) => state.watchlist)

  // Get deduplicated portfolio
  const uniqueInvestments = investments.reduce((acc, current) => {
    const existingIndex = acc.findIndex(item => item.stockCode === current.stockCode)
    if (existingIndex === -1) {
      // If stock doesn't exist, add it
      acc.push(current)
    } else {
      // If stock exists, compare purchase dates, keep the latest record
      const existing = acc[existingIndex]
      if (new Date(current.purchaseDate) > new Date(existing.purchaseDate)) {
        acc[existingIndex] = current
      }
    }
    return acc
  }, [] as typeof investments)

  // Auto scroll to latest message
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

  useEffect(() => {
    if (location.state && location.state.question) {
      setQuestion(location.state.question);
    }
  }, [location.state]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!question.trim()) return

    // Add user message
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
      
      // Add AI response
      const assistantMessage: Message = {
        role: 'assistant',
        content: response,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      setError('Error getting answer. Please try again later.')
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
      {/* Only Chat Area, sidebar removed */}
      <div className="flex-1 flex flex-col">
        {/* Message List */}
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

        {/* Input Area */}
        <div className="border-t p-4 bg-white">
          {/* Suggested Questions */}
          <div className="mb-4 flex flex-wrap gap-2">
            {messages.length === 0 && (
              <>
                <button
                  onClick={() => setQuestion("What are the best stocks to buy right now?")}
                  className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition-colors"
                >
                  What are the best stocks to buy right now?
                </button>
                <button
                  onClick={() => setQuestion("Should I sell any stocks in my portfolio?")}
                  className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition-colors"
                >
                  Should I sell any stocks in my portfolio?
                </button>
                <button
                  onClick={() => setQuestion("What is the outlook for the tech sector?")}
                  className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition-colors"
                >
                  What is the outlook for the tech sector?
                </button>
                <button
                  onClick={() => setQuestion("How can I reduce risk in my investments?")}
                  className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition-colors"
                >
                  How can I reduce risk in my investments?
                </button>
              </>
            )}
          </div>

          <form onSubmit={handleSubmit} className="flex space-x-4">
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Type your question..."
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
              Send
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