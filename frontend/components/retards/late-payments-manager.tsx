"use client";

import { ReactNode, useMemo, useState } from "react";
import {
  AlertTriangle,
  BellRing,
  CheckCircle2,
  Clock3,
  History,
  Loader2,
  PhoneCall,
  ShieldCheck,
  UserRound,
  type LucideIcon,
} from "lucide-react";

import { Alert, Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, EmptyState, PageHeader, StatCard } from "@/components/ui";
import { PaymentIncidentAction, PaymentProblem, scanOverdueContributions, updatePaymentIncidentStatus } from "@/lib/api";
import { getSessionToken } from "@/lib/auth";

const initialProblems: PaymentProblem[] = [
  {
    incident_id: "demo-late-001",
    tontine_id: "demo-tontine",
    member_id: "demo-member-1",
    contribution_id: "demo-contribution-1",
    guarantor_id: "demo-guarantor-1",
    member_name: "Oumar Sawadogo",
    member_contact: "+226 76 44 55 66",
    guarantor_name: "Paul Ilboudo",
    guarantor_contact: "+226 78 88 22 10",
    due_date: "2026-05-10",
    amount_due: 10000,
    amount_paid: 0,
    contribution_status: "late",
    incident_status: "open",
    title: "Cotisation en retard",
    description: "Cotisation du cycle 4 echue le 10 mai 2026.",
    created_at: "2026-05-11T08:00:00Z",
  },
  {
    incident_id: "demo-late-002",
    tontine_id: "demo-tontine",
    member_id: "demo-member-2",
    contribution_id: "demo-contribution-2",
    guarantor_id: "demo-guarantor-2",
    member_name: "Awa Ouedraogo",
    member_contact: "awa@example.com",
    guarantor_name: "Issa Traore",
    guarantor_contact: "+226 70 11 22 33",
    due_date: "2026-05-08",
    amount_due: 15000,
    amount_paid: 0,
    contribution_status: "late",
    incident_status: "guarantor_notified",
    title: "Garant sollicite",
    description: "Le garant a ete prevenu pour suivre la regularisation.",
    created_at: "2026-05-09T09:30:00Z",
  },
  {
    incident_id: "demo-late-003",
    tontine_id: "demo-tontine",
    member_id: "demo-member-3",
    contribution_id: "demo-contribution-3",
    guarantor_id: "demo-guarantor-3",
    member_name: "Mariam Kabore",
    member_contact: "mariam@example.com",
    guarantor_name: "Fatou Compaore",
    guarantor_contact: "+226 71 09 30 40",
    due_date: "2026-04-27",
    amount_due: 10000,
    amount_paid: 10000,
    contribution_status: "paid",
    incident_status: "resolved",
    title: "Dette reglee",
    description: "Paiement confirme par le tresorier.",
    created_at: "2026-04-28T10:00:00Z",
    resolved_at: "2026-04-29T15:20:00Z",
  },
];

const incidentLabels: Record<string, string> = {
  open: "Dette en attente",
  guarantor_notified: "Garant sollicite",
  resolved: "Dette reglee",
  dismissed: "Classe",
  escalated: "Escalade",
  investigating: "Verification",
};

const incidentTone: Record<string, "green" | "yellow" | "red" | "neutral"> = {
  open: "red",
  guarantor_notified: "yellow",
  resolved: "green",
  dismissed: "neutral",
  escalated: "red",
  investigating: "yellow",
};

