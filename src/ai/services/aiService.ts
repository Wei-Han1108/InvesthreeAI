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
  async askQuestion(question: string, investments: Investment[], watchlist: WatchlistItem[]): Promise<string> {
    try {
      // 构建投资组合信息
      const portfolioInfo = investments.length > 0 
        ? `当前投资组合：
${investments.map(inv => 
  `- ${inv.stockName} (${inv.stockCode}): ${inv.quantity}股，购买价 $${inv.purchasePrice}，当前价 $${inv.currentPrice}，购买日期 ${new Date(inv.purchaseDate).toLocaleDateString()}`).join('\n')}`
        : '当前没有投资任何股票。'

      // 构建观察列表信息
      const watchlistInfo = watchlist.length > 0
        ? `当前观察列表：
${watchlist.map(stock => 
  `- ${stock.name} (${stock.symbol}): 当前价格 $${stock.price}，涨跌幅 ${stock.changePercent}%`).join('\n')}`
        : '当前观察列表为空。'

      const systemPrompt = `你是一个专业的投资顾问，具有丰富的股票市场分析经验。在回答问题时，请注意以下几点：

1. 投资组合分析：
${portfolioInfo}

2. 观察列表分析：
${watchlistInfo}

3. 回答要求：
- 根据用户的投资组合和观察列表提供个性化的建议
- 考虑市场风险，提供风险提示
- 分析投资组合的分散度，必要时提供优化建议
- 对观察列表中的股票提供买入时机建议
- 使用专业但易懂的语言
- 回答要简洁明了，突出重点
- 必要时提供具体的操作建议

4. 注意事项：
- 不要给出具体的投资金额建议
- 强调投资有风险，入市需谨慎
- 建议用户进行充分的研究和风险评估
- 提醒用户关注市场动态和公司基本面
- 建议用户定期检查和调整投资组合

请基于以上信息，为用户提供专业的投资建议。`

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