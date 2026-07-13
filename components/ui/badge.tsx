import * as React from "react";
import { cn } from "@/lib/utils";

type BadgeVariant = "primary" | "success" | "warning" | "danger" | "muted";

const variants: Record<BadgeVariant, string> = {
  primary: "bg-[rgba(10,132,255,0.14)] text-[#7cc4ff] border-[rgba(10,132,255,0.3)]",
  success: "bg-[rgba(31,208,117,0.12)] text-[#6ee7b7] border-[rgba(31,208,117,0.24)]",
  warning: "bg-[rgba(245,166,35,0.12)] text-[#fcd34d] border-[rgba(245,166,35,0.24)]",
  danger:  "bg-[rgba(232,64,64,0.12)] text-[#fca5a5] border-[rgba(232,64,64,0.24)]",
  muted:   "bg-[var(--color-surface-3)] text-[var(--color-muted-foreground)] border-[var(--color-border)]",
};

export function Badge({
  variant = "muted",
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { variant?: BadgeVariant }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-semibold capitalize leading-none tracking-wide",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
