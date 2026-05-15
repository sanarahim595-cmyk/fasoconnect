"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, ClipboardList, FileCheck2, Loader2, RefreshCw, ShieldCheck, Users, WalletCards, XCircle } from "lucide-react";

import { Alert, Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, EmptyState, PageHeader, StatCard } from "@/components/ui";
import {
  AdminOverview,
  AdminUserRow,
  CommunityProject,
  decideAdminProject,
  getAdminOverview,
  getAdminProjects,
  getAdminUsers,
  reviewAdminCnib,
} from "@/lib/api";
import { getSessionToken } from "@/lib/auth";

const demoOverview: AdminOverview = {
  users_count: 148,
  tontines_count: 37,
  submitted_projects_count: 12,
  approved_projects_count: 5,
  contributions_count: 486,
};

const demoUsers: AdminUserRow[] = [
  {
    id: "demo-user-1",
    full_name: "Awa Ouedraogo",
    phone: "+226 70 11 22 33",
    email: "awa@example.com",
    role: "utilisateur",
    status: "pending_verification",
    created_at: "2026-05-10T08:00:00Z",
    cnib_id: "demo-cnib-1",
    cnib_number: "B12345678",
    cnib_status: "pending",
  },
  {
    id: "demo-user-2",
    full_name: "Moussa Traore",
    phone: "+226 76 90 90 90",
    email: null,
    role: "administrateur_tontine",
    status: "active",
    created_at: "2026-05-09T08:00:00Z",
    cnib_id: "demo-cnib-2",
    cnib_number: "B87654321",
    cnib_status: "verified",
  },
  {
    id: "demo-user-3",
    full_name: "Salimata Kone",
    phone: null,
    email: "sali@example.com",
    role: "utilisateur",
    status: "manual_review",
    created_at: "2026-05-08T08:00:00Z",
    cnib_id: "demo-cnib-3",
    cnib_number: "OCR incertain",
    cnib_status: "manual_review",
  },
];

const demoProjects: CommunityProject[] = [
  {
    id: "demo-admin-project-1",
    submitted_by: "demo-user-1",
    title: "Forage quartier secteur 12",
    description: "Installer un forage public pour reduire la distance d'acces a l'eau.",
    category: "eau",
    city: "Ouagadougou",
    latitude: 12.3714,
    longitude: -1.5197,
    target_amount: 2500000,
    collected_amount: 0,
    currency: "XOF",
    status: "pending",
    photos: [],
    created_at: "2026-05-12T08:00:00Z",
    updated_at: "2026-05-12T08:00:00Z",
  },
  {
    id: "demo-admin-project-2",
    submitted_by: "demo-user-2",
    title: "Lampadaires solaires",
    description: "Eclairer la voie principale autour du marche.",
    category: "energie_solaire",
    city: "Koudougou",
    latitude: 12.2526,
    longitude: -2.3627,
    target_amount: 1900000,
    collected_amount: 0,
    currency: "XOF",
    status: "approved",
    photos: [],
    created_at: "2026-05-07T08:00:00Z",
    updated_at: "2026-05-09T08:00:00Z",
  },
];

const cnibTone = {
  pending: "yellow",
  verified: "green",
  rejected: "red",
  manual_review: "yellow",
  missing: "neutral",
} as const;

const cnibLabels = {
  pending: "En attente",
  verified: "Verifiee",
  rejected: "Rejetee",
  manual_review: "Revue manuelle",
  missing: "Absente",
};

const projectTone = {
  pending: "yellow",
  approved: "green",
  rejected: "red",
} as const;

