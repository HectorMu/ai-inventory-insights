import { dynamicTool } from "ai";
import { z } from "zod";
import {
  getSalesSummary,
  getTopProducts,
  getLowStockProducts,
  getSalesComparison,
  getCategoryBreakdown,
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
