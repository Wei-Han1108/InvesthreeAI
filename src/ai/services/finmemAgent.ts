import { ChatOpenAI } from "@langchain/openai";

export async function finmemBuyDecision({
  userProfile,
  investments,
  fmpData,
  stock,
  characterType
}: {
  userProfile: any;
  investments: any[];
  fmpData: any;
  stock: string;
  characterType: string;
}) {
  const prompt = `
You are an investment advisor with a ${characterType} style.
[Long-term Memory]
User profile: ${JSON.stringify(userProfile)}
[Short-term Memory]
Market data: ${JSON.stringify(fmpData)}
User's current holdings: ${JSON.stringify(investments)}
Target stock: ${stock}
Based on the above information, should the user buy this stock today? Please provide a detailed reason and suggestion. Only return JSON: {"decision": "buy"|"not buy", "reason": "..."}
  `;
  const llm = new ChatOpenAI({ openAIApiKey: import.meta.env.VITE_OPENAI_API_KEY });
  const result = await llm.invoke(prompt);
  // Try to parse JSON
  try {
    const match = String(result.content).match(/\{[\s\S]*\}/);
    if (match) {
      return JSON.parse(match[0]);
    }
  } catch {}
  return { decision: "not buy", reason: "LLM did not return valid JSON" };
} 