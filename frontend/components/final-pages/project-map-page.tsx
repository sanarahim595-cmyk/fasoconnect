"use client";

import dynamic from "next/dynamic";

import { Card, CardContent, CardDescription, CardHeader, CardTitle, PageHeader } from "@/components/ui";
import { CommunityProject } from "@/lib/api";

const ProjectMap = dynamic(() => import("@/components/projets/projects-map").then((module) => module.ProjectMap), {
  ssr: false,
  loading: () => <div className="grid h-96 place-items-center rounded-xl bg-stone-100 text-sm font-bold text-stone-500">Carte en chargement...</div>,
});

const projects: CommunityProject[] = [
  {
    id: "map-project-1",
    submitted_by: "demo",
    title: "Forage d'eau potable",
    description: "Projet valide pour ameliorer l'acces a l'eau dans un quartier dense.",
    category: "eau",
    city: "Ouagadougou",
    latitude: 12.3714,
    longitude: -1.5197,
    target_amount: 2500000,
    collected_amount: 0,
    currency: "XOF",
    status: "approved",
    photos: ["https://images.unsplash.com/photo-1541544741938-0af808871cc0?q=80&w=900&auto=format&fit=crop"],
    created_at: "2026-05-01T08:00:00Z",
    updated_at: "2026-05-01T08:00:00Z",
  },
  {
    id: "map-project-2",
    submitted_by: "demo",
    title: "Reboisement d'une cour scolaire",
    description: "Projet valide pour reduire la chaleur et creer des espaces d'ombre.",
    category: "environnement",
    city: "Ouahigouya",
    latitude: 13.5828,
    longitude: -2.4216,
    target_amount: 650000,
    collected_amount: 0,
    currency: "XOF",
    status: "approved",
    photos: ["https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?q=80&w=900&auto=format&fit=crop"],
    created_at: "2026-05-06T08:00:00Z",
    updated_at: "2026-05-06T08:00:00Z",
  },
];

export function ProjectMapPageContent() {
  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow="Carte des projets"
        title="Explorer les projets communautaires valides"
        description="Filtre par categorie ou commune, puis clique sur un marqueur pour voter ou consulter les details."
      />
      <Card>
        <CardHeader>
          <CardTitle>Carte interactive</CardTitle>
          <CardDescription>Leaflet et OpenStreetMap, optimisee pour mobile.</CardDescription>
        </CardHeader>
        <CardContent>
          <ProjectMap projects={projects} selectedPoint={{ lat: 12.3714, lng: -1.5197 }} onSelect={() => undefined} />
        </CardContent>
      </Card>
    </div>
  );
}
