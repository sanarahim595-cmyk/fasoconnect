"use client";

import { FormEvent, useState } from "react";
import { AlertTriangle, Crown, Loader2, MailPlus, ShieldCheck, UserPlus, Users, type LucideIcon } from "lucide-react";

import { Alert, Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, EmptyState, Input, PageHeader } from "@/components/ui";
import { MemberDisplayStatus, MemberRole, inviteMemberWithGuarantor } from "@/lib/api";
import { getSessionToken } from "@/lib/auth";

const roleLabels: Record<MemberRole, string> = {
  member: "Membre",
  treasurer: "Trésorier",
  administrator: "Administrateur",
};

const statusLabels: Record<MemberDisplayStatus, string> = {
  up_to_date: "À jour",
  late: "En retard",
  payment_default: "Défaut de paiement",
  current_beneficiary: "Bénéficiaire actuel",
  next_beneficiary: "Prochain bénéficiaire",
};

const statusTone: Record<MemberDisplayStatus, "green" | "yellow" | "red" | "neutral"> = {
  up_to_date: "green",
  late: "yellow",
  payment_default: "red",
  current_beneficiary: "green",
  next_beneficiary: "yellow",
};

const members = [
  {
    name: "Awa Ouedraogo",
    contact: "+226 70 11 22 33",
    role: "administrator" as MemberRole,
    status: "current_beneficiary" as MemberDisplayStatus,
    guarantor: "Issa Traoré",
  },
  {
    name: "Mariam Kaboré",
    contact: "mariam@example.com",
    role: "treasurer" as MemberRole,
    status: "up_to_date" as MemberDisplayStatus,
    guarantor: "Fatou Compaoré",
  },
  {
    name: "Oumar Sawadogo",
    contact: "+226 76 44 55 66",
    role: "member" as MemberRole,
    status: "late" as MemberDisplayStatus,
    guarantor: "Paul Ilboudo",
  },
  {
    name: "Paul Ilboudo",
    contact: "+226 78 88 22 10",
    role: "member" as MemberRole,
    status: "next_beneficiary" as MemberDisplayStatus,
    guarantor: "Awa Ouedraogo",
  },
];

type FieldErrors = Partial<Record<"tontine" | "member" | "contact" | "guarantor" | "guarantorContact" | "session", string>>;

