 const prompt_system = `You are a professional financial analyst who excels at extracting key information from news and technical indicators to provide investment advice. Please maintain objectivity and professionalism in your analysis, and include risk warnings.`
 interface GPTAdviceResponse {
  choices: {
    message: {
      role: string;
      content: string;
    };
  }[];
}
 export interface NewsItem {
  title: string;
  summary: string;
  date: string;
  site: string;
}

export interface TechnicalIndicator {
  sma: {
    value: number;
    signal: 'bullish' | 'bearish' | 'neutral';
    price: number;
  };
  ema: {
    value: number;
    signal: 'bullish' | 'bearish' | 'neutral';
    price: number;
  };
  rsi: {
    value: number;
    signal: 'bullish' | 'bearish' | 'neutral';
  };
  macd: {
    value: number;
    signal: 'bullish' | 'bearish' | 'neutral';
  };
  priceStrength: number;
  stability: number;
}

export interface Input {
  news: NewsItem[];
  technicalIndicators: TechnicalIndicator;
}

function formatInput(input: Input): string {
  const newsStr = input.news
    .map(
      (item, i) =>
        `${i + 1}. [${item.date}] ${item.title} (${item.site})\n${item.summary}`
    )
    .join("\n\n");

  const tech = input.technicalIndicators;
  const indicatorsStr = `
Technical Indicators:
- SMA: ${tech.sma.value} (${tech.sma.signal}), price: ${tech.sma.price}
- EMA: ${tech.ema.value} (${tech.ema.signal}), price: ${tech.ema.price}
- RSI: ${tech.rsi.value} (${tech.rsi.signal})
- MACD: ${tech.macd.value} (${tech.macd.signal})
- Price Strength: ${tech.priceStrength}
- Stability: ${tech.stability}
  `.trim();

  return `News:\n${newsStr}\n\n${indicatorsStr}`;
}


 export async function fetchGPTAdvice(input: Input, apiKey: string): Promise<{

  }> {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: prompt_system
          },
          { 
            role: "user",
            content: formatInput(input)
          }
        ],
        max_tokens: 300
      })
    })
    if (!res.ok) throw new Error('Failed to fetch gpt advise');
    return await res.json();
  }


