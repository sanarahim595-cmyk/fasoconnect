"use client";

import { FormEvent, useState } from "react";
import { AlertTriangle, Download, FileText, Gavel, History, Loader2, Plus, Settings2, Trash2, Users, Vote, WalletCards, type LucideIcon } from "lucide-react";

import { Alert, Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, EmptyState, Input, PageHeader, StatCard } from "@/components/ui";
import { TontineAdminOverview, downloadTontineAdminExport, getTontineAdminOverview, removeTontineAdminMember, updateTontineAdminRules } from "@/lib/api";
import { getSessionToken } from "@/lib/auth";

const demoOverview: TontineAdminOverview = {
  tontine: {
    id: "demo-tontine-admin",
    name: "Tontine Wend-Panga",
    description: "Groupe mensuel de solidarite et d'epargne.",
    organizer_id: "demo-user",
    contribution_amount: 10000,
    currency: "XOF" as const,
    frequency: "monthly" as const,
    start_date: "2026-05-01",
    max_members: 20,
    rules: {
      internal_rules: "Penalite de 1000 XOF apres 3 jours de retard. Garant obligatoire.",
      payout_order_mode: "manual",
    },
    payout_order_locked: true,
    status: "active" as const,
    created_at: "2026-05-01T08:00:00Z",
    updated_at: "2026-05-01T08:00:00Z",
  },
  members_count: 14,
  contributions_count: 42,
  late_contributions_count: 2,
  incidents_count: 5,
  votes_count: 3,
};

const demoMembers = [
  { id: "demo-member-1", name: "Awa Ouedraogo", role: "Administratrice", status: "A jour" },
  { id: "demo-member-2", name: "Oumar Sawadogo", role: "Membre", status: "En retard" },
  { id: "demo-member-3", name: "Mariam Kabore", role: "Tresoriere", status: "A jour" },
];

const history = [
  "Regles modifiees par l'administrateur",
  "Cotisation de Mariam marquee comme payee",
  "Garant sollicite pour Oumar",
  "Vote lance pour l'ordre de passage",
];

