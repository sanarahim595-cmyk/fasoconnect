"use client";

import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock3,
  Coins,
  Eye,
  HandCoins,
  MapPin,
  ShieldCheck,
  Users,
  Vote,
  WalletCards,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui";
import { cn } from "@/lib/utils";

const problems = [
  {
    title: "Manque de transparence",
    description: "Tout le groupe doit savoir qui a payé, qui est en retard et quand le fonds sera remis.",
    icon: Eye,
  },
  {
    title: "Conflits",
    description: "Les discussions deviennent vite tendues quand les règles ne sont pas visibles par tous.",
    icon: Users,
  },
  {
    title: "Retards",
    description: "Un membre qui bloque le cycle peut fragiliser toute la tontine et casser la confiance.",
    icon: Clock3,
  },
];

const solutions = [
  "Règles validées dès le départ par tous les membres.",
  "Suivi en temps réel des cotisations, retards et distributions.",
  "Garants enregistrés pour permettre au groupe de continuer en cas de défaut.",
  "Votes et traçabilité pour soutenir des projets communautaires.",
];

const simulationSteps = [
  {
    title: "Créer la tontine",
    description: "Le groupe définit le montant, la fréquence, les membres, les garants et l'ordre de passage.",
    icon: WalletCards,
    status: "Contrat numérique",
  },
  {
    title: "Cotiser ensemble",
    description: "Chaque paiement apparaît dans le tableau de bord, avec un statut clair et partagé.",
    icon: HandCoins,
    status: "Transparence",
  },
  {
    title: "Distribuer le pot",
    description: "Au bon moment, le membre prévu reçoit le pot selon les règles validées.",
    icon: Coins,
    status: "Cycle fluide",
  },
  {
    title: "Soutenir un projet",
    description: "Le groupe peut voter et allouer une part du fonds à un projet local traçable.",
    icon: Vote,
    status: "Impact citoyen",
  },
];

