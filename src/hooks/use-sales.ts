"use client";

import { useQuery } from "@tanstack/react-query";

interface Sale {
  id: number;
  createdAt: string;
  total: number;
}

interface SalesFilters {
  from?: string;
  to?: string;
  category?: string;
}

async function fetchSales(filters: SalesFilters): Promise<Sale[]> {
  const params = new URLSearchParams();
  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);
  if (filters.category) params.set("category", filters.category);

  const res = await fetch(`/api/sales?${params.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch sales");
  return res.json();
}

export function useSales(filters: SalesFilters) {
  return useQuery<Sale[]>({
    queryKey: ["sales", filters],
    queryFn: () => fetchSales(filters),
  });
}
