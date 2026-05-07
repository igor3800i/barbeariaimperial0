import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

const STORAGE_KEY = "imperial_client";

export type Client = {
  id?: string;
  name: string;
  surname: string;
  phone: string;
  isLoggedIn: boolean;
  createdAt: string;
};

type ClientAuthState = {
  client: Client | null;
  isAuthenticated: boolean;
  register: (name: string, surname: string, phone: string) => Promise<void>;
  login: (phone: string) => Promise<boolean>;
  logout: () => void;
};

const Ctx = createContext<ClientAuthState | null>(null);

export function ClientAuthProvider({ children }: { children: ReactNode }) {
  const [client, setClient] = useState<Client | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as Client;
      return parsed?.isLoggedIn ? parsed : null;
    } catch {
      return null;
    }
  });

  const persist = (c: Client | null) => {
    try {
      if (c) localStorage.setItem(STORAGE_KEY, JSON.stringify(c));
      else localStorage.removeItem(STORAGE_KEY);
    } catch {}
  };

  const register = useCallback(async (name: string, surname: string, phone: string) => {
    const cleanName = name.trim();
    const cleanSurname = surname.trim();
    const cleanPhone = phone.trim();

    // Check if phone already exists
    const { data: existing } = await supabase
      .from("clients")
      .select("id, name, surname, phone, created_at")
      .eq("phone", cleanPhone)
      .maybeSingle();

    let row = existing;
    if (!row) {
      const { data: inserted, error } = await supabase
        .from("clients")
        .insert({ name: cleanName, surname: cleanSurname, phone: cleanPhone })
        .select("id, name, surname, phone, created_at")
        .single();
      if (error) throw error;
      row = inserted;
    }

    const c: Client = {
      id: row!.id,
      name: row!.name,
      surname: row!.surname,
      phone: row!.phone,
      isLoggedIn: true,
      createdAt: (row!.created_at ?? new Date().toISOString()).slice(0, 10),
    };
    persist(c);
    setClient(c);
  }, []);

  const login = useCallback(async (phone: string) => {
    const cleanPhone = phone.trim();
    const { data, error } = await supabase
      .from("clients")
      .select("id, name, surname, phone, created_at")
      .eq("phone", cleanPhone)
      .maybeSingle();
    if (error || !data) return false;
    const c: Client = {
      id: data.id,
      name: data.name,
      surname: data.surname,
      phone: data.phone,
      isLoggedIn: true,
      createdAt: (data.created_at ?? new Date().toISOString()).slice(0, 10),
    };
    persist(c);
    setClient(c);
    return true;
  }, []);

  const logout = useCallback(() => {
    persist(null);
    setClient(null);
  }, []);

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