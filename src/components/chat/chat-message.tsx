"use client";

import type { UIMessage } from "ai";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";
import { Bot, User } from "lucide-react";

function getMessageText(message: UIMessage): string {
  return message.parts
    .filter((part) => part.type === "text")
    .map((part) => (part as { text: string }).text)
    .join("");
}

interface ChatMessageProps {
  message: UIMessage;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";
  const textContent = getMessageText(message);

  return (
    <div className={cn("flex flex-col w-full", isUser ? "items-end" : "items-start")}>
      {isUser ? (
        <div className="flex items-end gap-3 max-w-[75%]">
          <div className="rounded-lg px-3 py-2 text-sm bg-primary text-primary-foreground">
            <p>{textContent}</p>
          </div>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs bg-primary text-primary-foreground">
            <User className="h-4 w-4" />
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2 max-w-2xl">
          <div className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs bg-muted mt-0.5">
              <Bot className="h-4 w-4" />
            </div>
            <div className="rounded-lg px-3 py-2 text-sm bg-muted text-foreground">
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {textContent}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
