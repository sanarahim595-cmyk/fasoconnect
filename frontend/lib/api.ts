const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";
export const CNIB_NOT_DETECTED_MESSAGE = "Numéro CNIB non détecté. Veuillez scanner une CNIB lisible.";

export async function getHealth() {
  const response = await fetch(`${API_URL}/health`, {
    next: { revalidate: 30 },
  });

  if (!response.ok) {
    throw new Error("Unable to reach FasoTontine API");
  }

  return response.json() as Promise<{ status: string; service: string }>;
}

export type RegisterWithCnibResult = {
  user: {
    id: string;
    first_name: string;
    last_name: string;
    phone?: string;
    email?: string;
    city?: string;
    status: string;
    role: "utilisateur" | "administrateur_tontine" | "administrateur_plateforme";
  };
  cnib: {
    id: string;
    cnib_number: string;
    status: "pending" | "verified" | "rejected" | "manual_review";
  };
  access_token: string;
  requires_manual_review: boolean;
};

export type SessionUser = RegisterWithCnibResult["user"] & {
  role: "utilisateur" | "administrateur_tontine" | "administrateur_plateforme";
};

export type LoginResult = {
  user: SessionUser;
  access_token: string;
  token_type: "bearer";
};

export type TontineFrequency = "daily" | "weekly" | "monthly";
export type TontineStatus = "draft" | "active" | "completed";

export type CreateTontinePayload = {
  name: string;
  description?: string;
  organizer_id: string;
  contribution_amount: number;
  currency: "XOF";
  frequency: TontineFrequency;
  start_date: string;
  max_members?: number;
  rules: {
    internal_rules: string;
    payout_order_mode: "manual" | "automatic";
  };
  payout_order_locked: boolean;
  status: TontineStatus;
};

export type Tontine = CreateTontinePayload & {
  id: string;
  members_count?: number;
  contributions_count?: number;
  late_contributions_count?: number;
  paid_contributions_count?: number;
  created_at: string;
  updated_at: string;
};

export type TontineMemberSummary = {
  id: string;
  user_id: string;
  full_name: string;
  phone?: string | null;
  email?: string | null;
  role: string;
  status: string;
  member_number?: number | null;
  payout_position?: number | null;
  joined_at?: string | null;
};

export type TontineFull = Tontine & {
  members: TontineMemberSummary[];
  contributions: Array<{
    id: string;
    member_id: string;
    cycle_number: number;
    due_date?: string | null;
    paid_at?: string | null;
    amount_due: number;
    amount_paid: number;
    status: ContributionStatus;
    receipt_url?: string | null;
  }>;
  incidents: Array<{
    id: string;
    title: string;
    type: string;
    status: string;
    amount: number;
    created_at?: string | null;
  }>;
};

export type TontineAdminOverview = {
  tontine: Tontine;
  members_count: number;
  contributions_count: number;
  late_contributions_count: number;
  incidents_count: number;
  votes_count: number;
};

export type MemberRole = "member" | "treasurer" | "administrator";
export type MemberDisplayStatus =
  | "up_to_date"
  | "late"
  | "payment_default"
  | "current_beneficiary"
  | "next_beneficiary";

export type InviteMemberPayload = {
  tontine_id: string;
  full_name: string;
  phone?: string;
  email?: string;
  role: MemberRole;
  guarantor_full_name: string;
  guarantor_phone?: string;
  guarantor_email?: string;
  relationship?: string;
};

export type ContributionStatus = "paid" | "pending" | "late" | "cancelled";

export type Contribution = {
  id: string;
  tontine_id: string;
  member_id: string;
  cycle_number: number;
  due_date: string;
  paid_at?: string | null;
  amount_due: number;
  amount_paid: number;
  payment_method?: string | null;
  transaction_reference?: string | null;
  receipt_url?: string | null;
  status: ContributionStatus;
  created_at: string;
  updated_at: string;
};

export type MarkContributionPaidPayload = {
  amount_paid: number;
  paid_at?: string;
  proof_url?: string;
};

export type PaymentIncidentStatus = "open" | "guarantor_notified" | "resolved" | "dismissed" | "escalated" | "investigating";

