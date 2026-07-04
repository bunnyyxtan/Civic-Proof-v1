// src/lib/auth/authClient.ts

/**
 * Returns null as Firebase Anonymous Auth has been removed.
 */
export async function ensureAnonymousUser(): Promise<any | null> {
  return null;
}

/**
 * Generates or retrieves a stable fallback citizen UID stored locally.
 */
export function getOrCreateFallbackUid(): string {
  if (typeof window === "undefined") return "anonymous_fallback";
  let fallbackUid = localStorage.getItem("civicproof_fallback_uid");
  if (!fallbackUid) {
    fallbackUid = `fallback_citizen_${Math.random().toString(36).substring(2, 11)}`;
    localStorage.setItem("civicproof_fallback_uid", fallbackUid);
  }
  return fallbackUid;
}

/**
 * Returns a local token representing the citizen.
 */
export function getLocalIdToken(): string {
  const uid = getOrCreateFallbackUid();
  return `civic_local_for_${uid}`;
}

/**
 * Retrieves the security ID token for the authenticated user, which can be passed in Authorization headers.
 */
export async function getCitizenIdToken(): Promise<string | null> {
  return getLocalIdToken();
}
