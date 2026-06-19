"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface Sale { id: number; createdAt: string; total: number; }
interface SalesFilters { from?: string; to?: string; category?: string; }
interface SaleItemInput { productId: number; quantity: number; unitPrice: number; }

async function fetchSales(filters: SalesFilters): Promise<Sale[]> {
  const params = new URLSearchParams();
  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);
  if (filters.category) params.set("category", filters.category);
  const res = await fetch(`/api/sales?${params.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch sales");
  return res.json();
}

async function createSale(items: SaleItemInput[]) {
  const res = await fetch("/api/sales", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items }),
  });
  if (!res.ok) throw new Error("Failed to create sale");
  return res.json();
}

async function deleteSale(id: number) {
  const res = await fetch(`/api/sales/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete sale");
}

export function useSales(filters: SalesFilters) {
  return useQuery<Sale[]>({
    queryKey: ["sales", filters],
    queryFn: () => fetchSales(filters),
  });
}

export function useCreateSale() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createSale,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useDeleteSale() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteSale,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}
