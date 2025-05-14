import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { z } from "zod";

// 校验返回格式
const StockListSchema = z.array(z.string());

// 组装prompt
function buildPrompt({ investments, survey, fmpData }: {
  investments: Array<{ stockCode: string; stockName: string; quantity: number; purchasePrice: number; currentPrice: number; }>;
  survey: {
    age: number;
    ai_needs: string[];
    annual_income: string;
    available_fund: string;
    investing_years: string;
    investment_goals: string[];
    investment_knowledge: string;
    investment_strategies: string[];
    monthly_expenses: number;
    risk_tolerance: string;
  };
  fmpData: {
    trendingStocks?: Array<{ symbol: string; name: string; }>;
    sectorPerformance?: Array<{ sector: string; changePercent: number; }>;
    topGainers?: Array<{ symbol: string; name: string; changePercent: number; }>;
    topLosers?: Array<{ symbol: string; name: string; changePercent: number; }>;
    [key: string]: any;
  };
}) {
  return `
You are a professional investment advisor.

User Profile:
- Age: ${survey.age}
- Annual Income: ${survey.annual_income}
- Available Fund: ${survey.available_fund}
- Investing Years: ${survey.investing_years}
- Investment Knowledge: ${survey.investment_knowledge}
- Investment Goals: ${survey.investment_goals.join(', ')}
- Investment Strategies: ${survey.investment_strategies.join(', ')}
- Monthly Expenses: ${survey.monthly_expenses}
- Risk Tolerance: ${survey.risk_tolerance}
- AI Needs: ${survey.ai_needs.join(', ')}

Current Holdings:
${investments.map(i => `- ${i.stockName} (${i.stockCode}), Qty: ${i.quantity}, Buy: ${i.purchasePrice}, Now: ${i.currentPrice}`).join('\n')}

Market Data (FMP):
${fmpData.trendingStocks ? `Trending Stocks: ${fmpData.trendingStocks.map(s => `${s.name} (${s.symbol})`).join(', ')}` : ''}
${fmpData.sectorPerformance ? `\nSector Performance:\n${fmpData.sectorPerformance.map(s => `- ${s.sector}: ${s.changePercent > 0 ? '+' : ''}${s.changePercent}%`).join('\n')}` : ''}
${fmpData.topGainers ? `\nTop Gainers:\n${fmpData.topGainers.map(s => `- ${s.name} (${s.symbol}): ${s.changePercent > 0 ? '+' : ''}${s.changePercent}%`).join('\n')}` : ''}
${fmpData.topLosers ? `\nTop Losers:\n${fmpData.topLosers.map(s => `- ${s.name} (${s.symbol}): ${s.changePercent > 0 ? '+' : ''}${s.changePercent}%`).join('\n')}` : ''}

Based on the user's profile, current holdings, and the above market data, recommend 10 stocks for the user to consider next. Only return a JSON array of stock symbols,
e.g. ["AAPL", "MSFT", ...]. Do not include any explanation or extra text.`;
}

export async function recommendStocks({
  investments,
  survey,
  fmpData
}: {
  investments: Array<{ stockCode: string; stockName: string; quantity: number; purchasePrice: number; currentPrice: number; }>;
  survey: {
    age: number;
    ai_needs: string[];
    annual_income: string;
    available_fund: string;
    investing_years: string;
    investment_goals: string[];
    investment_knowledge: string;
    investment_strategies: string[];
    monthly_expenses: number;
    risk_tolerance: string;
  };
  fmpData: {
    trendingStocks?: Array<{ symbol: string; name: string; }>;
    sectorPerformance?: Array<{ sector: string; changePercent: number; }>;
    topGainers?: Array<{ symbol: string; name: string; changePercent: number; }>;
    topLosers?: Array<{ symbol: string; name: string; changePercent: number; }>;
    [key: string]: any;
  };
}): Promise<string[]> {
  const prompt = buildPrompt({ investments, survey, fmpData });

  // 适配Vite前端环境
  // 你需要在.env文件中配置VITE_OPENAI_API_KEY=sk-xxxxxx
  const openAIApiKey = import.meta.env.VITE_OPENAI_API_KEY;
  if (!openAIApiKey) throw new Error("VITE_OPENAI_API_KEY is not set in environment variables");

  const model = new ChatOpenAI({
    openAIApiKey,
    modelName: "gpt-4o",
    temperature: 0.7,
  });

  const result = await model.call([
    { role: "system", content: "You are a helpful AI investment assistant." },
    { role: "user", content: prompt },
  ]);

  // 只提取JSON部分
  const contentStr = String(result.content);
  const match = contentStr.match(/\[.*\]/s);
  if (!match) throw new Error("No JSON array found in LLM response");
  const stockList = JSON.parse(match[0]);
  StockListSchema.parse(stockList); // 校验
  return stockList;
} 