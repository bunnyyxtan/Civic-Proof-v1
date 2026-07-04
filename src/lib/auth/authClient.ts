// src/lib/auth/authClient.ts
import { supabaseBrowser } from "../supabase/supabaseBrowser";

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

export async function ensureCitizenSession(): Promise<{ uid: string; token: string | null }> {
  try {
    let { data: { session } } = await supabaseBrowser.auth.getSession();
    if (!session) {
      const { data, error } = await supabaseBrowser.auth.signInAnonymously();
      if (error) throw error;
      session = data.session;
    }
    if (session?.user) return { uid: session.user.id, token: session.access_token };
  } catch (e) {
    console.warn("Supabase anon auth failed, using local identity:", e);
  }
  const uid = getOrCreateFallbackUid();
  return { uid, token: getLocalIdToken() };
}

/**
 * Retrieves the security ID token for the authenticated user, which can be passed in Authorization headers.
 */
export async function getCitizenIdToken(): Promise<string | null> {
  const session = await ensureCitizenSession();
  return session.token;
}
