import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded border px-2 py-0.5 text-xs font-semibold transition-colors tracking-wide uppercase",
  {
    variants: {
      variant: {
        default: "border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--color-foreground)]",
        primary: "border-indigo-500/30 bg-indigo-500/10 text-indigo-300",
        success: "border-green-500/30 bg-green-500/10 text-green-400",
        warning: "border-amber-500/30 bg-amber-500/10 text-amber-400",
        danger: "border-red-500/30 bg-red-500/10 text-red-400",
        muted: "border-transparent bg-[var(--color-surface-3)] text-[var(--color-muted-foreground)]",
        outline: "border-[var(--color-border)] bg-transparent text-[var(--color-muted-foreground)]",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
