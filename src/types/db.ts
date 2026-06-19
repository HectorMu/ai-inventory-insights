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

export interface Order {
  id: number;
  productId: number;
  productName: string;
  quantity: number;
  status: string;
  createdAt: string;
}

export interface SaleItem {
  id: number;
  productId: number;
  productName: string;
  productCategory: string;
  quantity: number;
  unitPrice: number;
}

export interface SaleDetail {
  id: number;
  createdAt: string;
  total: number;
  items: SaleItem[];
}
