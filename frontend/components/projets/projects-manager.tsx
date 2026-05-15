"use client";

import dynamic from "next/dynamic";
import { FormEvent, ReactNode, useEffect, useMemo, useState } from "react";
import { CheckCircle2, Clock3, FolderHeart, ImagePlus, Loader2, MapPin, ShieldCheck, XCircle } from "lucide-react";

import { Alert, Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, EmptyState, Input, PageHeader, StatCard } from "@/components/ui";
import { CommunityProject, CommunityProjectCategory, getMyCommunityProjects, getPublicCommunityProjects, reviewCommunityProject, submitCommunityProject } from "@/lib/api";
import { getSessionToken } from "@/lib/auth";

const ProjectMap = dynamic(() => import("./projects-map").then((module) => module.ProjectMap), {
  ssr: false,
  loading: () => <div className="grid h-72 place-items-center rounded-xl bg-stone-100 text-sm font-bold text-stone-500">Carte en chargement...</div>,
});

const categoryLabels: Record<CommunityProjectCategory, string> = {
  eau: "Eau",
  ecole: "Ecole",
  sante: "Sante",
  route: "Route",
  energie_solaire: "Energie solaire",
  environnement: "Environnement",
  autre: "Autre",
};

const statusLabels = {
  pending: "En attente",
  approved: "Valide",
  rejected: "Refuse",
};

const statusTone = {
  pending: "yellow",
  approved: "green",
  rejected: "red",
} as const;

