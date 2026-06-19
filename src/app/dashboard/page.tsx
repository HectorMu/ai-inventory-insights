import { KPICards } from "@/components/dashboard/kpi-cards";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your inventory and sales performance
        </p>
      </div>
      <KPICards />
    </div>
  );
}
