import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { TrendingUp, DollarSign, Calendar } from "lucide-react";
import { BarberShell } from "@/components/barber/barber-shell";
import { supabase } from "@/integrations/supabase/client";
import { useMyBarber } from "@/lib/use-my-barber";
import { formatBRL } from "@/lib/format";

export const Route = createFileRoute("/barber/financial")({
  head: () => ({ meta: [{ title: "Financeiro — Barbearia Imperial" }] }),
  component: () => (
    <BarberShell title="Financeiro">
      <FinancialContent />
    </BarberShell>
  ),
});

function FinancialContent() {
  const { data: myBarber } = useMyBarber();
  const barberId = myBarber?.id;

  const { data, isLoading } = useQuery({
    queryKey: ["barber-financial", barberId ?? "all"],
    queryFn: async () => {
      let q = supabase
        .from("appointments")
        .select("id, scheduled_at, status, price_charged, notes, services(name), profiles!appointments_client_id_fkey(full_name)")
        .in("status", ["confirmed", "completed"])
        .order("scheduled_at", { ascending: false })
        .limit(200);
      if (barberId) q = q.eq("barber_id", barberId);
      const { data, error } = await q;
      if (error) throw error;
      return data as unknown as Array<{
        id: string;
        scheduled_at: string;
        status: string;
        price_charged: number | null;
        notes: string | null;
        services: { name: string } | null;
        profiles: { full_name: string } | null;
      }>;
    },
  });

  const parseGuestName = (notes: string | null) => {
    if (!notes) return null;
    const m = notes.match(/cliente:([^|]+)/);
    return m ? m[1].trim() : null;
  };

  const stats = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const weekStart = new Date(now); weekStart.setDate(now.getDate() - 7);
    let month = 0, week = 0, total = 0, pending = 0;
    for (const a of data ?? []) {
      const v = Number(a.price_charged ?? 0);
      total += v;
      if (a.status === "confirmed") pending += v;
      const d = new Date(a.scheduled_at);
      if (d >= monthStart) month += v;
      if (d >= weekStart) week += v;
    }
    return {
      monthCents: Math.round(month * 100),
      weekCents: Math.round(week * 100),
      totalCents: Math.round(total * 100),
      pendingCents: Math.round(pending * 100),
      count: (data ?? []).length,
    };
  }, [data]);

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-3">
        <Card icon={<DollarSign className="h-5 w-5" />} label="Este mês" value={formatBRL(stats.monthCents)} />
        <Card icon={<TrendingUp className="h-5 w-5" />} label="Últimos 7 dias" value={formatBRL(stats.weekCents)} />
        <Card icon={<Calendar className="h-5 w-5" />} label="A receber (confirmados)" value={formatBRL(stats.pendingCents)} />
      </div>

      <section className="rounded-xl border border-border bg-card">
        <header className="border-b border-border p-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">Atendimentos</h2>
        </header>
        {isLoading ? (
          <div className="space-y-1 p-3">
            {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-12 animate-pulse rounded-md bg-background" />)}
          </div>
        ) : (data ?? []).length === 0 ? (
          <p className="p-8 text-center text-sm text-muted-foreground">Sem atendimentos ainda.</p>
        ) : (
          <ul className="divide-y divide-border">
            {data!.map((a) => {
              const clientName = a.profiles?.full_name ?? parseGuestName(a.notes) ?? "Cliente";
              return (
                <li key={a.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-foreground">{a.services?.name ?? "Serviço"} — {clientName}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(a.scheduled_at).toLocaleString("pt-BR")}
                      {" · "}
                      <span className={a.status === "completed" ? "text-emerald-500" : "text-amber-500"}>
                        {a.status === "completed" ? "Concluído" : "Confirmado"}
                      </span>
                    </p>
                  </div>
                  <span className="font-display text-base text-primary">{formatBRL(Math.round(Number(a.price_charged ?? 0) * 100))}</span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

function Card({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 text-muted-foreground">{icon}<span className="text-xs uppercase tracking-wider">{label}</span></div>
      <p className="mt-2 text-2xl font-bold text-foreground">{value}</p>
    </div>
  );
}
