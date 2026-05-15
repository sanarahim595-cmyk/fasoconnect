import { LucideIcon } from "lucide-react";
import { ReactNode } from "react";

import { cn } from "@/lib/utils";
import { Button } from "./button";

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  children?: ReactNode;
  className?: string;
};

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  children,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn("grid place-items-center rounded-xl border border-dashed border-stone-300 bg-white/70 p-8 text-center", className)}>
      <div className="grid max-w-sm place-items-center">
        <div className="grid h-14 w-14 place-items-center rounded-full bg-burkina-green/10 text-burkina-green">
          <Icon className="h-7 w-7" aria-hidden="true" />
        </div>
        <h3 className="mt-4 text-lg font-black text-night">{title}</h3>
        <p className="mt-2 text-sm leading-6 text-stone-600">{description}</p>
        {actionLabel ? (
          <Button className="mt-5" size="sm" onClick={onAction}>
            {actionLabel}
          </Button>
        ) : null}
        {children}
      </div>
    </div>
  );
}
