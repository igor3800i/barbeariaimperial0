import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { CalendarDays, DollarSign, TrendingUp, Target } from "lucide-react";
import {
  Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer,
  Tooltip, XAxis, YAxis, Area, ComposedChart,
} from "recharts";
import { BarberShell } from "@/components/barber/barber-shell";
import { useBarberStore } from "@/lib/barber-store";
import { formatBRL } from "@/lib/format";

export const Route = createFileRoute("/barber/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Imperial" }] }),
  component: DashboardPage,
});

function isoDay(d: Date) { return d.toISOString().slice(0, 10); }

function DashboardPage() {
  const { appointments } = useBarberStore();

  const today = new Date();
  const todayStr = isoDay(today);
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

  const billable = (s: string) => s === "confirmed" || s === "completed";

  const todayAppts = appointments.filter((a) => a.date === todayStr);
  const todayRevenue = todayAppts.filter((a) => billable(a.status)).reduce((s, a) => s + a.value * 100, 0);

  const monthAppts = appointments.filter((a) => new Date(a.date) >= monthStart && billable(a.status));
  const monthRevenue = monthAppts.reduce((s, a) => s + a.value * 100, 0);

  const completed = appointments.filter((a) => a.status === "completed");
  const totalRevenue = completed.reduce((s, a) => s + a.value * 100, 0);
  const ticket = completed.length ? totalRevenue / completed.length : 0;

  const weekData = useMemo(() => {
    const days = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
    const counts = Array(7).fill(0);
    const start = new Date(today);
    start.setDate(start.getDate() - 6);
    appointments.forEach((a) => {
      const d = new Date(a.date);
      if (d >= start && d <= today) counts[d.getDay()]++;
    });
    return days.map((day, i) => ({ day, agendamentos: counts[i] }));
  }, [appointments, today]);

  const monthData = useMemo(() => {
    const out: { day: string; total: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = isoDay(d);
      const total = appointments
        .filter((a) => a.date === key && billable(a.status))
        .reduce((s, a) => s + a.value, 0);
      out.push({ day: `${d.getDate()}/${d.getMonth() + 1}`, total });
    }
    return out;
  }, [appointments, today]);

  return (
    <BarberShell title="Dashboard">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric icon={CalendarDays} label="Agendamentos Hoje" value={String(todayAppts.length)} />
        <Metric icon={DollarSign} label="Faturamento do Dia" value={formatBRL(todayRevenue)} />
        <Metric icon={TrendingUp} label="Faturamento do Mês" value={formatBRL(monthRevenue)} />
        <Metric icon={Target} label="Ticket Médio" value={formatBRL(ticket)} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <ChartCard title="Agendamentos da Semana">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={weekData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="day" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8 }} />
              <Bar dataKey="agendamentos" fill="var(--primary)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Faturamento — últimos 30 dias">
          <ResponsiveContainer width="100%" height={240}>
            <ComposedChart data={monthData}>
              <defs>
                <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="day" stroke="var(--muted-foreground)" fontSize={10} tickLine={false} axisLine={false} interval={4} />
              <YAxis stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8 }}
                formatter={(v: number) => formatBRL(v * 100)}
              />
              <Area type="monotone" dataKey="total" stroke="none" fill="url(#rev)" />
              <Line type="monotone" dataKey="total" stroke="var(--primary)" strokeWidth={2} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </BarberShell>
  );
}

function Metric({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-start justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-accent-foreground">
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <div className="mt-3 text-2xl font-bold text-foreground lg:text-3xl" style={{ fontFamily: "'Montserrat', sans-serif" }}>
        {value}
      </div>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-foreground" style={{ fontFamily: "'Montserrat', sans-serif" }}>
        {title}
      </h3>
      {children}
    </div>
  );
}