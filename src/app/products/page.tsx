import { ProductTable } from "@/components/products/product-table";

export default function ProductsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Products</h1>
        <p className="text-muted-foreground">
          Inventory levels and product information
        </p>
      </div>
      <ProductTable />
    </div>
  );
}
