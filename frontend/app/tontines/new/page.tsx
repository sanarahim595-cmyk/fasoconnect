import { WalletCards } from "lucide-react";

import { CreateTontineForm } from "@/components/tontines/create-tontine-form";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";

export default function NewTontinePage() {
  return (
    <AppShell>
      <div className="grid gap-6 lg:grid-cols-[0.75fr_1.25fr] lg:items-start">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <WalletCards className="h-6 w-6 text-burkina-green" aria-hidden="true" />
              Créer une tontine
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-bold leading-7 text-stone-600">
              Une tontine claire commence par des règles simples : montant,
              fréquence, membres, ordre de passage et statut du cycle.
            </p>
          </CardContent>
        </Card>

        <CreateTontineForm />
      </div>
    </AppShell>
  );
}
