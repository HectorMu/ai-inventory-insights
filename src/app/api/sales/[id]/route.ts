import { NextRequest, NextResponse } from "next/server";
import { getSaleById } from "@/db/queries";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const sale = getSaleById(Number(id));
    if (!sale) {
      return NextResponse.json({ error: "Sale not found" }, { status: 404 });
    }
    return NextResponse.json(sale);
  } catch (error) {
    console.error("Sale detail API error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
