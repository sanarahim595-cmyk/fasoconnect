import { PlatformAdminDashboard } from "@/components/admin/platform-admin-dashboard";
import { AppShell } from "@/components/layout/app-shell";

export default function AdminPage() {
  return (
    <AppShell>
      <PlatformAdminDashboard />
    </AppShell>
  );
}
