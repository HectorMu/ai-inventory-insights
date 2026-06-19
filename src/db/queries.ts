import { db, schema } from "./index";
import { sql, eq, gte, lte, desc, asc, and, sum, count } from "drizzle-orm";

export type GroupBy = "product" | "category" | "day" | "week" | "month";

export function getSalesSummary(from: string, to: string, groupBy: GroupBy) {
  const dateFilter = and(
    gte(schema.sales.createdAt, from),
    lte(schema.sales.createdAt, to)
  );

  let groupColumn;

  switch (groupBy) {
    case "product":
      groupColumn = schema.products.name;
      break;
    case "category":
      groupColumn = schema.products.category;
      break;
    case "day":
      groupColumn = schema.sales.createdAt;
      break;
    case "week": {
      const weekExpr = sql`strftime('%Y-W%W', ${schema.sales.createdAt})`;
      groupColumn = weekExpr;
      break;
    }
    case "month": {
      const monthExpr = sql`strftime('%Y-%m', ${schema.sales.createdAt})`;
      groupColumn = monthExpr;
      break;
    }
    default:
      throw new Error(`Invalid groupBy: ${groupBy}`);
  }

  const rows = db
    .select({
      label: groupColumn,
      revenue: sum(schema.saleItems.unitPrice).mapWith(Number),
      quantity: sum(schema.saleItems.quantity).mapWith(Number),
    })
    .from(schema.sales)
    .innerJoin(schema.saleItems, eq(schema.sales.id, schema.saleItems.saleId))
    .innerJoin(
      schema.products,
      eq(schema.saleItems.productId, schema.products.id)
    )
    .where(dateFilter)
    .groupBy(groupColumn)
    .orderBy(desc(sum(schema.saleItems.unitPrice)))
    .all();
  return JSON.parse(JSON.stringify(rows));
}

export function getTopProducts(from: string, to: string, limit: number) {
  const dateFilter = and(
    gte(schema.sales.createdAt, from),
    lte(schema.sales.createdAt, to)
  );

  const rows = db
    .select({
      name: schema.products.name,
      category: schema.products.category,
      revenue: sum(schema.saleItems.unitPrice).mapWith(Number),
      quantity: sum(schema.saleItems.quantity).mapWith(Number),
    })
    .from(schema.sales)
    .innerJoin(schema.saleItems, eq(schema.sales.id, schema.saleItems.saleId))
    .innerJoin(
      schema.products,
      eq(schema.saleItems.productId, schema.products.id)
    )
    .where(dateFilter)
    .groupBy(schema.products.id)
    .orderBy(desc(sum(schema.saleItems.unitPrice)))
    .limit(limit)
    .all();
  return JSON.parse(JSON.stringify(rows));
}

export function getLowStockProducts(threshold: number) {
  const rows = db
    .select()
    .from(schema.products)
    .where(lte(schema.products.stock, threshold))
    .orderBy(asc(schema.products.stock))
    .all();
  return JSON.parse(JSON.stringify(rows));
}

export function getSalesComparison(
  periodA: { from: string; to: string },
  periodB: { from: string; to: string }
) {
  const periodAData = db
    .select({
      total: sum(schema.sales.total).mapWith(Number),
      count: count().mapWith(Number),
    })
    .from(schema.sales)
    .where(
      and(gte(schema.sales.createdAt, periodA.from), lte(schema.sales.createdAt, periodA.to))
    )
    .get();

  const periodBData = db
    .select({
      total: sum(schema.sales.total).mapWith(Number),
      count: count().mapWith(Number),
    })
    .from(schema.sales)
    .where(
      and(gte(schema.sales.createdAt, periodB.from), lte(schema.sales.createdAt, periodB.to))
    )
    .get();

  const aTotal = periodAData?.total ?? 0;
  const bTotal = periodBData?.total ?? 0;
  const aCount = periodAData?.count ?? 0;
  const bCount = periodBData?.count ?? 0;

  const change = bTotal === 0 ? null : ((aTotal - bTotal) / bTotal) * 100;

  return {
    periodA: { from: periodA.from, to: periodA.to, total: aTotal, count: aCount },
    periodB: { from: periodB.from, to: periodB.to, total: bTotal, count: bCount },
    changePercent: change,
  };
}

export function getCategoryBreakdown(from: string, to: string) {
  const dateFilter = and(
    gte(schema.sales.createdAt, from),
    lte(schema.sales.createdAt, to)
  );

  const rows = db
    .select({
      category: schema.products.category,
      revenue: sum(schema.saleItems.unitPrice).mapWith(Number),
      quantity: sum(schema.saleItems.quantity).mapWith(Number),
    })
    .from(schema.sales)
    .innerJoin(schema.saleItems, eq(schema.sales.id, schema.saleItems.saleId))
    .innerJoin(
      schema.products,
      eq(schema.saleItems.productId, schema.products.id)
    )
    .where(dateFilter)
    .groupBy(schema.products.category)
    .orderBy(desc(sum(schema.saleItems.unitPrice)))
    .all();
  return JSON.parse(JSON.stringify(rows));
}

export function getDashboardKPIs() {
  const totalRevenue = db
    .select({ value: sum(schema.sales.total).mapWith(Number) })
    .from(schema.sales)
    .get();

  const topProduct = db
    .select({
      name: schema.products.name,
      revenue: sum(schema.saleItems.unitPrice).mapWith(Number),
    })
    .from(schema.sales)
    .innerJoin(schema.saleItems, eq(schema.sales.id, schema.saleItems.saleId))
    .innerJoin(schema.products, eq(schema.saleItems.productId, schema.products.id))
    .groupBy(schema.products.id)
    .orderBy(desc(sum(schema.saleItems.unitPrice)))
    .limit(1)
    .get();

  const lowStockCount = db
    .select({ count: count().mapWith(Number) })
    .from(schema.products)
    .where(lte(schema.products.stock, 20))
    .get();

  const totalSales = db
    .select({ count: count().mapWith(Number) })
    .from(schema.sales)
    .get();

  return {
    totalRevenue: totalRevenue?.value ?? 0,
    topProduct: topProduct?.name ?? "N/A",
    lowStockCount: lowStockCount?.count ?? 0,
    totalSalesCount: totalSales?.count ?? 0,
  };
}

export function getAllProducts() {
  const rows = db.select().from(schema.products).orderBy(asc(schema.products.name)).all();
  return JSON.parse(JSON.stringify(rows));
}

export function getAllSales(from?: string, to?: string, category?: string) {
  const conditions = [];
  if (from) conditions.push(gte(schema.sales.createdAt, from));
  if (to) conditions.push(lte(schema.sales.createdAt, to));
  if (category) {
    conditions.push(
      sql`EXISTS (SELECT 1 FROM sale_items si JOIN products p ON si.product_id = p.id WHERE si.sale_id = sales.id AND p.category = ${category})`
    );
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const salesData = db
    .select({
      id: schema.sales.id,
      createdAt: schema.sales.createdAt,
      total: schema.sales.total,
    })
    .from(schema.sales)
    .where(whereClause)
    .orderBy(desc(schema.sales.createdAt))
    .all();

  return salesData;
}
