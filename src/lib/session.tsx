"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

interface Session {
  userId: number;
  email: string;
  name: string;
}

interface SessionContextType {
  session: Session | null;
  setSession: (session: Session | null) => void;
  refreshSession: () => Promise<Session | null>;
  logout: () => void;
  loading: boolean;
}

const SessionContext = createContext<SessionContextType>({
  session: null,
  setSession: () => {},
  refreshSession: async () => null,
  logout: () => {},
  loading: true,
});

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSessionState] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshSession = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      const data = res.ok ? await res.json() : null;
      const nextSession = data?.session ?? null;
      setSessionState(nextSession);
      return nextSession as Session | null;
    } catch {
      setSessionState(null);
      return null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => void refreshSession(), 0);
    return () => clearTimeout(timer);
  }, []);

  const setSession = (newSession: Session | null) => {
    setSessionState(newSession);
    setLoading(false);
  };

  const logout = () => {
    void fetch("/api/auth/logout", { method: "POST" }).finally(() => {
      setSession(null);
      window.location.href = "/login";
    });
  };

  return (
    <SessionContext.Provider value={{ session, setSession, refreshSession, logout, loading }}>
      {children}
    </SessionContext.Provider>
  );
}

export const useSession = () => useContext(SessionContext);
