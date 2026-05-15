"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Users, WalletCards } from "lucide-react";

import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle, EmptyState, PageHeader, StatCard } from "@/components/ui";
import { getMyTontines, Tontine } from "@/lib/api";
import { getSessionToken } from "@/lib/auth";

export function MyTontines() {
  const [tontines, setTontines] = useState<Tontine[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getSessionToken();
    if (!token) {
      setLoading(false);
      return;
    }
    getMyTontines(token)
      .then(setTontines)
      .catch(() => setTontines([]))
      .finally(() => setLoading(false));
  }, []);

  const activeCount = useMemo(() => tontines.filter((item) => item.status === "active").length, [tontines]);
  const lateCount = useMemo(() => tontines.reduce((sum, item) => sum + (item.late_contributions_count ?? 0), 0), [tontines]);

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow="Mes tontines"
        title="Toutes tes tontines"
        description="Crée une tontine, ouvre son détail, suis les membres, les cotisations et les retards."
        actions={<Link className="inline-flex h-11 items-center rounded-lg bg-burkina-green px-4 text-sm font-black text-white" href="/tontines/new">Créer une tontine</Link>}
      />

      <section className="grid gap-4 md:grid-cols-3">
        <StatCard icon={Users} label="Tontines" value={String(tontines.length)} />
        <StatCard icon={WalletCards} label="Actives" value={String(activeCount)} tone="yellow" />
        <StatCard icon={AlertTriangle} label="Retards" value={String(lateCount)} tone={lateCount ? "red" : "green"} />
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Liste de mes tontines</CardTitle>
          <CardDescription>Les tontines créées apparaissent ici immédiatement.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <EmptyState icon={WalletCards} title="Chargement" description="Synchronisation des tontines." />
          ) : tontines.length ? (
            <div className="grid gap-3 lg:grid-cols-2">
              {tontines.map((tontine) => (
                <article key={tontine.id} className="rounded-xl border border-stone-100 bg-stone-50 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-black text-night">{tontine.name}</h3>
                      <p className="mt-1 text-sm font-bold text-stone-500">{formatMoney(tontine.contribution_amount)} · {frequencyLabel(tontine.frequency)}</p>
                    </div>
                    <Badge variant={tontine.status === "active" ? "green" : "yellow"}>{statusLabel(tontine.status)}</Badge>
                  </div>
                  <p className="mt-4 text-sm leading-6 text-stone-600">{tontine.description || "Tontine sans description."}</p>
                  <div className="mt-4 flex flex-wrap gap-2 text-xs font-black text-stone-600">
                    <span className="rounded-lg bg-white px-3 py-2">{tontine.members_count ?? 0} membre(s)</span>
                    <span className="rounded-lg bg-white px-3 py-2">{tontine.contributions_count ?? 0} cotisation(s)</span>
                    <span className="rounded-lg bg-white px-3 py-2">{tontine.late_contributions_count ?? 0} retard(s)</span>
                  </div>
                  <Link className="mt-4 inline-flex h-10 items-center rounded-lg bg-burkina-green px-4 text-sm font-black text-white" href={`/tontines/${tontine.id}`}>
                    Voir détail
                  </Link>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState icon={CheckCircle2} title="Aucune tontine" description="Crée ta première tontine pour démarrer le cycle." />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XOF", maximumFractionDigits: 0 }).format(value);
}

function frequencyLabel(value: string) {
  return { daily: "Quotidienne", weekly: "Hebdomadaire", monthly: "Mensuelle" }[value] ?? value;
}

function statusLabel(value: string) {
  return { draft: "Brouillon", active: "Active", completed: "Terminée" }[value] ?? value;
}
