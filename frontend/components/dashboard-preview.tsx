"use client";

import {
  ArrowRight,
  CircleDollarSign,
  HandHeart,
  MapPin,
  Plus,
  ShieldCheck,
  Users,
} from "lucide-react";
import { useState } from "react";

import {
  Alert,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  EmptyState,
  Input,
  Modal,
  PageHeader,
  StatCard,
} from "@/components/ui";

export function DashboardPreview() {
  const [open, setOpen] = useState(false);

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow="Design system"
        title="Une interface claire pour des tontines de confiance"
        description="Palette Burkina Faso, composants reutilisables, navigation responsive et bases visuelles pretes pour les prochains modules."
        actions={
          <>
            <Button variant="outline">Voir les projets</Button>
            <Button onClick={() => setOpen(true)}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              Nouvelle tontine
            </Button>
          </>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Users} label="Membres actifs" value="128" trend="+18 ce mois" tone="green" />
        <StatCard icon={CircleDollarSign} label="Cotisations" value="8.4M" trend="FCFA suivis" tone="yellow" />
        <StatCard icon={ShieldCheck} label="Score moyen" value="92%" trend="Confiance elevee" tone="green" />
        <StatCard icon={HandHeart} label="Impact local" value="3" trend="Projets finances" tone="red" />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle>Tontine Wend Panga</CardTitle>
                <CardDescription>Cycle mensuel, transparence en temps reel et garants suivis.</CardDescription>
              </div>
              <Badge variant="green">Cycle en cours</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {[
                ["Awa Ouedraogo", "Paye", "green", "50 000 FCFA"],
                ["Issa Traore", "En attente", "yellow", "50 000 FCFA"],
                ["Mariam Kabore", "Garantie validee", "red", "50 000 FCFA"],
              ].map(([name, status, tone, amount]) => (
                <div
                  key={name}
                  className="flex flex-col gap-3 rounded-xl border border-stone-100 bg-stone-50/80 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-black text-night">{name}</p>
                    <p className="text-sm font-medium text-stone-500">{amount}</p>
                  </div>
                  <Badge variant={tone as "green" | "yellow" | "red"}>{status}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6">
          <Alert title="Retard detecte" variant="warning">
            Le garant du membre concerne peut etre sollicite selon les regles du cycle.
          </Alert>

          <Card>
            <CardHeader>
              <CardTitle>Validation membre</CardTitle>
              <CardDescription>Exemple de formulaire coherent avec le futur espace CNIB.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <Input label="Nom complet" placeholder="Nom et prenom" />
              <Input label="Telephone" placeholder="+226 XX XX XX XX" />
              <Button className="w-full">
                Continuer
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <EmptyState
          icon={MapPin}
          title="Carte des projets locaux"
          description="Pret pour connecter Leaflet et OpenStreetMap aux projets soumis par les mairies et ONG."
          actionLabel="Preparer la carte"
        />

        <Card className="overflow-hidden">
          <div className="h-2 bg-gradient-to-r from-burkina-green via-burkina-yellow to-burkina-red" />
          <CardHeader>
            <CardTitle>Projet communautaire</CardTitle>
            <CardDescription>Panneau solaire pour une ecole primaire.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex items-center justify-between text-sm font-bold">
              <span>Collecte</span>
              <span>72%</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-stone-100">
              <div className="h-full w-[72%] rounded-full bg-burkina-green" />
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <Badge variant="green">Vote favorable</Badge>
              <Badge variant="yellow">Photos requises</Badge>
              <Badge variant="neutral">Suivi public</Badge>
            </div>
          </CardContent>
        </Card>
      </section>

      <Modal
        open={open}
        title="Nouvelle tontine"
        description="Le composant Modal est pret pour les futurs formulaires de creation."
        onClose={() => setOpen(false)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button onClick={() => setOpen(false)}>Creer</Button>
          </>
        }
      >
        <div className="grid gap-4">
          <Input label="Nom de la tontine" placeholder="Ex: Wend Panga" />
          <Input label="Montant par membre" placeholder="50 000 FCFA" />
          <Alert variant="success">Les regles seront validees par tous les membres avant lancement.</Alert>
        </div>
      </Modal>
    </div>
  );
}
