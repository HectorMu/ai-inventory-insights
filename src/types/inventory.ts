export interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  stock: number;
  createdAt: string;
}

export interface InventorySummary {
  totalProducts: number;
  totalStock: number;
  avgPrice: number;
  totalInventoryValue: number;
}
