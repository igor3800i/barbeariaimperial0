import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

const STORAGE_KEY = "imperial.barber.auth";
const VALID_USER = "imperial2026";
const VALID_PASS = "102030";

type AuthState = {
  isAuthenticated: boolean;
  username: string | null;
  login: (user: string, pass: string) => boolean;
  logout: () => void;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [username, setUsername] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setUsername(stored);
    } catch {}
    setHydrated(true);
  }, []);

  const login = useCallback((user: string, pass: string) => {
    if (user === VALID_USER && pass === VALID_PASS) {
      try { localStorage.setItem(STORAGE_KEY, user); } catch {}
      setUsername(user);
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
    setUsername(null);
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated: !!username, username, login, logout }}>
      {hydrated ? children : null}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}