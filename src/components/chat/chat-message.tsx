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

interface ToolInvocationPart {
  toolInvocation: {
    state: string;
    result: unknown;
    toolName: string;
  };
}

function extractChartsFromToolResults(message: UIMessage): ChartInfo[] {
  const charts: ChartInfo[] = [];

  for (const part of message.parts) {
    if (part.type !== "tool-invocation") continue;

    const invocation = (part as unknown as ToolInvocationPart).toolInvocation;
    if (!invocation || invocation.state !== "result") continue;

    const output = invocation.result;
    if (!Array.isArray(output) || output.length === 0) continue;

    const keys = Object.keys(output[0]);
    const labelKey = keys.find((k) => k !== "value" && k !== "revenue" && k !== "quantity" && k !== "count" && k !== "revenue");
    const valueKey = keys.find((k) => k === "value" || k === "revenue" || k === "quantity" || k === "count");

    if (labelKey && valueKey) {
      charts.push({
        data: output.map((item: Record<string, unknown>) => ({
          label: String(item[labelKey] ?? item.name ?? item.category ?? ""),
          value: Number(item[valueKey] ?? 0),
        })),
        type: invocation.toolName === "get_category_breakdown" ? "pie" : "bar",
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

  return (
    <div className={cn("flex gap-3", isUser ? "flex-row-reverse" : "flex-row")}>
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs",
          isUser ? "bg-primary text-primary-foreground" : "bg-muted"
        )}
      >
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>

      <div
        className={cn(
          "flex flex-col gap-2 max-w-[80%]",
          isUser ? "items-end" : "items-start"
        )}
      >
        <div
          className={cn(
            "rounded-lg px-3 py-2 text-sm",
            isUser
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-foreground"
          )}
        >
          {isUser ? (
            <p>{textContent}</p>
          ) : (
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {textContent}
              </ReactMarkdown>
            </div>
          )}
        </div>

        {charts.map((chart, i) => (
          <div
            key={i}
            className="w-full max-w-sm bg-card border rounded-lg p-3"
          >
            <Chart data={chart.data} type={chart.type} />
          </div>
        ))}
      </div>
    </div>
  );
}
