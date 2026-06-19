"use client";

import type { UIMessage } from "ai";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";
import { Chart } from "@/components/ui/chart";
import { Bot, User } from "lucide-react";

interface ChartDataItem {
  label: string;
  value: number;
  [key: string]: string | number;
}

interface ChartInfo {
  data: ChartDataItem[];
  type: "bar" | "pie";
}

function getMessageText(message: UIMessage): string {
  return message.parts
    .filter((part) => part.type === "text")
    .map((part) => (part as { text: string }).text)
    .join("");
}

interface DynamicToolPart {
  type: "dynamic-tool";
  toolName: string;
  state: string;
  output: unknown;
}

function extractChartsFromToolResults(message: UIMessage): ChartInfo[] {
  const charts: ChartInfo[] = [];

  for (const part of message.parts) {
    if (part.type !== "dynamic-tool") continue;
    const tool = part as unknown as DynamicToolPart;
    if (tool.state !== "output-available" && tool.state !== "result") continue;

    let output = tool.output;
    if (typeof output === "string") {
      try { output = JSON.parse(output); } catch { continue; }
    }
    if (!Array.isArray(output) || output.length === 0) continue;

    const keys = Object.keys(output[0]);
    const labelKey = keys.find(
      (k) => k !== "value" && k !== "revenue" && k !== "quantity" && k !== "count"
    );
    const valueKey = keys.find(
      (k) => k === "value" || k === "revenue" || k === "quantity" || k === "count"
    );

    if (labelKey && valueKey) {
      charts.push({
        data: output.map((item: Record<string, unknown>) => ({
          label: String(item[labelKey] ?? item.name ?? item.category ?? ""),
          value: Number(item[valueKey] ?? 0),
        })),
        type: tool.toolName === "get_category_breakdown" ? "pie" : "bar",
      });
    }
  }

  return charts;
}

interface ChatMessageProps {
  message: UIMessage;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";
  const textContent = getMessageText(message);
  const charts = !isUser ? extractChartsFromToolResults(message) : [];
  const hasCharts = charts.length > 0;

  return (
    <div className={cn("flex flex-col w-full", isUser ? "items-end" : "items-center")}>
      {isUser ? (
        <div className="flex items-end gap-3 max-w-[75%]">
          <div className="rounded-lg px-3 py-2 text-sm bg-primary text-primary-foreground">
            <p>{textContent}</p>
          </div>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs bg-primary text-primary-foreground">
            <User className="h-4 w-4" />
          </div>
        </div>
      ) : (
        <div className={cn("flex flex-col gap-2 w-full", hasCharts ? "max-w-2xl" : "max-w-2xl")}>
          <div className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs bg-muted mt-0.5">
              <Bot className="h-4 w-4" />
            </div>
            <div className="rounded-lg px-3 py-2 text-sm bg-muted text-foreground flex-1 min-w-0">
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {textContent}
                </ReactMarkdown>
              </div>
            </div>
          </div>

          {charts.map((chart, i) => (
            <div key={i} className="w-full bg-card border rounded-lg p-3">
              <Chart data={chart.data} type={chart.type} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
