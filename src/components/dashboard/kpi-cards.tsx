"use client";

import { useDashboard } from "@/hooks/use-dashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { DollarSign, Package, TrendingUp, AlertTriangle } from "lucide-react";

export function KPICards() {
  const { data, isLoading, error } = useDashboard();

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <div className="h-4 w-24 bg-muted rounded animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-32 bg-muted rounded animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error || !data) {
    return <div className="text-destructive">Failed to load dashboard data</div>;
  }

  const cards = [
    {
      title: "Total Revenue",
      value: formatCurrency(data.totalRevenue),
      icon: DollarSign,
      color: "text-emerald-600",
    },
    {
      title: "Total Sales",
      value: data.totalSalesCount.toLocaleString(),
      icon: TrendingUp,
      color: "text-blue-600",
    },
    {
      title: "Top Product",
      value: data.topProduct,
      icon: Package,
      color: "text-violet-600",
    },
    {
      title: "Low Stock Items",
      value: data.lowStockCount.toString(),
      icon: AlertTriangle,
      color: data.lowStockCount > 0 ? "text-red-600" : "text-muted-foreground",
      badge: data.lowStockCount > 0 ? (
        <Badge variant="destructive" className="ml-2">
          Needs attention
        </Badge>
      ) : (
        <Badge variant="secondary" className="ml-2">
          All good
        </Badge>
      ),
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {card.title}
            </CardTitle>
            <card.icon className={`h-4 w-4 ${card.color}`} />
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <div className="text-2xl font-bold">{card.value}</div>
              {card.badge}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
