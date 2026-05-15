"use client";

import {
  AlertTriangle,
  Bell,
  CalendarClock,
  CheckCircle2,
  Clock3,
  Plus,
  MapPin,
  ShieldCheck,
  UserRoundCheck,
  Users,
  WalletCards,
} from "lucide-react";

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  EmptyState,
  PageHeader,
  StatCard,
} from "@/components/ui";

const tontines = [
  {
    name: "Wend Panga",
    members: 12,
    amount: "50 000 FCFA",
    status: "Cycle actif",
    nextPayout: "15 juin 2026",
  },
  {
    name: "Yam Solidarité",
    members: 8,
    amount: "25 000 FCFA",
    status: "Validation règles",
    nextPayout: "En attente",
  },
];

const pendingContributions = [
  { tontine: "Wend Panga", dueDate: "20 mai 2026", amount: "50 000 FCFA" },
  { tontine: "Yam Solidarité", dueDate: "25 mai 2026", amount: "25 000 FCFA" },
];

const paidContributions = [
  { tontine: "Wend Panga", paidAt: "12 mai 2026", amount: "50 000 FCFA" },
  { tontine: "Wend Panga", paidAt: "12 avril 2026", amount: "50 000 FCFA" },
];

const nearbyProjects = [
  { title: "Forage à Tanghin", distance: "2.4 km", progress: 68, category: "Eau potable" },
  { title: "Panneau solaire école", distance: "5.1 km", progress: 42, category: "Éducation" },
];

const notifications = [
  { title: "Cotisation bientôt due", message: "Wend Panga attend ta cotisation avant le 20 mai.", tone: "yellow" },
  { title: "Vote communautaire ouvert", message: "Un projet local attend ton vote cette semaine.", tone: "green" },
];

