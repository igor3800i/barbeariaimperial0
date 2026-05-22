import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState, useSyncExternalStore, useCallback } from "react";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { MapPin, Phone, Instagram, User as UserIcon, LogOut } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider, useAuth } from "@/lib/auth-context";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-primary">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Página não encontrada</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          A página que você procura não existe.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            Voltar ao início
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold text-foreground">Algo deu errado</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        <button
          onClick={() => { router.invalidate(); reset(); }}
          className="mt-6 inline-flex items-center justify-center rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground"
        >
          Tentar novamente
        </button>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Barbearia Imperial" },
      { name: "description", content: "Barbearia premium com agendamento online rápido. Corte, barba e combo em poucos cliques." },
      { property: "og:title", content: "Barbearia Imperial" },
      { property: "og:description", content: "Barbearia premium com agendamento online rápido. Corte, barba e combo em poucos cliques." },
      { property: "og:type", content: "website" },
      { name: "twitter:title", content: "Barbearia Imperial" },
      { name: "twitter:description", content: "Barbearia premium com agendamento online rápido. Corte, barba e combo em poucos cliques." },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", type: "image/png", href: "/favicon.png" },
      { rel: "apple-touch-icon", href: "/favicon.png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Raleway:wght@200;300;400;500;600;700;800&display=swap" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

type LocalClient = { clientName?: string; clientPhone?: string } | null;

const LOCAL_CLIENT_KEY = "imperial.client";
const LOCAL_CLIENT_EVENT = "imperial:client-change";

function readLocalClient(): LocalClient {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(LOCAL_CLIENT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

let cachedSnapshot: LocalClient = null;
let cachedRaw: string | null = null;

function getSnapshot(): LocalClient {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(LOCAL_CLIENT_KEY);
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    try {
      cachedSnapshot = raw ? JSON.parse(raw) : null;
    } catch {
      cachedSnapshot = null;
    }
  }
  return cachedSnapshot;
}

function getServerSnapshot(): LocalClient {
  return null;
}

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(LOCAL_CLIENT_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(LOCAL_CLIENT_EVENT, callback);
  };
}

function useLocalClient() {
  const localClient = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const clearLocalClient = useCallback(() => {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(LOCAL_CLIENT_KEY);
    window.dispatchEvent(new Event(LOCAL_CLIENT_EVENT));
  }, []);
  return [localClient, clearLocalClient] as const;
}

function Header() {
  const linkClass = "text-sm font-medium text-muted-foreground hover:text-primary transition-colors";
  const { isAuthenticated, profile, signOut } = useAuth();
  const [localClient, clearLocalClient] = useLocalClient();
  const loggedIn = isAuthenticated || !!localClient;
  const displayName =
    profile?.full_name?.split(" ")[0] ??
    localClient?.clientName?.split(" ")[0] ??
    "Conta";
  const handleSignOut = async () => {
    if (isAuthenticated) await signOut();
    if (localClient) clearLocalClient();
  };
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <img src="/favicon.png" alt="Barbearia Imperial" className="h-10 w-10 rounded-full object-cover" />
          <span className="font-serif text-lg font-bold text-foreground">Barbearia Imperial</span>
        </Link>
        <nav className="hidden items-center gap-6 md:flex">
          <Link to="/" className={linkClass} activeOptions={{ exact: true }} activeProps={{ className: "text-sm font-medium text-primary" }}>Início</Link>
          <Link to="/servicos" className={linkClass} activeProps={{ className: "text-sm font-medium text-primary" }}>Serviços</Link>
          <Link to="/produtos" className={linkClass} activeProps={{ className: "text-sm font-medium text-primary" }}>Produtos</Link>
          <Link to="/contato" className={linkClass} activeProps={{ className: "text-sm font-medium text-primary" }}>Contato</Link>
        </nav>
        <div className="flex items-center gap-2">
          {loggedIn ? (
            <>
              <Link
                to="/minha-conta"
                className="hidden items-center gap-1.5 rounded-md border border-border px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted sm:inline-flex"
                title={profile?.full_name ?? localClient?.clientName ?? "Minha conta"}
              >
                <UserIcon className="h-4 w-4" />
                <span className="max-w-[110px] truncate">{displayName}</span>
              </Link>
              <button
                onClick={handleSignOut}
                className="hidden h-9 items-center gap-1 rounded-md border border-border px-2 text-xs text-muted-foreground hover:bg-muted sm:inline-flex"
                title="Sair"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </>
          ) : (
            <Link to="/login" className="hidden text-sm font-medium text-muted-foreground hover:text-primary sm:inline-flex">
              Entrar
            </Link>
          )}
          <Link
            to="/agendar"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-md transition hover:opacity-90"
          >
            Agendar
          </Link>
        </div>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-3">
        <div>
          <div className="flex items-center gap-2">
            <img src="/favicon.png" alt="Barbearia Imperial" className="h-9 w-9 rounded-full object-cover" />
            <span className="font-serif text-lg font-bold">Barbearia Imperial</span>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">Tradição, estilo e precisão. Sua barbearia de confiança.</p>
        </div>
        <div className="text-sm">
          <h3 className="font-display text-base text-primary">Horário</h3>
          <p className="mt-2 text-muted-foreground">Segunda: 09:00 – 15:00</p>
          <p className="text-muted-foreground">Terça a Sexta: 09:00 – 20:00</p>
          <p className="text-muted-foreground">Sábado: 09:00 – 21:00</p>
          <p className="text-muted-foreground"><span className="text-destructive">●</span> Domingo: Fechado</p>
        </div>
        <div className="space-y-2 text-sm text-muted-foreground">
          <h3 className="font-display text-base text-primary">Contato</h3>
          <p className="flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" /> Av. José Alves Seabra, 3154 — Bauru, SP</p>
          <p className="flex items-center gap-2"><Phone className="h-4 w-4 text-primary" /> (11) 99999-0000</p>
          <p className="flex items-center gap-2"><Instagram className="h-4 w-4 text-primary" /> @barbeariaimperial</p>
        </div>
      </div>
      <div className="border-t border-border py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Barbearia Imperial — Todos os direitos reservados · Bauru, SP
      </div>
    </footer>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <div className="flex min-h-screen flex-col">
          <Header />
          <main className="flex-1"><Outlet /></main>
          <Footer />
        </div>
        <Toaster richColors position="top-center" />
      </AuthProvider>
    </QueryClientProvider>
  );
}
