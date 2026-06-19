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
  proposeFulfillOrderTool,
  confirmFulfillOrderTool,
  generateChartTool,
  proposeBulkRestockTool,
  confirmBulkRestockTool,
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
    propose_fulfill_order: proposeFulfillOrderTool,
    confirm_fulfill_order: confirmFulfillOrderTool,
    generate_chart: generateChartTool,
    propose_bulk_restock: proposeBulkRestockTool,
    confirm_bulk_restock: confirmBulkRestockTool,
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

RESTOCK ORDER FLOW - You MUST follow these steps ONE AT A TIME. NEVER call propose and confirm tools in the same response.

For restocking a single product, use propose_restock_order then confirm_restock_order.
For restocking MULTIPLE products at once (e.g., "restock 10 for each in electronics"), use propose_bulk_restock then confirm_bulk_restock instead of making multiple individual calls.

Step 1: Call get_low_stock_products to find low stock items.
Step 2: If restocking multiple items, call propose_bulk_restock with all items at once. If restocking a single item, call propose_restock_order.
Step 3: STOP and present the proposal to the user. Ask them to type "confirm" to proceed or "cancel" to discard. DO NOT proceed further.
Step 4: Wait for the user's reply. Only if they say "confirm" or "yes", call confirm_bulk_restock or confirm_restock_order (matching the propose tool used).
Step 5: If the user says "cancel" or "no", do NOT call any tool.

FULFILL ORDER FLOW - You MUST follow these steps ONE AT A TIME. NEVER call propose_fulfill_order and confirm_fulfill_order in the same response.

Step 1: Call get_recent_orders to see pending or ordered orders.
Step 2: Call propose_fulfill_order for each order you want to fulfill.
Step 3: STOP and present the proposal to the user. Tell them that fulfilling will add the quantity to product stock. Ask them to type "confirm" to proceed or "cancel" to discard. DO NOT proceed further.
Step 4: Wait for the user's reply. Only if they say "confirm" or "yes", call confirm_fulfill_order.
Step 5: If the user says "cancel" or "no", do NOT call any tool.

CHART FLOW - Use the generate_chart tool when the user explicitly asks for a chart, graph, visualization, or visual comparison.

- First call the appropriate data tool (e.g., get_category_breakdown, get_top_products, get_sales_summary).
- Then call generate_chart with the data to display it as a bar or pie chart.
- Use "bar" for comparing values across categories (e.g., sales by product, top products, monthly trends).
- Use "pie" for showing proportions of a whole (e.g., category breakdown).
- For simple text-only answers (e.g., asking about a single product's sales), do NOT call generate_chart. Only chart when the user wants a visual representation.`,
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
