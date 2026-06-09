"use client";

import { useState, useRef, type ReactNode } from "react";
import { cn } from "@/lib/cn";

type Side = "top" | "bottom" | "left" | "right";

type Props = {
  content: string;
  side?: Side;
  children: ReactNode;
  className?: string;
};

const sidePositions: Record<Side, string> = {
  top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
  bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
  left: "right-full top-1/2 -translate-y-1/2 mr-2",
  right: "left-full top-1/2 -translate-y-1/2 ml-2",
};

export function AdminTooltip({ content, side = "top", children, className }: Props) {
  const [visible, setVisible] = useState(false);
  const timeout = useRef<ReturnType<typeof setTimeout>>(undefined);

  function show() {
    clearTimeout(timeout.current);
    timeout.current = setTimeout(() => setVisible(true), 400);
  }

  function hide() {
    clearTimeout(timeout.current);
    setVisible(false);
  }

  return (
    <span
      className={cn("relative inline-flex", className)}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}
      {visible && (
        <span
          role="tooltip"
          className={cn(
            "pointer-events-none absolute z-50 whitespace-nowrap rounded-lg bg-[var(--admin-ink)] px-2.5 py-1.5 font-sans text-[11px] font-medium text-white shadow-lg",
            "animate-[admin-tooltip-in_0.15s_cubic-bezier(0.22,1,0.36,1)]",
            sidePositions[side],
          )}
        >
          {content}
        </span>
      )}
    </span>
  );
}
