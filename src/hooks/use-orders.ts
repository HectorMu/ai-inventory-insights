"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface Order {
  id: number;
  productId: number;
  productName: string;
  quantity: number;
  status: string;
  createdAt: string;
}

async function fetchOrders(): Promise<Order[]> {
  const res = await fetch("/api/orders");
  if (!res.ok) throw new Error("Failed to fetch orders");
  return res.json();
}

export function useOrders() {
  return useQuery<Order[]>({
    queryKey: ["orders"],
    queryFn: fetchOrders,
  });
}