export function PlatformAdminDashboard() {
  const [overview, setOverview] = useState(demoOverview);
  const [users, setUsers] = useState(demoUsers);
  const [projects, setProjects] = useState(demoProjects);
  const [loading, setLoading] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pendingProjects = useMemo(() => projects.filter((project) => project.status === "pending"), [projects]);

  useEffect(() => {
    void refreshAdminData();
  }, []);

  async function refreshAdminData() {
    const token = getSessionToken();
    if (!token) return;

    setLoading("refresh");
    setError(null);
    try {
      const [nextOverview, nextUsers, nextProjects] = await Promise.all([
        getAdminOverview(token),
        getAdminUsers(token),
        getAdminProjects(token),
      ]);
      setOverview(nextOverview);
      setUsers(nextUsers);
      setProjects(nextProjects);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Chargement admin impossible.");
    } finally {
      setLoading(null);
    }
  }

  async function handleCnib(user: AdminUserRow, status: "verified" | "rejected" | "manual_review") {
    if (!user.cnib_id) {
      setError("Cet utilisateur n'a pas de dossier CNIB.");
      return;
    }
    setLoading(`${user.id}-${status}`);
    setNotice(null);
    setError(null);
    const token = getSessionToken();
    try {
      if (token && !user.cnib_id.startsWith("demo-")) {
        await reviewAdminCnib(user.cnib_id, status, token);
      }
      setUsers((items) => items.map((item) => (item.id === user.id ? { ...item, cnib_status: status, status: status === "verified" ? "active" : item.status } : item)));
      setNotice("Decision CNIB journalisee dans admin_actions.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Validation CNIB impossible.");
    } finally {
      setLoading(null);
    }
  }

  async function handleProject(project: CommunityProject, status: "approved" | "rejected" | "changes_requested") {
    setLoading(`${project.id}-${status}`);
    setNotice(null);
    setError(null);
    const token = getSessionToken();
    try {
      if (token && !project.id.startsWith("demo-")) {
        await decideAdminProject(project.id, status, token);
      }
      setProjects((items) => items.map((item) => (item.id === project.id ? { ...item, status: status === "changes_requested" ? "pending" : status } : item)));
      setNotice("Action projet journalisee dans admin_actions.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Decision projet impossible.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow="Administration plateforme"
        title="Controle, validation et journalisation"
        description="Espace strictement reserve au role administrateur_plateforme."
        actions={
          <Button onClick={refreshAdminData} type="button" variant="outline">
            {loading === "refresh" ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> : <RefreshCw className="h-5 w-5" aria-hidden="true" />}
            Actualiser
          </Button>
        }
      />

      {error ? <Alert title="Action impossible" variant="danger">{error}</Alert> : null}
      {notice ? <Alert title="Journal admin" variant="success">{notice}</Alert> : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard icon={Users} label="Utilisateurs" value={String(overview.users_count)} />
        <StatCard icon={ShieldCheck} label="Tontines" value={String(overview.tontines_count)} tone="yellow" />
        <StatCard icon={ClipboardList} label="Projets soumis" value={String(overview.submitted_projects_count)} />
        <StatCard icon={FileCheck2} label="Projets valides" value={String(overview.approved_projects_count)} tone="green" />
        <StatCard icon={WalletCards} label="Cotisations" value={String(overview.contributions_count)} tone="yellow" />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle>Utilisateurs et CNIB</CardTitle>
                <CardDescription>Validation manuelle des comptes avec piece CNIB.</CardDescription>
              </div>
              <Badge variant="green">{users.length} comptes</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {users.length ? (
              <div className="grid gap-3">
                {users.map((user) => (
                  <article key={user.id} className="rounded-xl border border-stone-100 bg-stone-50 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h3 className="font-black text-night">{user.full_name}</h3>
                        <p className="mt-1 text-sm font-bold text-stone-500">{user.phone ?? user.email ?? "Contact absent"}</p>
                        <p className="mt-1 text-xs font-bold text-stone-400">CNIB : {user.cnib_number ?? "Non fournie"}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="neutral">{user.role}</Badge>
                        <Badge variant={cnibTone[user.cnib_status]}>{cnibLabels[user.cnib_status]}</Badge>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button disabled={!user.cnib_id || loading === `${user.id}-verified`} onClick={() => handleCnib(user, "verified")} size="sm" type="button">
                        <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                        Valider CNIB
                      </Button>
                      <Button disabled={!user.cnib_id || loading === `${user.id}-manual_review`} onClick={() => handleCnib(user, "manual_review")} size="sm" type="button" variant="outline">
                        Revue manuelle
                      </Button>
                      <Button disabled={!user.cnib_id || loading === `${user.id}-rejected`} onClick={() => handleCnib(user, "rejected")} size="sm" type="button" variant="danger">
                        <XCircle className="h-4 w-4" aria-hidden="true" />
                        Refuser
                      </Button>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <EmptyState icon={Users} title="Aucun utilisateur" description="Les comptes inscrits apparaitront ici." />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle>Projets soumis</CardTitle>
                <CardDescription>Validation, refus ou demande de modification.</CardDescription>
              </div>
              <Badge variant="yellow">{pendingProjects.length} en attente</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {projects.length ? (
              <div className="grid gap-3">
                {projects.map((project) => (
                  <article key={project.id} className="rounded-xl border border-stone-100 bg-stone-50 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h3 className="font-black text-night">{project.title}</h3>
                        <p className="mt-1 text-sm leading-6 text-stone-600">{project.description}</p>
                        <p className="mt-2 text-xs font-bold text-stone-500">{project.city ?? "Commune non renseignee"} · {formatMoney(project.target_amount)}</p>
                      </div>
                      <Badge variant={projectTone[project.status]}>{project.status}</Badge>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button disabled={loading === `${project.id}-approved`} onClick={() => handleProject(project, "approved")} size="sm" type="button">
                        Valider projet
                      </Button>
                      <Button disabled={loading === `${project.id}-rejected`} onClick={() => handleProject(project, "rejected")} size="sm" type="button" variant="danger">
                        Refuser projet
                      </Button>
                      <Button disabled={loading === `${project.id}-changes_requested`} onClick={() => handleProject(project, "changes_requested")} size="sm" type="button" variant="outline">
                        Demander modification
                      </Button>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <EmptyState icon={ClipboardList} title="Aucun projet soumis" description="Les soumissions citoyennes apparaitront ici." />
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XOF", maximumFractionDigits: 0 }).format(value);
}
