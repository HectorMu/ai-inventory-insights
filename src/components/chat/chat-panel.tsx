"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useChat } from "@ai-sdk/react";
import { useQueryClient } from "@tanstack/react-query";
import { useChats } from "@/hooks/use-chats";
import { getInvalidationKeysFromMessage } from "@/lib/cache-invalidation";
import { lastAssistantMessageIsCompleteWithApprovalResponses } from "ai";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatMessage as ChatMessageUI } from "@/components/chat/chat-message";
import { Send, Plus, History, Trash2, Check, X, Pencil } from "lucide-react";

export function ChatPanel() {
  const { chats, createChat, updateChat, deleteChat } = useChats();
  const [activeChatId, setActiveChatId] = useState<number | null>(null);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitleValue, setEditTitleValue] = useState("");

  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollViewportRef = useRef<HTMLDivElement>(null);
  const titleSetRef = useRef(false);
  const activeChatRef = useRef<number | null>(null);
  const historyRef = useRef<HTMLDivElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  activeChatRef.current = activeChatId;
  const currentChat = chats.find((c) => c.id === activeChatId);
  const chatTitle = currentChat?.title ?? "AI Analyst";

  const queryClient = useQueryClient();
  const { messages, setMessages, sendMessage, status, error: chatError, addToolApprovalResponse } = useChat({
    onFinish: ({ message }) => {
      const keysToInvalidate = getInvalidationKeysFromMessage(message);
      for (const key of keysToInvalidate) {
        queryClient.invalidateQueries({ queryKey: key });
      }
    },
    sendAutomaticallyWhen: ({ messages }) =>
      lastAssistantMessageIsCompleteWithApprovalResponses({ messages }),
  });

  const handleApprove = useCallback(
    (approvalId: string) =>
      addToolApprovalResponse({
        id: approvalId,
        approved: true,
        options: { body: { chatId: activeChatRef.current } },
      }),
    [addToolApprovalResponse]
  );

  const handleDeny = useCallback(
    (approvalId: string) =>
      addToolApprovalResponse({
        id: approvalId,
        approved: false,
        options: { body: { chatId: activeChatRef.current } },
      }),
    [addToolApprovalResponse]
  );

  useEffect(() => {
    titleSetRef.current = false;
    setShowHistory(false);
    setIsEditingTitle(false);

    if (!activeChatId) {
      setMessages([]);
      setIsLoading(false);
      setLoadError(null);
      return;
    }

    setIsLoading(true);
    setLoadError(null);

    let cancelled = false;
    fetch(`/api/chats/${activeChatId}/messages`)
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load messages (${res.status})`);
        return res.json();
      })
      .then((msgs: { messageId: string; role: string; content: string }[]) => {
        if (cancelled) return;
        if (!Array.isArray(msgs)) throw new Error("Invalid response format");
        const uiMsgs = msgs.map((m) => ({
          id: m.messageId,
          role: m.role,
          parts: JSON.parse(m.content),
        }));
        setMessages(uiMsgs as Parameters<typeof setMessages>[0]);
        setIsLoading(false);
        requestAnimationFrame(() => {
          scrollViewportRef.current?.scrollTo({
            top: scrollViewportRef.current.scrollHeight,
            behavior: "auto",
          });
        });
      })
      .catch((err: Error) => {
        if (cancelled) return;
        console.error("Failed to load messages:", err);
        setLoadError(err.message);
        setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [activeChatId, setMessages]);

  useEffect(() => {
    const el = scrollViewportRef.current;
    if (!el) return;
    requestAnimationFrame(() => {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    });
  }, [messages, scrollViewportRef]);

  useEffect(() => {
    const hasPending = messages.some(
      (m) =>
        m.role === "assistant" &&
        m.parts?.some(
          (p) =>
            p.type === "dynamic-tool" &&
            (p as { state: string }).state === "approval-requested"
        )
    );
    if (!hasPending) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [messages]);

  useEffect(() => {
    if (isEditingTitle && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [isEditingTitle]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (historyRef.current && !historyRef.current.contains(e.target as Node)) {
        setShowHistory(false);
      }
    };
    if (showHistory) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showHistory]);

  const submitMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || status === "streaming" || status === "submitted") return;
      const chatId = activeChatRef.current;
      if (!chatId) return;

      if (!titleSetRef.current) {
        titleSetRef.current = true;
        const shortened = text.length > 60 ? text.slice(0, 57) + "..." : text;
        updateChat({ id: chatId, title: shortened }).catch(() => {});
      }

      sendMessage(
        { text },
        { body: { chatId } }
      );
    },
    [sendMessage, status, updateChat]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitMessage(input);
    setInput("");
  };

  const handleNewChat = async () => {
    try {
      const chat = await createChat("New Chat");
      setActiveChatId(chat.id);
      setShowHistory(false);
    } catch (err) {
      console.error("Failed to create chat:", err);
    }
  };

  const handleSelectChat = (id: number) => {
    setActiveChatId(id);
    setShowHistory(false);
  };

  const handleDeleteChat = async (id: number) => {
    try {
      await deleteChat(id);
      if (activeChatId === id) {
        setActiveChatId(null);
      }
    } catch (err) {
      console.error("Failed to delete chat:", err);
    }
  };

  const handleStartEditTitle = () => {
    setEditTitleValue(chatTitle);
    setIsEditingTitle(true);
  };

  const handleSaveTitle = async () => {
    if (activeChatId && editTitleValue.trim() && editTitleValue !== chatTitle) {
      try {
        await updateChat({ id: activeChatId, title: editTitleValue.trim() });
      } catch (err) {
        console.error("Failed to update title:", err);
      }
    }
    setIsEditingTitle(false);
  };

  const handleCancelTitleEdit = () => {
    setIsEditingTitle(false);
  };

  const filteredChats = chats.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const quickQuestions = [
    "What were my top products this quarter?",
    "Show me sales by category",
    "Which products are low in stock?",
  ];

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="flex items-center gap-1 px-3 py-2 border-b shrink-0 min-h-[49px]">
        <div className="flex-1 min-w-0">
          {isEditingTitle ? (
            <div className="flex items-center gap-1">
              <Input
                ref={editInputRef}
                value={editTitleValue}
                onChange={(e) => setEditTitleValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveTitle();
                  if (e.key === "Escape") handleCancelTitleEdit();
                }}
                className="h-7 text-sm px-2"
              />
              <button onClick={handleSaveTitle} className="h-6 w-6 flex items-center justify-center shrink-0 rounded hover:bg-accent">
                <Check className="h-3.5 w-3.5" />
              </button>
              <button onClick={handleCancelTitleEdit} className="h-6 w-6 flex items-center justify-center shrink-0 rounded hover:bg-accent">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleStartEditTitle}
              className="flex items-center gap-1.5 text-sm font-semibold truncate max-w-full hover:text-muted-foreground transition-colors group"
            >
              <span className="truncate">{chatTitle}</span>
              <Pencil className="h-3 w-3 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-0.5 shrink-0">
          <div ref={historyRef} className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setShowHistory(!showHistory)}
              title="Chat history"
            >
              <History className="h-4 w-4" />
            </Button>
            {showHistory && (
              <div className="absolute right-0 top-full mt-1 w-72 bg-popover border rounded-md shadow-lg z-50">
                <div className="p-2 border-b">
                  <Input
                    placeholder="Search chats..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-8 text-sm"
                    autoFocus
                  />
                </div>
                <div className="max-h-64 overflow-y-auto p-1">
                  {filteredChats.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-4">
                      {searchQuery ? "No matching chats" : "No conversations yet"}
                    </p>
                  ) : (
                    filteredChats.map((chat) => (
                      <div
                        key={chat.id}
                        className={`group flex items-center gap-1 px-2 py-1.5 rounded-md cursor-pointer text-sm transition-colors ${
                          activeChatId === chat.id
                            ? "bg-accent text-accent-foreground"
                            : "hover:bg-accent/50 text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <button
                          className="flex-1 text-left truncate min-w-0"
                          onClick={() => handleSelectChat(chat.id)}
                        >
                          {chat.title}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteChat(chat.id);
                          }}
                          className="h-6 w-6 shrink-0 flex items-center justify-center rounded opacity-0 group-hover:opacity-100 hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-all"
                          title="Delete chat"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleNewChat} title="New chat">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <ScrollArea ref={scrollRef} viewportRef={scrollViewportRef} className="flex-1 p-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="space-y-3 w-full max-w-md">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-12 bg-muted rounded animate-pulse" />
              ))}
            </div>
          </div>
        ) : loadError ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-sm text-destructive p-3 rounded-md bg-destructive/10 text-center">
              Failed to load messages: {loadError}
            </div>
          </div>
        ) : !activeChatId || messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground space-y-2">
            <div className="text-lg font-medium">AI Sales Analyst</div>
            <p className="text-sm max-w-xs">
              Ask me anything about your sales data, inventory, or trends.
            </p>
            {activeChatId && (
              <div className="flex flex-wrap gap-2 mt-4 justify-center">
                {quickQuestions.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => submitMessage(q)}
                    className="text-xs bg-muted hover:bg-accent rounded-full px-3 py-1.5 transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}
            {!activeChatId && (
              <Button onClick={handleNewChat} size="sm" className="mt-2 gap-1.5">
                <Plus className="h-4 w-4" />
                New Chat
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <ChatMessageUI key={message.id} message={message} onApprove={handleApprove} onDeny={handleDeny} />
            ))}
            {(status === "streaming" || status === "submitted") && (
              <div className="text-sm text-muted-foreground animate-pulse">
                Thinking...
              </div>
            )}
            {chatError && (
              <div className="text-sm text-destructive p-3 rounded-md bg-destructive/10">
                Error: {chatError.message}
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
            placeholder={activeChatId ? "Ask about your data..." : "Start a new chat first..."}
            disabled={!activeChatId || status === "streaming" || status === "submitted"}
            className="flex-1"
          />
          <Button type="submit" size="icon" disabled={!input.trim() || !activeChatId}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
