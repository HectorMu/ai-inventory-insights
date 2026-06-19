import { NextResponse } from "next/server";
import { getDashboardKPIs } from "@/db/queries";

export async function GET() {
  try {
    const kpis = getDashboardKPIs();
    return NextResponse.json(kpis);
  } catch (error) {
    console.error("Dashboard API error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
