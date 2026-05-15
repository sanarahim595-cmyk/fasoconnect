"use client";

import { FormEvent, ReactNode, useMemo, useState } from "react";
import {
  CalendarClock,
  CheckCircle2,
  Clock3,
  FileCheck2,
  History,
  Loader2,
  ReceiptText,
  XCircle,
  type LucideIcon,
} from "lucide-react";

import { Alert, Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, EmptyState, Input, PageHeader, StatCard } from "@/components/ui";
import { ContributionStatus, markContributionAsPaid } from "@/lib/api";
import { getSessionToken } from "@/lib/auth";

type ContributionItem = {
  id: string;
  member: string;
  tontine: string;
  cycle: number;
  dueDate: string;
  paidAt?: string;
  amountDue: number;
  amountPaid: number;
  proof?: string;
  status: ContributionStatus;
};

const initialContributions: ContributionItem[] = [
  {
    id: "demo-001",
    member: "Awa Ouedraogo",
    tontine: "Tontine Wend-Panga",
    cycle: 4,
    dueDate: "2026-05-16",
    amountDue: 10000,
    amountPaid: 0,
    status: "pending",
  },
  {
    id: "demo-002",
    member: "Oumar Sawadogo",
    tontine: "Tontine Wend-Panga",
    cycle: 4,
    dueDate: "2026-05-10",
    amountDue: 10000,
    amountPaid: 0,
    status: "late",
  },
  {
    id: "demo-003",
    member: "Mariam Kabore",
    tontine: "Tontine Wend-Panga",
    cycle: 3,
    dueDate: "2026-05-03",
    paidAt: "2026-05-03",
    amountDue: 10000,
    amountPaid: 10000,
    proof: "Recu caisse #FT-2026-003",
    status: "paid",
  },
  {
    id: "demo-004",
    member: "Paul Ilboudo",
    tontine: "Tontine Wend-Panga",
    cycle: 2,
    dueDate: "2026-04-26",
    amountDue: 10000,
    amountPaid: 0,
    status: "cancelled",
  },
];

const statusLabels: Record<ContributionStatus, string> = {
  paid: "Paye",
  pending: "En attente",
  late: "En retard",
  cancelled: "Annule",
};

const statusTone: Record<ContributionStatus, "green" | "yellow" | "red" | "neutral"> = {
  paid: "green",
  pending: "yellow",
  late: "red",
  cancelled: "neutral",
};

