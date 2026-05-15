"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { LogIn, Loader2 } from "lucide-react";

import { Alert, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input } from "@/components/ui";
import { loginUser } from "@/lib/api";
import { redirectAfterLogin, saveSession } from "@/lib/auth";

export function LoginForm() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const form = new FormData(event.currentTarget);

    try {
      setLoading(true);
      const session = await loginUser({
        identifier: String(form.get("identifier") ?? ""),
        method: "password",
        password_or_otp: String(form.get("password_or_otp") ?? ""),
      });
      saveSession(session);
      redirectAfterLogin(session.user.role);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Connexion impossible.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="overflow-hidden">
      <div className="h-2 bg-gradient-to-r from-burkina-green via-burkina-yellow to-burkina-red" />
      <CardHeader>
        <CardTitle className="text-2xl">Connexion</CardTitle>
        <CardDescription>
          Connecte-toi avec ton téléphone ou ton email et le mot de passe de ton compte.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-5" onSubmit={handleSubmit}>
          <Input label="Téléphone ou email" name="identifier" placeholder="+226 XX XX XX XX ou email" required />

          <Input
            label="Mot de passe"
            name="password_or_otp"
            placeholder="Ton mot de passe"
            required
            type="password"
          />

          {error ? (
            <Alert title="Connexion refusée" variant="danger">
              {error}
            </Alert>
          ) : null}

          <Button className="w-full" disabled={loading} size="lg" type="submit">
            {loading ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> : <LogIn className="h-5 w-5" aria-hidden="true" />}
            Se connecter
          </Button>
        </form>

        <p className="mt-5 text-center text-sm font-bold text-stone-600">
          Pas encore de compte ?{" "}
          <Link className="text-burkina-green" href="/register">
            Créer un compte
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
