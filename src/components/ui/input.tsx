import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="flex flex-col gap-1 w-full text-left">
        {label && (
          <label htmlFor={inputId} className="text-xs font-semibold text-slate-700">
            {label}
            {props.required && <span className="text-rose-600 ml-0.5">*</span>}
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
          className={cn(
            "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#006d63] focus:outline-none focus:ring-1 focus:ring-[#006d63] disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500 shadow-2xs transition-colors",
            error && "border-rose-500 focus:border-rose-500 focus:ring-rose-500",
            className
          )}
          {...props}
        />
        {hint && !error && <span className="text-[11px] text-slate-500">{hint}</span>}
        {error && <span className="text-[11px] text-rose-600 font-medium">{error}</span>}
      </div>
    );
  }
);
Input.displayName = "Input";
