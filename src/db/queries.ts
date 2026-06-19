import { db, schema } from "./index";
import { sql, eq, gte, lte, desc, asc, and, or, like, sum, count } from "drizzle-orm";

export type { Order, SaleDetail, SaleItem, Product } from "@/types/db";

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

export function getSaleById(id: number) {
  const sale = db
    .select({
      id: schema.sales.id,
      createdAt: schema.sales.createdAt,
      total: schema.sales.total,
    })
    .from(schema.sales)
    .where(eq(schema.sales.id, id))
    .get();

  if (!sale) return null;

  const items = db
    .select({
      id: schema.saleItems.id,
      productId: schema.saleItems.productId,
      productName: schema.products.name,
      productCategory: schema.products.category,
      quantity: schema.saleItems.quantity,
      unitPrice: schema.saleItems.unitPrice,
    })
    .from(schema.saleItems)
    .innerJoin(schema.products, eq(schema.saleItems.productId, schema.products.id))
    .where(eq(schema.saleItems.saleId, id))
    .all();

  return { ...sale, items };
}

export function searchProducts(query: string) {
  const rows = db
    .select()
    .from(schema.products)
    .where(
      or(
        like(schema.products.name, `%${query}%`),
        like(schema.products.category, `%${query}%`)
      )
    )
    .orderBy(asc(schema.products.name))
    .all();
  return JSON.parse(JSON.stringify(rows));
}

export function getAllCategories() {
  const rows = db
    .select({ category: schema.products.category })
    .from(schema.products)
    .groupBy(schema.products.category)
    .orderBy(asc(schema.products.category))
    .all();
  return rows.map((r) => r.category);
}

export function getInventorySummary() {
  const totalProducts = db.select({ count: count().mapWith(Number) }).from(schema.products).get();
  const totalStock = db
    .select({ value: sql`SUM(${schema.products.stock})`.mapWith(Number) })
    .from(schema.products)
    .get();
  const avgPrice = db
    .select({ value: sql`AVG(${schema.products.price})`.mapWith(Number) })
    .from(schema.products)
    .get();
  const totalValue = db
    .select({ value: sql`SUM(${schema.products.price} * ${schema.products.stock})`.mapWith(Number) })
    .from(schema.products)
    .get();

  return {
    totalProducts: totalProducts?.count ?? 0,
    totalStock: totalStock?.value ?? 0,
    avgPrice: avgPrice?.value ?? 0,
    totalInventoryValue: totalValue?.value ?? 0,
  };
}

export function createOrder(productId: number, quantity: number) {
  const now = new Date().toISOString();
  const result = db
    .insert(schema.orders)
    .values({ productId, quantity, status: "pending", createdAt: now })
    .returning()
    .get();
  return result;
}

export function getAllOrders() {
  const rows = db
    .select({
      id: schema.orders.id,
      productId: schema.orders.productId,
      productName: schema.products.name,
      quantity: schema.orders.quantity,
      status: schema.orders.status,
      createdAt: schema.orders.createdAt,
    })
    .from(schema.orders)
    .innerJoin(schema.products, eq(schema.orders.productId, schema.products.id))
    .orderBy(desc(schema.orders.createdAt))
    .all();
  return JSON.parse(JSON.stringify(rows));
}

export function updateOrderStatus(id: number, status: string) {
  const order = db
    .select()
    .from(schema.orders)
    .where(eq(schema.orders.id, id))
    .get();
  if (order) {
    db.update(schema.orders)
      .set({ status })
      .where(eq(schema.orders.id, id))
      .run();
  }
}

