import { useEffect, useState, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  LogOut, Menu, X, LayoutDashboard, CalendarDays, Users,
  Package, Scissors, DollarSign, Settings, ChevronRight,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";
import { NotificationsBell } from "@/components/barber/notifications-bell";

const NAV = [
  { to: "/barber/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/barber/appointments", label: "Agendamentos", icon: CalendarDays },
  { to: "/barber/clients", label: "Clientes", icon: Users },
  { to: "/barber/products", label: "Produtos", icon: Package },
  { to: "/barber/services", label: "Serviços", icon: Scissors },
  { to: "/barber/financial", label: "Financeiro", icon: DollarSign },
  { to: "/barber/settings", label: "Configurações", icon: Settings },
] as const;

export function BarberShell({ title, children }: { title: string; children: ReactNode }) {
  const auth = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [drawer, setDrawer] = useState(false);

  useEffect(() => {
    if (!auth.isAuthenticated) navigate({ to: "/barber/login" });
  }, [auth.isAuthenticated, navigate]);

  useEffect(() => { setDrawer(false); }, [pathname]);

  if (!auth.isAuthenticated) return null;

  const handleLogout = async () => {
    await auth.signOut();
    navigate({ to: "/barber/login" });
  };

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar lg:flex">
        <BrandRow />
        <nav className="flex-1 space-y-1 p-3">
          {NAV.map((item) => (
            <NavItem key={item.to} {...item} active={pathname === item.to} />
          ))}
        </nav>
        <button
          onClick={handleLogout}
          className="m-3 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          <LogOut className="h-4 w-4" /> Sair
        </button>
      </aside>

      {/* Mobile drawer */}
      {drawer && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setDrawer(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-72 flex-col bg-sidebar">
            <div className="flex items-center justify-between border-b border-sidebar-border p-4">
              <BrandRow compact />
              <button onClick={() => setDrawer(false)} className="rounded p-1 text-sidebar-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex-1 space-y-1 p-3">
              {NAV.map((item) => (
                <NavItem key={item.to} {...item} active={pathname === item.to} />
              ))}
            </nav>
            <button
              onClick={handleLogout}
              className="m-3 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            >
              <LogOut className="h-4 w-4" /> Sair
            </button>
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-card px-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setDrawer(true)}
              className="rounded p-2 text-foreground lg:hidden"
              aria-label="Abrir menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <Link to="/barber/dashboard" className="flex items-center gap-2 lg:hidden">
              <img src="/favicon.png" alt="Barbearia Imperial" className="h-8 w-8 rounded-full object-cover" />
              <span className="text-base font-bold text-foreground font-serif">
                Barbearia Imperial
              </span>
            </Link>
          </div>

          <h1 className="hidden text-base font-semibold uppercase tracking-wider text-foreground sm:block" style={{ fontFamily: "'Montserrat', sans-serif" }}>
            {title}
          </h1>

          <div className="flex items-center gap-2">
            <NotificationsBell />
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary font-bold text-primary-foreground">
              I
            </div>
            <button onClick={handleLogout} className="hidden rounded p-2 text-muted-foreground hover:text-foreground sm:block" aria-label="Sair">
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-x-hidden p-4 pb-24 lg:p-6 lg:pb-6">
          <h1 className="mb-4 text-2xl font-bold text-foreground sm:hidden" style={{ fontFamily: "'Montserrat', sans-serif" }}>{title}</h1>
          {children}
        </main>

        {/* Mobile bottom nav */}
        <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-border bg-card lg:hidden">
          {NAV.slice(0, 5).map((item) => {
            const active = pathname === item.to;
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 py-2 text-[10px]",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

function BrandRow({ compact }: { compact?: boolean }) {
  return (
    <div className={cn("flex items-center gap-2 border-b border-sidebar-border", compact ? "" : "p-5")}>
      <img src="/favicon.png" alt="Barbearia Imperial" className="h-9 w-9 rounded-full object-cover" />
      <span className="text-lg font-bold text-foreground font-serif">
        Barbearia Imperial
      </span>
    </div>
  );
}

function NavItem({ to, label, icon: Icon, active }: { to: string; label: string; icon: any; active: boolean }) {
  return (
    <Link
      to={to}
      className={cn(
        "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition",
        active
          ? "border-l-[3px] border-primary bg-sidebar-accent text-sidebar-accent-foreground"
          : "border-l-[3px] border-transparent text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
      )}
    >
      <Icon className="h-4 w-4" />
      <span className="flex-1">{label}</span>
      {active && <ChevronRight className="h-4 w-4" />}
    </Link>
  );
}