import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { CalendarDays, DollarSign, Users, Clock, RefreshCw, TrendingUp } from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { BarberShell } from "@/components/barber/barber-shell";
import { supabase } from "@/integrations/supabase/client";
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
  const [barberId, setBarberId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const id = localStorage.getItem("barberId");
    setBarberId(id);
  }, []);

  const { data: stats, isLoading, error } = useQuery({
    queryKey: ["barber-dashboard", barberId],
    enabled: !!barberId,
    queryFn: async () => {
      const now = new Date();
      const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date(now); todayEnd.setHours(23, 59, 59, 999);
      const weekStart = new Date(todayStart); weekStart.setDate(weekStart.getDate() - 7);
      const monthStart = new Date(todayStart); monthStart.setDate(monthStart.getDate() - 29);

      const { data, error } = await supabase
        .from("appointments")
        .select("id, scheduled_at, ends_at, status, price_charged, client_id, services(name)")
        .eq("barber_id", barberId!)
        .gte("scheduled_at", monthStart.toISOString())
        .order("scheduled_at", { ascending: true });

      if (error) throw error;

      const all = data ?? [];
      const today = all.filter((a) => {
        const d = new Date(a.scheduled_at);
        return d >= todayStart && d <= todayEnd && a.status !== "cancelled";
      });
      const week = all.filter((a) => {
        const d = new Date(a.scheduled_at);
        return d >= weekStart && a.status !== "cancelled";
      });
      const revenue = week
        .filter((a) => a.status === "completed")
        .reduce((sum, a) => sum + Number(a.price_charged ?? 0), 0);
      const uniqClients = new Set(week.map((a) => a.client_id).filter(Boolean)).size;
      const next = today.find((a) => new Date(a.scheduled_at) >= now) ?? today[0];

      // Daily series for the last 30 days
      const series: { date: string; label: string; agendamentos: number; receita: number }[] = [];
      for (let i = 0; i < 30; i++) {
        const d = new Date(monthStart);
        d.setDate(d.getDate() + i);
        const key = d.toISOString().slice(0, 10);
        series.push({
          date: key,
          label: d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
          agendamentos: 0,
          receita: 0,
        });
      }
      const byDate = new Map(series.map((s) => [s.date, s]));
      for (const a of all) {
        if (a.status === "cancelled") continue;
        const key = new Date(a.scheduled_at).toISOString().slice(0, 10);
        const slot = byDate.get(key);
        if (!slot) continue;
        slot.agendamentos += 1;
        if (a.status === "completed" || a.status === "confirmed") {
          slot.receita += Number(a.price_charged ?? 0);
        }
      }

      return {
        todayCount: today.length,
        weekCount: week.length,
        revenueCents: Math.round(revenue * 100),
        uniqClients,
        next,
        series,
      };
    },
  });

  const series = stats?.series ?? [];

  return (
    <div className="space-y-6">
      {!barberId && <p className="text-sm text-muted-foreground">Carregando dados...</p>}
      
      {barberId && (
        <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-card p-3">
          <div>
            <p className="text-xs text-muted-foreground">BarberID: <code className="text-xs">{barberId.slice(0, 12)}...</code></p>
            {isLoading && <p className="text-xs text-blue-500">⏳ Carregando...</p>}
            {error && <p className="text-xs text-destructive">❌ Erro: {(error as any)?.message}</p>}
          </div>
          <button
            onClick={() => queryClient.invalidateQueries({ queryKey: ["barber-dashboard", barberId] })}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            <RefreshCw className="h-4 w-4" />
            Recarregar
          </button>
        </div>
      )}
      
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<CalendarDays className="h-5 w-5" />}
          label="Agendamentos hoje"
          value={isLoading ? "—" : String(stats?.todayCount ?? 0)}
        />
        <StatCard
          icon={<Clock className="h-5 w-5" />}
          label="Últimos 7 dias"
          value={isLoading ? "—" : String(stats?.weekCount ?? 0)}
        />
        <StatCard
          icon={<DollarSign className="h-5 w-5" />}
          label="Receita (7d, concluídos)"
          value={isLoading ? "—" : formatBRL(stats?.revenueCents ?? 0)}
        />
        <StatCard
          icon={<Users className="h-5 w-5" />}
          label="Clientes únicos (7d)"
          value={isLoading ? "—" : String(stats?.uniqClients ?? 0)}
        />
      </div>

      <section className="rounded-xl border border-border bg-card p-5">
        <div className="mb-4 flex items-center justify-between gap-2">
          <h2 className="text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            Movimentação (últimos 30 dias)
          </h2>
          <span className="text-xs text-muted-foreground">Agendamentos x Receita</span>
        </div>
        <div className="h-72 w-full">
          {isLoading ? (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              Carregando gráfico…
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={series} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradAg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis
                  dataKey="label"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  interval={Math.max(0, Math.floor(series.length / 8) - 1)}
                />
                <YAxis
                  yAxisId="left"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v: number) => `R$${v}`}
                />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  formatter={(value: number, name: string) =>
                    name === "receita"
                      ? [formatBRL(Math.round(value * 100)), "Receita"]
                      : [value, "Agendamentos"]
                  }
                />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="agendamentos"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fill="url(#gradAg)"
                />
                <Area
                  yAxisId="right"
                  type="monotone"
                  dataKey="receita"
                  stroke="#10b981"
                  strokeWidth={2}
                  fill="url(#gradRev)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-foreground">
          Próximo atendimento
        </h2>
        {stats?.next ? (
          <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-background p-4">
            <div>
              <p className="text-lg font-semibold text-foreground">
                {(stats.next.services as { name?: string } | null)?.name ?? "Serviço"}
              </p>
              <p className="text-sm text-muted-foreground">
                {new Date(stats.next.scheduled_at).toLocaleString("pt-BR", {
                  weekday: "long",
                  day: "2-digit",
                  month: "long",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
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
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="text-xs uppercase tracking-wider">{label}</span>
      </div>
      <p className="mt-2 text-2xl font-bold text-foreground">{value}</p>
    </div>
  );
}
