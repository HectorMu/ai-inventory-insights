import { NextRequest, NextResponse } from "next/server";
import { getAllOrders, createOrder } from "@/db/queries";

export async function GET() {
  try {
    const orders = getAllOrders();
    return NextResponse.json(orders);
  } catch (error) {
    console.error("Orders API error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const order = createOrder(body.productId, body.quantity);
    return NextResponse.json(order);
  } catch (error) {
    console.error("Create order API error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
