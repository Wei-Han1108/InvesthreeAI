import { ChatOpenAI } from '@langchain/openai'
import { HumanMessage, SystemMessage } from '@langchain/core/messages'

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY

const chatModel = new ChatOpenAI({
  openAIApiKey: OPENAI_API_KEY,
  temperature: 0.7,
  modelName: 'gpt-4o-mini'
})

export const aiService = {
  async askQuestion(question: string): Promise<string> {
    try {
      const response = await chatModel.call([
        new SystemMessage('你是一个专业的投资顾问，可以帮助用户解答关于股票投资的问题。'),
        new HumanMessage(question)
      ])

      return response.content.toString()
    } catch (error) {
      console.error('Error asking AI:', error)
      throw error
    }
  }
} 