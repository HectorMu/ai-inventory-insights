"use client";

import type { UIMessage } from "ai";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";
import { Bot, User, Shield, ShieldCheck, ShieldX, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";

function getMessageText(message: UIMessage): string {
  return message.parts
    .filter((part) => part.type === "text")
    .map((part) => (part as { text: string }).text)
    .join("");
}

function formatToolName(toolName: string): string {
  return toolName
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function formatToolInput(toolName: string, input: unknown): string {
  const obj = input as Record<string, unknown>;
  switch (toolName) {
    case "restock_order":
      return obj.productName
        ? `${obj.productName} × ${obj.quantity} units`
        : `Product #${obj.productId} × ${obj.quantity} units`;
    case "fulfill_order": {
      const parts = [`Order #${obj.orderId}`];
      if (obj.productName) parts.push(obj.productName as string);
      if (obj.quantity) parts.push(`× ${obj.quantity} units`);
      return parts.join(" - ");
    }
    case "bulk_restock": {
      const items = obj.items as Array<Record<string, unknown>> | undefined;
      if (!items) return "Unknown";
      return items
        .map((i) =>
          i.productName
            ? `${i.productName} × ${i.quantity} units`
            : `Product #${i.productId} × ${i.quantity} units`
        )
        .join(", ");
    }
    default:
      return JSON.stringify(input);
  }
}

interface ChatMessageProps {
  message: UIMessage;
  onApprove?: (approvalId: string) => void;
  onDeny?: (approvalId: string) => void;
}

export function ChatMessage({ message, onApprove, onDeny }: ChatMessageProps) {
  const isUser = message.role === "user";
  const textContent = getMessageText(message);

  const approvalParts = message.parts.filter(
    (part) =>
      part.type === "dynamic-tool" &&
      (part as { state: string }).state === "approval-requested"
  ) as Array<{
    type: "dynamic-tool";
    toolName: string;
    toolCallId: string;
    title?: string;
    state: "approval-requested";
    input: unknown;
    approval: { id: string; signature?: string };
  }>;

  const respondedParts = message.parts.filter(
    (part) =>
      part.type === "dynamic-tool" &&
      (part as { state: string }).state === "approval-responded"
  ) as Array<{
    type: "dynamic-tool";
    toolName: string;
    state: "approval-responded";
    approval: { id: string; approved: boolean };
  }>;

  return (
    <div className={cn("flex flex-col w-full", isUser ? "items-end" : "items-start")}>
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
        <div className="flex flex-col gap-2 max-w-2xl">
          <div className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs bg-muted mt-0.5">
              <Bot className="h-4 w-4" />
            </div>
            <div className="flex flex-col gap-2 flex-1">
              {textContent && (
                <div className="rounded-lg px-3 py-2 text-sm bg-muted text-foreground">
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {textContent}
                    </ReactMarkdown>
                  </div>
                </div>
              )}

              {approvalParts.map((part) => (
                <div
                  key={part.toolCallId}
                  className="rounded-lg border p-3 text-sm bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="h-4 w-4 text-amber-600" />
                    <span className="font-medium text-amber-800 dark:text-amber-200">
                      Approval Required
                    </span>
                  </div>
                  <p className="text-muted-foreground mb-1">
                    <span className="font-medium text-foreground">
                      {formatToolName(part.toolName)}
                    </span>
                    : {formatToolInput(part.toolName, part.input)}
                  </p>
                  <div className="flex gap-2 mt-2">
                    <Button
                      size="sm"
                      variant="default"
                      className="h-8 gap-1"
                      onClick={() => onApprove?.(part.approval.id)}
                    >
                      <Check className="h-3.5 w-3.5" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 gap-1"
                      onClick={() => onDeny?.(part.approval.id)}
                    >
                      <X className="h-3.5 w-3.5" />
                      Deny
                    </Button>
                  </div>
                </div>
              ))}

              {respondedParts.map((part) => (
                <div
                  key={part.approval.id}
                  className={cn(
                    "rounded-lg border p-3 text-sm flex items-center gap-2",
                    part.approval.approved
                      ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800"
                      : "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800"
                  )}
                >
                  {part.approval.approved ? (
                    <>
                      <ShieldCheck className="h-4 w-4 text-green-600" />
                      <span className="text-green-800 dark:text-green-200 font-medium">
                        Approved
                      </span>
                    </>
                  ) : (
                    <>
                      <ShieldX className="h-4 w-4 text-red-600" />
                      <span className="text-red-800 dark:text-red-200 font-medium">
                        Denied
                      </span>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