export type PaymentProblem = {
  incident_id: string;
  tontine_id: string;
  member_id?: string | null;
  contribution_id?: string | null;
  guarantor_id?: string | null;
  member_name: string;
  member_contact?: string | null;
  guarantor_name?: string | null;
  guarantor_contact?: string | null;
  due_date?: string | null;
  amount_due?: number | null;
  amount_paid?: number | null;
  contribution_status?: string | null;
  incident_status: PaymentIncidentStatus;
  title: string;
  description?: string | null;
  created_at: string;
  resolved_at?: string | null;
};

export type OverdueScanResult = {
  scanned: number;
  marked_late: number;
  incidents_created: number;
  notifications_created: number;
};

export type PaymentIncidentAction = "debt_resolved" | "debt_pending" | "guarantor_called";

export type InternalVoteType = "rule_validation" | "payout_order" | "decision" | "member_decision" | "community_project";
export type VoteStatus = "open" | "closed";

export type CreateInternalVotePayload = {
  tontine_id?: string;
  community_project_id?: string;
  title: string;
  description?: string;
  type: InternalVoteType;
  deadline: string;
  options: string[];
  status: VoteStatus;
  allow_multiple_choices?: boolean;
};

export type VoteResultOption = {
  option_id: string;
  label: string;
  description?: string | null;
  position: number;
  responses: number;
  percentage: number;
};

export type VoteResults = {
  vote_id: string;
  title: string;
  description?: string | null;
  type: InternalVoteType;
  status: VoteStatus;
  deadline?: string | null;
  results_visible: boolean;
  total_responses: number;
  options: VoteResultOption[];
};

export type CommunityProjectCategory = "eau" | "ecole" | "sante" | "route" | "energie_solaire" | "environnement" | "autre";
export type CommunityProjectStatus = "pending" | "approved" | "rejected";

export type SubmitCommunityProjectPayload = {
  title: string;
  description: string;
  category: CommunityProjectCategory;
  city: string;
  latitude?: number;
  longitude?: number;
  photos: string[];
  target_amount: number;
  beneficiaries: string;
  justification: string;
};

export type CommunityProject = {
  id: string;
  submitted_by: string;
  title: string;
  description: string;
  category: CommunityProjectCategory;
  city?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  target_amount: number;
  collected_amount: number;
  currency: "XOF";
  status: CommunityProjectStatus;
  beneficiaries?: string | null;
  justification?: string | null;
  photos: string[];
  created_at: string;
  updated_at: string;
};

export type AdminOverview = {
  users_count: number;
  tontines_count: number;
  submitted_projects_count: number;
  approved_projects_count: number;
  contributions_count: number;
};

export type AdminUserRow = {
  id: string;
  full_name: string;
  phone?: string | null;
  email?: string | null;
  role: "utilisateur" | "administrateur_tontine" | "administrateur_plateforme";
  status: string;
  created_at: string;
  cnib_id?: string | null;
  cnib_number?: string | null;
  cnib_status: "pending" | "verified" | "rejected" | "manual_review" | "missing";
};

export type InternalNotification = {
  id: string;
  user_id: string;
  tontine_id?: string | null;
  project_id?: string | null;
  type: "late_payment" | "new_vote" | "project_approved" | "member_added" | "guarantor_called" | "next_beneficiary" | string;
  title: string;
  message: string;
  channel: string;
  payload: Record<string, unknown>;
  status: "unread" | "read" | "sent" | "failed" | "archived";
  read_at?: string | null;
  sent_at?: string | null;
  created_at: string;
  updated_at: string;
};

export async function registerWithCnib(formData: FormData): Promise<RegisterWithCnibResult> {
  const response = await fetch(`${API_URL}/auth/register-with-cnib`, {
    method: "POST",
    body: formData,
  });
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(payload?.error?.message ?? CNIB_NOT_DETECTED_MESSAGE);
  }

  return payload as RegisterWithCnibResult;
}

export async function loginUser(payload: {
  identifier: string;
  method: "password" | "otp";
  password_or_otp: string;
}): Promise<LoginResult> {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.error?.message ?? "Connexion impossible.");
  }

  return data as LoginResult;
}

