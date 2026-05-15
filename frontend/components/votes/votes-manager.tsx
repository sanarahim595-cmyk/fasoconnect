"use client";

import { FormEvent, useMemo, useState } from "react";
import { BarChart3, CheckCircle2, ClipboardCheck, Clock3, FolderHeart, Loader2, Plus, UserCheck, Vote } from "lucide-react";

import { Alert, Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, EmptyState, Input, PageHeader, StatCard } from "@/components/ui";
import { InternalVoteType, VoteResults, closeExpiredVotes, createInternalVote, respondToVote } from "@/lib/api";
import { getSessionToken } from "@/lib/auth";

const demoVotes: VoteResults[] = [
  {
    vote_id: "demo-vote-rules",
    title: "Validation des regles internes",
    description: "Confirmer le montant, les penalites de retard et les conditions de garantie.",
    type: "rule_validation",
    status: "open",
    deadline: "2026-05-20T18:00:00Z",
    results_visible: true,
    total_responses: 12,
    options: [
      { option_id: "demo-rules-yes", label: "J'approuve", position: 0, responses: 9, percentage: 75 },
      { option_id: "demo-rules-no", label: "Je refuse", position: 1, responses: 3, percentage: 25 },
    ],
  },
  {
    vote_id: "demo-vote-project",
    title: "Projet communautaire a soutenir",
    description: "Choisir le projet local qui recevra une partie du fonds solidaire.",
    type: "community_project",
    status: "open",
    deadline: "2026-05-25T18:00:00Z",
    results_visible: true,
    total_responses: 18,
    options: [
      { option_id: "demo-water", label: "Forage d'eau potable", position: 0, responses: 10, percentage: 55.6 },
      { option_id: "demo-solar", label: "Panneaux solaires ecole", position: 1, responses: 8, percentage: 44.4 },
    ],
  },
  {
    vote_id: "demo-vote-member",
    title: "Acceptation d'un nouveau membre",
    description: "Decider si le groupe accepte l'entree de Salif dans la tontine.",
    type: "member_decision",
    status: "closed",
    deadline: "2026-05-12T18:00:00Z",
    results_visible: true,
    total_responses: 14,
    options: [
      { option_id: "demo-accept", label: "Accepter", position: 0, responses: 11, percentage: 78.6 },
      { option_id: "demo-refuse", label: "Refuser", position: 1, responses: 3, percentage: 21.4 },
    ],
  },
];

const typeLabels: Record<InternalVoteType, string> = {
  rule_validation: "Regles de tontine",
  payout_order: "Ordre de passage",
  decision: "Decision interne",
  member_decision: "Membre",
  community_project: "Projet communautaire",
};

