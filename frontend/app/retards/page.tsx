import { AppShell } from "@/components/layout/app-shell";
import { LatePaymentsManager } from "@/components/retards/late-payments-manager";

export default function RetardsPage() {
  return (
    <AppShell>
      <LatePaymentsManager />
    </AppShell>
  );
}
