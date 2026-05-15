import { SessionPanel } from "@/components/auth/session-panel";
import { UserDashboard } from "@/components/dashboard/user-dashboard";
import { AppShell } from "@/components/layout/app-shell";

export default function DashboardPage() {
  return (
    <AppShell>
      <div className="grid gap-6">
        <SessionPanel />
        <UserDashboard />
      </div>
    </AppShell>
  );
}
