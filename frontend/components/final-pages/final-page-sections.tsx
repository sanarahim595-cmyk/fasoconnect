import Link from "next/link";

import { AlertTriangle, CalendarClock, CheckCircle2, FolderHeart, HandHeart, History, ShieldCheck, UserRound, Users, WalletCards, type LucideIcon } from "lucide-react";

import { Alert, Badge, Card, CardContent, CardDescription, CardHeader, CardTitle, EmptyState, PageHeader, StatCard } from "@/components/ui";

const tontines = [
  { id: "wend-panga", name: "Tontine Wend-Panga", amount: "10 000 XOF", frequency: "Mensuelle", members: 14, status: "Active" },
  { id: "solidarite-bobo", name: "Solidarite Bobo", amount: "5 000 XOF", frequency: "Hebdomadaire", members: 9, status: "Brouillon" },
];

export function MyTontinesContent() {
  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow="Mes tontines"
        title="Toutes tes tontines au meme endroit"
        description="Suis les groupes auxquels tu participes, les cycles actifs et les prochaines actions."
        actions={<Link className="inline-flex h-11 items-center rounded-lg bg-burkina-green px-4 text-sm font-black text-white" href="/tontines/new">Creer une tontine</Link>}
      />
      <section className="grid gap-4 md:grid-cols-3">
        <StatCard icon={Users} label="Tontines" value={String(tontines.length)} />
        <StatCard icon={WalletCards} label="Cycle actif" value="1" tone="yellow" />
        <StatCard icon={CheckCircle2} label="A jour" value="92%" tone="green" />
      </section>
      <Card>
        <CardHeader>
          <CardTitle>Liste de mes tontines</CardTitle>
          <CardDescription>Ouvre une tontine pour voir ses membres, regles, cotisations et votes.</CardDescription>
        </CardHeader>
        <CardContent>
          {tontines.length ? (
            <div className="grid gap-3 lg:grid-cols-2">
              {tontines.map((tontine) => (
                <article key={tontine.id} className="rounded-xl border border-stone-100 bg-stone-50 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-black text-night">{tontine.name}</h3>
                      <p className="mt-1 text-sm font-bold text-stone-500">{tontine.amount} · {tontine.frequency}</p>
                    </div>
                    <Badge variant={tontine.status === "Active" ? "green" : "yellow"}>{tontine.status}</Badge>
                  </div>
                  <p className="mt-4 text-sm leading-6 text-stone-600">{tontine.members} membres inscrits. Les informations detaillees sont disponibles dans l&apos;espace tontine.</p>
                  <Link className="mt-4 inline-flex h-10 items-center rounded-lg bg-burkina-green px-4 text-sm font-black text-white" href={`/tontines/${tontine.id}`}>Voir detail</Link>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState icon={Users} title="Aucune tontine" description="Cree ou rejoins une tontine pour commencer a suivre tes cycles." />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export function TontineDetailContent({ id }: { id: string }) {
  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow="Detail tontine"
        title="Tontine Wend-Panga"
        description={`Identifiant: ${id}. Vue complete du cycle, des regles, des membres et des incidents.`}
        actions={<Link className="inline-flex h-11 items-center rounded-lg bg-burkina-green px-4 text-sm font-black text-white" href="/tontines/admin">Administrer</Link>}
      />
      <section className="grid gap-4 md:grid-cols-4">
        <StatCard icon={Users} label="Membres" value="14" />
        <StatCard icon={WalletCards} label="Cotisation" value="10k" tone="yellow" />
        <StatCard icon={CalendarClock} label="Prochain tour" value="22 mai" />
        <StatCard icon={AlertTriangle} label="Retards" value="2" tone="red" />
      </section>
      <section className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Regles de la tontine</CardTitle>
            <CardDescription>Contrat numerique valide par le groupe.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm font-bold text-stone-600">
            <p className="rounded-xl bg-stone-50 p-4">Montant: 10 000 XOF par mois. Penalite: 1 000 XOF apres trois jours de retard.</p>
            <p className="rounded-xl bg-stone-50 p-4">Ordre de passage manuel, verrouille apres validation par vote.</p>
            <Alert variant="info" title="Etat du cycle">Le prochain beneficiaire est Mariam Kabore.</Alert>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Actions rapides</CardTitle>
            <CardDescription>Acces aux modules lies a cette tontine.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <QuickLink href="/tontines/members" label="Gerer les membres" icon={Users} />
            <QuickLink href="/cotisations" label="Gerer les cotisations" icon={WalletCards} />
            <QuickLink href="/retards" label="Suivre les retards" icon={AlertTriangle} />
            <QuickLink href="/votes" label="Lancer un vote" icon={History} />
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

export function ProfileContent() {
  return (
    <div className="grid gap-6">
      <PageHeader eyebrow="Profil" title="Profil utilisateur" description="Informations personnelles, verification CNIB et preferences de compte." />
      <section className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
        <Card>
          <CardHeader>
            <CardTitle>Identite</CardTitle>
            <CardDescription>Compte de demonstration connecte.</CardDescription>
          </CardHeader>
          <CardContent className="grid place-items-center text-center">
            <div className="grid h-20 w-20 place-items-center rounded-full bg-burkina-green text-2xl font-black text-white">FT</div>
            <h3 className="mt-4 text-xl font-black text-night">Utilisateur FasoTontine</h3>
            <p className="mt-2 text-sm font-bold text-stone-500">+226 70 00 00 00 · Ouagadougou</p>
            <Badge className="mt-4" variant="green">CNIB verifiee</Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Parametres du compte</CardTitle>
            <CardDescription>Les modifications sensibles seront validees par CNIB.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <InfoRow label="Role" value="Utilisateur" />
            <InfoRow label="Score de Confiance" value="82/100" />
            <InfoRow label="Notifications" value="Paiements, votes, projets et garants" />
            <EmptyState icon={UserRound} title="Aucune demande en attente" description="Les demandes de modification du profil apparaitront ici." />
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

export function AboutContent() {
  return (
    <main className="min-h-screen bg-burkina-white px-5 py-8 text-night sm:px-8">
      <div className="mx-auto grid max-w-6xl gap-8">
        <PageHeader
          eyebrow="A propos"
          title="FasoTontine, moderniser la tontine sans trahir son ame"
          description="Une plateforme imaginee pour rendre l'epargne collective plus transparente, plus fiable et plus utile aux communautes locales."
          actions={<Link className="inline-flex h-11 items-center rounded-lg bg-burkina-green px-4 text-sm font-black text-white" href="/">Accueil</Link>}
        />
        <section className="grid gap-6 md:grid-cols-3">
          <Card><CardContent className="pt-6"><HandHeart className="h-8 w-8 text-burkina-green" /><h2 className="mt-4 font-black">Vision</h2><p className="mt-2 text-sm leading-6 text-stone-600">Faire de la tontine un outil numerique de confiance et de solidarite locale.</p></CardContent></Card>
          <Card><CardContent className="pt-6"><ShieldCheck className="h-8 w-8 text-burkina-green" /><h2 className="mt-4 font-black">Transparence</h2><p className="mt-2 text-sm leading-6 text-stone-600">Paiements, retards, votes, garants et projets restent visibles et tracables.</p></CardContent></Card>
          <Card><CardContent className="pt-6"><FolderHeart className="h-8 w-8 text-burkina-green" /><h2 className="mt-4 font-black">Impact</h2><p className="mt-2 text-sm leading-6 text-stone-600">Les groupes peuvent soutenir des projets d&apos;eau, d&apos;ecole, de sante ou d&apos;energie solaire.</p></CardContent></Card>
        </section>
        <Card>
          <CardHeader>
            <CardTitle>Equipe Bug Hunters</CardTitle>
            <CardDescription>Une equipe universitaire portee par la rigueur technique et l&apos;utilite sociale.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="leading-7 text-stone-600">FasoTontine part d&apos;un probleme concret: cahiers divergents, manque de transparence, conflits de paiement et argent enferme dans un petit cercle. L&apos;application apporte un arbitre neutre, des regles validees, des notifications, des votes et un pont vers les projets communautaires.</p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

function QuickLink({ href, label, icon: Icon }: { href: string; label: string; icon: LucideIcon }) {
  return (
    <Link className="flex items-center gap-3 rounded-xl bg-stone-50 p-4 font-black text-night transition hover:bg-burkina-green/10" href={href}>
      <Icon className="h-5 w-5 text-burkina-green" aria-hidden="true" />
      {label}
    </Link>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl bg-stone-50 p-4 text-sm">
      <span className="font-bold text-stone-500">{label}</span>
      <span className="font-black text-night">{value}</span>
    </div>
  );
}
