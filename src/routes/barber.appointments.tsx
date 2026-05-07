import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, Check, CheckCheck, X } from "lucide-react";
import { toast } from "sonner";
import { BarberShell } from "@/components/barber/barber-shell";
import { useAppointments } from "@/lib/use-appointments";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { formatBRL } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { AppointmentStatus } from "@/lib/mock-data";

export const Route = createFileRoute("/barber/appointments")({
  head: () => ({ meta: [{ title: "Agendamentos — Barbearia Imperial" }] }),
  component: AppointmentsPage,
});

const STATUS_LABEL: Record<AppointmentStatus, string> = {
  confirmed: "Confirmado",
  pending: "Pendente",
  completed: "Concluído",
  cancelled: "Cancelado",
};

const STATUS_CLASSES: Record<AppointmentStatus, string> = {
  confirmed: "bg-secondary text-secondary-foreground",
  pending: "text-[oklch(0.20_0_0)]",
  completed: "bg-muted text-muted-foreground",
  cancelled: "bg-destructive text-destructive-foreground",
};

function AppointmentsPage() {
  const { data: appointments = [] } = useAppointments();
  const qc = useQueryClient();
  const [period, setPeriod] = useState<"hoje" | "semana" | "mes" | "todos">("hoje");
  const [status, setStatus] = useState<"todos" | AppointmentStatus>("todos");
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);
    const weekStart = new Date(today); weekStart.setDate(today.getDate() - today.getDay());
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    return appointments
      .filter((a) => {
        const d = new Date(a.date);
        if (period === "hoje") return a.date === todayStr;
        if (period === "semana") return d >= weekStart && d <= today;
        if (period === "mes") return d >= monthStart && d <= today;
        return true;
      })
      .filter((a) => status === "todos" ? true : a.status === status)
      .filter((a) => {
        if (q.trim() === "") return true;
        const needle = q.toLowerCase();
        return a.client_name.toLowerCase().includes(needle) || a.client_phone.includes(needle);
      })
      .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  }, [appointments, period, status, q]);

  async function updateStatus(id: string, status: AppointmentStatus) {
    const { error } = await supabase.from("appointments").update({ status }).eq("id", id);
    if (error) {
      toast.error("Erro ao atualizar status");
      return;
    }
    toast.success("Status atualizado");
    qc.invalidateQueries({ queryKey: ["appointments"] });
  }

  return (
    <BarberShell title="Agendamentos">
      <div className="mb-4 space-y-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por cliente..."
            className="h-10 w-full rounded-lg border border-border bg-input pl-9 pr-3 text-sm text-foreground outline-none focus:border-ring"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Chips value={period} onChange={(v) => setPeriod(v as any)} options={[
            { v: "hoje", label: "Hoje" },
            { v: "semana", label: "Esta semana" },
            { v: "mes", label: "Este mês" },
            { v: "todos", label: "Todos" },
          ]} />
        </div>
        <div className="flex flex-wrap gap-2">
          <Chips value={status} onChange={(v) => setStatus(v as any)} options={[
            { v: "todos", label: "Todos status" },
            { v: "pending", label: "Pendente" },
            { v: "confirmed", label: "Confirmado" },
            { v: "completed", label: "Concluído" },
            { v: "cancelled", label: "Cancelado" },
          ]} />
        </div>
      </div>

      <div className="space-y-2">
        {filtered.length === 0 && (
          <div className="rounded-xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
            Nenhum agendamento encontrado.
          </div>
        )}
        {filtered.map((a) => (
          <div key={a.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/15 font-bold text-primary">
              {a.client_name[0]}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <p className="truncate font-semibold text-foreground">{a.client_name}</p>
                <p className="shrink-0 text-sm font-bold text-primary">{formatBRL(Number(a.service_value) * 100)}</p>
              </div>
              <p className="truncate text-xs text-muted-foreground">{a.service}</p>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{a.date} • {a.time}</span>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                    STATUS_CLASSES[a.status as AppointmentStatus],
                  )}
                  style={a.status === "pending" ? { background: "oklch(0.85 0.15 85)" } : undefined}
                >
                  {STATUS_LABEL[a.status as AppointmentStatus]}
                </span>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {a.status !== "confirmed" && a.status !== "completed" && a.status !== "cancelled" && (
                  <ActionBtn onClick={() => updateStatus(a.id, "confirmed")} icon={Check} label="Confirmar" />
                )}
                {a.status !== "completed" && a.status !== "cancelled" && (
                  <ActionBtn onClick={() => updateStatus(a.id, "completed")} icon={CheckCheck} label="Concluir" />
                )}
                {a.status !== "cancelled" && a.status !== "completed" && (
                  <ActionBtn onClick={() => updateStatus(a.id, "cancelled")} icon={X} label="Cancelar" destructive />
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </BarberShell>
  );
}

function ActionBtn({ onClick, icon: Icon, label, destructive }: { onClick: () => void; icon: any; label: string; destructive?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-medium transition",
        destructive
          ? "border-destructive/40 text-destructive hover:bg-destructive/10"
          : "border-border text-foreground hover:border-primary/50 hover:bg-primary/10",
      )}
    >
      <Icon className="h-3 w-3" /> {label}
    </button>
  );
}

function Chips<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: { v: T; label: string }[] }) {
  return (
    <>
      {options.map((o) => (
        <button
          key={o.v}
          onClick={() => onChange(o.v)}
          className={cn(
            "rounded-full border px-3 py-1.5 text-xs font-medium transition",
            value === o.v
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-card text-muted-foreground hover:border-primary/40",
          )}
        >
          {o.label}
        </button>
      ))}
    </>
  );
}