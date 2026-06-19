import { NextResponse } from "next/server";
import { getAllProducts } from "@/db/queries";

export async function GET() {
  try {
    const products = getAllProducts();
    return NextResponse.json(products);
  } catch (error) {
    console.error("Products API error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
