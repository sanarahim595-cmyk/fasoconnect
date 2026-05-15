import { AppShell } from "@/components/layout/app-shell";
import { VotesManager } from "@/components/votes/votes-manager";

export default function VotesPage() {
  return (
    <AppShell>
      <VotesManager />
    </AppShell>
  );
}
