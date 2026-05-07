import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { MapPin, Phone, Instagram } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { ClientAuthProvider } from "@/lib/client-auth-context";
import { AuthProvider } from "@/lib/auth-context";
import { BarberStoreProvider } from "@/lib/barber-store";

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
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/ffc7fd94-3812-45b5-930e-e3245b3e33f8/id-preview-b5328ed6--49578355-fa65-40aa-875e-972602ae726b.lovable.app-1778111172721.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/ffc7fd94-3812-45b5-930e-e3245b3e33f8/id-preview-b5328ed6--49578355-fa65-40aa-875e-972602ae726b.lovable.app-1778111172721.png" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", type: "image/png", href: "/favicon.png" },
      { rel: "apple-touch-icon", href: "/favicon.png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@400;500;600;700&family=Playfair+Display:wght@600;700&display=swap" },
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

function Header() {
  const linkClass = "text-sm font-medium text-muted-foreground hover:text-primary transition-colors";
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <img src="/favicon.png" alt="Barbearia Imperial" className="h-10 w-10 rounded-full object-cover" />
          <span className="text-lg font-bold text-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>Barbearia Imperial</span>
        </Link>
        <nav className="hidden items-center gap-6 md:flex">
          <Link to="/" className={linkClass} activeOptions={{ exact: true }} activeProps={{ className: "text-sm font-medium text-primary" }}>Início</Link>
          <Link to="/servicos" className={linkClass} activeProps={{ className: "text-sm font-medium text-primary" }}>Serviços</Link>
          <Link to="/produtos" className={linkClass} activeProps={{ className: "text-sm font-medium text-primary" }}>Produtos</Link>
          <Link to="/contato" className={linkClass} activeProps={{ className: "text-sm font-medium text-primary" }}>Contato</Link>
        </nav>
        <Link
          to="/agendar"
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-md transition hover:opacity-90"
        >
          Agendar
        </Link>
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
            <span className="text-lg font-bold" style={{ fontFamily: "'Playfair Display', serif" }}>Barbearia Imperial</span>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">Tradição, estilo e precisão. Sua barbearia de confiança.</p>
        </div>
        <div className="text-sm">
          <h3 className="font-display text-base text-primary">Horário</h3>
          <p className="mt-2 text-muted-foreground">Ter – Sáb: 09h às 20h</p>
          <p className="text-muted-foreground">Domingo e Segunda: Fechado</p>
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
      <BarberStoreProvider>
        <ClientAuthProvider>
          <AuthProvider>
            <div className="flex min-h-screen flex-col">
              <Header />
              <main className="flex-1"><Outlet /></main>
              <Footer />
            </div>
            <Toaster richColors position="top-center" />
          </AuthProvider>
        </ClientAuthProvider>
      </BarberStoreProvider>
    </QueryClientProvider>
  );
}