export function UserDashboard() {
  const lateContributions: typeof pendingContributions = [];
  const guarantor = {
    name: "Issa Traoré",
    phone: "+226 70 12 34 56",
    status: "Garantie active",
  };

  return (
    <div className="grid gap-5 pb-4">
      <PageHeader
        eyebrow="Espace membre"
        title="Bonjour, voici ta tontine aujourd'hui"
        description="Un tableau de bord pensé comme une application mobile : rapide à lire, clair et centré sur tes actions."
        actions={
          <Button onClick={() => window.location.assign("/tontines/new")}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Créer une tontine
          </Button>
        }
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={WalletCards} label="Mes tontines" value="2" trend="1 cycle actif" tone="green" />
        <StatCard icon={Clock3} label="En attente" value="75k" trend="2 cotisations" tone="yellow" />
        <StatCard icon={CheckCircle2} label="Payées" value="100k" trend="2 reçus validés" tone="green" />
        <StatCard icon={ShieldCheck} label="Score de Confiance" value="92%" trend="Très fiable" tone="green" />
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="overflow-hidden">
          <div className="h-2 bg-gradient-to-r from-burkina-green via-burkina-yellow to-burkina-red" />
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle>Mes tontines</CardTitle>
                <CardDescription>Groupes auxquels tu participes actuellement.</CardDescription>
              </div>
              <Badge variant="green">2 actives</Badge>
            </div>
          </CardHeader>
          <CardContent className="grid gap-3">
            {tontines.map((tontine) => (
              <article key={tontine.name} className="rounded-xl border border-stone-100 bg-stone-50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-black text-night">{tontine.name}</h3>
                    <p className="mt-1 text-sm font-bold text-stone-500">
                      {tontine.members} membres · {tontine.amount}
                    </p>
                  </div>
                  <Badge variant={tontine.status === "Cycle actif" ? "green" : "yellow"}>
                    {tontine.status}
                  </Badge>
                </div>
                <div className="mt-4 flex items-center gap-2 text-sm font-bold text-burkina-green">
                  <CalendarClock className="h-4 w-4" aria-hidden="true" />
                  Prochain tour : {tontine.nextPayout}
                </div>
              </article>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Mon prochain tour de réception</CardTitle>
            <CardDescription>Le prochain moment où tu reçois le pot.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-2xl bg-burkina-green p-5 text-white shadow-glow">
              <p className="text-sm font-bold text-white/75">Tontine Wend Panga</p>
              <p className="mt-2 text-3xl font-black">15 juin</p>
              <p className="mt-2 text-sm font-bold text-white/80">Montant estimé : 600 000 FCFA</p>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-5 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Mes cotisations en attente</CardTitle>
            <CardDescription>Paiements à effectuer prochainement.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {pendingContributions.map((item) => (
              <ContributionRow key={`${item.tontine}-${item.dueDate}`} icon={Clock3} tone="yellow" title={item.tontine} subtitle={`Échéance ${item.dueDate}`} amount={item.amount} />
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Mes cotisations payées</CardTitle>
            <CardDescription>Historique récent validé.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {paidContributions.map((item) => (
              <ContributionRow key={`${item.tontine}-${item.paidAt}`} icon={CheckCircle2} tone="green" title={item.tontine} subtitle={`Payée le ${item.paidAt}`} amount={item.amount} />
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Mes retards éventuels</CardTitle>
            <CardDescription>Alertes de paiement à régulariser.</CardDescription>
          </CardHeader>
          <CardContent>
            {lateContributions.length ? (
              <div className="grid gap-3">
                {lateContributions.map((item) => (
                  <ContributionRow key={item.tontine} icon={AlertTriangle} tone="red" title={item.tontine} subtitle={`Retard depuis ${item.dueDate}`} amount={item.amount} />
                ))}
              </div>
            ) : (
              <EmptyState
                className="border-burkina-green/25 bg-burkina-green/5 p-6"
                icon={CheckCircle2}
                title="Aucun retard"
                description="Toutes tes cotisations sont dans les délais."
              />
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
        <Card>
          <CardHeader>
            <CardTitle>Mon garant</CardTitle>
            <CardDescription>Personne sollicitée si un incident bloque le cycle.</CardDescription>
          </CardHeader>
          <CardContent>
            {guarantor ? (
              <div className="flex items-center gap-4 rounded-xl bg-stone-50 p-4">
                <div className="grid h-14 w-14 place-items-center rounded-full bg-burkina-yellow/25 text-yellow-800">
                  <UserRoundCheck className="h-7 w-7" aria-hidden="true" />
                </div>
                <div>
                  <p className="font-black text-night">{guarantor.name}</p>
                  <p className="mt-1 text-sm font-bold text-stone-500">{guarantor.phone}</p>
                  <Badge className="mt-2" variant="green">{guarantor.status}</Badge>
                </div>
              </div>
            ) : (
              <EmptyState icon={Users} title="Aucun garant" description="Ajoute un garant pour sécuriser ton cycle." />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Projets communautaires proches de moi</CardTitle>
            <CardDescription>Initiatives locales ouvertes au soutien des tontines.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            {nearbyProjects.map((project) => (
              <article key={project.title} className="rounded-xl border border-stone-100 bg-stone-50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-black text-night">{project.title}</h3>
                    <p className="mt-1 text-sm font-bold text-stone-500">{project.category}</p>
                  </div>
                  <Badge variant="neutral">
                    <MapPin className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
                    {project.distance}
                  </Badge>
                </div>
                <div className="mt-4 h-3 overflow-hidden rounded-full bg-white">
                  <div className="h-full rounded-full bg-burkina-green" style={{ width: `${project.progress}%` }} />
                </div>
                <p className="mt-2 text-xs font-black text-burkina-green">{project.progress}% collecté</p>
              </article>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Notifications importantes</CardTitle>
            <CardDescription>Ce qui mérite ton attention aujourd&apos;hui.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {notifications.map((notification) => (
              <div key={notification.title} className="flex gap-3 rounded-xl border border-stone-100 bg-white p-4 shadow-sm">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-burkina-green/10 text-burkina-green">
                  <Bell className="h-5 w-5" aria-hidden="true" />
                </div>
                <div>
                  <p className="font-black text-night">{notification.title}</p>
                  <p className="mt-1 text-sm leading-6 text-stone-600">{notification.message}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <div className="h-2 bg-gradient-to-r from-burkina-green via-burkina-yellow to-burkina-red" />
          <CardHeader>
            <CardTitle>Score de Confiance</CardTitle>
            <CardDescription>Calculé à partir des paiements, retards et incidents.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid place-items-center rounded-2xl bg-stone-50 p-6 text-center">
              <div className="grid h-28 w-28 place-items-center rounded-full border-[10px] border-burkina-green bg-white shadow-soft">
                <span className="text-3xl font-black text-burkina-green">92</span>
              </div>
              <p className="mt-4 text-lg font-black text-night">Très fiable</p>
              <p className="mt-2 max-w-xs text-sm leading-6 text-stone-600">
                Continue à payer dans les délais pour garder un score élevé.
              </p>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function ContributionRow({
  icon: Icon,
  tone,
  title,
  subtitle,
  amount,
}: {
  icon: typeof Clock3;
  tone: "green" | "yellow" | "red";
  title: string;
  subtitle: string;
  amount: string;
}) {
  const toneClasses = {
    green: "bg-burkina-green/10 text-burkina-green",
    yellow: "bg-burkina-yellow/20 text-yellow-800",
    red: "bg-burkina-red/10 text-burkina-red",
  };

  return (
    <div className="flex items-center gap-3 rounded-xl bg-stone-50 p-3">
      <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg ${toneClasses[tone]}`}>
        <Icon className="h-5 w-5" aria-hidden="true" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-black text-night">{title}</p>
        <p className="truncate text-xs font-bold text-stone-500">{subtitle}</p>
      </div>
      <p className="text-right text-sm font-black text-night">{amount}</p>
    </div>
  );
}