export async function createTontine(payload: CreateTontinePayload, token: string): Promise<Tontine> {
  const response = await fetch(`${API_URL}/tontines`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.error?.message ?? "Impossible de créer la tontine.");
  }

  return data as Tontine;
}

export async function getMyTontines(token: string): Promise<Tontine[]> {
  const response = await fetch(`${API_URL}/tontines/mine/list`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.error?.message ?? "Impossible de charger vos tontines.");
  }

  return data as Tontine[];
}

export async function getTontineFull(tontineId: string, token: string): Promise<TontineFull> {
  const response = await fetch(`${API_URL}/tontines/${tontineId}/full`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.error?.message ?? "Impossible de charger cette tontine.");
  }

  return data as TontineFull;
}

export async function getTontineAdminOverview(tontineId: string, token: string): Promise<TontineAdminOverview> {
  const response = await fetch(`${API_URL}/tontines/admin/${tontineId}/overview`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.error?.message ?? "Acces administrateur de tontine refuse.");
  }

  return data as TontineAdminOverview;
}

export async function updateTontineAdminRules(tontineId: string, rules: Record<string, unknown>, token: string): Promise<Tontine> {
  const response = await fetch(`${API_URL}/tontines/admin/${tontineId}/rules`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(rules),
  });
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.error?.message ?? "Impossible de modifier les regles.");
  }

  return data as Tontine;
}

export async function removeTontineAdminMember(tontineId: string, memberId: string, token: string) {
  const response = await fetch(`${API_URL}/tontines/admin/${tontineId}/members/${memberId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.error?.message ?? "Impossible de supprimer ce membre.");
  }

  return data as { message: string };
}

export async function downloadTontineAdminExport(tontineId: string, format: "csv" | "pdf", token: string): Promise<{ blob: Blob; filename: string }> {
  const response = await fetch(`${API_URL}/tontines/admin/${tontineId}/export.${format}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.error?.message ?? "Export impossible.");
  }

  const disposition = response.headers.get("content-disposition") ?? "";
  const match = disposition.match(/filename="?([^"]+)"?/i);
  return {
    blob: await response.blob(),
    filename: match?.[1] ?? `fasotontine-${tontineId}.${format}`,
  };
}

export async function inviteMemberWithGuarantor(payload: InviteMemberPayload, token: string) {
  const response = await fetch(`${API_URL}/members/invite-with-guarantor`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.error?.message ?? "Impossible d'ajouter ce membre.");
  }

  return data as { message: string };
}

export async function markContributionAsPaid(contributionId: string, payload: MarkContributionPaidPayload, token: string) {
  const response = await fetch(`${API_URL}/contributions/${contributionId}/mark-paid`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.error?.message ?? "Impossible de marquer cette cotisation comme payee.");
  }

  return data as Contribution;
}

export async function scanOverdueContributions(token: string): Promise<OverdueScanResult> {
  const response = await fetch(`${API_URL}/incidents/overdue/scan`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.error?.message ?? "Impossible d'analyser les retards.");
  }

  return data as OverdueScanResult;
}

export async function updatePaymentIncidentStatus(incidentId: string, status: PaymentIncidentAction, token: string, note?: string) {
  const response = await fetch(`${API_URL}/incidents/${incidentId}/payment-status`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ status, note }),
  });
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.error?.message ?? "Impossible de mettre a jour cet incident.");
  }

  return data;
}

