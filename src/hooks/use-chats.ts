"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface Chat {
  id: number;
  title: string;
  createdAt: string;
  updatedAt: string;
}

interface ChatMessage {
  id: number;
  chatId: number;
  role: string;
  content: string;
  createdAt: string;
}

async function fetchChats(): Promise<Chat[]> {
  const res = await fetch("/api/chats");
  if (!res.ok) throw new Error("Failed to fetch chats");
  return res.json();
}

async function createChat(title: string): Promise<Chat> {
  const res = await fetch("/api/chats", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title }),
  });
  if (!res.ok) throw new Error("Failed to create chat");
  return res.json();
}

async function updateChat(id: number, title: string) {
  const res = await fetch(`/api/chats/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title }),
  });
  if (!res.ok) throw new Error("Failed to update chat");
}

async function removeChat(id: number) {
  const res = await fetch(`/api/chats/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete chat");
}

async function fetchChatMessages(chatId: number): Promise<ChatMessage[]> {
  const res = await fetch(`/api/chats/${chatId}/messages`);
  if (!res.ok) throw new Error("Failed to fetch messages");
  return res.json();
}

async function addChatMessage(chatId: number, role: string, content: string): Promise<ChatMessage> {
  const res = await fetch(`/api/chats/${chatId}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ role, content }),
  });
  if (!res.ok) throw new Error("Failed to add message");
  return res.json();
}

export function useChats() {
  const queryClient = useQueryClient();

  const chatsQuery = useQuery<Chat[]>({
    queryKey: ["chats"],
    queryFn: fetchChats,
  });

  const createChatMutation = useMutation({
    mutationFn: (title: string) => createChat(title),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chats"] });
    },
  });

  const updateChatMutation = useMutation({
    mutationFn: ({ id, title }: { id: number; title: string }) => updateChat(id, title),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chats"] });
    },
  });

  const deleteChatMutation = useMutation({
    mutationFn: (id: number) => removeChat(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chats"] });
    },
  });

  return {
    chats: chatsQuery.data ?? [],
    isLoading: chatsQuery.isLoading,
    error: chatsQuery.error,
    createChat: createChatMutation.mutateAsync,
    updateChat: updateChatMutation.mutateAsync,
    deleteChat: deleteChatMutation.mutateAsync,
  };
}

export function useChatMessages(chatId: number | null) {
  const queryClient = useQueryClient();

  const messagesQuery = useQuery<ChatMessage[]>({
    queryKey: ["chat-messages", chatId],
    queryFn: () => fetchChatMessages(chatId!),
    enabled: chatId !== null,
  });

  const addMessageMutation = useMutation({
    mutationFn: ({ role, content }: { role: string; content: string }) =>
      addChatMessage(chatId!, role, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat-messages", chatId] });
    },
  });

  return {
    messages: messagesQuery.data ?? [],
    isLoading: messagesQuery.isLoading,
    addMessage: addMessageMutation.mutateAsync,
  };
}
