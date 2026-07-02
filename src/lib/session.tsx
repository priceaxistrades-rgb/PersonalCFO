"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface Session {
  userId: number;
  email: string;
  name: string;
}

interface SessionContextType {
  session: Session | null;
  setSession: (session: Session | null) => void;
  logout: () => void;
}

const SessionContext = createContext<SessionContextType>({
  session: null,
  setSession: () => {},
  logout: () => {},
});

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSessionState] = useState<Session | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem("session");
    if (stored) {
      try {
        setSessionState(JSON.parse(stored));
      } catch {
        localStorage.removeItem("session");
      }
    }
  }, []);

  const setSession = (newSession: Session | null) => {
    setSessionState(newSession);
    if (newSession) {
      localStorage.setItem("session", JSON.stringify(newSession));
    } else {
      localStorage.removeItem("session");
    }
  };

  const logout = () => {
    setSession(null);
    window.location.href = "/login";
  };

  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <SessionContext.Provider value={{ session, setSession, logout }}>
      {children}
    </SessionContext.Provider>
  );
}

export const useSession = () => useContext(SessionContext);
