import { ChatOpenAI } from "@langchain/openai";
import axios from "axios";

export type PredictionDay = {
  date: string;
  predicted_close: number;
  reason: string;
};

export type HistoricalDay = {
  date: string;
  close: number;
};

export type ModelPrediction = {
  model: string;
  result: PredictionDay[];
};

export type PredictionResponse = {
  symbol: string;
  historical: HistoricalDay[];
  predictions: ModelPrediction[];
};

export interface PredictParams {
  symbol: string;
  days: number;
}

const FMP_API_KEY = import.meta.env.VITE_FMP_API_KEY;
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

const FMP_BASE = "https://financialmodelingprep.com/api/v3";

async function getFmpData(symbol: string) {
  const endpoints = {
    historical: `${FMP_BASE}/historical-price-full/${symbol}?apikey=${FMP_API_KEY}`,
    profile: `${FMP_BASE}/profile/${symbol}?apikey=${FMP_API_KEY}`,
    news: `${FMP_BASE}/stock_news?tickers=${symbol}&limit=10&apikey=${FMP_API_KEY}`,
    financials: `${FMP_BASE}/income-statement/${symbol}?limit=5&apikey=${FMP_API_KEY}`,
  };
  const data: Record<string, any> = {};
  for (const [k, url] of Object.entries(endpoints)) {
    try {
      const resp = await axios.get(url, { timeout: 10000 });
      data[k] = resp.data;
    } catch (e) {
      data[k] = [];
    }
  }
  return data;
}

function buildPrompt(symbol: string, fmpData: any, days: number) {
  const hist = fmpData.historical?.historical?.slice(0, 30) || [];
  const profile = fmpData.profile?.[0] || {};
  const news = (fmpData.news || []).slice(0, 3);
  const financials = fmpData.financials || [];
  return `
You are an expert financial analyst. Based on the following data for ${symbol}, predict the closing price for each of the next ${days} trading days.
Return your answer as a JSON array of objects, each with 'date' (in YYYY-MM-DD format), 'predicted_close', and a brief 'reason' (1 sentence).

[Company Profile]
${JSON.stringify(profile)}

[Historical Prices (last 30 days)]
${JSON.stringify(hist)}

[Recent News]
${JSON.stringify(news)}

[Financial Data]
${JSON.stringify(financials)}

Example output:
[
  {"date": "2024-03-20", "predicted_close": 123.45, "reason": "..."},
  {"date": "2024-03-21", "predicted_close": 124.10, "reason": "..."},
  ...
]
`;
}

function parseModelResult(raw: string): PredictionDay[] {
  try {
    const clean = raw.replace(/```json|```/g, "").trim();
    return JSON.parse(clean);
  } catch {
    return [];
  }
}

async function callGPT(prompt: string, model: string): Promise<string> {
  const llm = new ChatOpenAI({
    model: model,
    openAIApiKey: OPENAI_API_KEY,
    temperature: 0.7,
  });
  const res = await llm.invoke(prompt);
  return typeof res.content === "string" ? res.content : JSON.stringify(res.content);
}

// --- MAIN SERVICE ---

export async function predictStockMultiAgent(params: PredictParams): Promise<PredictionResponse> {
  const { symbol, days } = params;
  const fmpData = await getFmpData(symbol);
  const prompt = buildPrompt(symbol, fmpData, days);

  // Get historical data
  const historical = (fmpData.historical?.historical || [])
    .slice(0, 7)
    .map((day: any) => ({
      date: day.date,
      close: day.close
    }))
    .reverse();

  const results: ModelPrediction[] = await Promise.all([
    (async () => {
      try {
        const result = await callGPT(prompt, "gpt-4o-2024-08-06");
        return { model: "GPT-4o", result: parseModelResult(result) };
      } catch (e: any) {
        return { model: "GPT-4o", result: [] };
      }
    })(),
    (async () => {
      try {
        const result = await callGPT(prompt, "gpt-4o-mini-2024-07-18");
        return { model: "GPT-4o-Mini", result: parseModelResult(result) };
      } catch (e: any) {
        return { model: "GPT-4o-Mini", result: [] };
      }
    })(),
    (async () => {
      try {
        const result = await callGPT(prompt, "gpt-4.1-2025-04-14");
        return { model: "GPT-4.1", result: parseModelResult(result) };
      } catch (e: any) {
        return { model: "GPT-4.1", result: [] };
      }
    })(),
    (async () => {
      try {
        const result = await callGPT(prompt, "gpt-4.1-nano-2025-04-14");
        return { model: "GPT-4.1-Nano", result: parseModelResult(result) };
      } catch (e: any) {
        return { model: "GPT-4.1-Nano", result: [] };
      }
    })(),
  ]);

  return {
    symbol,
    historical,
    predictions: results,
  };
} 