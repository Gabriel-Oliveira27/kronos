"use client";

import { useState, forwardRef, useId, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface PasswordInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
  error?: string;
  hint?: string;
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, label, error, hint, id, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const [visivel, setVisivel] = useState(false);

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-slate-700 dark:text-slate-200">
            {label}
          </label>
        )}
        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            type={visivel ? "text" : "password"}
            className={cn(
              "h-10 w-full rounded-lg border bg-white pr-10 pl-3 text-sm text-slate-900 placeholder:text-slate-400 transition-colors",
              "focus:outline-2 focus:outline-offset-1 focus:outline-brand-blue",
              "dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500",
              error ? "border-danger" : "border-slate-300 dark:border-slate-700",
              className
            )}
            aria-invalid={!!error}
            {...props}
          />
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setVisivel((v) => !v)}
            aria-label={visivel ? "Ocultar senha" : "Mostrar senha"}
            className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          >
            {visivel ? (
              // Olho fechado
              <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"
                  stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M1 1l22 22" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            ) : (
              // Olho aberto
              <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z"
                  stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6" />
              </svg>
            )}
          </button>
        </div>
        {hint && !error && <span className="text-xs text-slate-500 dark:text-slate-400">{hint}</span>}
        {error && <span className="text-xs text-danger">{error}</span>}
      </div>
    );
  }
);
PasswordInput.displayName = "PasswordInput";
