import { AppShell } from "@/components/layout/app-shell";
import { ProjectsManager } from "@/components/projets/projects-manager";

export default function ProjetsPage() {
  return (
    <AppShell>
      <ProjectsManager />
    </AppShell>
  );
}