export function fulfillOrder(id: number) {
  const order = db
    .select()
    .from(schema.orders)
    .where(eq(schema.orders.id, id))
    .get();
  if (!order) return null;
  db.update(schema.orders)
    .set({ status: "fulfilled" })
    .where(eq(schema.orders.id, id))
    .run();
  db.update(schema.products)
    .set({ stock: sql`${schema.products.stock} + ${order.quantity}` })
    .where(eq(schema.products.id, order.productId))
    .run();
  const updated = db
    .select({
      id: schema.orders.id,
      productId: schema.orders.productId,
      productName: schema.products.name,
      quantity: schema.orders.quantity,
      status: schema.orders.status,
      createdAt: schema.orders.createdAt,
    })
    .from(schema.orders)
    .innerJoin(schema.products, eq(schema.orders.productId, schema.products.id))
    .where(eq(schema.orders.id, id))
    .get();
  return updated;
}

export function deleteOrder(id: number) {
  db.delete(schema.orders).where(eq(schema.orders.id, id)).run();
}

export function createProduct(data: { name: string; category: string; price: number; stock: number }) {
  const now = new Date().toISOString();
  const result = db
    .insert(schema.products)
    .values({ ...data, createdAt: now })
    .returning()
    .get();
  return result;
}

export function updateProduct(id: number, data: { name: string; category: string; price: number; stock: number }) {
  db.update(schema.products)
    .set(data)
    .where(eq(schema.products.id, id))
    .run();
}

export function deleteProduct(id: number) {
  db.delete(schema.products).where(eq(schema.products.id, id)).run();
}

export function createSale(items: { productId: number; quantity: number; unitPrice: number }[]) {
  const now = new Date().toISOString();
  const total = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const sale = db
    .insert(schema.sales)
    .values({ createdAt: now, total })
    .returning()
    .get();
  for (const item of items) {
    db.insert(schema.saleItems)
      .values({ saleId: sale.id, productId: item.productId, quantity: item.quantity, unitPrice: item.unitPrice })
      .run();
    db.update(schema.products)
      .set({ stock: sql`${schema.products.stock} - ${item.quantity}` })
      .where(eq(schema.products.id, item.productId))
      .run();
  }
  return getSaleById(sale.id);
}

export function deleteSale(id: number) {
  const sale = getSaleById(id);
  if (!sale) return;
  for (const item of sale.items) {
    db.update(schema.products)
      .set({ stock: sql`${schema.products.stock} + ${item.quantity}` })
      .where(eq(schema.products.id, item.productId))
      .run();
  }
  db.delete(schema.saleItems).where(eq(schema.saleItems.saleId, id)).run();
  db.delete(schema.sales).where(eq(schema.sales.id, id)).run();
}

export function createChat(title: string) {
  const now = new Date().toISOString();
  const result = db
    .insert(schema.chats)
    .values({ title, createdAt: now, updatedAt: now })
    .returning()
    .get();
  return result;
}

export function getAllChats() {
  return db
    .select()
    .from(schema.chats)
    .orderBy(desc(schema.chats.updatedAt))
    .all();
}

export function getChatById(id: number) {
  return db.select().from(schema.chats).where(eq(schema.chats.id, id)).get();
}

export function updateChatTitle(id: number, title: string) {
  const now = new Date().toISOString();
  db.update(schema.chats)
    .set({ title, updatedAt: now })
    .where(eq(schema.chats.id, id))
    .run();
}

export function upsertChatMessage(chatId: number, messageId: string, role: string, content: string) {
  const now = new Date().toISOString();
  db.insert(schema.chatMessages)
    .values({ chatId, messageId, role, content, createdAt: now })
    .onConflictDoNothing()
    .run();
  db.update(schema.chats)
    .set({ updatedAt: now })
    .where(eq(schema.chats.id, chatId))
    .run();
}

export function deleteChat(id: number) {
  db.delete(schema.chatMessages).where(eq(schema.chatMessages.chatId, id)).run();
  db.delete(schema.chats).where(eq(schema.chats.id, id)).run();
}

export function getChatMessages(chatId: number) {
  return db
    .select()
    .from(schema.chatMessages)
    .where(eq(schema.chatMessages.chatId, chatId))
    .orderBy(asc(schema.chatMessages.createdAt))
    .all();
}
