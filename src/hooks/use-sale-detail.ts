"use client";

import { useQuery } from "@tanstack/react-query";
import type { SaleDetail } from "@/types/db";

async function fetchSaleDetail(id: number): Promise<SaleDetail> {
  const res = await fetch(`/api/sales/${id}`);
  if (!res.ok) throw new Error("Failed to fetch sale detail");
  return res.json();
}

export function useSaleDetail(id: number | null) {
  return useQuery<SaleDetail>({
    queryKey: ["sale", id],
    queryFn: () => fetchSaleDetail(id!),
    enabled: id !== null,
  });
}
