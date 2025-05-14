import { ChatOpenAI } from '@langchain/openai'
import { HumanMessage, SystemMessage } from '@langchain/core/messages'

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY

const chatModel = new ChatOpenAI({
  openAIApiKey: OPENAI_API_KEY,
  temperature: 0.7,
  modelName: 'gpt-4o-mini'
})

interface Investment {
  stockCode: string
  stockName: string
  quantity: number
  purchasePrice: number
  purchaseDate: string
  currentPrice: number
}

interface WatchlistItem {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
}

export const aiService = {
  async askQuestion(question: string, investments: Investment[], watchlist: WatchlistItem[], survey?: any): Promise<string> {
    try {
      // 构建投资组合信息
      const portfolioInfo = investments.length > 0 
        ? `当前投资组合：\n${investments.map(inv => 
  `- ${inv.stockName} (${inv.stockCode}): ${inv.quantity}股，购买价 $${inv.purchasePrice}，当前价 $${inv.currentPrice}，购买日期 ${new Date(inv.purchaseDate).toLocaleDateString()}`).join('\n')}`
        : '当前没有投资任何股票。'

      // 构建观察列表信息
      const watchlistInfo = watchlist.length > 0
        ? `当前观察列表：\n${watchlist.map(stock => 
  `- ${stock.name} (${stock.symbol}): 当前价格 $${stock.price}，涨跌幅 ${stock.changePercent}%`).join('\n')}`
        : '当前观察列表为空。'

      // 构建问卷信息
      const surveyInfo = survey
        ? `用户问卷信息：\n${Object.entries(survey).map(([k, v]) => `- ${k}: ${v}`).join('\n')}`
        : '用户未填写问卷。'

      const systemPrompt = `You are a professional investment advisor with extensive experience in stock market analysis. When answering questions, please note the following points:

1. Portfolio Analysis:
${portfolioInfo}

2. Watchlist Analysis:
${watchlistInfo}

3. User Survey Information:
${surveyInfo}

4. Response Requirements:
- Provide personalized advice based on the user's portfolio, watchlist, and survey information
- Consider market risks and provide risk warnings
- Analyze portfolio diversification and provide optimization suggestions when necessary
- Provide buying timing suggestions for stocks in the watchlist
- Use professional but understandable language
- Keep answers concise and focused on key points
- Provide specific operational suggestions when necessary

5. Important Notes:
- Do not provide specific investment amount recommendations
- Emphasize that investment involves risk and caution is required
- Advise users to conduct thorough research and risk assessment
- Remind users to monitor market dynamics and company fundamentals
- Suggest users regularly review and adjust their investment portfolio

Please provide professional investment advice based on the above information.`

      const response = await chatModel.call([
        new SystemMessage(systemPrompt),
        new HumanMessage(question)
      ])

      return response.content.toString()
    } catch (error) {
      console.error('Error asking AI:', error)
      throw error
    }
  }
} 