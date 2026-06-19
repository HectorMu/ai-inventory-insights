"use client";

import { useQuery } from "@tanstack/react-query";

interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  stock: number;
  createdAt: string;
}

async function fetchProducts(): Promise<Product[]> {
  const res = await fetch("/api/products");
  if (!res.ok) throw new Error("Failed to fetch products");
  return res.json();
}

export function useProducts() {
  return useQuery<Product[]>({
    queryKey: ["products"],
    queryFn: fetchProducts,
  });
}
