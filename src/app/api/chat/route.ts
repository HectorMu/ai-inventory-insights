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
  restockOrderTool,
  recentOrdersTool,
  fulfillOrderTool,
  bulkRestockTool,
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
    restock_order: restockOrderTool,
    get_recent_orders: recentOrdersTool,
    fulfill_order: fulfillOrderTool,
    bulk_restock: bulkRestockTool,
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

MUTATION TOOLS (these require user approval before executing):
- restock_order: Create a restock order for a single product. The system will pause and prompt the user to approve.
- bulk_restock: Create restock orders for multiple products at once. The system will prompt the user to approve.
- fulfill_order: Fulfill a pending order (adds quantity to product stock). The system will prompt the user to approve.

IMPORTANT: When calling restock_order, bulk_restock, or fulfill_order, ALWAYS include the productName and quantity fields in the input so the approval dialog shows readable information. You already know the product name from your search results — pass it along.

When you call a mutation tool, the system automatically pauses and asks the user for confirmation. You do NOT need to stop and ask manually — call the tool directly and the system handles the approval. If the user approves, the tool executes. If they deny, it won't. Proceed naturally from there.

CREATION → FULFILLMENT FLOW:
After restock_order or bulk_restock executes successfully, ALWAYS ask the user: "The order was created. Would you like to fulfill it now? You can also ask me to fulfill it at any later time."
If they say yes, call fulfill_order with the order ID. Fulfillment adds the quantity to product stock and also requires approval — the system handles it automatically.
`,
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
