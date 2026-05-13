import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check, X, Loader2 } from "lucide-react";
import { BarberShell } from "@/components/barber/barber-shell";
import { supabase } from "@/integrations/supabase/client";
import { useMyBarber } from "@/lib/use-my-barber";
import { formatBRL } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/barber/appointments")({
  head: () => ({ meta: [{ title: "Agendamentos — Barbearia Imperial" }] }),
  component: () => (
    <BarberShell title="Agendamentos">
      <AppointmentsContent />
    </BarberShell>
  ),
});

type Filter = "upcoming" | "today" | "all" | "completed" | "cancelled";

type Row = {
  id: string;
  scheduled_at: string;
  ends_at: string;
  status: string;
  price_charged: number | null;
  client_id: string | null;
  services: { name: string } | null;
  profiles: { full_name: string; phone: string | null } | null;
};

function AppointmentsContent() {
  const { data: myBarber } = useMyBarber();
  const barberId = myBarber?.id;
  const qc = useQueryClient();
  const [filter, setFilter] = useState<Filter>("upcoming");

  const { data, isLoading } = useQuery({
    queryKey: ["barber-appointments", barberId ?? "all"],
    queryFn: async () => {
      let q = supabase
        .from("appointments")
        .select("id, scheduled_at, ends_at, status, price_charged, client_id, services(name), profiles!appointments_client_id_fkey(full_name, phone)")
        .order("scheduled_at", { ascending: true });
      if (barberId) q = q.eq("barber_id", barberId);
      const { data, error } = await q;
      if (error) throw error;
      return data as unknown as Row[];
    },
  });

  // Realtime
  useEffect(() => {
    const ch = supabase
      .channel("appointments-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "appointments" }, () => {
        qc.invalidateQueries({ queryKey: ["barber-appointments"] });
        qc.invalidateQueries({ queryKey: ["barber-dashboard"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [qc]);

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("appointments").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_d, v) => toast.success(`Status: ${v.status}`),
    onError: (e: Error) => toast.error(e.message),
  });

  const filtered = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now); todayEnd.setHours(23, 59, 59, 999);
    return (data ?? []).filter((a) => {
      const d = new Date(a.scheduled_at);
      if (filter === "all") return true;
      if (filter === "completed") return a.status === "completed";
      if (filter === "cancelled") return a.status === "cancelled";
      if (filter === "today") return d >= todayStart && d <= todayEnd;
      return d >= now && a.status !== "cancelled" && a.status !== "completed";
    });
  }, [data, filter]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {(["upcoming", "today", "all", "completed", "cancelled"] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-semibold uppercase",
              filter === f ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground hover:text-foreground",
            )}
          >
            {labels[f]}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-20 animate-pulse rounded-lg border border-border bg-card" />)}
        </div>
      ) : filtered.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border bg-card/50 p-8 text-center text-sm text-muted-foreground">Nenhum agendamento.</p>
      ) : (
        <ul className="space-y-2">
          {filtered.map((a) => (
            <li key={a.id} className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex-1">
                <p className="text-base font-semibold text-foreground">{a.services?.name ?? "Serviço"} — {a.profiles?.full_name ?? "Cliente"}</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(a.scheduled_at).toLocaleString("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                  {a.profiles?.phone && <> · {a.profiles.phone}</>}
                  {a.price_charged != null && <> · {formatBRL(Math.round(Number(a.price_charged) * 100))}</>}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={a.status} />
                {a.status !== "completed" && a.status !== "cancelled" && (
                  <>
                    {a.status === "pending" && (
                      <button onClick={() => updateStatus.mutate({ id: a.id, status: "confirmed" })} className="rounded-md bg-primary/10 px-2 py-1 text-xs font-semibold text-primary hover:bg-primary/20" disabled={updateStatus.isPending}>
                        Confirmar
                      </button>
                    )}
                    <button onClick={() => updateStatus.mutate({ id: a.id, status: "completed" })} className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-1 text-xs font-semibold text-emerald-500 hover:bg-emerald-500/20" disabled={updateStatus.isPending}>
                      {updateStatus.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />} Concluir
                    </button>
                    <button onClick={() => updateStatus.mutate({ id: a.id, status: "cancelled" })} className="inline-flex items-center gap-1 rounded-md bg-destructive/10 px-2 py-1 text-xs font-semibold text-destructive hover:bg-destructive/20" disabled={updateStatus.isPending}>
                      <X className="h-3 w-3" /> Cancelar
                    </button>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const labels: Record<Filter, string> = {
  upcoming: "Próximos",
  today: "Hoje",
  all: "Todos",
  completed: "Concluídos",
  cancelled: "Cancelados",
};

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: "bg-yellow-500/10 text-yellow-500 border-yellow-500/30",
    confirmed: "bg-blue-500/10 text-blue-500 border-blue-500/30",
    completed: "bg-emerald-500/10 text-emerald-500 border-emerald-500/30",
    cancelled: "bg-destructive/10 text-destructive border-destructive/30",
  };
  const labelMap: Record<string, string> = { pending: "Pendente", confirmed: "Confirmado", completed: "Concluído", cancelled: "Cancelado" };
  return <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase", map[status] ?? "border-border bg-muted text-muted-foreground")}>{labelMap[status] ?? status}</span>;
}
