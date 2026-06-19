"use client";

import { useQuery } from "@tanstack/react-query";

interface DashboardKPIs {
  totalRevenue: number;
  topProduct: string;
  lowStockCount: number;
  totalSalesCount: number;
}

async function fetchDashboard(): Promise<DashboardKPIs> {
  const res = await fetch("/api/dashboard");
  if (!res.ok) throw new Error("Failed to fetch dashboard");
  return res.json();
}

export function useDashboard() {
  return useQuery<DashboardKPIs>({
    queryKey: ["dashboard"],
    queryFn: fetchDashboard,
  });
}
