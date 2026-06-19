import { NextRequest, NextResponse } from "next/server";
import { updateProduct, deleteProduct } from "@/db/queries";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    updateProduct(Number(id), body);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update product API error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    deleteProduct(Number(id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete product API error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
