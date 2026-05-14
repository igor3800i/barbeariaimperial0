import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Scissors, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { BarberShell } from "@/components/barber/barber-shell";
import { supabase } from "@/integrations/supabase/client";
import { formatBRL } from "@/lib/format";

export const Route = createFileRoute("/barber/services")({
  head: () => ({ meta: [{ title: "Serviços — Barbearia Imperial" }] }),
  component: () => (
    <BarberShell title="Serviços">
      <ServicesPage />
    </BarberShell>
  ),
});

type Service = {
  id: string;
  name: string;
  description: string | null;
  duration_min: number;
  price: number;
  active: boolean;
  category: string | null;
};

const DURATIONS = [15, 20, 30, 45, 60, 75, 90, 120];

function ServicesPage() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Partial<Service> | null>(null);

  const { data: services = [], isLoading } = useQuery({
    queryKey: ["admin-services"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("services")
        .select("id, name, description, duration_min, price, active, category")
        .order("price");
      if (error) throw error;
      return data as Service[];
    },
  });

  const upsert = useMutation({
    mutationFn: async (s: Partial<Service>) => {
      const payload = {
        name: s.name!,
        description: s.description ?? null,
        duration_min: s.duration_min!,
        price: s.price!,
        active: s.active ?? true,
        category: s.category ?? null,
      };
      if (s.id) {
        const { error } = await supabase.from("services").update(payload).eq("id", s.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("services").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Serviço salvo");
      qc.invalidateQueries({ queryKey: ["admin-services"] });
      qc.invalidateQueries({ queryKey: ["services"] });
      setEditing(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("services").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Serviço removido");
      qc.invalidateQueries({ queryKey: ["admin-services"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Gerencie os serviços oferecidos.</p>
        <button
          onClick={() => setEditing({ name: "", duration_min: 30, price: 0, active: true })}
          className="flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> Novo
        </button>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : (
        <div className="space-y-2">
          {services.map((s) => (
            <div key={s.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
                <Scissors className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-foreground">
                  {s.name} {!s.active && <span className="ml-2 text-xs text-muted-foreground">(inativo)</span>}
                </p>
                <p className="text-xs text-muted-foreground">{s.duration_min} min</p>
              </div>
              <p className="text-sm font-bold text-primary">{formatBRL(Math.round(Number(s.price) * 100))}</p>
              <button onClick={() => setEditing(s)} className="rounded-md border border-border p-2 text-muted-foreground hover:bg-muted">
                <Pencil className="h-4 w-4" />
              </button>
              <button
                onClick={() => { if (confirm(`Remover "${s.name}"?`)) remove.mutate(s.id); }}
                className="rounded-md border border-border p-2 text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          {services.length === 0 && <p className="text-sm text-muted-foreground">Nenhum serviço cadastrado.</p>}
        </div>
      )}

      {editing && (
        <ServiceModal
          initial={editing}
          onClose={() => setEditing(null)}
          onSave={(s) => upsert.mutate(s)}
          saving={upsert.isPending}
        />
      )}
    </>
  );
}

function ServiceModal({
  initial, onClose, onSave, saving,
}: { initial: Partial<Service>; onClose: () => void; onSave: (s: Partial<Service>) => void; saving: boolean }) {
  const [form, setForm] = useState<Partial<Service>>(initial);
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center">
      <div className="w-full max-w-lg rounded-t-2xl border border-border bg-card p-5 sm:rounded-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">{initial.id ? "Editar serviço" : "Novo serviço"}</h2>
          <button onClick={onClose} className="rounded p-1 text-muted-foreground"><X className="h-5 w-5" /></button>
        </div>
        <div className="space-y-3">
          <Field label="Nome">
            <input value={form.name ?? ""} onChange={(e) => setForm({ ...form, name: e.target.value })} className="modal-input" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Duração (min)">
              <select value={form.duration_min ?? 30} onChange={(e) => setForm({ ...form, duration_min: Number(e.target.value) })} className="modal-input">
                {DURATIONS.map((d) => <option key={d} value={d}>{d} min</option>)}
              </select>
            </Field>
            <Field label="Preço (R$)">
              <input type="number" min={0} step="0.01" value={form.price ?? 0}
                onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} className="modal-input" />
            </Field>
          </div>
          <Field label="Descrição">
            <textarea rows={2} value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} className="modal-input" />
          </Field>
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input type="checkbox" checked={form.active ?? true} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
            Ativo (visível no agendamento)
          </label>
        </div>
        <button
          onClick={() => onSave(form)}
          disabled={saving || !form.name?.trim()}
          className="mt-5 h-11 w-full rounded-lg bg-primary text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          {saving ? "Salvando..." : "Salvar"}
        </button>
      </div>
      <style>{`.modal-input{height:40px;width:100%;border-radius:0.5rem;border:1px solid var(--border);background:var(--input);padding:0 0.75rem;font-size:0.875rem;color:var(--foreground);outline:none}.modal-input:focus{border-color:var(--ring)}textarea.modal-input{height:auto;padding:0.5rem 0.75rem}`}</style>
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
