// src/lib/repositories/repositoryFactory.ts
// Factory for retrieving CaseRepositories

import { CaseRepository } from "./caseRepository";
import { SupabaseCaseRepository } from "./supabaseCaseRepository";
import { isSupabaseConfigured } from "../supabase/supabaseClient";

export type PersistenceMode = "supabase";

interface PersistenceState {
  mode: PersistenceMode;
  error?: string;
}

const state: PersistenceState = {
  mode: "supabase"
};

/**
 * Global function to check active persistence metadata.
 */
export function getPersistenceMetadata() {
  return {
    persistence: state.mode,
    ...(state.error ? { error: state.error } : {}),
  };
}

// Singleton repository instance
let activeRepositoryInstance: CaseRepository | null = null;

export function getCaseRepository(): CaseRepository {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured. Set SUPABASE_ENABLED, NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
  }
  if (!activeRepositoryInstance) {
    activeRepositoryInstance = new SupabaseCaseRepository();
  }
  return activeRepositoryInstance;
}

/**
 * Manual state reset primarily used to clear fallback conditions during testing
 */
export function resetRepositoryConfiguration() {
  state.mode = "supabase";
  state.error = undefined;
  activeRepositoryInstance = null;
}
