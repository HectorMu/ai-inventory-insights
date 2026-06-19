"use client";

import * as React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { cn } from "@/lib/utils";

const COLORS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
];

interface ChartProps {
  data: { label: string; value: number; [key: string]: string | number }[];
  type: "bar" | "line" | "pie";
  dataKey?: string;
  nameKey?: string;
  className?: string;
}

export function Chart({ data, type, dataKey = "value", nameKey = "label", className }: ChartProps) {
  if (!data || data.length === 0) {
    return <div className="text-sm text-muted-foreground py-4 text-center">No data available</div>;
  }

  if (type === "pie") {
    return (
      <div className={cn("w-full", className)}>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={data}
              dataKey={dataKey}
              nameKey={nameKey}
              cx="50%"
              cy="50%"
              outerRadius={80}
              label={({ name, percent = 0 }) =>
                `${name} ${(percent * 100).toFixed(0)}%`
              }
            >
              {data.map((_, index) => (
                <Cell key={index} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  }

  const ChartComponent = type === "bar" ? BarChart : LineChart;
  const DataComponent = type === "bar" ? Bar : Line;

  return (
    <div className={cn("w-full", className)}>
      <ResponsiveContainer width="100%" height={250}>
        <ChartComponent data={data}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis
            dataKey={nameKey}
            tick={{ fontSize: 12 }}
            className="text-muted-foreground"
          />
          <YAxis tick={{ fontSize: 12 }} className="text-muted-foreground" />
          <Tooltip
            contentStyle={{
              background: "var(--background)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius)",
            }}
          />
          <DataComponent
            type="monotone"
            dataKey={dataKey}
            fill="var(--color-chart-1)"
            stroke="var(--color-chart-1)"
            strokeWidth={2}
          />
        </ChartComponent>
      </ResponsiveContainer>
    </div>
  );
}
