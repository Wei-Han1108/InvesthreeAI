import { useState } from 'react'
import { aiService } from '../services/aiService'

const AskAI = () => {
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!question.trim()) return

    setIsLoading(true)
    setError('')
    setAnswer('')

    try {
      const response = await aiService.askQuestion(question)
      setAnswer(response)
    } catch (error) {
      setError('获取答案时出错，请稍后重试。')
      console.error('Error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-2xl font-semibold mb-6">AI 投资顾问</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="question" className="block text-sm font-medium text-gray-700 mb-1">
              请输入你的问题
            </label>
            <textarea
              id="question"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="w-full px-3 py-2 border rounded-md min-h-[100px]"
              placeholder="例如：如何选择优质股票？"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? '思考中...' : '提问'}
          </button>
        </form>

        {error && (
          <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-md">
            {error}
          </div>
        )}

        {answer && (
          <div className="mt-6">
            <h3 className="text-lg font-medium mb-2">回答：</h3>
            <div className="p-4 bg-gray-50 rounded-md whitespace-pre-wrap">
              {answer}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AskAI 