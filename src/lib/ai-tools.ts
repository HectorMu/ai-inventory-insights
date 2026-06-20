import { dynamicTool } from "ai";
import { z } from "zod";
import {
  getSalesSummary,
  getTopProducts,
  getLowStockProducts,
  getSalesComparison,
  getCategoryBreakdown,
  getSaleById,
  searchProducts,
  getAllCategories,
  getInventorySummary,
  getAllProducts,
  createOrder,
  getAllOrders,
  fulfillOrder,
} from "@/db/queries";

export const salesSummaryTool = dynamicTool({
  description: "Get sales summary grouped by product, category, day, week, or month for a date range",
  inputSchema: z.object({
    from: z.string().describe("Start date (YYYY-MM-DD)"),
    to: z.string().describe("End date (YYYY-MM-DD)"),
    groupBy: z
      .enum(["product", "category", "day", "week", "month"])
      .describe("Group results by this dimension"),
  }),
  execute: async (input) => {
    const { from, to, groupBy } = input as { from: string; to: string; groupBy: "product" | "category" | "day" | "week" | "month" };
    return getSalesSummary(from, to, groupBy);
  },
});

export const topProductsTool = dynamicTool({
  description: "Get top selling products by revenue in a date range",
  inputSchema: z.object({
    from: z.string().describe("Start date (YYYY-MM-DD)"),
    to: z.string().describe("End date (YYYY-MM-DD)"),
    limit: z.number().describe("Number of top products to return"),
  }),
  execute: async (input) => {
    const { from, to, limit } = input as { from: string; to: string; limit: number };
    return getTopProducts(from, to, limit);
  },
});

export const lowStockTool = dynamicTool({
  description: "Get products with stock below a threshold, use 20 as default if not specified",
  inputSchema: z.object({
    threshold: z.number().default(20).describe("Stock threshold"),
  }),
  execute: async (input) => {
    const { threshold } = input as { threshold: number };
    return getLowStockProducts(threshold);
  },
});

export const salesComparisonTool = dynamicTool({
  description: "Compare sales between two time periods",
  inputSchema: z.object({
    periodA: z.object({
      from: z.string().describe("Start date for period A (YYYY-MM-DD)"),
      to: z.string().describe("End date for period A (YYYY-MM-DD)"),
    }),
    periodB: z.object({
      from: z.string().describe("Start date for period B (YYYY-MM-DD)"),
      to: z.string().describe("End date for period B (YYYY-MM-DD)"),
    }),
  }),
  execute: async (input) => {
    const { periodA, periodB } = input as { periodA: { from: string; to: string }; periodB: { from: string; to: string } };
    return getSalesComparison(periodA, periodB);
  },
});

export const categoryBreakdownTool = dynamicTool({
  description: "Get sales breakdown by category for a date range",
  inputSchema: z.object({
    from: z.string().describe("Start date (YYYY-MM-DD)"),
    to: z.string().describe("End date (YYYY-MM-DD)"),
  }),
  execute: async (input) => {
    const { from, to } = input as { from: string; to: string };
    return getCategoryBreakdown(from, to);
  },
});

export const saleDetailTool = dynamicTool({
  description: "Get detailed information about a specific sale including all items purchased",
  inputSchema: z.object({
    saleId: z.number().describe("Sale ID to look up"),
  }),
  execute: async (input) => {
    const { saleId } = input as { saleId: number };
    const sale = getSaleById(saleId);
    if (!sale) return JSON.stringify({ error: "Sale not found" });
    return JSON.parse(JSON.stringify(sale));
  },
});

export const searchProductsTool = dynamicTool({
  description: "Search products by name or category",
  inputSchema: z.object({
    query: z.string().describe("Search query to match product name or category"),
  }),
  execute: async (input) => {
    const { query } = input as { query: string };
    return searchProducts(query);
  },
});

export const categoriesTool = dynamicTool({
  description: "Get all available product categories",
  inputSchema: z.object({}),
  execute: async () => {
    return getAllCategories();
  },
});

export const inventorySummaryTool = dynamicTool({
  description: "Get inventory summary: total products, stock count, average price, total inventory value",
  inputSchema: z.object({}),
  execute: async () => {
    return getInventorySummary();
  },
});

export const allProductsTool = dynamicTool({
  description: "Get a list of all products with their stock levels, prices, and categories",
  inputSchema: z.object({}),
  execute: async () => {
    return getAllProducts();
  },
});

export const restockOrderTool = dynamicTool({
  description: "Create a restock order for a single product. Requires user approval before execution.",
  title: "Restock Order",
  inputSchema: z.object({
    productId: z.number().describe("Product ID to restock"),
    quantity: z.number().positive().describe("Quantity to order"),
    productName: z.string().optional().describe("Product name for display in the approval dialog"),
  }),
  needsApproval: true,
  execute: async (input) => {
    const { productId, quantity } = input as { productId: number; quantity: number };
    const order = createOrder(productId, quantity);
    return JSON.parse(JSON.stringify(order));
  },
});

export const recentOrdersTool = dynamicTool({
  description: "Get recent restock orders and their statuses",
  inputSchema: z.object({}),
  execute: async () => {
    return getAllOrders();
  },
});

export const fulfillOrderTool = dynamicTool({
  description: "Fulfill a pending restock order. Adds the ordered quantity to product stock. Requires user approval before execution.",
  title: "Fulfill Order",
  inputSchema: z.object({
    orderId: z.number().describe("Order ID to fulfill"),
    productName: z.string().optional().describe("Product name for display in the approval dialog"),
    quantity: z.number().optional().describe("Quantity for display in the approval dialog"),
  }),
  needsApproval: true,
  execute: async (input) => {
    const { orderId } = input as { orderId: number };
    const result = fulfillOrder(orderId);
    if (!result) return JSON.stringify({ error: "Order not found" });
    return JSON.parse(JSON.stringify(result));
  },
});

export const bulkRestockTool = dynamicTool({
  description: "Create restock orders for multiple products at once. Requires user approval before execution.",
  title: "Bulk Restock",
  inputSchema: z.object({
    items: z.array(z.object({
      productId: z.number().describe("Product ID to restock"),
      quantity: z.number().positive().describe("Quantity to order"),
      productName: z.string().optional().describe("Product name for display in the approval dialog"),
    })).min(1).describe("List of products and quantities to restock"),
  }),
  needsApproval: true,
  execute: async (input) => {
    const { items } = input as { items: { productId: number; quantity: number }[] };
    const results = items.map((item) => createOrder(item.productId, item.quantity));
    return JSON.parse(JSON.stringify(results));
  },
});


