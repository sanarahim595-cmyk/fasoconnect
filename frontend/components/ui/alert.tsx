import { HTMLAttributes, ReactNode } from "react";
import { AlertCircle, CheckCircle2, Info, TriangleAlert } from "lucide-react";

import { cn } from "@/lib/utils";

type AlertVariant = "info" | "success" | "warning" | "danger";

const config = {
  info: {
    icon: Info,
    className: "border-burkina-green/20 bg-burkina-green/10 text-burkina-green",
  },
  success: {
    icon: CheckCircle2,
    className: "border-burkina-green/20 bg-burkina-green/10 text-burkina-green",
  },
  warning: {
    icon: TriangleAlert,
    className: "border-burkina-yellow/30 bg-burkina-yellow/20 text-yellow-800",
  },
  danger: {
    icon: AlertCircle,
    className: "border-burkina-red/20 bg-burkina-red/10 text-burkina-red",
  },
};

type AlertProps = HTMLAttributes<HTMLDivElement> & {
  title?: string;
  children: ReactNode;
  variant?: AlertVariant;
};

export function Alert({ className, title, children, variant = "info", ...props }: AlertProps) {
  const Icon = config[variant].icon;

  return (
    <div
      className={cn(
        "flex gap-3 rounded-xl border p-4 shadow-sm",
        config[variant].className,
        className,
      )}
      role="status"
      {...props}
    >
      <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
      <div className="space-y-1">
        {title ? <p className="text-sm font-black">{title}</p> : null}
        <div className="text-sm leading-6 text-stone-700">{children}</div>
      </div>
    </div>
  );
}
