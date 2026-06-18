import { type InputHTMLAttributes, forwardRef, useId } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, id, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-slate-700 dark:text-slate-200">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            "h-10 rounded-lg border bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 transition-colors",
            "focus:outline-2 focus:outline-offset-1 focus:outline-brand-blue",
            "dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500",
            error
              ? "border-danger"
              : "border-slate-300 dark:border-slate-700",
            className
          )}
          aria-invalid={!!error}
          {...props}
        />
        {hint && !error && <span className="text-xs text-slate-500 dark:text-slate-400">{hint}</span>}
        {error && <span className="text-xs text-danger">{error}</span>}
      </div>
    );
  }
);
Input.displayName = "Input";