export function HomeLanding() {
  const [activeCount, setActiveCount] = useState(1208);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setActiveCount((current) => current + 1);
    }, 4200);

    return () => window.clearInterval(interval);
  }, []);

  const currentStep = simulationSteps[step];
  const StepIcon = currentStep.icon;

  const potMembers = useMemo(
    () => ["Awa", "Issa", "Mariam", "Paul", "Fatou", "Oumar"],
    [],
  );

  return (
    <main className="min-h-screen overflow-hidden bg-burkina-white text-night">
      <section className="relative min-h-screen px-5 py-5 sm:px-8">
        <div className="absolute inset-x-0 top-0 h-2 bg-gradient-to-r from-burkina-red via-burkina-yellow to-burkina-green" />
        <div className="mx-auto flex min-h-[calc(100vh-2.5rem)] max-w-7xl flex-col">
          <header className="flex items-center justify-between gap-4 py-3">
            <div className="flex items-center gap-3">
              <BurkinaFlag className="h-12 w-16" />
              <div>
                <p className="text-lg font-black leading-tight">FasoTontine</p>
                <p className="text-xs font-bold uppercase tracking-normal text-burkina-green">
                  Burkina Faso
                </p>
              </div>
            </div>

            <nav className="hidden items-center gap-2 md:flex">
              <a className="rounded-lg px-3 py-2 text-sm font-bold text-stone-600 transition hover:bg-white" href="#probleme">
                Problème
              </a>
              <a className="rounded-lg px-3 py-2 text-sm font-bold text-stone-600 transition hover:bg-white" href="#solution">
                Solution
              </a>
              <a className="rounded-lg px-3 py-2 text-sm font-bold text-stone-600 transition hover:bg-white" href="#simulation">
                Simulation
              </a>
            </nav>
          </header>

          <div className="grid flex-1 items-center gap-10 py-10 lg:grid-cols-[1.02fr_0.98fr]">
            <div className="max-w-3xl animate-fade-up">
              <Badge variant="green">Plateforme moderne de tontines</Badge>
              <h1 className="mt-5 text-5xl font-black leading-[1.02] text-night sm:text-6xl lg:text-7xl">
                FasoTontine
              </h1>
              <p className="mt-5 text-2xl font-black leading-tight text-burkina-red sm:text-3xl">
                Épargnons ensemble. Construisons ensemble.
              </p>
              <p className="mt-6 max-w-2xl text-base leading-8 text-stone-600 sm:text-lg">
                La tontine garde sa force collective, mais gagne la transparence,
                la traçabilité et la confiance nécessaires pour servir les familles
                et les communautés locales.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button onClick={() => window.location.assign("/register")} size="lg">
                  Créer un compte
                  <ArrowRight className="h-5 w-5" aria-hidden="true" />
                </Button>
                <Button onClick={() => window.location.assign("/login")} size="lg" variant="outline">
                  Se connecter
                </Button>
                <Button size="lg" variant="secondary">
                  <MapPin className="h-5 w-5" aria-hidden="true" />
                  Voir les projets communautaires
                </Button>
              </div>

              <div className="mt-8 grid max-w-xl gap-3 sm:grid-cols-[0.9fr_1.1fr]">
                <Card className="p-5">
                  <p className="text-sm font-bold text-stone-500">Tontines actives</p>
                  <p className="mt-2 text-4xl font-black text-burkina-green">
                    {activeCount.toLocaleString("fr-FR")}
                  </p>
                </Card>
                <Card className="p-5">
                  <p className="text-sm font-bold text-stone-500">Confiance suivie</p>
                  <div className="mt-3 flex items-center gap-3">
                    <ShieldCheck className="h-9 w-9 text-burkina-green" aria-hidden="true" />
                    <p className="text-sm font-bold leading-6 text-stone-600">
                      Paiements, retards, garants et votes visibles par tous.
                    </p>
                  </div>
                </Card>
              </div>
            </div>

            <HeroPot members={potMembers} />
          </div>
        </div>
      </section>

      <section id="probleme" className="px-5 py-16 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <Badge variant="red">Le problème</Badge>
            <h2 className="mt-4 text-3xl font-black leading-tight sm:text-4xl">
              La tontine est puissante, mais elle devient fragile quand la confiance manque.
            </h2>
          </div>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {problems.map((problem) => (
              <Card key={problem.title} className="p-6">
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-burkina-red/10 text-burkina-red">
                  <problem.icon className="h-6 w-6" aria-hidden="true" />
                </div>
                <h3 className="mt-5 text-xl font-black">{problem.title}</h3>
                <p className="mt-3 text-sm leading-7 text-stone-600">{problem.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="solution" className="px-5 py-16 sm:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div>
            <Badge variant="green">La solution</Badge>
            <h2 className="mt-4 text-3xl font-black leading-tight sm:text-4xl">
              Un arbitre numérique simple, clair et accepté par tout le groupe.
            </h2>
            <p className="mt-5 text-base leading-8 text-stone-600">
              FasoTontine transforme les règles de la tontine en contrat numérique,
              affiche les statuts en temps réel et relie l&apos;épargne privée aux projets
              communautaires choisis par vote.
            </p>
          </div>

          <Card className="overflow-hidden">
            <div className="h-2 bg-gradient-to-r from-burkina-green via-burkina-yellow to-burkina-red" />
            <CardContent className="grid gap-4 p-6">
              {solutions.map((item) => (
                <div key={item} className="flex gap-3 rounded-xl bg-stone-50 p-4">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-burkina-green" aria-hidden="true" />
                  <p className="text-sm font-bold leading-6 text-stone-700">{item}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </section>

      <section id="simulation" className="px-5 py-16 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="max-w-3xl">
              <Badge variant="yellow">Simulation interactive</Badge>
              <h2 className="mt-4 text-3xl font-black leading-tight sm:text-4xl">
                Teste une tontine fictive en 4 étapes.
              </h2>
              <p className="mt-4 text-base leading-8 text-stone-600">
                Avance, recule et visualise le parcours avant même de créer un compte.
              </p>
            </div>
            <div className="flex items-center gap-2">
              {simulationSteps.map((item, index) => (
                <button
                  key={item.title}
                  aria-label={`Aller à l'étape ${index + 1}`}
                  className={cn(
                    "h-2.5 rounded-full transition-all",
                    index === step ? "w-10 bg-burkina-green" : "w-2.5 bg-stone-300",
                  )}
                  onClick={() => setStep(index)}
                  type="button"
                />
              ))}
            </div>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
            <Card className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="grid h-14 w-14 place-items-center rounded-xl bg-burkina-green/10 text-burkina-green">
                  <StepIcon className="h-7 w-7" aria-hidden="true" />
                </div>
                <Badge variant="green">Étape {step + 1}/4</Badge>
              </div>
              <h3 className="mt-6 text-3xl font-black">{currentStep.title}</h3>
              <p className="mt-4 text-base leading-8 text-stone-600">{currentStep.description}</p>
              <Badge className="mt-6" variant="yellow">
                {currentStep.status}
              </Badge>
              <div className="mt-8 flex gap-3">
                <Button
                  disabled={step === 0}
                  onClick={() => setStep((value) => Math.max(0, value - 1))}
                  variant="outline"
                >
                  <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                  Précédent
                </Button>
                <Button onClick={() => setStep((value) => Math.min(3, value + 1))} disabled={step === 3}>
                  Suivant
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Button>
              </div>
            </Card>

            <Card className="overflow-hidden">
              <CardHeader>
                <CardTitle>Tontine fictive: Wend Panga</CardTitle>
                <CardDescription>
                  Chaque étape met en avant le statut du groupe, les fonds et l&apos;impact local.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  {simulationSteps.map((item, index) => (
                    <div
                      key={item.title}
                      className={cn(
                        "rounded-xl border p-4 transition",
                        index === step
                          ? "border-burkina-green bg-burkina-green/10 shadow-glow"
                          : "border-stone-200 bg-stone-50",
                      )}
                    >
                      <p className="text-xs font-black uppercase tracking-normal text-stone-500">
                        {String(index + 1).padStart(2, "0")}
                      </p>
                      <p className="mt-2 font-black text-night">{item.title}</p>
                      <p className="mt-2 text-sm leading-6 text-stone-600">{item.status}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </main>
  );
}

function BurkinaFlag({ className }: { className?: string }) {
  return (
    <div className={cn("relative overflow-hidden rounded-lg border border-white/70 shadow-soft", className)} aria-label="Drapeau du Burkina Faso">
      <div className="h-1/2 bg-burkina-red" />
      <div className="h-1/2 bg-burkina-green" />
      <svg className="absolute left-1/2 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2" viewBox="0 0 24 24" aria-hidden="true">
        <polygon fill="#f4c542" points="12,2 14.9,8.4 22,9.2 16.7,14 18.2,21 12,17.4 5.8,21 7.3,14 2,9.2 9.1,8.4" />
      </svg>
    </div>
  );
}

function HeroPot({ members }: { members: string[] }) {
  return (
    <div className="animate-fade-up lg:pl-4">
      <Card className="relative overflow-hidden p-5 sm:p-7">
        <div className="absolute right-6 top-6">
          <BurkinaFlag className="h-10 w-14" />
        </div>
        <div className="mt-10 grid place-items-center">
          <div className="tontine-pot" aria-label="Pot de tontine qui se remplit progressivement">
            <div className="tontine-pot-fill" />
            <div className="tontine-pot-shine" />
            <div className="tontine-coin coin-one" />
            <div className="tontine-coin coin-two" />
            <div className="tontine-coin coin-three" />
            <div className="relative z-10 text-center">
              <p className="text-sm font-black uppercase tracking-normal text-white/80">Pot commun</p>
              <p className="mt-2 text-4xl font-black text-white">1.2M</p>
              <p className="mt-1 text-sm font-bold text-white/80">FCFA</p>
            </div>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-3 gap-3">
          {members.map((member, index) => (
            <div key={member} className="rounded-xl bg-stone-50 p-3 text-center">
              <div
                className={cn(
                  "mx-auto grid h-9 w-9 place-items-center rounded-full text-xs font-black text-white",
                  index % 3 === 0 && "bg-burkina-green",
                  index % 3 === 1 && "bg-burkina-red",
                  index % 3 === 2 && "bg-burkina-yellow text-night",
                )}
              >
                {member.slice(0, 1)}
              </div>
              <p className="mt-2 truncate text-xs font-black text-stone-600">{member}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
