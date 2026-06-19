import { NextResponse } from "next/server";
import { getAllOrders } from "@/db/queries";

export async function GET() {
  try {
    const orders = getAllOrders();
    return NextResponse.json(orders);
  } catch (error) {
    console.error("Orders API error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
