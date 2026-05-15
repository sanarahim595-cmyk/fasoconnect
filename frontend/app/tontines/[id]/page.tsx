import { AppShell } from "@/components/layout/app-shell";
import { TontineDetail } from "@/components/tontines/tontine-detail";

export default async function TontineDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <AppShell>
      <TontineDetail id={id} />
    </AppShell>
  );
}