export function VotesManager() {
  const [votes, setVotes] = useState(demoVotes);
  const [loading, setLoading] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const openVotes = useMemo(() => votes.filter((item) => item.status === "open"), [votes]);
  const closedVotes = useMemo(() => votes.filter((item) => item.status === "closed"), [votes]);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    setNotice(null);
    setError(null);

    const form = new FormData(formElement);
    const options = String(form.get("options") ?? "")
      .split("\n")
      .map((option) => option.trim())
      .filter(Boolean);

    if (options.length < 2) {
      setError("Ajoute au moins deux options de vote.");
      return;
    }

    const deadline = String(form.get("deadline") ?? "");
    if (!deadline) {
      setError("La date limite est obligatoire.");
      return;
    }

    const payload = {
      title: String(form.get("title") ?? "").trim(),
      description: String(form.get("description") ?? "").trim() || undefined,
      type: String(form.get("type")) as InternalVoteType,
      deadline: new Date(deadline).toISOString(),
      options,
      status: "open" as const,
    };

    const token = getSessionToken();
    setLoading("create");
    try {
      if (token) {
        const created = await createInternalVote(payload, token);
        setVotes((items) => [created, ...items]);
      } else {
        setVotes((items) => [
          {
            vote_id: `demo-created-${Date.now()}`,
            ...payload,
            results_visible: true,
            total_responses: 0,
            options: options.map((label, position) => ({
              option_id: `demo-option-${Date.now()}-${position}`,
              label,
              position,
              responses: 0,
              percentage: 0,
            })),
          },
          ...items,
        ]);
      }
      setNotice("Vote cree avec succes.");
      formElement.reset();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Creation du vote impossible.");
    } finally {
      setLoading(null);
    }
  }

  async function handleRespond(vote: VoteResults, optionId: string) {
    setNotice(null);
    setError(null);
    setLoading(`${vote.vote_id}-${optionId}`);
    const token = getSessionToken();

    try {
      if (token && !vote.vote_id.startsWith("demo-")) {
        await respondToVote(vote.vote_id, optionId, token);
      }
      setVotes((items) =>
        items.map((item) => {
          if (item.vote_id !== vote.vote_id) return item;
          const total = item.total_responses + 1;
          const options = item.options.map((option) => ({
            ...option,
            responses: option.option_id === optionId ? option.responses + 1 : option.responses,
          }));
          return {
            ...item,
            total_responses: total,
            options: options.map((option) => ({ ...option, percentage: total ? roundPercent((option.responses / total) * 100) : 0 })),
          };
        }),
      );
      setNotice("Votre reponse a ete enregistree.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Vote impossible.");
    } finally {
      setLoading(null);
    }
  }

  async function handleCloseExpired() {
    setNotice(null);
    setError(null);
    setLoading("close-expired");
    const token = getSessionToken();
    const now = new Date();

    try {
      if (token) {
        const result = await closeExpiredVotes(token);
        setNotice(`${result.closed_votes} vote(s) expire(s) ferme(s).`);
      } else {
        setNotice("Votes expires fermes en mode demonstration.");
      }
      setVotes((items) => items.map((item) => (item.deadline && new Date(item.deadline) <= now ? { ...item, status: "closed" } : item)));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Fermeture automatique impossible.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow="Votes internes"
        title="Decisions transparentes de la tontine"
        description="Cree des votes pour les regles, l'ordre de passage, les membres, les decisions internes et les projets communautaires."
        actions={
          <Button onClick={handleCloseExpired} type="button" variant="outline">
            {loading === "close-expired" ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> : <Clock3 className="h-5 w-5" aria-hidden="true" />}
            Fermer les votes expires
          </Button>
        }
      />

      {error ? <Alert title="Action impossible" variant="danger">{error}</Alert> : null}
      {notice ? <Alert title="Vote mis a jour" variant="success">{notice}</Alert> : null}

      <section className="grid gap-4 md:grid-cols-3">
        <StatCard icon={Vote} label="Votes ouverts" value={String(openVotes.length)} />
        <StatCard icon={CheckCircle2} label="Votes fermes" value={String(closedVotes.length)} tone="yellow" />
        <StatCard icon={BarChart3} label="Reponses visibles" value={String(votes.reduce((sum, item) => sum + item.total_responses, 0))} tone="green" />
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Card className="overflow-hidden">
          <div className="h-2 bg-gradient-to-r from-burkina-green via-burkina-yellow to-burkina-red" />
          <CardHeader>
            <CardTitle>Creation de vote</CardTitle>
            <CardDescription>Les resultats restent visibles pour garder la confiance du groupe.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4" onSubmit={handleCreate}>
              <Input label="Titre" name="title" placeholder="Validation de l&apos;ordre de passage" required />
              <Input label="Description" name="description" placeholder="Explique la decision a prendre" />
              <label className="grid gap-2 text-sm font-semibold text-stone-700">
                <span>Type de vote</span>
                <select className="h-11 rounded-lg border border-stone-200 bg-white px-3 text-sm shadow-sm outline-none focus:border-burkina-green focus:ring-4 focus:ring-burkina-green/10" name="type">
                  <option value="rule_validation">Valider les regles</option>
                  <option value="payout_order">Valider l&apos;ordre de passage</option>
                  <option value="decision">Approuver une decision</option>
                  <option value="member_decision">Accepter ou refuser un membre</option>
                  <option value="community_project">Choisir un projet communautaire</option>
                </select>
              </label>
              <Input label="Date limite" name="deadline" required type="datetime-local" />
              <label className="grid gap-2 text-sm font-semibold text-stone-700">
                <span>Options</span>
                <textarea
                  className="min-h-28 rounded-lg border border-stone-200 bg-white px-3 py-3 text-sm text-night shadow-sm outline-none transition placeholder:text-stone-400 focus:border-burkina-green focus:ring-4 focus:ring-burkina-green/10"
                  name="options"
                  placeholder={"J'approuve\nJe refuse"}
                  required
                />
              </label>
              <Button className="w-full" disabled={loading === "create"} size="lg" type="submit">
                {loading === "create" ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> : <Plus className="h-5 w-5" aria-hidden="true" />}
                Creer le vote
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle>Votes ouverts</CardTitle>
                <CardDescription>Chaque membre peut repondre avant la date limite.</CardDescription>
              </div>
              <Badge variant="green">{openVotes.length} ouverts</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {openVotes.length ? (
              <div className="grid gap-4">
                {openVotes.map((vote) => (
                  <VoteCard key={vote.vote_id} vote={vote} onRespond={handleRespond} loading={loading} />
                ))}
              </div>
            ) : (
              <EmptyState icon={ClipboardCheck} title="Aucun vote ouvert" description="Les prochains votes du groupe apparaitront ici." />
            )}
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle>Resultats et votes fermes</CardTitle>
              <CardDescription>Les resultats restent visibles apres fermeture.</CardDescription>
            </div>
            <Badge variant="yellow">{closedVotes.length} fermes</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {closedVotes.length ? (
            <div className="grid gap-4">
              {closedVotes.map((vote) => (
                <VoteCard key={vote.vote_id} vote={vote} />
              ))}
            </div>
          ) : (
            <EmptyState icon={FolderHeart} title="Aucun resultat ferme" description="Les votes termines seront conserves ici." />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function VoteCard({ vote, onRespond, loading }: { vote: VoteResults; onRespond?: (vote: VoteResults, optionId: string) => void; loading?: string | null }) {
  return (
    <article className="rounded-xl border border-stone-100 bg-stone-50 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-black text-night">{vote.title}</h3>
            <Badge variant={vote.status === "open" ? "green" : "neutral"}>{vote.status === "open" ? "Ouvert" : "Ferme"}</Badge>
          </div>
          <p className="mt-1 text-sm font-bold text-stone-500">{typeLabels[vote.type]}</p>
          {vote.description ? <p className="mt-2 text-sm leading-6 text-stone-600">{vote.description}</p> : null}
        </div>
        <p className="text-sm font-bold text-stone-500">{vote.deadline ? formatDeadline(vote.deadline) : "Sans date limite"}</p>
      </div>

      <div className="mt-4 grid gap-3">
        {vote.options.map((option) => (
          <div key={option.option_id} className="rounded-lg bg-white p-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="font-black text-night">{option.label}</p>
                <p className="text-xs font-bold text-stone-500">{option.responses} reponse(s) · {option.percentage}%</p>
              </div>
              {vote.status === "open" && onRespond ? (
                <Button disabled={loading === `${vote.vote_id}-${option.option_id}`} onClick={() => onRespond(vote, option.option_id)} size="sm" type="button">
                  {loading === `${vote.vote_id}-${option.option_id}` ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <UserCheck className="h-4 w-4" aria-hidden="true" />}
                  Voter
                </Button>
              ) : null}
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-stone-100">
              <div className="h-full rounded-full bg-burkina-green transition-all" style={{ width: `${Math.min(option.percentage, 100)}%` }} />
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}

function roundPercent(value: number) {
  return Math.round(value * 10) / 10;
}

function formatDeadline(value: string) {
  return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}


