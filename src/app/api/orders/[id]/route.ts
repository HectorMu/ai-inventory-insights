import { NextRequest, NextResponse } from "next/server";
import { deleteOrder } from "@/db/queries";

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    deleteOrder(Number(id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete order API error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
