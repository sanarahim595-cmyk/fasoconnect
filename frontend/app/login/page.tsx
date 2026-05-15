import Link from "next/link";

import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-burkina-white px-5 py-8 text-night sm:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <section>
          <Link className="text-sm font-black text-burkina-green" href="/">
            Retour à l&apos;accueil
          </Link>
          <h1 className="mt-6 text-4xl font-black leading-tight sm:text-5xl">
            Accède à ton espace FasoTontine
          </h1>
          <p className="mt-5 text-lg leading-8 text-stone-600">
            Les routes privées sont protégées par session JWT. Après connexion,
            FasoTontine redirige automatiquement selon ton rôle.
          </p>
        </section>

        <LoginForm />
      </div>
    </main>
  );
}