export function LatePaymentsManager() {
  const [problems, setProblems] = useState(initialProblems);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const activeProblems = useMemo(() => problems.filter((item) => item.incident_status !== "resolved"), [problems]);
  const history = useMemo(() => problems.filter((item) => item.incident_status === "resolved"), [problems]);
  const calledGuarantors = problems.filter((item) => item.incident_status === "guarantor_notified").length;
  const exposedAmount = activeProblems.reduce((sum, item) => sum + Number(item.amount_due ?? 0), 0);

  async function handleScan() {
    setNotice(null);
    setError(null);
    const token = getSessionToken();
    if (!token) {
      setError("Connecte-toi pour lancer l'analyse automatique des retards.");
      return;
    }

    setLoadingAction("scan");
    try {
      const result = await scanOverdueContributions(token);
      setNotice(`${result.marked_late} membre(s) marques en retard, ${result.incidents_created} incident(s), ${result.notifications_created} notification(s).`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Analyse des retards impossible.");
    } finally {
      setLoadingAction(null);
    }
  }

  async function handleAction(problem: PaymentProblem, action: PaymentIncidentAction) {
    setNotice(null);
    setError(null);
    setLoadingAction(`${problem.incident_id}-${action}`);

    const token = getSessionToken();
    try {
      if (token && !problem.incident_id.startsWith("demo-")) {
        await updatePaymentIncidentStatus(problem.incident_id, action, token);
      }

      setProblems((items) =>
        items.map((item) =>
          item.incident_id === problem.incident_id
            ? {
                ...item,
                incident_status: action === "debt_resolved" ? "resolved" : action === "guarantor_called" ? "guarantor_notified" : "open",
                contribution_status: action === "debt_resolved" ? "paid" : "late",
                amount_paid: action === "debt_resolved" ? item.amount_due : item.amount_paid,
                resolved_at: action === "debt_resolved" ? new Date().toISOString() : null,
              }
            : item,
        ),
      );

      setNotice(actionLabel(action, problem.member_name));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Mise a jour impossible.");
    } finally {
      setLoadingAction(null);
    }
  }

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow="Retards et garants"
        title="Suivi des problemes de paiement"
        description="Les cotisations depassees peuvent etre marquees en retard, rattachees a un garant et suivies jusqu'a regularisation."
        actions={
          <Button onClick={handleScan} type="button">
            {loadingAction === "scan" ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> : <Clock3 className="h-5 w-5" aria-hidden="true" />}
            Analyser les retards
          </Button>
        }
      />

      {error ? <Alert title="Action impossible" variant="danger">{error}</Alert> : null}
      {notice ? <Alert title="Suivi mis a jour" variant="success">{notice}</Alert> : null}

      <section className="grid gap-4 md:grid-cols-3">
        <StatCard icon={AlertTriangle} label="Incidents actifs" value={String(activeProblems.length)} tone="red" />
        <StatCard icon={ShieldCheck} label="Garants sollicites" value={String(calledGuarantors)} tone="yellow" />
        <StatCard icon={BellRing} label="Montant expose" value={formatMoney(exposedAmount)} tone="green" />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle>Retards a suivre</CardTitle>
                <CardDescription>Membre, garant, montant et actions administrateur.</CardDescription>
              </div>
              <Badge variant="red">{activeProblems.length} ouverts</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {activeProblems.length ? (
              <div className="grid gap-3">
                {activeProblems.map((problem) => (
                  <ProblemCard key={problem.incident_id} problem={problem}>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button
                        disabled={loadingAction === `${problem.incident_id}-debt_resolved`}
                        onClick={() => handleAction(problem, "debt_resolved")}
                        size="sm"
                        type="button"
                      >
                        <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                        Dette reglee
                      </Button>
                      <Button
                        disabled={loadingAction === `${problem.incident_id}-debt_pending`}
                        onClick={() => handleAction(problem, "debt_pending")}
                        size="sm"
                        type="button"
                        variant="outline"
                      >
                        <Clock3 className="h-4 w-4" aria-hidden="true" />
                        Dette en attente
                      </Button>
                      <Button
                        disabled={loadingAction === `${problem.incident_id}-guarantor_called`}
                        onClick={() => handleAction(problem, "guarantor_called")}
                        size="sm"
                        type="button"
                        variant="secondary"
                      >
                        <PhoneCall className="h-4 w-4" aria-hidden="true" />
                        Garant sollicite
                      </Button>
                    </div>
                  </ProblemCard>
                ))}
              </div>
            ) : (
              <EmptyState icon={CheckCircle2} title="Aucun retard actif" description="Les dettes en retard apparaitront ici apres analyse." />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notifications internes</CardTitle>
            <CardDescription>Alertes generees pour les membres et les garants.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <NotificationItem icon={BellRing} title="Alerte membre" description="Le membre recoit une notification lorsqu'une cotisation depasse sa date prevue." />
            <NotificationItem icon={ShieldCheck} title="Garant visible" description="Le garant rattache au membre est affiche sur chaque incident." />
            <NotificationItem icon={PhoneCall} title="Garant sollicite" description="L'administrateur peut notifier le garant si la dette reste ouverte." />
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle>Historique des incidents</CardTitle>
              <CardDescription>Dettes reglees et problemes de paiement clotures.</CardDescription>
            </div>
            <Badge variant="green">{history.length} regles</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {history.length ? (
            <div className="grid gap-3">
              {history.map((problem) => (
                <ProblemCard key={problem.incident_id} problem={problem} />
              ))}
            </div>
          ) : (
            <EmptyState icon={History} title="Historique vide" description="Les incidents regles seront conserves ici." />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ProblemCard({ problem, children }: { problem: PaymentProblem; children?: ReactNode }) {
  return (
    <article className="rounded-xl border border-stone-100 bg-stone-50 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-black text-night">{problem.member_name}</h3>
            <Badge variant={incidentTone[problem.incident_status] ?? "neutral"}>{incidentLabels[problem.incident_status] ?? problem.incident_status}</Badge>
          </div>
          <p className="mt-1 text-sm font-bold text-stone-500">{problem.member_contact ?? "Contact non renseigne"}</p>
        </div>
        <div className="text-left sm:text-right">
          <p className="text-lg font-black text-night">{formatMoney(Number(problem.amount_due ?? 0))}</p>
          <p className="text-xs font-bold text-stone-500">Echeance {problem.due_date ? formatDate(problem.due_date) : "non definie"}</p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <Meta icon={UserRound} label="Incident" value={problem.description ?? problem.title} />
        <Meta icon={ShieldCheck} label="Garant" value={problem.guarantor_name ? `${problem.guarantor_name} · ${problem.guarantor_contact ?? "contact non renseigne"}` : "Aucun garant trouve"} />
      </div>
      {children}
    </article>
  );
}

function NotificationItem({ icon: Icon, title, description }: { icon: LucideIcon; title: string; description: string }) {
  return (
    <div className="flex gap-3 rounded-xl bg-stone-50 p-4">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-burkina-green/10 text-burkina-green">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </div>
      <div>
        <p className="font-black text-night">{title}</p>
        <p className="mt-1 text-sm leading-6 text-stone-600">{description}</p>
      </div>
    </div>
  );
}

function Meta({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg bg-white p-3 text-sm font-bold text-stone-600">
      <Icon className="h-4 w-4 text-burkina-green" aria-hidden="true" />
      <div>
        <p className="text-[11px] uppercase tracking-wide text-stone-400">{label}</p>
        <p>{value}</p>
      </div>
    </div>
  );
}

function actionLabel(action: PaymentIncidentAction, member: string) {
  if (action === "debt_resolved") return `Dette reglee pour ${member}.`;
  if (action === "guarantor_called") return `Garant sollicite pour ${member}.`;
  return `Dette maintenue en attente pour ${member}.`;
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XOF", maximumFractionDigits: 0 }).format(value);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}
