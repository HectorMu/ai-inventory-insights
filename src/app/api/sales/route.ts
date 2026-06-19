import { NextRequest, NextResponse } from "next/server";
import { getAllSales, createSale } from "@/db/queries";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from") ?? undefined;
    const to = searchParams.get("to") ?? undefined;
    const category = searchParams.get("category") ?? undefined;
    const sales = getAllSales(from, to, category);
    return NextResponse.json(sales);
  } catch (error) {
    console.error("Sales API error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const sale = createSale(body.items);
    return NextResponse.json(sale);
  } catch (error) {
    console.error("Create sale API error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
