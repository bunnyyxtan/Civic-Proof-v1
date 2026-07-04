// src/lib/auth/useCitizenAuth.ts
import { useEffect, useState } from "react";
import { ensureCitizenSession } from "./authClient";

export function useCitizenAuth() {
  const [uid, setUid] = useState<string | null>(null);
  const [idToken, setIdToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    ensureCitizenSession().then(({ uid, token }) => {
      if (mounted) {
        setUid(uid);
        setIdToken(token);
        setLoading(false);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  const citizen = { uid: uid || "", isAnonymous: true };

  return {
    user: null,
    citizen,
    idToken,
    loading,
    uid: uid || "",
    isAnonymous: true,
    email: null,
  };
}
