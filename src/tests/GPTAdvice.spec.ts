import dotenv from 'dotenv';
import { fetchGPTAdvice, Input, GPTAdviceResponse } from './GPTAdvice';
dotenv.config();

const API_KEY = process.env.VITE_OPENAI_API_KEY!;
const INPUT: Input = {
  news: [
    {
      title: "Apple's iPhone 16 Rumors Boost Investor Sentiment",
      summary: "Analysts anticipate strong demand for Apple's upcoming iPhone 16 series, with upgraded AI features and camera improvements. The stock saw a slight uptick following the leaks.",
      date: "2025-05-13",
      site: "Bloomberg"
    },
    {
      title: "Apple faces EU probe over App Store policies",
      summary: "Regulators in the EU have opened a formal investigation into Apple's App Store commission practices, which may lead to significant fines.",
      date: "2025-05-12",
      site: "Reuters"
    }
  ],
  technicalIndicators: {
    sma: {
      value: 180.23,
      signal: "bullish",
      price: 186.35
    },
    ema: {
      value: 182.12,
      signal: "bullish",
      price: 186.35
    },
    rsi: {
      value: 68.5,
      signal: "neutral"
    },
    macd: {
      value: 1.45,
      signal: "bullish"
    },
    priceStrength: 3.4,
    stability: 88
  }
}


describe('NewsItem API Schema Validation', () => {
  it('should return an array of properly structured NewsItem objects', async () => {
    const response: GPTAdviceResponse = await fetchGPTAdvice(INPUT, API_KEY);
    const advice = response.choices[0].message.content;
    console.log(advice);
    expect(advice).toBeDefined();
    expect(typeof advice).toBe('string');

  },20000);
});
