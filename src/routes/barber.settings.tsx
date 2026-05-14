import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Camera, Loader2, Pencil, Plus, Trash2, User, X } from "lucide-react";
import { toast } from "sonner";
import { BarberShell } from "@/components/barber/barber-shell";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/barber/settings")({
  head: () => ({ meta: [{ title: "Configurações — Barbearia Imperial" }] }),
  component: () => (
    <BarberShell title="Configurações">
      <SettingsPage />
    </BarberShell>
  ),
});

type Tab = "barbers" | "hours";

function SettingsPage() {
  const [tab, setTab] = useState<Tab>("barbers");
  return (
    <div>
      <div className="mb-6 flex gap-2 border-b border-border">
        {([["barbers", "Barbeiros"], ["hours", "Horários"]] as const).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={cn(
              "border-b-2 px-4 py-2 text-sm font-semibold transition",
              tab === id ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {label}
          </button>
        ))}
      </div>
      {tab === "barbers" ? <BarbersTab /> : <HoursTab />}
    </div>
  );
}

/* ---------- BARBEIROS ---------- */

type Barber = {
  id: string;
  display_name: string;
  bio: string | null;
  instagram: string | null;
  photo_url: string | null;
  active: boolean;
  commission_rate: number;
  profile_id: string | null;
};

