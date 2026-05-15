"use client";

import { LoginResult, SessionUser } from "@/lib/api";

const TOKEN_KEY = "fasotontine_token";
const USER_KEY = "fasotontine_user";

export function saveSession(session: LoginResult) {
  localStorage.setItem(TOKEN_KEY, session.access_token);
  localStorage.setItem(USER_KEY, JSON.stringify(session.user));
  document.cookie = `fasotontine_token=${session.access_token}; path=/; max-age=86400; SameSite=Lax`;
  document.cookie = `fasotontine_role=${session.user.role}; path=/; max-age=86400; SameSite=Lax`;
}

export function getSessionUser(): SessionUser | null {
  const raw = localStorage.getItem(USER_KEY);
  return raw ? (JSON.parse(raw) as SessionUser) : null;
}

export function getSessionToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function logout() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  document.cookie = "fasotontine_token=; path=/; max-age=0";
  document.cookie = "fasotontine_role=; path=/; max-age=0";
  window.location.assign("/login");
}

export function redirectAfterLogin(role: SessionUser["role"]) {
  if (role === "administrateur_plateforme") {
    window.location.assign("/admin");
    return;
  }
  window.location.assign("/dashboard");
}
