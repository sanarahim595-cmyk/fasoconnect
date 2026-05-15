import { AppShell } from "@/components/layout/app-shell";
import { ContributionsManager } from "@/components/cotisations/contributions-manager";

export default function CotisationsPage() {
  return (
    <AppShell>
      <ContributionsManager />
    </AppShell>
  );
}
