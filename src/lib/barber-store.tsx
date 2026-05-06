import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { initialMockProducts, initialMockServices, mockAppointments, type MockAppointment, type MockProduct, type MockService } from "./mock-data";

const PRODUCTS_KEY = "imperial.products";
const SERVICES_KEY = "imperial.services";
const APPTS_KEY = "imperial.appointments";

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw) as T;
  } catch {}
  return fallback;
}

type Store = {
  products: MockProduct[];
  services: MockService[];
  appointments: MockAppointment[];
  setProducts: (p: MockProduct[]) => void;
  setServices: (s: MockService[]) => void;
  setAppointments: (a: MockAppointment[]) => void;
};

const Ctx = createContext<Store | null>(null);

export function BarberStoreProvider({ children }: { children: ReactNode }) {
  const [products, setProductsState] = useState<MockProduct[]>(initialMockProducts);
  const [services, setServicesState] = useState<MockService[]>(initialMockServices);
  const [appointments, setAppointmentsState] = useState<MockAppointment[]>(mockAppointments);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setProductsState(load(PRODUCTS_KEY, initialMockProducts));
    setServicesState(load(SERVICES_KEY, initialMockServices));
    setAppointmentsState(load(APPTS_KEY, mockAppointments));
    setHydrated(true);
  }, []);

  const setProducts = (p: MockProduct[]) => {
    setProductsState(p);
    try { localStorage.setItem(PRODUCTS_KEY, JSON.stringify(p)); } catch {}
  };
  const setServices = (s: MockService[]) => {
    setServicesState(s);
    try { localStorage.setItem(SERVICES_KEY, JSON.stringify(s)); } catch {}
  };
  const setAppointments = (a: MockAppointment[]) => {
    setAppointmentsState(a);
    try { localStorage.setItem(APPTS_KEY, JSON.stringify(a)); } catch {}
  };

  if (!hydrated) return null;

  return (
    <Ctx.Provider value={{ products, services, appointments, setProducts, setServices, setAppointments }}>
      {children}
    </Ctx.Provider>
  );
}

export function useBarberStore() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useBarberStore must be used inside BarberStoreProvider");
  return ctx;
}