export function ProjectsManager() {
  const [projects, setProjects] = useState<CommunityProject[]>([]);
  const [selectedPoint, setSelectedPoint] = useState({ lat: 12.3714, lng: -1.5197 });
  const [loading, setLoading] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = getSessionToken();
    const loader = token ? getMyCommunityProjects(token) : getPublicCommunityProjects();
    loader.then(setProjects).catch(() => setProjects([]));
  }, []);

  const approved = useMemo(() => projects.filter((project) => project.status === "approved"), [projects]);
  const pending = useMemo(() => projects.filter((project) => project.status === "pending"), [projects]);
  const rejected = useMemo(() => projects.filter((project) => project.status === "rejected"), [projects]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    setNotice(null);
    setError(null);

    const form = new FormData(formElement);
    const photos = String(form.get("photos") ?? "")
      .split("\n")
      .map((photo) => photo.trim())
      .filter(Boolean);
    const targetAmount = Number(form.get("target_amount"));

    if (!Number.isFinite(targetAmount) || targetAmount <= 0) {
      setError("Le montant estime doit etre superieur a zero.");
      return;
    }

    const payload = {
      title: String(form.get("title") ?? "").trim(),
      description: String(form.get("description") ?? "").trim(),
      category: String(form.get("category")) as CommunityProjectCategory,
      city: String(form.get("city") ?? "").trim(),
      latitude: selectedPoint.lat,
      longitude: selectedPoint.lng,
      photos,
      target_amount: targetAmount,
      beneficiaries: String(form.get("beneficiaries") ?? "").trim(),
      justification: String(form.get("justification") ?? "").trim(),
    };

    const token = getSessionToken();
    setLoading("submit");
    try {
      const created = token
        ? await submitCommunityProject(payload, token)
        : {
            id: `demo-created-${Date.now()}`,
            submitted_by: "demo-user",
            collected_amount: 0,
            currency: "XOF" as const,
            status: "pending" as const,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            ...payload,
          };
      setProjects((items) => [created, ...items]);
      setNotice("Projet soumis avec le statut en attente.");
      formElement.reset();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Soumission impossible.");
    } finally {
      setLoading(null);
    }
  }

  async function handleReview(project: CommunityProject, status: "approved" | "rejected") {
    setNotice(null);
    setError(null);
    setLoading(`${project.id}-${status}`);
    const token = getSessionToken();
    try {
      if (token && !project.id.startsWith("demo-")) {
        await reviewCommunityProject(project.id, status, token);
      }
      setProjects((items) => items.map((item) => (item.id === project.id ? { ...item, status } : item)));
      setNotice(status === "approved" ? "Projet valide et publie." : "Projet refuse, visible uniquement par l'auteur et l'admin.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Traitement du projet impossible.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow="Projets communautaires"
        title="Soumettre, valider et publier les projets locaux"
        description="Les projets soumis restent en attente. Seul l'administrateur plateforme peut les valider ou les refuser."
      />

      {error ? <Alert title="Action impossible" variant="danger">{error}</Alert> : null}
      {notice ? <Alert title="Projet mis a jour" variant="success">{notice}</Alert> : null}

      <section className="grid gap-4 md:grid-cols-3">
        <StatCard icon={FolderHeart} label="Publies" value={String(approved.length)} />
        <StatCard icon={Clock3} label="En attente" value={String(pending.length)} tone="yellow" />
        <StatCard icon={XCircle} label="Refuses" value={String(rejected.length)} tone="red" />
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card className="overflow-hidden">
          <div className="h-2 bg-gradient-to-r from-burkina-green via-burkina-yellow to-burkina-red" />
          <CardHeader>
            <CardTitle>Soumettre un projet</CardTitle>
            <CardDescription>Le projet sera cree avec le statut en attente.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4" onSubmit={handleSubmit}>
              <Input label="Titre" name="title" placeholder="Forage d'eau potable" required />
              <Input label="Description" name="description" placeholder="Resume clair du besoin local" required />
              <label className="grid gap-2 text-sm font-semibold text-stone-700">
                <span>Categorie</span>
                <select className="h-11 rounded-lg border border-stone-200 bg-white px-3 text-sm shadow-sm outline-none focus:border-burkina-green focus:ring-4 focus:ring-burkina-green/10" name="category">
                  {Object.entries(categoryLabels).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </label>
              <Input label="Commune" name="city" placeholder="Ouagadougou" required />
              <div className="grid gap-4 md:grid-cols-2">
                <Input label="Latitude" readOnly value={selectedPoint.lat.toFixed(6)} />
                <Input label="Longitude" readOnly value={selectedPoint.lng.toFixed(6)} />
              </div>
              <Input label="Montant estime" min="1" name="target_amount" placeholder="2500000" required type="number" />
              <Input label="Beneficiaires" name="beneficiaries" placeholder="350 habitants, 120 eleves..." required />
              <Input label="Justification" name="justification" placeholder="Pourquoi ce projet est prioritaire ?" required />
              <label className="grid gap-2 text-sm font-semibold text-stone-700">
                <span>Photos</span>
                <textarea className="min-h-24 rounded-lg border border-stone-200 bg-white px-3 py-3 text-sm text-night shadow-sm outline-none transition placeholder:text-stone-400 focus:border-burkina-green focus:ring-4 focus:ring-burkina-green/10" name="photos" placeholder="Un lien photo par ligne" />
              </label>
              <Button className="w-full" disabled={loading === "submit"} size="lg" type="submit">
                {loading === "submit" ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> : <ImagePlus className="h-5 w-5" aria-hidden="true" />}
                Soumettre le projet
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Localisation</CardTitle>
            <CardDescription>Clique sur la carte pour choisir les coordonnees GPS.</CardDescription>
          </CardHeader>
          <CardContent>
            <ProjectMap projects={projects} selectedPoint={selectedPoint} onSelect={setSelectedPoint} />
          </CardContent>
        </Card>
      </section>

      <ProjectsSection title="Projets publics valides" description="Ces projets apparaissent publiquement." projects={approved} />

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle>Validation administrateur plateforme</CardTitle>
              <CardDescription>Les projets refuses restent visibles uniquement par l&apos;auteur et l&apos;admin.</CardDescription>
            </div>
            <Badge variant="yellow">{pending.length} en attente</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {pending.length ? (
            <div className="grid gap-3">
              {pending.map((project) => (
                <ProjectCard key={project.id} project={project}>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button disabled={loading === `${project.id}-approved`} onClick={() => handleReview(project, "approved")} size="sm" type="button">
                      <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                      Valider
                    </Button>
                    <Button disabled={loading === `${project.id}-rejected`} onClick={() => handleReview(project, "rejected")} size="sm" type="button" variant="outline">
                      <XCircle className="h-4 w-4" aria-hidden="true" />
                      Refuser
                    </Button>
                  </div>
                </ProjectCard>
              ))}
            </div>
          ) : (
            <EmptyState icon={ShieldCheck} title="Aucun projet en attente" description="Les nouvelles soumissions apparaitront ici." />
          )}
        </CardContent>
      </Card>

      <ProjectsSection title="Mes projets refuses" description="Visibilite limitee a l'auteur et a l'administrateur plateforme." projects={rejected} />
    </div>
  );
}

function ProjectsSection({ title, description, projects }: { title: string; description: string; projects: CommunityProject[] }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <Badge variant="green">{projects.length} projet(s)</Badge>
        </div>
      </CardHeader>
      <CardContent>
        {projects.length ? (
          <div className="grid gap-3 lg:grid-cols-2">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        ) : (
          <EmptyState icon={FolderHeart} title="Aucun projet" description="Les projets apparaitront ici apres soumission." />
        )}
      </CardContent>
    </Card>
  );
}

function ProjectCard({ project, children }: { project: CommunityProject; children?: ReactNode }) {
  return (
    <article id={`project-${project.id}`} className="scroll-mt-24 overflow-hidden rounded-xl border border-stone-100 bg-stone-50">
      {project.photos?.[0] ? <div className="h-36 w-full bg-cover bg-center" style={{ backgroundImage: `url(${project.photos[0]})` }} /> : null}
      <div className="p-4">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-black text-night">{project.title}</h3>
          <Badge variant={statusTone[project.status]}>{statusLabels[project.status]}</Badge>
        </div>
        <p className="mt-2 text-sm leading-6 text-stone-600">{project.description}</p>
        <div className="mt-4 grid gap-2 text-sm font-bold text-stone-600 sm:grid-cols-2">
          <span className="rounded-lg bg-white p-3">{categoryLabels[project.category]}</span>
          <span className="rounded-lg bg-white p-3">{formatMoney(project.target_amount)}</span>
          <span className="rounded-lg bg-white p-3">{project.city ?? "Commune non renseignee"}</span>
          <span className="flex items-center gap-2 rounded-lg bg-white p-3">
            <MapPin className="h-4 w-4 text-burkina-green" aria-hidden="true" />
            {project.latitude?.toFixed(3) ?? "--"}, {project.longitude?.toFixed(3) ?? "--"}
          </span>
        </div>
        {project.beneficiaries ? <p className="mt-3 text-sm font-bold text-stone-600">Beneficiaires : {project.beneficiaries}</p> : null}
        {children}
      </div>
    </article>
  );
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XOF", maximumFractionDigits: 0 }).format(value);
}

