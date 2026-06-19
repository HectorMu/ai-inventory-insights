import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";
import path from "path";
import fs from "fs";

const dbPath = path.join(process.cwd(), "data", "inventory.db");
const dir = path.dirname(dbPath);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

const sqlite = new Database(dbPath);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");
const db = drizzle(sqlite, { schema });

const PRODUCTS = [
  { name: "Wireless Bluetooth Headphones", category: "Electronics", price: 79.99, stock: 45 },
  { name: "USB-C Hub 7-in-1", category: "Electronics", price: 34.99, stock: 120 },
  { name: "Mechanical Keyboard RGB", category: "Electronics", price: 129.99, stock: 30 },
  { name: "27-inch 4K Monitor", category: "Electronics", price: 449.99, stock: 15 },
  { name: "Portable SSD 1TB", category: "Electronics", price: 109.99, stock: 60 },
  { name: "Wireless Charging Pad", category: "Electronics", price: 24.99, stock: 200 },
  { name: "Noise Cancelling Earbuds", category: "Electronics", price: 149.99, stock: 25 },
  { name: "Smartphone Tripod", category: "Electronics", price: 29.99, stock: 80 },
  { name: "Cotton T-Shirt (Pack of 3)", category: "Clothing", price: 34.99, stock: 100 },
  { name: "Slim Fit Chinos", category: "Clothing", price: 59.99, stock: 55 },
  { name: "Wool Blend Sweater", category: "Clothing", price: 89.99, stock: 35 },
  { name: "Running Shoes", category: "Clothing", price: 119.99, stock: 40 },
  { name: "Leather Belt", category: "Clothing", price: 44.99, stock: 70 },
  { name: "Organic Green Tea (50 bags)", category: "Food & Beverages", price: 14.99, stock: 150 },
  { name: "Dark Chocolate Bar 85%", category: "Food & Beverages", price: 5.99, stock: 300 },
  { name: "Cold Brew Coffee (12 pack)", category: "Food & Beverages", price: 24.99, stock: 90 },
  { name: "Mixed Nuts Roasted (1lb)", category: "Food & Beverages", price: 12.99, stock: 110 },
  { name: "Indoor Plant Pot Set", category: "Home & Garden", price: 39.99, stock: 50 },
  { name: "Scented Candle Collection", category: "Home & Garden", price: 29.99, stock: 65 },
  { name: "Bamboo Cutting Board", category: "Home & Garden", price: 22.99, stock: 85 },
  { name: "Microfiber Cleaning Set", category: "Home & Garden", price: 19.99, stock: 140 },
  { name: "Throw Blanket Premium", category: "Home & Garden", price: 49.99, stock: 40 },
];

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min: number, max: number, decimals = 2) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

function randomDate(start: Date, end: Date) {
  const d = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  return d.toISOString().split("T")[0];
}

async function seed() {
  console.log("Seeding database...");

  sqlite.exec("DELETE FROM sale_items");
  sqlite.exec("DELETE FROM sales");
  sqlite.exec("DELETE FROM products");

  const insertedProducts: { id: number; price: number }[] = [];
  for (const p of PRODUCTS) {
    const result = sqlite
      .prepare(
        "INSERT INTO products (name, category, price, stock, created_at) VALUES (?, ?, ?, ?, ?)"
      )
      .run(p.name, p.category, p.price, p.stock, "2025-06-01");
    insertedProducts.push({ id: Number(result.lastInsertRowid), price: p.price });
  }

  const startDate = new Date("2026-01-01");
  const endDate = new Date("2026-06-30");

  const dayCount = Math.floor(
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  let totalSales = 0;

  for (let dayOffset = 0; dayOffset <= dayCount; dayOffset++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(currentDate.getDate() + dayOffset);
    const dateStr = currentDate.toISOString().split("T")[0];

    const isWeekend = currentDate.getDay() === 0 || currentDate.getDay() === 6;
    const salesCount = isWeekend ? randomInt(3, 8) : randomInt(5, 15);

    for (let s = 0; s < salesCount; s++) {
      const itemsCount = randomInt(1, 5);
      let saleTotal = 0;
      const saleItemsData: { productId: number; quantity: number; unitPrice: number }[] = [];

      for (let i = 0; i < itemsCount; i++) {
        const product = insertedProducts[randomInt(0, insertedProducts.length - 1)];
        const qty = randomInt(1, 3);
        const unitPrice = product.price;
        saleTotal += qty * unitPrice;
        saleItemsData.push({ productId: product.id, quantity: qty, unitPrice });
      }

      const saleResult = sqlite
        .prepare("INSERT INTO sales (created_at, total) VALUES (?, ?)")
        .run(dateStr, saleTotal);
      const saleId = Number(saleResult.lastInsertRowid);

      const stmt = sqlite.prepare(
        "INSERT INTO sale_items (sale_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?)"
      );
      for (const item of saleItemsData) {
        stmt.run(saleId, item.productId, item.quantity, item.unitPrice);
      }

      totalSales++;
    }
  }

  console.log(`Seeded ${insertedProducts.length} products and ${totalSales} sales transactions.`);
  sqlite.close();
}

seed().catch(console.error);
