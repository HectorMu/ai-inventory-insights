import { NextRequest, NextResponse } from "next/server";
import { createChat, getAllChats } from "@/db/queries";

export async function GET() {
  try {
    const chats = getAllChats();
    return NextResponse.json(chats);
  } catch (error) {
    console.error("Chats API error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { title } = await req.json();
    const chat = createChat(title ?? "New Chat");
    return NextResponse.json(chat);
  } catch (error) {
    console.error("Create chat API error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
