import { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type BadgeVariant = "green" | "red" | "yellow" | "white" | "neutral";

const variants: Record<BadgeVariant, string> = {
  green: "border-burkina-green/20 bg-burkina-green/10 text-burkina-green",
  red: "border-burkina-red/20 bg-burkina-red/10 text-burkina-red",
  yellow: "border-burkina-yellow/30 bg-burkina-yellow/20 text-yellow-800",
  white: "border-white/40 bg-white/80 text-night",
  neutral: "border-stone-200 bg-stone-100 text-stone-700",
};

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant;
};

export function Badge({ className, variant = "neutral", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex h-7 items-center rounded-full border px-2.5 text-xs font-black",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
