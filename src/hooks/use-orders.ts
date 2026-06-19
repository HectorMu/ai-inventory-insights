"use client";

import { useQuery } from "@tanstack/react-query";
import type { Order } from "@/types/db";

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
