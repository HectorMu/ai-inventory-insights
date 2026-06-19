"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Nav } from "@/components/dashboard/nav";
import { ChatPanel } from "@/components/chat/chat-panel";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [chatWidth, setChatWidth] = useState(380);
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const newWidth = rect.right - e.clientX;
      const clamped = Math.max(280, Math.min(800, newWidth));
      setChatWidth(clamped);
    },
    [isResizing]
  );

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, handleMouseMove, handleMouseUp]);

  return (
    <div className="flex flex-col h-screen">
      <Nav />
      <div ref={containerRef} className="flex-1 flex overflow-hidden">
        <div className="flex-1 min-w-0 overflow-auto p-6">{children}</div>
        <div
          className="w-2 bg-border hover:bg-primary/40 transition-colors cursor-col-resize shrink-0 relative"
          onMouseDown={handleMouseDown}
        >
          <div className="absolute inset-y-0 -left-1 -right-1" />
        </div>
        <div
          className="shrink-0 overflow-hidden"
          style={{ width: chatWidth }}
        >
          <ChatPanel />
        </div>
      </div>
    </div>
  );
}
