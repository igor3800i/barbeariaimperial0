import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, DollarSign, Users, Clock } from "lucide-react";
import { BarberShell } from "@/components/barber/barber-shell";
import { supabase } from "@/integrations/supabase/client";
import { useMyBarber } from "@/lib/use-my-barber";
import { formatBRL } from "@/lib/format";

export const Route = createFileRoute("/barber/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Barbearia Imperial" }] }),
  component: () => (
    <BarberShell title="Dashboard">
      <DashboardContent />
    </BarberShell>
  ),
});

function DashboardContent() {
  const { data: myBarber } = useMyBarber();
  const barberId = myBarber?.id;

  const { data: stats, isLoading } = useQuery({
    queryKey: ["barber-dashboard", barberId ?? "all"],
    queryFn: async () => {
      const now = new Date();
      const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date(now); todayEnd.setHours(23, 59, 59, 999);
      const weekStart = new Date(todayStart); weekStart.setDate(weekStart.getDate() - 7);

      let q = supabase
        .from("appointments")
        .select("id, scheduled_at, ends_at, status, price_charged, client_id, services(name)")
        .gte("scheduled_at", weekStart.toISOString())
        .order("scheduled_at", { ascending: true });
      if (barberId) q = q.eq("barber_id", barberId);

      const { data, error } = await q;
      if (error) throw error;

      const today = (data ?? []).filter((a) => {
        const d = new Date(a.scheduled_at);
        return d >= todayStart && d <= todayEnd && a.status !== "cancelled";
      });
      const week = (data ?? []).filter((a) => a.status !== "cancelled");
      const revenue = week
        .filter((a) => a.status === "completed")
        .reduce((sum, a) => sum + Number(a.price_charged ?? 0), 0);
      const uniqClients = new Set(week.map((a) => a.client_id).filter(Boolean)).size;
      const next = today.find((a) => new Date(a.scheduled_at) >= now) ?? today[0];

      return { todayCount: today.length, weekCount: week.length, revenueCents: Math.round(revenue * 100), uniqClients, next };
    },
  });

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={<CalendarDays className="h-5 w-5" />} label="Agendamentos hoje" value={isLoading ? "—" : String(stats?.todayCount ?? 0)} />
        <StatCard icon={<Clock className="h-5 w-5" />} label="Últimos 7 dias" value={isLoading ? "—" : String(stats?.weekCount ?? 0)} />
        <StatCard icon={<DollarSign className="h-5 w-5" />} label="Receita (7d, concluídos)" value={isLoading ? "—" : formatBRL(stats?.revenueCents ?? 0)} />
        <StatCard icon={<Users className="h-5 w-5" />} label="Clientes únicos (7d)" value={isLoading ? "—" : String(stats?.uniqClients ?? 0)} />
      </div>

      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-foreground">Próximo atendimento</h2>
        {stats?.next ? (
          <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-background p-4">
            <div>
              <p className="text-lg font-semibold text-foreground">
                {(stats.next.services as { name?: string } | null)?.name ?? "Serviço"}
              </p>
              <p className="text-sm text-muted-foreground">
                {new Date(stats.next.scheduled_at).toLocaleString("pt-BR", { weekday: "long", day: "2-digit", month: "long", hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
            <Link to="/barber/appointments" className="text-sm font-semibold text-primary hover:underline">
              Ver todos →
            </Link>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Nenhum atendimento próximo.</p>
        )}
      </section>

      {!myBarber && (
        <div className="rounded-lg border border-yellow-500/40 bg-yellow-500/5 p-4 text-sm text-foreground">
          Sua conta ainda não está vinculada a um perfil de barbeiro. Você está vendo dados agregados de toda a barbearia.
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 text-muted-foreground">{icon}<span className="text-xs uppercase tracking-wider">{label}</span></div>
      <p className="mt-2 text-2xl font-bold text-foreground">{value}</p>
    </div>
  );
}
