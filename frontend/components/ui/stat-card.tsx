import { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Card } from "./card";

type StatCardProps = {
  label: string;
  value: string;
  trend?: string;
  icon: LucideIcon;
  tone?: "green" | "red" | "yellow";
  className?: string;
};

const tones = {
  green: "bg-burkina-green/10 text-burkina-green",
  red: "bg-burkina-red/10 text-burkina-red",
  yellow: "bg-burkina-yellow/20 text-yellow-800",
};

export function StatCard({ label, value, trend, icon: Icon, tone = "green", className }: StatCardProps) {
  return (
    <Card className={cn("p-5", className)}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-stone-500">{label}</p>
          <p className="mt-2 text-3xl font-black tracking-normal text-night">{value}</p>
        </div>
        <div className={cn("grid h-11 w-11 place-items-center rounded-lg", tones[tone])}>
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
      </div>
      {trend ? <p className="mt-4 text-sm font-bold text-burkina-green">{trend}</p> : null}
    </Card>
  );
}
