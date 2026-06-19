import { ToolLoopAgent, createAgentUIStreamResponse } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import {
  salesSummaryTool,
  topProductsTool,
  lowStockTool,
  salesComparisonTool,
  categoryBreakdownTool,
} from "@/lib/ai-tools";

const groq = createOpenAI({
  baseURL: "https://api.groq.com/openai/v1",
  apiKey: process.env.GROQ_API_KEY ?? "",
});

const agent = new ToolLoopAgent({
  model: groq.chat("llama-3.3-70b-versatile"),
  tools: {
    get_sales_summary: salesSummaryTool,
    get_top_products: topProductsTool,
    get_low_stock_products: lowStockTool,
    get_sales_comparison: salesComparisonTool,
    get_category_breakdown: categoryBreakdownTool,
  },
  allowSystemInMessages: true,
  instructions: `You are an AI inventory and sales analytics assistant with access to a live database of products and sales.

You MUST use the provided tools to answer questions. NEVER describe what you would do — actually call the tools and use the results.

Rules:
- Always call a tool when the user asks about data. NEVER just say "I would call X tool".
- Current year is 2026. Our data covers January to June 2026.
- Always prefer real data over assumptions.
- Be concise, insightful, and data-driven in your responses.
- When the data has labels and values, you can present it as markdown.`,
});

export async function POST(req: Request) {
  const { messages } = await req.json();

  return createAgentUIStreamResponse({
    agent,
    uiMessages: messages,
  });
}
