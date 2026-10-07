import { adminClient, jwtClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

export const AUTH_URL: string = import.meta.env.VITE_AUTH_URL || (import.meta.env.PROD ? window.location.origin : "http://localhost:4000");
export const CHAT_URL: string = import.meta.env.VITE_CHAT_URL ?? "http://localhost:4001";

export const authClient = createAuthClient({
  baseURL: AUTH_URL,
  fetchOptions: { credentials: "include" },
  plugins: [adminClient(), jwtClient()],
});

let cached: { token: string; exp: number } | null = null;

async function getToken(): Promise<string> {
  if (cached && cached.exp - Date.now() > 60_000) return cached.token;
  const { data } = await authClient.token();
  if (!data?.token) throw new Error("not_signed_in");
  const payload = JSON.parse(atob(data.token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
  cached = { token: data.token, exp: payload.exp * 1000 };
  return data.token;
}

export function clearToken() {
  cached = null;
}

/** Calls the chat service's /admin/* endpoints with a short-lived JWT (role claim must be "admin"). */
export async function chatApi<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${CHAT_URL}${path}`, {
    ...init,
    headers: { authorization: `Bearer ${await getToken()}`, "content-type": "application/json", ...(init.headers ?? {}) },
  });
  if (!res.ok) throw new Error(((await res.json().catch(() => ({}))) as { error?: string }).error ?? `http_${res.status}`);
  return res.json() as Promise<T>;
}
