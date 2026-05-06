import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

const STORAGE_KEY = "imperial_client";

export type Client = {
  name: string;
  surname: string;
  phone: string;
  isLoggedIn: boolean;
  createdAt: string;
};

type ClientAuthState = {
  client: Client | null;
  isAuthenticated: boolean;
  register: (name: string, surname: string, phone: string) => void;
  login: (phone: string) => boolean;
  logout: () => void;
};

const Ctx = createContext<ClientAuthState | null>(null);

export function ClientAuthProvider({ children }: { children: ReactNode }) {
  const [client, setClient] = useState<Client | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Client;
        if (parsed?.isLoggedIn) setClient(parsed);
      }
    } catch {}
    setHydrated(true);
  }, []);

  const persist = (c: Client | null) => {
    try {
      if (c) localStorage.setItem(STORAGE_KEY, JSON.stringify(c));
      else localStorage.removeItem(STORAGE_KEY);
    } catch {}
  };

  const register = useCallback((name: string, surname: string, phone: string) => {
    const c: Client = {
      name: name.trim(),
      surname: surname.trim(),
      phone: phone.trim(),
      isLoggedIn: true,
      createdAt: new Date().toISOString().slice(0, 10),
    };
    persist(c);
    setClient(c);
  }, []);

  const login = useCallback((phone: string) => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return false;
      const parsed = JSON.parse(raw) as Client;
      if (parsed.phone === phone.trim()) {
        const updated = { ...parsed, isLoggedIn: true };
        persist(updated);
        setClient(updated);
        return true;
      }
    } catch {}
    return false;
  }, []);

  const logout = useCallback(() => {
    persist(null);
    setClient(null);
  }, []);

  if (!hydrated) return null;

  return (
    <Ctx.Provider value={{ client, isAuthenticated: !!client?.isLoggedIn, register, login, logout }}>
      {children}
    </Ctx.Provider>
  );
}

export function useClientAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useClientAuth must be used inside ClientAuthProvider");
  return ctx;
}

export function maskPhone(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits.length ? `(${digits}` : "";
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}