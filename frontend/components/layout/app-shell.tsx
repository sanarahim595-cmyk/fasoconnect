"use client";

import {
  Bell,
  CircleDollarSign,
  HandHeart,
  Home,
  Map,
  Menu,
  Settings,
  ShieldCheck,
  Users,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";

import { Badge, Button } from "@/components/ui";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Accueil", icon: Home, href: "/dashboard" },
  { label: "Tontines", icon: Users, href: "/tontines" },
  { label: "Cotisations", icon: CircleDollarSign, href: "/cotisations" },
  { label: "Projets", icon: Map, href: "/projets" },
  { label: "Retards", icon: ShieldCheck, href: "/retards" },
];

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-transparent pb-[calc(5.5rem+env(safe-area-inset-bottom))] text-night lg:pb-0">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 border-r border-stone-200/80 bg-burkina-white/92 px-4 py-5 shadow-soft backdrop-blur lg:block">
        <BrandBlock />

        <nav className="mt-8 grid gap-1">
          {navItems.map((item) => (
            <a
              key={item.label}
              className={cn(
                "flex h-11 items-center gap-3 rounded-lg px-3 text-sm font-bold text-stone-600 transition hover:bg-stone-100 hover:text-night",
                isActiveRoute(pathname, item.href) && "bg-burkina-green text-white shadow-glow hover:bg-burkina-green hover:text-white",
              )}
              href={item.href}
            >
              <item.icon className="h-5 w-5" aria-hidden="true" />
              {item.label}
            </a>
          ))}
        </nav>

        <div className="absolute inset-x-4 bottom-5 rounded-xl border border-burkina-green/15 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-burkina-yellow/25 text-yellow-800">
              <HandHeart className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-black">Impact local</p>
              <p className="text-xs font-medium text-stone-500">3 projets soutenus</p>
            </div>
          </div>
        </div>
      </aside>

      <header className="sticky top-0 z-20 border-b border-stone-200/80 bg-burkina-white/88 px-4 py-3 backdrop-blur lg:ml-72 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 lg:hidden">
            <Button aria-label="Menu" size="icon" variant="ghost">
              <Menu className="h-5 w-5" aria-hidden="true" />
            </Button>
            <BrandMark />
          </div>

          <div className="hidden lg:block">
            <p className="text-sm font-bold text-stone-500">Tableau de bord</p>
            <p className="text-lg font-black text-night">Bienvenue sur FasoTontine</p>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <Badge variant="green">Actif</Badge>
            <a
              aria-label="Notifications"
              className="relative inline-flex h-10 w-10 items-center justify-center gap-2 rounded-lg border border-stone-200 bg-white p-0 font-bold text-night transition duration-200 hover:border-burkina-green/45 hover:bg-burkina-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-burkina-green focus-visible:ring-offset-2"
              href="/notifications"
            >
              <Bell className="h-5 w-5" aria-hidden="true" />
              <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-burkina-red px-1 text-[10px] font-black text-white">3</span>
            </a>
            <a
              aria-label="Profil utilisateur"
              className="hidden h-10 w-10 items-center justify-center rounded-lg border border-stone-200 bg-white text-night transition hover:border-burkina-green/45 hover:bg-burkina-white sm:inline-flex"
              href="/profil"
            >
              <Settings className="h-5 w-5" aria-hidden="true" />
            </a>
          </div>
        </div>
      </header>

      <main className="px-4 py-6 lg:ml-72 lg:px-8">
        <div className="mx-auto max-w-7xl animate-fade-up">{children}</div>
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-stone-200 bg-white/95 px-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] pt-2 shadow-soft backdrop-blur lg:hidden">
        <div className="grid grid-cols-5 gap-1">
          {navItems.slice(0, 5).map((item) => (
            <a
              key={item.label}
              className={cn(
                "grid min-h-14 place-items-center rounded-lg px-1 text-[11px] font-bold text-stone-500 transition",
                isActiveRoute(pathname, item.href) && "bg-burkina-green/10 text-burkina-green",
              )}
              href={item.href}
            >
              <item.icon className="h-5 w-5" aria-hidden="true" />
              <span className="mt-1 max-w-full truncate">{item.label}</span>
            </a>
          ))}
        </div>
      </nav>
    </div>
  );
}

function isActiveRoute(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function BrandBlock() {
  return (
    <div className="flex items-center gap-3">
      <BrandMark />
      <div>
        <p className="text-lg font-black leading-tight">FasoTontine</p>
        <p className="text-xs font-bold text-stone-500">Epargne & impact</p>
      </div>
    </div>
  );
}

function BrandMark() {
  return (
    <div className="relative grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-xl bg-burkina-green text-sm font-black text-white shadow-glow">
      <div className="absolute inset-x-0 top-0 h-1/3 bg-burkina-red" />
      <div className="absolute inset-x-0 bottom-0 h-1/3 bg-burkina-yellow" />
      <span className="relative z-10 rounded-full bg-burkina-green px-1.5 py-1">FT</span>
    </div>
  );
}
