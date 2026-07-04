// src/lib/auth/useCitizenAuth.ts
import { useEffect, useState } from "react";
import { getCitizenIdToken, getOrCreateFallbackUid } from "./authClient";

export function useCitizenAuth() {
  const [user, setUser] = useState<any | null>(null);
  const [idToken, setIdToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [fallbackUid] = useState<string>(() => getOrCreateFallbackUid());

  useEffect(() => {
    // Fetch local token on initialization
    getCitizenIdToken().then((token) => {
      setIdToken(token);
      setLoading(false);
    });
  }, []);

  const citizen = { uid: fallbackUid, isAnonymous: true };

  return {
    user: null,
    citizen,
    idToken,
    loading,
    uid: fallbackUid,
    isAnonymous: true,
    email: null,
  };
}
