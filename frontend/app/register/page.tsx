import Link from "next/link";

import { RegisterForm } from "@/components/auth/register-form";

export default function RegisterPage() {
  return (
    <main className="min-h-screen bg-burkina-white px-5 py-8 text-night sm:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <section>
          <Link className="text-sm font-black text-burkina-green" href="/">
            Retour à l&apos;accueil
          </Link>
          <h1 className="mt-6 text-4xl font-black leading-tight sm:text-5xl">
            Inscription sécurisée par CNIB
          </h1>
          <p className="mt-5 text-lg leading-8 text-stone-600">
            FasoTontine vérifie l&apos;identité dès l&apos;entrée. Pour la démo, le numéro CNIB saisi
            suffit pour créer le compte et le document reste facultatif.
          </p>
          <div className="mt-8 rounded-xl border border-burkina-green/15 bg-white p-5 shadow-soft">
            <p className="text-sm font-black uppercase tracking-normal text-burkina-green">
              Conseil de test
            </p>
            <p className="mt-2 text-sm leading-7 text-stone-600">
              Renseigne simplement un numéro comme <strong> B12345678</strong>. Tu peux joindre une photo ou un PDF CNIB
              si tu veux garder une preuve, mais ce n&apos;est plus obligatoire.
            </p>
          </div>
        </section>

        <RegisterForm />
      </div>
    </main>
  );
}
