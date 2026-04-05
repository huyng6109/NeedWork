import { forwardRef } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      hint,
      className,
      id,
      spellCheck = false,
      autoCorrect = "off",
      autoCapitalize = "off",
      ...props
    },
    ref
  ) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-dark">
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          spellCheck={spellCheck}
          autoCorrect={autoCorrect}
          autoCapitalize={autoCapitalize}
          className={cn(
            "w-full rounded-lg border border-border theme-input px-3 py-2 text-sm text-dark placeholder:text-muted",
            "focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            error && "border-red-500 focus:ring-red-500",
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-red-500">{error}</p>}
        {hint && !error && <p className="text-xs text-muted">{hint}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";
