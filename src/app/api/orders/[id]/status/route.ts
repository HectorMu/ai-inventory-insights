import { NextRequest, NextResponse } from "next/server";
import { fulfillOrder } from "@/db/queries";

export async function PATCH(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const order = fulfillOrder(Number(id));
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    return NextResponse.json(order);
  } catch (error) {
    console.error("Fulfill order API error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
