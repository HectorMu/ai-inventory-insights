import { NextRequest, NextResponse } from "next/server";
import { getChatMessages, addChatMessage } from "@/db/queries";

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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { role, content } = await request.json();
    const message = addChatMessage(Number(id), role, content);
    return NextResponse.json(message);
  } catch (error) {
    console.error("Add message API error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
