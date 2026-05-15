"use client";

import { useEffect, useState } from "react";
import { LogOut } from "lucide-react";

import { Button, Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { getSessionUser, logout } from "@/lib/auth";
import type { SessionUser } from "@/lib/api";

export function SessionPanel() {
  const [user, setUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    setUser(getSessionUser());
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Session active</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div>
          <p className="text-sm font-bold text-stone-500">Utilisateur</p>
          <p className="mt-1 text-xl font-black">
            {user ? `${user.first_name} ${user.last_name}` : "Session chargée"}
          </p>
          <p className="mt-1 text-sm font-bold text-burkina-green">{user?.role ?? "utilisateur"}</p>
        </div>
        <Button onClick={logout} variant="danger">
          <LogOut className="h-4 w-4" aria-hidden="true" />
          Déconnexion
        </Button>
      </CardContent>
    </Card>
  );
}
