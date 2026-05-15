"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, Save } from "lucide-react";

import { Alert, Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input } from "@/components/ui";
import { CreateTontinePayload, Tontine, createTontine } from "@/lib/api";
import { getSessionToken, getSessionUser } from "@/lib/auth";

type FieldErrors = Partial<Record<"name" | "amount" | "startDate" | "maxMembers" | "rules" | "session", string>>;

const frequencyOptions = [
  { label: "Quotidienne", value: "daily" },
  { label: "Hebdomadaire", value: "weekly" },
  { label: "Mensuelle", value: "monthly" },
] as const;

const statusOptions = [
  { label: "Brouillon", value: "draft" },
  { label: "Active", value: "active" },
  { label: "Terminée", value: "completed" },
] as const;

export function CreateTontineForm() {
  const router = useRouter();
  const [errors, setErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [created, setCreated] = useState<Tontine | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    setErrors({});
    setServerError(null);
    setCreated(null);

    const form = new FormData(formElement);
    const validationErrors = validate(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    const token = getSessionToken();
    const user = getSessionUser();
    if (!token || !user) {
      setErrors({ session: "Session expirée. Veuillez vous reconnecter." });
      return;
    }

    const payoutMode = String(form.get("payout_order_mode")) as "manual" | "automatic";
    const payload: CreateTontinePayload = {
      name: String(form.get("name")),
      description: String(form.get("description") ?? ""),
      organizer_id: user.id,
      contribution_amount: Number(form.get("contribution_amount")),
      currency: "XOF",
      frequency: String(form.get("frequency")) as CreateTontinePayload["frequency"],
      start_date: String(form.get("start_date")),
      max_members: Number(form.get("max_members")),
      rules: {
        internal_rules: String(form.get("rules")),
        payout_order_mode: payoutMode,
      },
      payout_order_locked: payoutMode === "manual",
      status: String(form.get("status")) as CreateTontinePayload["status"],
    };

    try {
      setLoading(true);
      setCreated(await createTontine(payload, token));
      formElement.reset();
      router.refresh();
      setTimeout(() => router.push("/tontines"), 700);
    } catch (caught) {
      setServerError(caught instanceof Error ? caught.message : "Impossible de créer la tontine.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="overflow-hidden">
      <div className="h-2 bg-gradient-to-r from-burkina-green via-burkina-yellow to-burkina-red" />
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="text-2xl">Nouvelle tontine</CardTitle>
            <CardDescription>
              Définis les règles dès le départ pour éviter les conflits pendant le cycle.
            </CardDescription>
          </div>
          <Badge variant="green">Contrat numérique</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <form className="grid gap-5" onSubmit={handleSubmit}>
          <Input error={errors.name} label="Nom de la tontine" name="name" placeholder="Wend Panga" required />
          <label className="grid gap-2 text-sm font-semibold text-stone-700">
            <span>Description</span>
            <textarea
              className="min-h-24 rounded-lg border border-stone-200 bg-white px-3 py-3 text-sm text-night shadow-sm outline-none transition placeholder:text-stone-400 focus:border-burkina-green focus:ring-4 focus:ring-burkina-green/10"
              name="description"
              placeholder="Objectif, quartier, type de groupe..."
            />
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            <Input error={errors.amount} label="Montant de cotisation" min="1" name="contribution_amount" placeholder="50000" required type="number" />
            <label className="grid gap-2 text-sm font-semibold text-stone-700">
              <span>Fréquence</span>
              <select className="h-11 rounded-lg border border-stone-200 bg-white px-3 text-sm shadow-sm outline-none focus:border-burkina-green focus:ring-4 focus:ring-burkina-green/10" name="frequency" required>
                {frequencyOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Input error={errors.startDate} label="Date de début" name="start_date" required type="date" />
            <Input error={errors.maxMembers} label="Nombre maximum de membres" min="2" name="max_members" placeholder="12" required type="number" />
          </div>

          <label className="grid gap-2 text-sm font-semibold text-stone-700">
            <span>Règles internes</span>
            <textarea
              className="min-h-28 rounded-lg border border-stone-200 bg-white px-3 py-3 text-sm text-night shadow-sm outline-none transition placeholder:text-stone-400 focus:border-burkina-green focus:ring-4 focus:ring-burkina-green/10"
              name="rules"
              placeholder="Ex : retard toléré 48h, appel au garant, pénalité..."
              required
            />
            {errors.rules ? <span className="text-xs font-medium text-burkina-red">{errors.rules}</span> : null}
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm font-semibold text-stone-700">
              <span>Ordre de passage</span>
              <select className="h-11 rounded-lg border border-stone-200 bg-white px-3 text-sm shadow-sm outline-none focus:border-burkina-green focus:ring-4 focus:ring-burkina-green/10" name="payout_order_mode" required>
                <option value="manual">Manuel</option>
                <option value="automatic">Automatique</option>
              </select>
            </label>
            <label className="grid gap-2 text-sm font-semibold text-stone-700">
              <span>Statut</span>
              <select className="h-11 rounded-lg border border-stone-200 bg-white px-3 text-sm shadow-sm outline-none focus:border-burkina-green focus:ring-4 focus:ring-burkina-green/10" name="status" required>
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>
          </div>

          {errors.session ? <Alert variant="danger">{errors.session}</Alert> : null}
          {serverError ? <Alert title="Action à vérifier" variant="warning">{serverError}</Alert> : null}
          {created ? (
            <Alert title="Tontine créée avec succès" variant="success">
              {created.name} a été sauvegardée en base de données avec le statut {created.status}.
            </Alert>
          ) : null}

          <Button className="w-full" disabled={loading} size="lg" type="submit">
            {loading ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> : <Save className="h-5 w-5" aria-hidden="true" />}
            Sauvegarder la tontine
          </Button>
        </form>

        <div className="mt-6 flex items-start gap-3 rounded-xl bg-burkina-green/5 p-4 text-sm font-bold text-stone-600">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-burkina-green" aria-hidden="true" />
          Les règles et l&apos;ordre de passage seront visibles par les membres dès l&apos;activation du cycle.
        </div>
      </CardContent>
    </Card>
  );
}

function validate(form: FormData): FieldErrors {
  const errors: FieldErrors = {};
  const name = String(form.get("name") ?? "").trim();
  const amount = Number(form.get("contribution_amount"));
  const startDate = String(form.get("start_date") ?? "");
  const maxMembers = Number(form.get("max_members"));
  const rules = String(form.get("rules") ?? "").trim();

  if (name.length < 3) {
    errors.name = "Le nom doit contenir au moins 3 caractères.";
  }
  if (!Number.isFinite(amount) || amount <= 0) {
    errors.amount = "Le montant de cotisation doit être supérieur à 0.";
  }
  if (!startDate) {
    errors.startDate = "La date de début est obligatoire.";
  }
  if (!Number.isInteger(maxMembers) || maxMembers < 2) {
    errors.maxMembers = "Le groupe doit contenir au moins 2 membres.";
  }
  if (rules.length < 10) {
    errors.rules = "Les règles internes doivent être suffisamment détaillées.";
  }

  return errors;
}
