"use client";

import { useState, useRef, useEffect } from "react";
import { useChat } from "@ai-sdk/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatMessage } from "@/components/chat/chat-message";
import { Send, RotateCcw } from "lucide-react";

export function ChatPanel() {
  const [input, setInput] = useState("");
  const { messages, sendMessage, status, error, regenerate } = useChat();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [messages]);

  const isLoading = status === "streaming" || status === "submitted";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    sendMessage({ text: input });
    setInput("");
  };

  const quickQuestions = [
    "What were my top products this quarter?",
    "Show me sales by category",
    "Which products are low in stock?",
  ];

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
        <h2 className="text-sm font-semibold">AI Analyst</h2>
        {messages.length > 0 && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => regenerate()}
            title="Regenerate response"
            className="h-7 w-7"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      <ScrollArea ref={scrollRef} className="flex-1 p-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground space-y-2">
            <div className="text-lg font-medium">AI Sales Analyst</div>
            <p className="text-sm max-w-xs">
              Ask me anything about your sales data, inventory, or trends.
            </p>
            <div className="flex flex-wrap gap-2 mt-4 justify-center">
              {quickQuestions.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => sendMessage({ text: q })}
                  className="text-xs bg-muted hover:bg-accent rounded-full px-3 py-1.5 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
            {error && (
              <div className="text-sm text-destructive p-3 rounded-md bg-destructive/10">
                Error: {error.message}
              </div>
            )}
          </div>
        )}
      </ScrollArea>

      <div className="border-t p-4 shrink-0">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your data..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
        {isLoading && (
          <p className="text-xs text-muted-foreground mt-1.5">AI is analyzing your data...</p>
        )}
      </div>
    </div>
  );
}
