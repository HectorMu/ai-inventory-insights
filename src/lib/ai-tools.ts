import { dynamicTool } from "ai";
import { z } from "zod";
import {
  queryProducts,
  querySales,
  queryOrders,
  getSalesComparison,
  createOrder,
  fulfillOrder,
} from "@/db/queries";

const queryProductsSchema = z.object({
  search: z.string().optional().describe("Text search across product name and category"),
  category: z.string().optional().describe("Filter by exact category name"),
  stockLte: z.number().optional().describe("Max stock threshold (e.g. 10 for low-stock)"),
  stockGte: z.number().optional().describe("Min stock threshold"),
  priceLte: z.number().optional().describe("Max price filter"),
  priceGte: z.number().optional().describe("Min price filter"),
  sortBy: z.enum(["name", "stock", "price", "category"]).optional().describe("Sort field"),
  order: z.enum(["asc", "desc"]).optional().describe("Sort direction"),
  limit: z.number().optional().describe("Max results (default 50)"),
  summary: z.boolean().optional().describe("If true, return aggregate stats + categories instead of product list"),
});

const querySalesSchema = z.object({
  from: z.string().optional().describe("Start date (YYYY-MM-DD)"),
  to: z.string().optional().describe("End date (YYYY-MM-DD)"),
  groupBy: z.enum(["product", "category", "day", "week", "month"]).optional().describe("Group results by this dimension"),
  category: z.string().optional().describe("Filter by product category"),
  productId: z.number().optional().describe("Filter by product ID"),
  saleId: z.number().optional().describe("Get full detail of a specific sale (includes line items)"),
  limit: z.number().optional().describe("Max results (default 50)"),
  sortBy: z.enum(["revenue", "date", "quantity"]).optional().describe("Sort field"),
  order: z.enum(["asc", "desc"]).optional().describe("Sort direction"),
});

const queryOrdersSchema = z.object({
  status: z.enum(["pending", "ordered", "received", "fulfilled", "cancelled"]).optional().describe("Filter by order status"),
  productId: z.number().optional().describe("Filter by product ID"),
  from: z.string().optional().describe("Start date (YYYY-MM-DD)"),
  to: z.string().optional().describe("End date (YYYY-MM-DD)"),
  sortBy: z.enum(["date", "status", "product"]).optional().describe("Sort field"),
  order: z.enum(["asc", "desc"]).optional().describe("Sort direction"),
  limit: z.number().optional().describe("Max results (default 50)"),
});

export const queryProductsTool = dynamicTool({
  description: `Search and filter products. Use filters to narrow results instead of dumping all records.
  - Set summary=true to get aggregate data (count, avg price, total value, categories list)
  - Use search to find products by name or category
  - Use stockLte for low-stock queries
  - Use category to filter by exact category`,
  inputSchema: queryProductsSchema,
  execute: async (input: unknown) => {
    const filters = input as z.infer<typeof queryProductsSchema>;
    const result = queryProducts(filters);
    return JSON.parse(JSON.stringify(result));
  },
});

export const querySalesTool = dynamicTool({
  description: `Query sales data with filters, grouping, and optional sale detail.
  - Set saleId to get full detail of a specific sale (with line items)
  - Set groupBy to get aggregated sales by product, category, day, week, or month
  - Use from/to to scope date range
  - Use category or productId to filter
  - Without groupBy or saleId, returns a raw chronological sales list`,
  inputSchema: querySalesSchema,
  execute: async (input: unknown) => {
    const filters = input as z.infer<typeof querySalesSchema>;
    const result = querySales(filters);
    return JSON.parse(JSON.stringify(result));
  },
});

export const queryOrdersTool = dynamicTool({
  description: `Query restock orders with optional filters.
  - Use status to filter by order status (pending, ordered, received, fulfilled, cancelled)
  - Use productId to get orders for a specific product
  - Use from/to for date range`,
  inputSchema: queryOrdersSchema,
  execute: async (input: unknown) => {
    const filters = input as z.infer<typeof queryOrdersSchema>;
    const result = queryOrders(filters);
    return JSON.parse(JSON.stringify(result));
  },
});

export const compareSalesPeriodsTool = dynamicTool({
  description: "Compare total revenue and sales count between two time periods. Returns each period's stats plus percent change.",
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


