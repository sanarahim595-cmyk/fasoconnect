"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, BellRing, CheckCheck, CheckCircle2, Clock3, Loader2, ShieldCheck, UserPlus, Vote } from "lucide-react";

import { Alert, Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, EmptyState, PageHeader, StatCard } from "@/components/ui";
import { InternalNotification, getMyNotifications, markAllNotificationsRead, markNotificationRead } from "@/lib/api";
import { getSessionToken } from "@/lib/auth";

const demoNotifications: InternalNotification[] = [
  {
    id: "demo-notif-1",
    user_id: "demo-user",
    type: "late_payment",
    title: "Paiement en retard",
    message: "Votre cotisation a depasse la date prevue.",
    channel: "in_app",
    payload: {},
    status: "unread",
    created_at: "2026-05-14T08:00:00Z",
    updated_at: "2026-05-14T08:00:00Z",
  },
  {
    id: "demo-notif-2",
    user_id: "demo-user",
    type: "new_vote",
    title: "Nouveau vote",
    message: "Vote ouvert pour choisir un projet communautaire.",
    channel: "in_app",
    payload: {},
    status: "unread",
    created_at: "2026-05-13T12:00:00Z",
    updated_at: "2026-05-13T12:00:00Z",
  },
  {
    id: "demo-notif-3",
    user_id: "demo-user",
    type: "project_approved",
    title: "Projet valide",
    message: "Votre projet apparait maintenant publiquement.",
    channel: "in_app",
    payload: {},
    status: "read",
    read_at: "2026-05-12T12:00:00Z",
    created_at: "2026-05-12T10:00:00Z",
    updated_at: "2026-05-12T10:00:00Z",
  },
  {
    id: "demo-notif-4",
    user_id: "demo-user",
    type: "next_beneficiary",
    title: "Prochain beneficiaire",
    message: "Vous etes le prochain beneficiaire du cycle.",
    channel: "in_app",
    payload: {},
    status: "unread",
    created_at: "2026-05-11T10:00:00Z",
    updated_at: "2026-05-11T10:00:00Z",
  },
];

const typeIcons = {
  late_payment: AlertTriangle,
  new_vote: Vote,
  project_approved: CheckCircle2,
  member_added: UserPlus,
  guarantor_called: ShieldCheck,
  next_beneficiary: Clock3,
};

export function NotificationsPanel() {
  const [notifications, setNotifications] = useState(demoNotifications);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const unreadCount = useMemo(() => notifications.filter((notification) => notification.status === "unread").length, [notifications]);

  useEffect(() => {
    void loadNotifications();
  }, []);

  async function loadNotifications() {
    const token = getSessionToken();
    if (!token) return;
    setLoading("load");
    try {
      setNotifications(await getMyNotifications(token));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Chargement impossible.");
    } finally {
      setLoading(null);
    }
  }

  async function handleRead(notification: InternalNotification) {
    const token = getSessionToken();
    setLoading(notification.id);
    setError(null);
    try {
      if (token && !notification.id.startsWith("demo-")) {
        await markNotificationRead(notification.id, token);
      }
      setNotifications((items) => items.map((item) => (item.id === notification.id ? { ...item, status: "read", read_at: new Date().toISOString() } : item)));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Action impossible.");
    } finally {
      setLoading(null);
    }
  }

  async function handleReadAll() {
    const token = getSessionToken();
    setLoading("read-all");
    setNotice(null);
    setError(null);
    try {
      if (token) {
        await markAllNotificationsRead(token);
      }
      setNotifications((items) => items.map((item) => ({ ...item, status: "read", read_at: new Date().toISOString() })));
      setNotice("Toutes les notifications sont marquees comme lues.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Action impossible.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow="Notifications"
        title="Centre de notifications internes"
        description="Paiements en retard, votes, projets, membres, garants et prochains beneficiaires."
        actions={
          <Button onClick={handleReadAll} type="button" variant="outline">
            {loading === "read-all" ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> : <CheckCheck className="h-5 w-5" aria-hidden="true" />}
            Tout marquer lu
          </Button>
        }
      />

      {error ? <Alert title="Erreur" variant="danger">{error}</Alert> : null}
      {notice ? <Alert title="Notifications" variant="success">{notice}</Alert> : null}

      <section className="grid gap-4 md:grid-cols-3">
        <StatCard icon={BellRing} label="Total" value={String(notifications.length)} />
        <StatCard icon={AlertTriangle} label="Non lues" value={String(unreadCount)} tone="red" />
        <StatCard icon={CheckCheck} label="Lues" value={String(notifications.length - unreadCount)} tone="green" />
      </section>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle>Liste des notifications</CardTitle>
              <CardDescription>Les notifications non lues sont mises en avant.</CardDescription>
            </div>
            <Badge variant={unreadCount ? "red" : "green"}>{unreadCount} non lue(s)</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {notifications.length ? (
            <div className="grid gap-3">
              {notifications.map((notification) => (
                <NotificationItem key={notification.id} notification={notification} loading={loading === notification.id} onRead={() => handleRead(notification)} />
              ))}
            </div>
          ) : (
            <EmptyState icon={BellRing} title="Aucune notification" description="Les alertes internes apparaitront ici." />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function NotificationItem({ notification, loading, onRead }: { notification: InternalNotification; loading: boolean; onRead: () => void }) {
  const Icon = typeIcons[notification.type as keyof typeof typeIcons] ?? BellRing;
  const unread = notification.status === "unread";
  return (
    <article className={`rounded-xl border p-4 ${unread ? "border-burkina-yellow/50 bg-burkina-yellow/10" : "border-stone-100 bg-stone-50"}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-white text-burkina-green">
            <Icon className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-black text-night">{notification.title}</h3>
              <Badge variant={unread ? "yellow" : "neutral"}>{unread ? "Non lu" : "Lu"}</Badge>
            </div>
            <p className="mt-1 text-sm leading-6 text-stone-600">{notification.message}</p>
            <p className="mt-2 text-xs font-bold text-stone-400">{formatDate(notification.created_at)}</p>
          </div>
        </div>
        {unread ? (
          <Button disabled={loading} onClick={onRead} size="sm" type="button">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <CheckCheck className="h-4 w-4" aria-hidden="true" />}
            Marquer lu
          </Button>
        ) : null}
      </div>
    </article>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}