export function TontineAdminDashboard() {
  const [tontineId, setTontineId] = useState(demoOverview.tontine.id);
  const [overview, setOverview] = useState(demoOverview);
  const [members, setMembers] = useState(demoMembers);
  const [loading, setLoading] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadOverview(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    setError(null);
    setNotice(null);
    const token = getSessionToken();
    if (!token) {
      setError("Connecte-toi avec un compte administrateur de cette tontine.");
      return;
    }

    setLoading("load");
    try {
      const data = await getTontineAdminOverview(tontineId, token);
      setOverview(data);
      setNotice("Espace administrateur charge.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Chargement impossible.");
    } finally {
      setLoading(null);
    }
  }

  async function handleRules(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setNotice(null);
    const token = getSessionToken();
    const form = new FormData(event.currentTarget);
    const internalRules = String(form.get("internal_rules") ?? "").trim();
    const payoutOrderMode = String(form.get("payout_order_mode") ?? "manual");

    if (!internalRules) {
      setError("Les regles internes sont obligatoires.");
      return;
    }
    if (!token) {
      setError("Session admin introuvable.");
      return;
    }

    setLoading("rules");
    try {
      const tontine = await updateTontineAdminRules(
        tontineId,
        { internal_rules: internalRules, payout_order_mode: payoutOrderMode },
        token,
      );
      setOverview((current) => ({ ...current, tontine }));
      setNotice("Regles de tontine modifiees.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Modification des regles impossible.");
    } finally {
      setLoading(null);
    }
  }

  async function handleRemoveMember(memberId: string) {
    const token = getSessionToken();
    setError(null);
    setNotice(null);
    setLoading(`remove-${memberId}`);
    try {
      if (token && !memberId.startsWith("demo-")) {
        await removeTontineAdminMember(tontineId, memberId, token);
      }
      setMembers((items) => items.filter((item) => item.id !== memberId));
      setNotice("Membre supprime de la tontine.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Suppression impossible.");
    } finally {
      setLoading(null);
    }
  }

  async function handleExport(format: "csv" | "pdf") {
    const token = getSessionToken();
    setError(null);
    setNotice(null);
    if (!token) {
      setError("Session admin introuvable pour exporter les donnees.");
      return;
    }

    setLoading(`export-${format}`);
    try {
      const { blob, filename } = await downloadTontineAdminExport(tontineId, format, token);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setNotice(`Export ${format.toUpperCase()} genere: ${filename}`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Export impossible.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow="Administrateur de tontine"
        title="Piloter les regles, membres, cotisations et decisions"
        description="Acces reserve a l'organisateur ou aux membres avec role administrateur dans cette tontine."
      />

      {error ? <Alert title="Action impossible" variant="danger">{error}</Alert> : null}
      {notice ? <Alert title="Espace tontine" variant="success">{notice}</Alert> : null}

      <Card>
        <CardContent className="pt-6">
          <form className="grid gap-3 md:grid-cols-[1fr_auto]" onSubmit={loadOverview}>
            <Input label="ID de la tontine" value={tontineId} onChange={(event) => setTontineId(event.target.value)} />
            <Button className="self-end" disabled={loading === "load"} type="submit">
              {loading === "load" ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> : <Settings2 className="h-5 w-5" aria-hidden="true" />}
              Charger
            </Button>
          </form>
        </CardContent>
      </Card>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard icon={Users} label="Membres" value={String(overview.members_count)} />
        <StatCard icon={WalletCards} label="Cotisations" value={String(overview.contributions_count)} tone="yellow" />
        <StatCard icon={AlertTriangle} label="Retards" value={String(overview.late_contributions_count)} tone="red" />
        <StatCard icon={Gavel} label="Incidents" value={String(overview.incidents_count)} tone="yellow" />
        <StatCard icon={Vote} label="Votes" value={String(overview.votes_count)} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card className="overflow-hidden">
          <div className="h-2 bg-gradient-to-r from-burkina-green via-burkina-yellow to-burkina-red" />
          <CardHeader>
            <CardTitle>Modifier les regles</CardTitle>
            <CardDescription>Montant, penalites, ordre de passage ou discipline interne.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4" onSubmit={handleRules}>
              <label className="grid gap-2 text-sm font-semibold text-stone-700">
                <span>Regles internes</span>
                <textarea
                  className="min-h-32 rounded-lg border border-stone-200 bg-white px-3 py-3 text-sm text-night shadow-sm outline-none transition placeholder:text-stone-400 focus:border-burkina-green focus:ring-4 focus:ring-burkina-green/10"
                  defaultValue={String(overview.tontine.rules?.internal_rules ?? "")}
                  name="internal_rules"
                />
              </label>
              <label className="grid gap-2 text-sm font-semibold text-stone-700">
                <span>Ordre de passage</span>
                <select className="h-11 rounded-lg border border-stone-200 bg-white px-3 text-sm shadow-sm outline-none focus:border-burkina-green focus:ring-4 focus:ring-burkina-green/10" defaultValue={String(overview.tontine.rules?.payout_order_mode ?? "manual")} name="payout_order_mode">
                  <option value="manual">Manuel</option>
                  <option value="automatic">Automatique</option>
                </select>
              </label>
              <Button disabled={loading === "rules"} type="submit">
                {loading === "rules" ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> : <Settings2 className="h-5 w-5" aria-hidden="true" />}
                Enregistrer les regles
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle>Membres</CardTitle>
                <CardDescription>Ajout et suppression des membres de la tontine.</CardDescription>
              </div>
              <Button onClick={() => window.location.assign("/tontines/members")} type="button">
                <Plus className="h-4 w-4" aria-hidden="true" />
                Ajouter
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {members.length ? (
              <div className="grid gap-3">
                {members.map((member) => (
                  <article key={member.id} className="flex flex-col gap-3 rounded-xl border border-stone-100 bg-stone-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="font-black text-night">{member.name}</h3>
                      <p className="mt-1 text-sm font-bold text-stone-500">{member.role}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant={member.status === "En retard" ? "red" : "green"}>{member.status}</Badge>
                      <Button disabled={loading === `remove-${member.id}`} onClick={() => handleRemoveMember(member.id)} size="sm" type="button" variant="danger">
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                        Supprimer
                      </Button>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <EmptyState icon={Users} title="Aucun membre" description="Ajoute des membres pour administrer le cycle." />
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <ActionCard icon={WalletCards} title="Gerer les cotisations" href="/cotisations" />
        <ActionCard icon={AlertTriangle} title="Gerer les retards" href="/retards" />
        <ActionCard icon={Vote} title="Lancer un vote" href="/votes" />
        <ActionCard icon={History} title="Voir l'historique" href="#historique" />
      </section>

      <Card id="historique">
        <CardHeader>
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <CardTitle>Historique complet</CardTitle>
              <CardDescription>Actions, cotisations, retards et votes recents.</CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <button className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-stone-200 bg-white px-3 text-sm font-bold text-night disabled:opacity-60" disabled={loading === "export-csv"} onClick={() => handleExport("csv")} type="button">
                <Download className="h-4 w-4" aria-hidden="true" />
                Export CSV
              </button>
              <button className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-stone-200 bg-white px-3 text-sm font-bold text-night disabled:opacity-60" disabled={loading === "export-pdf"} onClick={() => handleExport("pdf")} type="button">
                <FileText className="h-4 w-4" aria-hidden="true" />
                Export PDF
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-3">
          {history.map((item) => (
            <div key={item} className="rounded-xl bg-stone-50 p-4 text-sm font-bold text-stone-600">
              {item}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function ActionCard({ icon: Icon, title, href }: { icon: LucideIcon; title: string; href: string }) {
  return (
    <a className="flex items-center gap-3 rounded-xl border border-stone-100 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-soft" href={href}>
      <div className="grid h-11 w-11 place-items-center rounded-lg bg-burkina-green/10 text-burkina-green">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </div>
      <span className="font-black text-night">{title}</span>
    </a>
  );
}