export async function createInternalVote(payload: CreateInternalVotePayload, token: string): Promise<VoteResults> {
  const response = await fetch(`${API_URL}/votes/internal/create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.error?.message ?? "Impossible de creer le vote.");
  }

  return data as VoteResults;
}

export async function respondToVote(voteId: string, optionId: string, token: string, comment?: string) {
  const response = await fetch(`${API_URL}/votes/${voteId}/respond`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ option_id: optionId, comment }),
  });
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.error?.message ?? "Impossible d'enregistrer votre vote.");
  }

  return data;
}

export async function closeExpiredVotes(token: string): Promise<{ closed_votes: number }> {
  const response = await fetch(`${API_URL}/votes/expired/close`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.error?.message ?? "Impossible de fermer les votes expires.");
  }

  return data as { closed_votes: number };
}

export async function submitCommunityProject(payload: SubmitCommunityProjectPayload, token: string): Promise<CommunityProject> {
  const response = await fetch(`${API_URL}/community-projects/submit/new`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.error?.message ?? "Impossible de soumettre le projet.");
  }

  return data as CommunityProject;
}

export async function getMyCommunityProjects(token: string): Promise<CommunityProject[]> {
  const response = await fetch(`${API_URL}/community-projects/mine/list`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.error?.message ?? "Impossible de charger les projets.");
  }

  return data as CommunityProject[];
}

export async function getPublicCommunityProjects(): Promise<CommunityProject[]> {
  const response = await fetch(`${API_URL}/community-projects/public/approved`);
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.error?.message ?? "Impossible de charger les projets publics.");
  }

  return data as CommunityProject[];
}

export async function reviewCommunityProject(projectId: string, status: "approved" | "rejected", token: string, reason?: string): Promise<CommunityProject> {
  const response = await fetch(`${API_URL}/community-projects/${projectId}/review`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ status, reason }),
  });
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.error?.message ?? "Impossible de traiter ce projet.");
  }

  return data as CommunityProject;
}

export async function getAdminOverview(token: string): Promise<AdminOverview> {
  const response = await fetch(`${API_URL}/admin/stats/overview`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.error?.message ?? "Impossible de charger les statistiques admin.");
  }

  return data as AdminOverview;
}

export async function getAdminUsers(token: string): Promise<AdminUserRow[]> {
  const response = await fetch(`${API_URL}/admin/users/list`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.error?.message ?? "Impossible de charger les utilisateurs.");
  }

  return data as AdminUserRow[];
}

export async function getAdminProjects(token: string): Promise<CommunityProject[]> {
  const response = await fetch(`${API_URL}/admin/projects/submitted`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.error?.message ?? "Impossible de charger les projets soumis.");
  }

  return data as CommunityProject[];
}

export async function decideAdminProject(projectId: string, status: "approved" | "rejected" | "changes_requested", token: string, reason?: string) {
  const search = new URLSearchParams({ status });
  if (reason) search.set("reason", reason);
  const response = await fetch(`${API_URL}/admin/projects/${projectId}/decision?${search.toString()}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.error?.message ?? "Impossible de traiter ce projet.");
  }

  return data as CommunityProject;
}

export async function reviewAdminCnib(cnibId: string, status: "verified" | "rejected" | "manual_review", token: string, reason?: string) {
  const search = new URLSearchParams({ status });
  if (reason) search.set("reason", reason);
  const response = await fetch(`${API_URL}/admin/cnib/${cnibId}/review?${search.toString()}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.error?.message ?? "Impossible de valider cette CNIB.");
  }

  return data;
}

export async function getMyNotifications(token: string): Promise<InternalNotification[]> {
  const response = await fetch(`${API_URL}/notifications/mine/list`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.error?.message ?? "Impossible de charger les notifications.");
  }

  return data as InternalNotification[];
}

export async function getUnreadNotificationsCount(token: string): Promise<{ unread_count: number }> {
  const response = await fetch(`${API_URL}/notifications/mine/unread-count`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.error?.message ?? "Impossible de charger le compteur.");
  }

  return data as { unread_count: number };
}

export async function markNotificationRead(notificationId: string, token: string): Promise<InternalNotification> {
  const response = await fetch(`${API_URL}/notifications/${notificationId}/read`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.error?.message ?? "Impossible de marquer la notification comme lue.");
  }

  return data as InternalNotification;
}

export async function markAllNotificationsRead(token: string): Promise<{ updated: number }> {
  const response = await fetch(`${API_URL}/notifications/mine/read-all`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.error?.message ?? "Impossible de marquer les notifications.");
  }

  return data as { updated: number };
}

export async function uploadSecureImage(image: File, token: string): Promise<{ url: string; content_type: string }> {
  const form = new FormData();
  form.append("image", image);
  const response = await fetch(`${API_URL}/uploads/images`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.error?.message ?? "Upload image impossible.");
  }

  return data as { url: string; content_type: string };
}
