import { InputHTMLAttributes, forwardRef } from "react";

import { cn } from "@/lib/utils";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  hint?: string;
  error?: string;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, hint, error, id, ...props }, ref) => {
    const inputId = id ?? props.name;

    return (
      <label className="grid gap-2 text-sm font-semibold text-stone-700" htmlFor={inputId}>
        {label ? <span>{label}</span> : null}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            "h-11 rounded-lg border border-stone-200 bg-white px-3 text-sm text-night shadow-sm outline-none transition placeholder:text-stone-400 focus:border-burkina-green focus:ring-4 focus:ring-burkina-green/10",
            error && "border-burkina-red focus:border-burkina-red focus:ring-burkina-red/10",
            className,
          )}
          {...props}
        />
        {error ? <span className="text-xs font-medium text-burkina-red">{error}</span> : null}
        {!error && hint ? <span className="text-xs font-medium text-stone-500">{hint}</span> : null}
      </label>
    );
  },
);

Input.displayName = "Input";
