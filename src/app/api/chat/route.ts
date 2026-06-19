import { ToolLoopAgent, createAgentUIStreamResponse } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { upsertChatMessage } from "@/db/queries";
import {
  salesSummaryTool,
  topProductsTool,
  lowStockTool,
  salesComparisonTool,
  categoryBreakdownTool,
  saleDetailTool,
  searchProductsTool,
  categoriesTool,
  inventorySummaryTool,
  allProductsTool,
  proposeRestockOrderTool,
  confirmRestockOrderTool,
  recentOrdersTool,
} from "@/lib/ai-tools";

const provider = createOpenAI({
  baseURL: process.env.AI_BASE_URL ?? "https://api.groq.com/openai/v1",
  apiKey: process.env.AI_API_KEY ?? process.env.GROQ_API_KEY ?? "",
});

const agent = new ToolLoopAgent({
  model: provider.chat(process.env.AI_MODEL ?? "llama-3.3-70b-versatile"),
  tools: {
    get_sales_summary: salesSummaryTool,
    get_top_products: topProductsTool,
    get_low_stock_products: lowStockTool,
    get_sales_comparison: salesComparisonTool,
    get_category_breakdown: categoryBreakdownTool,
    get_sale_detail: saleDetailTool,
    search_products: searchProductsTool,
    get_categories: categoriesTool,
    get_inventory_summary: inventorySummaryTool,
    get_all_products: allProductsTool,
    propose_restock_order: proposeRestockOrderTool,
    confirm_restock_order: confirmRestockOrderTool,
    get_recent_orders: recentOrdersTool,
  },
  allowSystemInMessages: true,
   instructions: `You are an AI inventory and sales analytics assistant with access to a live database of products and sales.

You MUST use the provided tools to answer questions. NEVER describe what you would do — actually call the tools and use the results.

Rules:
- Always call a tool when the user asks about data. NEVER just say "I would call X tool".
- Current year is 2026. Our data covers January to June 2026.
- Always prefer real data over assumptions.
- Be concise, insightful, and data-driven in your responses.
- When the data has labels and values, you can present it as markdown.

RESTOCK ORDER FLOW - You MUST follow these steps ONE AT A TIME. NEVER call propose_restock_order and confirm_restock_order in the same response.

Step 1: Call get_low_stock_products to find low stock items.
Step 2: Call propose_restock_order for each item you want to restock.
Step 3: STOP and present the proposal to the user. Ask them to type "confirm" to proceed or "cancel" to discard. DO NOT proceed further.
Step 4: Wait for the user's reply. Only if they say "confirm" or "yes", call confirm_restock_order.
Step 5: If the user says "cancel" or "no", do NOT call any tool.`,
});

export async function POST(req: Request) {
  const { messages, chatId } = await req.json();

  return createAgentUIStreamResponse({
    agent,
    uiMessages: messages,
    originalMessages: messages,
    onFinish: async ({ messages: allMessages }) => {
      if (!chatId) return;
      for (const msg of allMessages) {
        if (msg.parts?.length) {
          upsertChatMessage(Number(chatId), msg.id, msg.role, JSON.stringify(msg.parts));
        }
      }
    },
  });
}
