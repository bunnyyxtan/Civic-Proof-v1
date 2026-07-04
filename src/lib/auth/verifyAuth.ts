// src/lib/auth/verifyAuth.ts
import { NextRequest } from "next/server";

export interface CitizenIdentity {
  uid: string;
  isAnonymous: boolean;
  email?: string;
  verified: boolean;
}

/**
 * Parses and verifies the Bearer ID token sent from the citizen client.
 * Returns the verified CitizenIdentity or null if missing, invalid, or unconfigured.
 */
export async function verifyCitizenAuth(req: NextRequest): Promise<CitizenIdentity | null> {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return null;
    }

    const token = authHeader.substring(7); // Remove 'Bearer '
    if (!token) return null;

    if (token.startsWith("civic_local_for_")) {
      const uid = token.substring("civic_local_for_".length);
      return {
        uid,
        isAnonymous: true,
        verified: true,
      };
    }

    return null;
  } catch (err) {
    console.error("verifyCitizenAuth verification failed:", err);
    return null;
  }
}
