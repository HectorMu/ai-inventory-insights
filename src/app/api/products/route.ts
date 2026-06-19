import { NextRequest, NextResponse } from "next/server";
import { getAllProducts, createProduct } from "@/db/queries";

export async function GET() {
  try {
    const products = getAllProducts();
    return NextResponse.json(products);
  } catch (error) {
    console.error("Products API error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const product = createProduct(body);
    return NextResponse.json(product);
  } catch (error) {
    console.error("Create product API error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
