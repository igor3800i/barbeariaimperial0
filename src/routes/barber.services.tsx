import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Pencil, Scissors, X } from "lucide-react";
import { BarberShell } from "@/components/barber/barber-shell";
import { useBarberStore } from "@/lib/barber-store";
import { formatBRL } from "@/lib/format";
import type { MockService } from "@/lib/mock-data";

export const Route = createFileRoute("/barber/services")({
  head: () => ({ meta: [{ title: "Serviços — Barbearia Imperial" }] }),
  component: ServicesPage,
});

const DURATIONS = [20, 30, 45, 60, 75, 90, 120];

function ServicesPage() {
  const { services, setServices } = useBarberStore();
  const [editing, setEditing] = useState<MockService | null>(null);

  const save = (s: MockService) => {
    setServices(services.map((x) => x.id === s.id ? s : x));
    setEditing(null);
  };

  return (
    <BarberShell title="Serviços">
      <p className="mb-4 text-sm text-muted-foreground">
        Alterações de valor refletem automaticamente no agendamento público e no faturamento.
      </p>
      <div className="space-y-2">
        {services.map((s) => (
          <div key={s.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <Scissors className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-foreground">{s.name}</p>
              <p className="text-xs text-muted-foreground">{s.duration} min</p>
            </div>
            <p className="text-sm font-bold text-primary">{formatBRL(s.price * 100)}</p>
            <button onClick={() => setEditing(s)} className="rounded-md border border-border p-2 text-muted-foreground hover:bg-muted">
              <Pencil className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      {editing && <ServiceModal initial={editing} onClose={() => setEditing(null)} onSave={save} />}
    </BarberShell>
  );
}

function ServiceModal({ initial, onClose, onSave }: { initial: MockService; onClose: () => void; onSave: (s: MockService) => void }) {
  const [form, setForm] = useState<MockService>(initial);
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center">
      <div className="w-full max-w-lg rounded-t-2xl border border-border bg-card p-5 sm:rounded-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">Editar serviço</h2>
          <button onClick={onClose} className="rounded p-1 text-muted-foreground"><X className="h-5 w-5" /></button>
        </div>
        <div className="space-y-3">
          <Field label="Nome do serviço">
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="svc-input" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Duração (min)">
              <select value={form.duration} onChange={(e) => setForm({ ...form, duration: Number(e.target.value) })} className="svc-input">
                {DURATIONS.map((d) => <option key={d} value={d}>{d} min</option>)}
              </select>
            </Field>
            <Field label="Valor (R$)">
              <input type="number" min={0} step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} className="svc-input" />
            </Field>
          </div>
          <Field label="Descrição">
            <textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="svc-input" />
          </Field>
        </div>
        <button onClick={() => onSave(form)} className="mt-5 h-11 w-full rounded-lg bg-primary text-sm font-semibold text-primary-foreground hover:opacity-90">
          Salvar alterações
        </button>
      </div>
      <style>{`.svc-input{height:40px;width:100%;border-radius:0.5rem;border:1px solid var(--border);background:var(--input);padding:0 0.75rem;font-size:0.875rem;color:var(--foreground);outline:none}.svc-input:focus{border-color:var(--ring)}textarea.svc-input{height:auto;padding:0.5rem 0.75rem}`}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}