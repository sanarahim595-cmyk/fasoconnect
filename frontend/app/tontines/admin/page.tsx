import { AppShell } from "@/components/layout/app-shell";
import { TontineAdminDashboard } from "@/components/tontines/tontine-admin-dashboard";

export default function TontineAdminPage() {
  return (
    <AppShell>
      <TontineAdminDashboard />
    </AppShell>
  );
}
