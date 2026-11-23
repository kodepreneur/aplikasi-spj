import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "danger" | "ghost" | "link";
  size?: "sm" | "md" | "lg" | "icon";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", children, disabled, type = "button", ...props }, ref) => {
    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled}
        className={cn(
          "inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer",
          // Variants
          variant === "primary" &&
            "bg-[#006d63] text-white hover:bg-[#07564f] active:bg-[#05413c] focus-visible:ring-[#006d63] shadow-xs",
          variant === "secondary" &&
            "bg-[#122d40] text-white hover:bg-[#1b3d54] active:bg-[#0e2332] focus-visible:ring-[#122d40] shadow-xs",
          variant === "outline" &&
            "border border-slate-300 bg-white text-slate-800 hover:bg-slate-50 active:bg-slate-100 focus-visible:ring-slate-400 shadow-2xs",
          variant === "danger" &&
            "bg-rose-700 text-white hover:bg-rose-800 active:bg-rose-900 focus-visible:ring-rose-700 shadow-xs",
          variant === "ghost" &&
            "text-slate-700 hover:bg-slate-100 active:bg-slate-200 focus-visible:ring-slate-300",
          variant === "link" &&
            "text-[#006d63] underline-offset-4 hover:underline focus-visible:ring-[#006d63] p-0 h-auto",
          // Sizes
          size === "sm" && "text-xs px-2.5 py-1.5 rounded-md gap-1.5",
          size === "md" && "text-sm px-3.5 py-2 rounded-md gap-2",
          size === "lg" && "text-base px-5 py-2.5 rounded-lg gap-2.5",
          size === "icon" && "h-9 w-9 rounded-md",
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
