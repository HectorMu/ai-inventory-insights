"use client";

import { useQuery } from "@tanstack/react-query";

interface SaleItem {
  id: number;
  productId: number;
  productName: string;
  productCategory: string;
  quantity: number;
  unitPrice: number;
}

interface SaleDetail {
  id: number;
  createdAt: string;
  total: number;
  items: SaleItem[];
}

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
