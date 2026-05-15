"use client";

import { FormEvent, useState } from "react";
import { CheckCircle2, FileScan, Loader2, ShieldAlert, Upload } from "lucide-react";

import { Alert, Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input } from "@/components/ui";
import { RegisterWithCnibResult, registerWithCnib } from "@/lib/api";

export function RegisterForm() {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RegisterWithCnibResult | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setResult(null);

    const form = new FormData(event.currentTarget);
    if (file) {
      form.set("cnib_file", file);
    } else {
      form.delete("cnib_file");
    }

    try {
      setLoading(true);
      setResult(await registerWithCnib(form));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Inscription impossible.");
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
            <CardTitle className="text-2xl">Créer un compte</CardTitle>
            <CardDescription>
              La CNIB est obligatoire. FasoTontine extrait le numéro par OCR avant de créer le compte.
            </CardDescription>
          </div>
          <Badge variant="green">CNIB requise</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <form className="grid gap-5" onSubmit={handleSubmit}>
          <Input label="Nom complet" name="full_name" placeholder="Awa Ouedraogo" required />
          <div className="grid gap-4 md:grid-cols-2">
            <Input label="Téléphone" name="phone" placeholder="+226 XX XX XX XX" required />
            <Input label="Email facultatif" name="email" placeholder="awa@email.com" type="email" />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Input label="Mot de passe" name="password_or_otp" placeholder="Choisir un mot de passe" required type="password" />
            <Input label="Commune / ville" name="city" placeholder="Ouagadougou" required />
          </div>
          <Input label="Numéro CNIB" name="cnib_number" placeholder="B12345678" required />

          <label className="grid gap-2 text-sm font-semibold text-stone-700">
            <span>Photo ou scan CNIB facultatif</span>
            <div className="rounded-xl border border-dashed border-burkina-green/35 bg-burkina-green/5 p-5">
              <div className="flex flex-col items-center justify-center gap-3 text-center">
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-white text-burkina-green shadow-sm">
                  <Upload className="h-6 w-6" aria-hidden="true" />
                </div>
                <div>
                  <p className="font-black text-night">{file ? file.name : "Importer une CNIB lisible"}</p>
                  <p className="mt-1 text-xs font-medium text-stone-500">
                    Optionnel : image JPG, PNG, WebP ou PDF pour joindre une preuve.
                  </p>
                </div>
                <input
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  className="w-full max-w-xs text-sm"
                  name="cnib_file"
                  onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                  type="file"
                />
              </div>
            </div>
          </label>

          {error ? (
            <Alert title="Inscription bloquée" variant="danger">
              {error}
            </Alert>
          ) : null}

          {result ? (
            <Alert title="CNIB validée" variant="success">
              Numéro CNIB enregistré : <strong>{result.cnib.cnib_number}</strong>.{" "}
              Statut :{" "}
              <strong>{result.cnib.status}</strong>.
            </Alert>
          ) : null}

          <Button className="w-full" disabled={loading} size="lg" type="submit">
            {loading ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> : <FileScan className="h-5 w-5" aria-hidden="true" />}
            Scanner la CNIB et créer le compte
          </Button>
        </form>

        <div className="mt-6 grid gap-3 rounded-xl bg-stone-50 p-4 text-sm font-bold text-stone-600">
          <div className="flex gap-2">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-burkina-green" aria-hidden="true" />
            La CNIB est validée directement pour la version de démonstration.
          </div>
          <div className="flex gap-2">
            <ShieldAlert className="h-5 w-5 shrink-0 text-burkina-red" aria-hidden="true" />
            Le fichier CNIB reste facultatif : le numéro saisi suffit pour créer le compte.
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
