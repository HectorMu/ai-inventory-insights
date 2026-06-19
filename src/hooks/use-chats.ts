"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Chat } from "@/types/chat";

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