export function MembersManager() {
  const [errors, setErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    setErrors({});
    setServerError(null);
    setSuccess(null);

    const form = new FormData(formElement);
    const validationErrors = validate(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    const token = getSessionToken();
    if (!token) {
      setErrors({ session: "Session expirée. Veuillez vous reconnecter." });
      return;
    }

    try {
      setLoading(true);
      const response = await inviteMemberWithGuarantor(
        {
          tontine_id: String(form.get("tontine_id")),
          full_name: String(form.get("full_name")),
          phone: cleanOptional(form.get("phone")),
          email: cleanOptional(form.get("email")),
          role: String(form.get("role")) as MemberRole,
          guarantor_full_name: String(form.get("guarantor_full_name")),
          guarantor_phone: cleanOptional(form.get("guarantor_phone")),
          guarantor_email: cleanOptional(form.get("guarantor_email")),
          relationship: cleanOptional(form.get("relationship")),
        },
        token,
      );
      setSuccess(response.message);
      formElement.reset();
    } catch (caught) {
      setServerError(caught instanceof Error ? caught.message : "Impossible d'ajouter ce membre.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow="Gestion des membres"
        title="Membres, rôles, statuts et garants"
        description="Chaque membre doit avoir un garant avant d'être ajouté à la tontine."
      />

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Card className="overflow-hidden">
          <div className="h-2 bg-gradient-to-r from-burkina-green via-burkina-yellow to-burkina-red" />
          <CardHeader>
            <CardTitle>Ajouter ou inviter un membre</CardTitle>
            <CardDescription>Invitation par téléphone ou email, avec garant obligatoire.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4" onSubmit={handleSubmit}>
              <Input error={errors.tontine} label="ID de la tontine" name="tontine_id" placeholder="UUID de la tontine" required />
              <Input error={errors.member} label="Nom complet du membre" name="full_name" placeholder="Mariam Kaboré" required />
              <div className="grid gap-4 md:grid-cols-2">
                <Input label="Téléphone du membre" name="phone" placeholder="+226 XX XX XX XX" />
                <Input label="Email du membre" name="email" placeholder="membre@email.com" type="email" />
              </div>
              {errors.contact ? <p className="text-xs font-bold text-burkina-red">{errors.contact}</p> : null}

              <label className="grid gap-2 text-sm font-semibold text-stone-700">
                <span>Rôle</span>
                <select className="h-11 rounded-lg border border-stone-200 bg-white px-3 text-sm shadow-sm outline-none focus:border-burkina-green focus:ring-4 focus:ring-burkina-green/10" name="role">
                  <option value="member">Membre</option>
                  <option value="treasurer">Trésorier</option>
                  <option value="administrator">Administrateur</option>
                </select>
              </label>

              <div className="rounded-xl border border-burkina-green/20 bg-burkina-green/5 p-4">
                <div className="mb-4 flex items-center gap-2 text-sm font-black text-burkina-green">
                  <ShieldCheck className="h-5 w-5" aria-hidden="true" />
                  Garant obligatoire
                </div>
                <div className="grid gap-4">
                  <Input error={errors.guarantor} label="Nom complet du garant" name="guarantor_full_name" placeholder="Issa Traoré" required />
                  <div className="grid gap-4 md:grid-cols-2">
                    <Input label="Téléphone du garant" name="guarantor_phone" placeholder="+226 XX XX XX XX" />
                    <Input label="Email du garant" name="guarantor_email" placeholder="garant@email.com" type="email" />
                  </div>
                  {errors.guarantorContact ? <p className="text-xs font-bold text-burkina-red">{errors.guarantorContact}</p> : null}
                  <Input label="Lien avec le membre" name="relationship" placeholder="Parent, ami, collègue..." />
                </div>
              </div>

              {errors.session ? <Alert variant="danger">{errors.session}</Alert> : null}
              {serverError ? <Alert title="Ajout impossible" variant="danger">{serverError}</Alert> : null}
              {success ? <Alert title="Membre ajouté" variant="success">{success}</Alert> : null}

              <Button className="w-full" disabled={loading} size="lg" type="submit">
                {loading ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> : <UserPlus className="h-5 w-5" aria-hidden="true" />}
                Ajouter le membre avec garant
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle>Liste des membres</CardTitle>
                <CardDescription>Vue claire des rôles, statuts et garants.</CardDescription>
              </div>
              <Badge variant="green">{members.length} membres</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {members.length ? (
              <div className="grid gap-3">
                {members.map((member) => (
                  <article key={member.name} className="rounded-xl border border-stone-100 bg-stone-50 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-black text-night">{member.name}</h3>
                          {member.role === "administrator" ? <Crown className="h-4 w-4 text-burkina-yellow" aria-hidden="true" /> : null}
                        </div>
                        <p className="mt-1 text-sm font-bold text-stone-500">{member.contact}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="neutral">{roleLabels[member.role]}</Badge>
                        <Badge variant={statusTone[member.status]}>{statusLabels[member.status]}</Badge>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center gap-2 rounded-lg bg-white p-3 text-sm font-bold text-stone-600">
                      <ShieldCheck className="h-4 w-4 text-burkina-green" aria-hidden="true" />
                      Garant : {member.guarantor}
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Users}
                title="Aucun membre"
                description="Ajoute ton premier membre avec son garant pour commencer."
              />
            )}
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Contrôles automatiques</CardTitle>
          <CardDescription>FasoTontine bloque toute création de membre sans garant.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <ControlItem icon={ShieldCheck} title="Garant requis" description="Nom et contact du garant obligatoires." />
          <ControlItem icon={MailPlus} title="Invitation" description="Téléphone ou email accepté pour le membre." />
          <ControlItem icon={AlertTriangle} title="Statuts visibles" description="Retard, défaut et bénéficiaires sont lisibles." />
        </CardContent>
      </Card>
    </div>
  );
}

function validate(form: FormData): FieldErrors {
  const errors: FieldErrors = {};
  const tontineId = String(form.get("tontine_id") ?? "").trim();
  const fullName = String(form.get("full_name") ?? "").trim();
  const phone = String(form.get("phone") ?? "").trim();
  const email = String(form.get("email") ?? "").trim();
  const guarantor = String(form.get("guarantor_full_name") ?? "").trim();
  const guarantorPhone = String(form.get("guarantor_phone") ?? "").trim();
  const guarantorEmail = String(form.get("guarantor_email") ?? "").trim();

  if (!tontineId) errors.tontine = "La tontine est obligatoire.";
  if (fullName.length < 3) errors.member = "Le nom du membre doit contenir au moins 3 caractères.";
  if (!phone && !email) errors.contact = "Ajoute un téléphone ou un email pour inviter le membre.";
  if (guarantor.length < 3) errors.guarantor = "Le nom du garant est obligatoire.";
  if (!guarantorPhone && !guarantorEmail) errors.guarantorContact = "Un garant doit avoir un téléphone ou un email.";
  if (phone && guarantorPhone && phone === guarantorPhone) errors.guarantorContact = "Le garant doit être différent du membre.";
  if (email && guarantorEmail && email === guarantorEmail) errors.guarantorContact = "Le garant doit être différent du membre.";

  return errors;
}

function cleanOptional(value: FormDataEntryValue | null) {
  const next = String(value ?? "").trim();
  return next.length ? next : undefined;
}

function ControlItem({ icon: Icon, title, description }: { icon: LucideIcon; title: string; description: string }) {
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


