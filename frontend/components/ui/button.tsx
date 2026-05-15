import { ButtonHTMLAttributes, forwardRef } from "react";

import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg" | "icon";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

const variants: Record<ButtonVariant, string> = {
  primary: "bg-burkina-green text-white shadow-glow hover:bg-burkina-green/90",
  secondary: "bg-burkina-yellow text-night shadow-soft hover:bg-burkina-yellow/90",
  outline: "border border-stone-200 bg-white text-night hover:border-burkina-green/45 hover:bg-burkina-white",
  ghost: "text-stone-600 hover:bg-stone-100 hover:text-night",
  danger: "bg-burkina-red text-white shadow-soft hover:bg-burkina-red/90",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-4 text-sm",
  lg: "h-12 px-5 text-base",
  icon: "h-10 w-10 p-0",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", type = "button", ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg font-bold transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-burkina-green focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  ),
);

Button.displayName = "Button";
