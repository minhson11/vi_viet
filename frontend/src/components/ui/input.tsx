import React, { InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils/cn";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  rightElement?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type = "text",
      label,
      error,
      helperText,
      rightElement,
      id,
      ...props
    },
    ref
  ) => {
    const inputId =
      id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs font-semibold text-ink uppercase tracking-wider flex items-center justify-between"
          >
            <span>
              {label}
              {props.required && <span className="text-brand-red ml-1">*</span>}
            </span>
          </label>
        )}
        <div className="relative w-full">
          <input
            id={inputId}
            type={type}
            ref={ref}
            className={cn(
              "w-full h-10 px-3 py-2 bg-surface border border-border rounded-md text-sm text-ink placeholder:text-ink-light transition-all focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-transparent disabled:opacity-50 disabled:bg-gray-100",
              rightElement && "pr-10",
              error && "border-red-500 focus:ring-red-500",
              className
            )}
            {...props}
          />
          {rightElement && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-auto">
              {rightElement}
            </div>
          )}
        </div>
        {error ? (
          <p className="text-xs text-red-600 font-medium">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-ink-muted">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = "Input";