export function ContributionsManager() {
  const [contributions, setContributions] = useState(initialContributions);
  const [selected, setSelected] = useState<ContributionItem | null>(initialContributions[0]);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const expected = useMemo(() => contributions.filter((item) => item.status === "pending" || item.status === "late"), [contributions]);
  const history = useMemo(() => contributions.filter((item) => item.status === "paid" || item.status === "cancelled"), [contributions]);
  const paidTotal = contributions.filter((item) => item.status === "paid").reduce((sum, item) => sum + item.amountPaid, 0);

  async function handleMarkPaid(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    setSuccess(null);
    setError(null);

    const form = new FormData(formElement);
    const contributionId = String(form.get("contribution_id") ?? "").trim();
    const amountPaid = Number(form.get("amount_paid"));
    const paidAt = String(form.get("paid_at") ?? "").trim();
    const proof = String(form.get("proof") ?? "").trim();

    if (!contributionId) {
      setError("Selectionne une cotisation a valider.");
      return;
    }
    if (!Number.isFinite(amountPaid) || amountPaid <= 0) {
      setError("Le montant paye doit etre superieur a zero.");
      return;
    }

    const localItem = contributions.find((item) => item.id === contributionId);
    const token = getSessionToken();
    setLoadingId(contributionId);

    try {
      if (token && !contributionId.startsWith("demo-")) {
        await markContributionAsPaid(
          contributionId,
          {
            amount_paid: amountPaid,
            paid_at: paidAt ? new Date(paidAt).toISOString() : undefined,
            proof_url: proof || undefined,
          },
          token,
        );
      }

      setContributions((items) =>
        items.map((item) =>
          item.id === contributionId
            ? {
                ...item,
                amountPaid,
                paidAt: paidAt || new Date().toISOString().slice(0, 10),
                proof: proof || "Preuve non fournie",
                status: "paid",
              }
            : item,
        ),
      );
      setSuccess(`${localItem?.member ?? "La cotisation"} est maintenant marquee comme payee.`);
      formElement.reset();
      setSelected(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Validation du paiement impossible.");
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow="Gestion des cotisations"
        title="Paiements attendus et historique"
        description="Validation manuelle des cotisations avec date, montant et preuve facultative. Aucun Mobile Money reel n'est connecte."
      />

      <section className="grid gap-4 md:grid-cols-3">
        <StatCard icon={Clock3} label="En attente" value={String(expected.filter((item) => item.status === "pending").length)} />
        <StatCard icon={CalendarClock} label="En retard" value={String(expected.filter((item) => item.status === "late").length)} tone="red" />
        <StatCard icon={FileCheck2} label="Montant valide" value={formatMoney(paidTotal)} tone="green" />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle>Liste des paiements attendus</CardTitle>
                <CardDescription>Cotisations en attente ou en retard a valider par un administrateur.</CardDescription>
              </div>
              <Badge variant="yellow">{expected.length} attendus</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {expected.length ? (
              <div className="grid gap-3">
                {expected.map((item) => (
                  <ContributionRow
                    key={item.id}
                    item={item}
                    action={
                      <Button onClick={() => setSelected(item)} size="sm" type="button">
                        <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                        Marquer comme paye
                      </Button>
                    }
                  />
                ))}
              </div>
            ) : (
              <EmptyState icon={ReceiptText} title="Aucun paiement attendu" description="Toutes les cotisations sont a jour pour le moment." />
            )}
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <div className="h-2 bg-gradient-to-r from-burkina-green via-burkina-yellow to-burkina-red" />
          <CardHeader>
            <CardTitle>Validation manuelle</CardTitle>
            <CardDescription>Ajoute uniquement une preuve de paiement si elle existe.</CardDescription>
          </CardHeader>
          <CardContent>
            <form key={selected?.id ?? "empty-selection"} className="grid gap-4" onSubmit={handleMarkPaid}>
              <Input label="ID de cotisation" name="contribution_id" readOnly required value={selected?.id ?? ""} />
              <Input label="Membre" readOnly value={selected?.member ?? ""} />
              <Input
                label="Montant paye"
                min="1"
                name="amount_paid"
                placeholder="10000"
                required
                type="number"
                defaultValue={selected?.amountDue ?? ""}
              />
              <Input label="Date de paiement" name="paid_at" type="date" />
              <Input label="Preuve de paiement facultative" name="proof" placeholder="Lien photo, reference papier, numero de recu..." />

              {error ? <Alert title="Validation impossible" variant="danger">{error}</Alert> : null}
              {success ? <Alert title="Paiement valide" variant="success">{success}</Alert> : null}

              <Button className="w-full" disabled={!selected || loadingId === selected.id} size="lg" type="submit">
                {loadingId === selected?.id ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> : <CheckCircle2 className="h-5 w-5" aria-hidden="true" />}
                Marquer comme paye
              </Button>
            </form>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle>Historique des cotisations</CardTitle>
              <CardDescription>Paiements valides, annules et preuves conservees.</CardDescription>
            </div>
            <Badge variant="green">{history.length} lignes</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {history.length ? (
            <div className="grid gap-3">
              {history.map((item) => (
                <ContributionRow key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <EmptyState icon={History} title="Historique vide" description="Les paiements valides apparaitront ici." />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ContributionRow({ item, action }: { item: ContributionItem; action?: ReactNode }) {
  return (
    <article className="rounded-xl border border-stone-100 bg-stone-50 p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-black text-night">{item.member}</h3>
            <Badge variant={statusTone[item.status]}>{statusLabels[item.status]}</Badge>
          </div>
          <p className="mt-1 text-sm font-bold text-stone-500">
            {item.tontine} · Cycle {item.cycle}
          </p>
        </div>
        {action}
      </div>

      <div className="mt-4 grid gap-3 text-sm font-bold text-stone-600 sm:grid-cols-2 lg:grid-cols-4">
        <Meta icon={CalendarClock} label="Echeance" value={formatDate(item.dueDate)} />
        <Meta icon={ReceiptText} label="Montant attendu" value={formatMoney(item.amountDue)} />
        <Meta icon={CheckCircle2} label="Montant paye" value={formatMoney(item.amountPaid)} />
        <Meta icon={item.status === "cancelled" ? XCircle : FileCheck2} label="Preuve" value={item.proof ?? "Facultative"} />
      </div>
    </article>
  );
}

function Meta({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg bg-white p-3">
      <Icon className="h-4 w-4 text-burkina-green" aria-hidden="true" />
      <div>
        <p className="text-[11px] uppercase tracking-wide text-stone-400">{label}</p>
        <p>{value}</p>
      </div>
    </div>
  );
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XOF", maximumFractionDigits: 0 }).format(value);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}