function BarbersTab() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Partial<Barber> | null>(null);

  const { data: barbers = [], isLoading } = useQuery({
    queryKey: ["admin-barbers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("barbers")
        .select("id, display_name, bio, instagram, photo_url, active, commission_rate, profile_id")
        .order("display_name");
      if (error) throw error;
      return data as Barber[];
    },
  });

  const upsert = useMutation({
    mutationFn: async (b: Partial<Barber>) => {
      const payload = {
        display_name: b.display_name!,
        bio: b.bio ?? null,
        instagram: b.instagram ?? null,
        photo_url: b.photo_url ?? null,
        active: b.active ?? true,
        commission_rate: b.commission_rate ?? 0.5,
      };
      if (b.id) {
        const { error } = await supabase.from("barbers").update(payload).eq("id", b.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("barbers").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Barbeiro salvo");
      qc.invalidateQueries({ queryKey: ["admin-barbers"] });
      setEditing(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("barbers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Removido");
      qc.invalidateQueries({ queryKey: ["admin-barbers"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <>
      <div className="mb-4 flex justify-end">
        <button
          onClick={() => setEditing({ display_name: "", active: true, commission_rate: 0.5 })}
          className="flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> Novo barbeiro
        </button>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {barbers.map((b) => (
            <div key={b.id} className="flex gap-3 rounded-xl border border-border bg-card p-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted">
                {b.photo_url ? <img src={b.photo_url} alt={b.display_name} className="h-full w-full object-cover" /> : <User className="h-6 w-6 text-muted-foreground" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-foreground">
                  {b.display_name} {!b.active && <span className="text-xs text-muted-foreground">(inativo)</span>}
                </p>
                {b.instagram && <p className="text-xs text-muted-foreground">@{b.instagram}</p>}
                <p className="text-xs text-muted-foreground">Comissão: {Math.round(Number(b.commission_rate) * 100)}%</p>
                <div className="mt-2 flex gap-1.5">
                  <button onClick={() => setEditing(b)} className="rounded-md border border-border px-2 py-1 text-xs hover:bg-muted">
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => { if (confirm(`Remover "${b.display_name}"?`)) remove.mutate(b.id); }}
                    className="rounded-md border border-border px-2 py-1 text-xs text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {barbers.length === 0 && <p className="text-sm text-muted-foreground">Nenhum barbeiro cadastrado.</p>}
        </div>
      )}

      {editing && (
        <BarberModal
          initial={editing}
          onClose={() => setEditing(null)}
          onSave={(b) => upsert.mutate(b)}
          saving={upsert.isPending}
        />
      )}
    </>
  );
}

function BarberModal({
  initial, onClose, onSave, saving,
}: { initial: Partial<Barber>; onClose: () => void; onSave: (b: Partial<Barber>) => void; saving: boolean }) {
  const [form, setForm] = useState<Partial<Barber>>(initial);
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center">
      <div className="w-full max-w-lg rounded-t-2xl border border-border bg-card p-5 sm:rounded-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">{initial.id ? "Editar barbeiro" : "Novo barbeiro"}</h2>
          <button onClick={onClose} className="rounded p-1 text-muted-foreground"><X className="h-5 w-5" /></button>
        </div>
        <div className="space-y-3">
          <Field label="Nome de exibição">
            <input value={form.display_name ?? ""} onChange={(e) => setForm({ ...form, display_name: e.target.value })} className="m-input" />
          </Field>
          <Field label="Foto">
            <PhotoUpload value={form.photo_url ?? ""} onChange={(url) => setForm({ ...form, photo_url: url })} />
          </Field>
          <Field label="Instagram (sem @)">
            <input value={form.instagram ?? ""} onChange={(e) => setForm({ ...form, instagram: e.target.value })} className="m-input" />
          </Field>
          <Field label="Bio">
            <textarea rows={2} value={form.bio ?? ""} onChange={(e) => setForm({ ...form, bio: e.target.value })} className="m-input" />
          </Field>
          <Field label="Comissão (0 a 1, ex: 0.5 = 50%)">
            <input type="number" min={0} max={1} step="0.05" value={form.commission_rate ?? 0.5}
              onChange={(e) => setForm({ ...form, commission_rate: Number(e.target.value) })} className="m-input" />
          </Field>
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input type="checkbox" checked={form.active ?? true} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
            Ativo
          </label>
        </div>
        <button
          onClick={() => onSave(form)}
          disabled={saving || !form.display_name?.trim()}
          className="mt-5 h-11 w-full rounded-lg bg-primary text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          {saving ? "Salvando..." : "Salvar"}
        </button>
      </div>
      <style>{`.m-input{height:40px;width:100%;border-radius:0.5rem;border:1px solid var(--border);background:var(--input);padding:0 0.75rem;font-size:0.875rem;color:var(--foreground);outline:none}.m-input:focus{border-color:var(--ring)}textarea.m-input{height:auto;padding:0.5rem 0.75rem}`}</style>
    </div>
  );
}

/* ---------- HORÁRIOS ---------- */

type WH = {
  id?: string;
  barber_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_day_off: boolean;
};

const DAYS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

function HoursTab() {
  const qc = useQueryClient();
  const [barberId, setBarberId] = useState<string>("");

  const { data: barbers = [] } = useQuery({
    queryKey: ["admin-barbers-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("barbers").select("id, display_name").eq("active", true).order("display_name");
      if (error) throw error;
      return data as { id: string; display_name: string }[];
    },
  });

  useEffect(() => { if (!barberId && barbers[0]) setBarberId(barbers[0].id); }, [barbers, barberId]);

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["admin-hours", barberId],
    enabled: !!barberId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("working_hours")
        .select("id, barber_id, day_of_week, start_time, end_time, is_day_off")
        .eq("barber_id", barberId)
        .order("day_of_week");
      if (error) throw error;
      return data as WH[];
    },
  });

  // Build a 7-day grid filling missing days
  const grid: WH[] = Array.from({ length: 7 }, (_, dow) => {
    const found = rows.find((r) => r.day_of_week === dow);
    return found ?? { barber_id: barberId, day_of_week: dow, start_time: "09:00", end_time: "18:00", is_day_off: true };
  });

  const [draft, setDraft] = useState<WH[] | null>(null);
  useEffect(() => { setDraft(null); }, [barberId, rows]);
  const data = draft ?? grid;

  const save = useMutation({
    mutationFn: async (items: WH[]) => {
      // Strategy: delete all existing for this barber, then insert non-day-off rows
      const { error: delErr } = await supabase.from("working_hours").delete().eq("barber_id", barberId);
      if (delErr) throw delErr;
      const inserts = items.map((i) => ({
        barber_id: barberId,
        day_of_week: i.day_of_week,
        start_time: i.start_time,
        end_time: i.end_time,
        is_day_off: i.is_day_off,
      }));
      const { error } = await supabase.from("working_hours").insert(inserts);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Horários salvos");
      qc.invalidateQueries({ queryKey: ["admin-hours", barberId] });
      setDraft(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const update = (dow: number, patch: Partial<WH>) => {
    setDraft(data.map((d) => (d.day_of_week === dow ? { ...d, ...patch } : d)));
  };

  if (barbers.length === 0) {
    return <p className="text-sm text-muted-foreground">Cadastre um barbeiro primeiro na aba "Barbeiros".</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <label className="text-sm font-semibold text-foreground">Barbeiro:</label>
        <select value={barberId} onChange={(e) => setBarberId(e.target.value)}
          className="h-10 rounded-lg border border-border bg-input px-3 text-sm text-foreground outline-none focus:border-ring">
          {barbers.map((b) => <option key={b.id} value={b.id}>{b.display_name}</option>)}
        </select>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : (
        <div className="space-y-2">
          {data.map((d) => (
            <div key={d.day_of_week} className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-3">
              <div className="w-24 font-semibold text-foreground">{DAYS[d.day_of_week]}</div>
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <input type="checkbox" checked={!d.is_day_off}
                  onChange={(e) => update(d.day_of_week, { is_day_off: !e.target.checked })} />
                Aberto
              </label>
              <input type="time" value={d.start_time.slice(0, 5)} disabled={d.is_day_off}
                onChange={(e) => update(d.day_of_week, { start_time: `${e.target.value}:00` })}
                className="h-9 rounded-md border border-border bg-input px-2 text-sm text-foreground disabled:opacity-50" />
              <span className="text-muted-foreground">até</span>
              <input type="time" value={d.end_time.slice(0, 5)} disabled={d.is_day_off}
                onChange={(e) => update(d.day_of_week, { end_time: `${e.target.value}:00` })}
                className="h-9 rounded-md border border-border bg-input px-2 text-sm text-foreground disabled:opacity-50" />
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={() => save.mutate(data)}
          disabled={save.isPending || !draft}
          className="h-11 rounded-lg bg-primary px-6 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          {save.isPending ? "Salvando..." : "Salvar alterações"}
        </button>
        {draft && (
          <button onClick={() => setDraft(null)} className="h-11 rounded-lg border border-border px-6 text-sm font-semibold text-foreground hover:bg-muted">
            Cancelar
          </button>
        )}
      </div>
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

function PhotoUpload({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFile(file: File) {
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage.from("barbers").upload(path, file, { upsert: false, cacheControl: "3600" });
      if (error) throw error;
      const { data } = supabase.storage.from("barbers").getPublicUrl(path);
      onChange(data.publicUrl);
      toast.success("Foto enviada");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full bg-muted">
        {value ? <img src={value} alt="" className="h-full w-full object-cover" /> : <User className="m-auto mt-5 h-6 w-6 text-muted-foreground" />}
      </div>
      <div className="flex-1 space-y-2">
        <input value={value} onChange={(e) => onChange(e.target.value)} placeholder="URL ou enviar arquivo"
          className="h-9 w-full rounded-md border border-border bg-input px-3 text-sm text-foreground outline-none focus:border-ring" />
        <button
          type="button"
          onClick={() => ref.current?.click()}
          disabled={uploading}
          className="inline-flex h-9 items-center gap-1.5 rounded-md border border-border bg-card px-3 text-xs font-semibold text-foreground hover:bg-muted disabled:opacity-50"
        >
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
          {uploading ? "Enviando..." : "Enviar foto"}
        </button>
        <input ref={ref} type="file" accept="image/*" className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }} />
      </div>
    </div>
  );
}

