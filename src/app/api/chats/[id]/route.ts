import { NextRequest, NextResponse } from "next/server";
import { getChatById, updateChatTitle, deleteChat } from "@/db/queries";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const chat = getChatById(Number(id));
    if (!chat) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }
    return NextResponse.json(chat);
  } catch (error) {
    console.error("Chat detail API error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { title } = await request.json();
    updateChatTitle(Number(id), title);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update chat API error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    deleteChat(Number(id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete chat API error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
