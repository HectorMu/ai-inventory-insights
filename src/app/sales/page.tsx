import { SalesTable } from "@/components/sales/sales-table";

export default function SalesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Sales</h1>
        <p className="text-muted-foreground">
          Transaction history with filtering
        </p>
      </div>
      <SalesTable />
    </div>
  );
}
