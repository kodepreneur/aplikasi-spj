import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "warning" | "danger" | "neutral";
}

export function Badge({ className, variant = "default", children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium tracking-wide",
        variant === "default" && "bg-teal-50 text-teal-800 border border-teal-200",
        variant === "success" && "bg-emerald-50 text-emerald-800 border border-emerald-200",
        variant === "warning" && "bg-amber-50 text-amber-800 border border-amber-200",
        variant === "danger" && "bg-rose-50 text-rose-800 border border-rose-200",
        variant === "neutral" && "bg-slate-100 text-slate-700 border border-slate-200",
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
