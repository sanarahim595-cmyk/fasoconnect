"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AlertTriangle, CalendarClock, History, Users, WalletCards, type LucideIcon } from "lucide-react";

import { Alert, Badge, Card, CardContent, CardDescription, CardHeader, CardTitle, EmptyState, PageHeader, StatCard } from "@/components/ui";
import { getTontineFull, TontineFull } from "@/lib/api";
import { getSessionToken } from "@/lib/auth";

export function TontineDetail({ id }: { id: string }) {
  const [tontine, setTontine] = useState<TontineFull | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getSessionToken();
    if (!token) {
      setLoading(false);
      return;
    }
    getTontineFull(id, token)
      .then(setTontine)
      .catch(() => setTontine(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <EmptyState icon={WalletCards} title="Chargement" description="Ouverture de la tontine." />;
  }

  if (!tontine) {
    return <EmptyState icon={WalletCards} title="Tontine indisponible" description="Connecte-toi avec le compte qui a créé cette tontine." />;
  }

  const rules = tontine.rules || {};
  const internalRules = typeof rules.internal_rules === "string" ? rules.internal_rules : "Aucune règle détaillée enregistrée.";
  const payoutMode = rules.payout_order_mode === "automatic" ? "Automatique" : "Manuel";

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow="Détail tontine"
        title={tontine.name}
        description={tontine.description || "Vue complète des membres, règles, cotisations et incidents."}
        actions={<Link className="inline-flex h-11 items-center rounded-lg bg-burkina-green px-4 text-sm font-black text-white" href="/tontines/admin">Administrer</Link>}
      />

      <section className="grid gap-4 md:grid-cols-4">
        <StatCard icon={Users} label="Membres" value={String(tontine.members.length)} />
        <StatCard icon={WalletCards} label="Cotisation" value={formatShortMoney(tontine.contribution_amount)} tone="yellow" />
        <StatCard icon={CalendarClock} label="Début" value={formatDate(tontine.start_date)} />
        <StatCard icon={AlertTriangle} label="Retards" value={String(tontine.late_contributions_count ?? 0)} tone={(tontine.late_contributions_count ?? 0) ? "red" : "green"} />
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Règles de la tontine</CardTitle>
            <CardDescription>Contrat numérique visible par les membres.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm font-bold text-stone-600">
            <p className="rounded-xl bg-stone-50 p-4">Montant : {formatMoney(tontine.contribution_amount)} · Fréquence : {frequencyLabel(tontine.frequency)}.</p>
            <p className="rounded-xl bg-stone-50 p-4">{internalRules}</p>
            <Alert variant="info" title="Ordre de passage">Mode {payoutMode}. {tontine.payout_order_locked ? "Ordre verrouillé." : "Ordre modifiable."}</Alert>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Actions rapides</CardTitle>
            <CardDescription>Modules prioritaires de cette tontine.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <QuickLink href="/membres" label="Voir les membres" icon={Users} />
            <QuickLink href="/cotisations" label="Gérer les cotisations" icon={WalletCards} />
            <QuickLink href="/retards" label="Suivre les retards" icon={AlertTriangle} />
            <QuickLink href="/votes" label="Lancer un vote" icon={History} />
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Membres</CardTitle>
          <CardDescription>Participants liés à cette tontine.</CardDescription>
        </CardHeader>
        <CardContent>
          {tontine.members.length ? (
            <div className="grid gap-3 md:grid-cols-2">
              {tontine.members.map((member) => (
                <div key={member.id} className="rounded-xl bg-stone-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-black text-night">{member.full_name}</p>
                      <p className="mt-1 text-sm font-bold text-stone-500">{member.phone || member.email || "Contact non renseigné"}</p>
                    </div>
                    <Badge variant={member.role === "administrator" ? "green" : "yellow"}>{roleLabel(member.role)}</Badge>
                  </div>
                  <p className="mt-3 text-sm font-bold text-stone-600">Statut : {member.status} · Passage : {member.payout_position ?? "-"}</p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon={Users} title="Aucun membre" description="Le créateur apparaîtra ici automatiquement." />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function QuickLink({ href, label, icon: Icon }: { href: string; label: string; icon: LucideIcon }) {
  return (
    <Link className="flex items-center gap-3 rounded-xl bg-stone-50 p-4 font-black text-night transition hover:bg-burkina-green/10" href={href}>
      <Icon className="h-5 w-5 text-burkina-green" aria-hidden="true" />
      {label}
    </Link>
  );
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XOF", maximumFractionDigits: 0 }).format(value);
}

function formatShortMoney(value: number) {
  if (value >= 1000) return `${Math.round(value / 1000)}k`;
  return String(value);
}

function formatDate(value?: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short" }).format(new Date(value));
}

function frequencyLabel(value: string) {
  return { daily: "Quotidienne", weekly: "Hebdomadaire", monthly: "Mensuelle" }[value] ?? value;
}

function roleLabel(value: string) {
  return { administrator: "Admin", treasurer: "Trésorier", member: "Membre" }[value] ?? value;
}
