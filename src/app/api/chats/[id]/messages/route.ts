import { NextRequest, NextResponse } from "next/server";
import { getChatMessages } from "@/db/queries";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const messages = getChatMessages(Number(id));
    return NextResponse.json(messages);
  } catch (error) {
    console.error("Chat messages API error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
