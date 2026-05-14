import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Calendar, Clock, Star, X, Camera, Loader2, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { formatBRL } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/minha-conta")({
  head: () => ({ meta: [{ title: "Minha conta — Barbearia Imperial" }] }),
  component: MinhaContaPage,
});

type Appt = {
  id: string;
  status: string;
  scheduled_at: string;
  ends_at: string;
  price_charged: number | null;
  notes: string | null;
  service: { name: string } | null;
  barber: { id: string; display_name: string; photo_url: string | null } | null;
  reviews: { id: string; rating: number; comment: string | null }[] | null;
};

const STATUS_LABEL: Record<string, string> = {
  pending: "Pendente",
  confirmed: "Confirmado",
  completed: "Concluído",
  cancelled: "Cancelado",
};

const STATUS_COLOR: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-500 border-yellow-500/30",
  confirmed: "bg-blue-500/10 text-blue-500 border-blue-500/30",
  completed: "bg-emerald-500/10 text-emerald-500 border-emerald-500/30",
  cancelled: "bg-red-500/10 text-red-500 border-red-500/30",
};

function MinhaContaPage() {
  const { isAuthenticated, user, profile, loading, signOut, refreshProfile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate({ to: "/login", search: { redirect: "/minha-conta" } as never });
    }
  }, [loading, isAuthenticated, navigate]);

  const qc = useQueryClient();
  const { data: appts = [], isLoading } = useQuery({
    queryKey: ["my-appointments", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("appointments")
        .select(`
          id, status, scheduled_at, ends_at, price_charged, notes,
          service:services(name),
          barber:barbers(id, display_name, photo_url),
          reviews(id, rating, comment)
        `)
        .eq("client_id", user!.id)
        .order("scheduled_at", { ascending: false });
      if (error) throw error;
      return data as unknown as Appt[];
    },
  });

  const cancel = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("appointments").update({ status: "cancelled" }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Agendamento cancelado");
      qc.invalidateQueries({ queryKey: ["my-appointments"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const upcoming = useMemo(
    () => appts.filter((a) => ["pending", "confirmed"].includes(a.status) && new Date(a.scheduled_at) >= new Date(Date.now() - 60 * 60 * 1000)),
    [appts],
  );
  const past = useMemo(
    () => appts.filter((a) => !upcoming.includes(a)),
    [appts, upcoming],
  );

  const [reviewing, setReviewing] = useState<Appt | null>(null);

  if (loading || !isAuthenticated) {
    return <div className="mx-auto max-w-4xl px-4 py-16 text-muted-foreground">Carregando...</div>;
  }

  return (
    <section className="mx-auto max-w-4xl px-4 py-12">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl font-bold text-foreground md:text-4xl">Minha conta</h1>
          <p className="text-sm text-muted-foreground">Olá, {profile?.full_name || "cliente"}.</p>
        </div>
        <button
          onClick={() => signOut().then(() => navigate({ to: "/" }))}
          className="inline-flex h-9 items-center gap-2 rounded-md border border-border px-3 text-xs font-semibold text-foreground hover:bg-muted"
        >
          <LogOut className="h-4 w-4" /> Sair
        </button>
      </header>

      <ProfileCard onUpdated={refreshProfile} />

      <div className="mt-10">
        <h2 className="mb-3 font-display text-xl font-bold text-foreground">Próximos agendamentos</h2>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando...</p>
        ) : upcoming.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card p-6 text-center">
            <p className="text-sm text-muted-foreground">Você não tem agendamentos futuros.</p>
            <Link to="/agendar" className="mt-3 inline-flex h-10 items-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground hover:opacity-90">
              Agendar agora
            </Link>
          </div>
        ) : (
          <ul className="space-y-3">
            {upcoming.map((a) => (
              <ApptRow key={a.id} appt={a} onCancel={() => cancel.mutate(a.id)} canceling={cancel.isPending} />
            ))}
          </ul>
        )}
      </div>

      <div className="mt-10">
        <h2 className="mb-3 font-display text-xl font-bold text-foreground">Histórico</h2>
        {past.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum atendimento anterior.</p>
        ) : (
          <ul className="space-y-3">
            {past.map((a) => (
              <ApptRow
                key={a.id}
                appt={a}
                past
                onReview={a.status === "completed" && !(a.reviews && a.reviews.length > 0) ? () => setReviewing(a) : undefined}
              />
            ))}
          </ul>
        )}
      </div>

      {reviewing && (
        <ReviewModal
          appt={reviewing}
          onClose={() => setReviewing(null)}
          onSaved={() => {
            setReviewing(null);
            qc.invalidateQueries({ queryKey: ["my-appointments"] });
          }}
        />
      )}
    </section>
  );
}

function ApptRow({
  appt, past, onCancel, onReview, canceling,
}: { appt: Appt; past?: boolean; onCancel?: () => void; onReview?: () => void; canceling?: boolean }) {
  const date = new Date(appt.scheduled_at);
  const dateLabel = date.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "short" });
  const timeLabel = date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  return (
    <li className="rounded-xl border border-border bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-display text-base font-semibold text-foreground">{appt.service?.name ?? "Serviço"}</span>
            <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase", STATUS_COLOR[appt.status])}>
              {STATUS_LABEL[appt.status] ?? appt.status}
            </span>
          </div>
          <p className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{dateLabel}</span>
            <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{timeLabel}</span>
            {appt.barber && <span>com <strong className="text-foreground">{appt.barber.display_name}</strong></span>}
            {appt.price_charged != null && <span>{formatBRL(Math.round(Number(appt.price_charged) * 100))}</span>}
          </p>
          {appt.reviews && appt.reviews.length > 0 && (
            <p className="mt-2 inline-flex items-center gap-1 text-xs text-yellow-500">
              {Array.from({ length: appt.reviews[0].rating }).map((_, i) => (
                <Star key={i} className="h-3.5 w-3.5 fill-current" />
              ))}
              <span className="ml-1 text-muted-foreground">{appt.reviews[0].comment}</span>
            </p>
          )}
        </div>
        <div className="flex shrink-0 gap-2">
          {!past && onCancel && appt.status !== "cancelled" && (
            <button
              onClick={() => { if (confirm("Cancelar este agendamento?")) onCancel(); }}
              disabled={canceling}
              className="rounded-md border border-destructive/40 px-3 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/10 disabled:opacity-50"
            >
              Cancelar
            </button>
          )}
          {onReview && (
            <button
              onClick={onReview}
              className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90"
            >
              Avaliar
            </button>
          )}
        </div>
      </div>
    </li>
  );
}

function ReviewModal({ appt, onClose, onSaved }: { appt: Appt; onClose: () => void; onSaved: () => void }) {
  const { user } = useAuth();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const save = useMutation({
    mutationFn: async () => {
      if (!appt.barber) throw new Error("Barbeiro não encontrado");
      const { error } = await supabase.from("reviews").insert({
        appointment_id: appt.id,
        barber_id: appt.barber.id,
        client_id: user!.id,
        rating,
        comment: comment.trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Avaliação enviada");
      onSaved();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-lg font-bold">Avaliar atendimento</h3>
          <button onClick={onClose} className="rounded p-1 text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        </div>
        <p className="mb-3 text-sm text-muted-foreground">{appt.service?.name} com {appt.barber?.display_name}</p>
        <div className="mb-4 flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} onClick={() => setRating(n)} className="p-1">
              <Star className={cn("h-7 w-7", n <= rating ? "fill-yellow-500 text-yellow-500" : "text-muted-foreground")} />
            </button>
          ))}
        </div>
        <textarea
          rows={3}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Conte como foi (opcional)"
          className="w-full rounded-md border border-border bg-input p-3 text-sm text-foreground outline-none focus:border-ring"
        />
        <button
          onClick={() => save.mutate()}
          disabled={save.isPending}
          className="mt-4 h-11 w-full rounded-lg bg-primary text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          {save.isPending ? "Enviando..." : "Enviar avaliação"}
        </button>
      </div>
    </div>
  );
}

function ProfileCard({ onUpdated }: { onUpdated: () => Promise<void> }) {
  const { user, profile } = useAuth();
  const [fullName, setFullName] = useState(profile?.full_name ?? "");
  const [phone, setPhone] = useState(profile?.phone ?? "");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setFullName(profile?.full_name ?? "");
    setPhone(profile?.phone ?? "");
  }, [profile]);

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: fullName.trim(), phone: phone.trim() || null })
        .eq("id", user!.id);
      if (error) throw error;
    },
    onSuccess: async () => {
      toast.success("Perfil atualizado");
      await onUpdated();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  async function handleAvatarChange(file: File) {
    if (!user) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${user.id}/avatar-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, { upsert: true, cacheControl: "3600" });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
      const { error: updErr } = await supabase.from("profiles").update({ avatar_url: pub.publicUrl }).eq("id", user.id);
      if (updErr) throw updErr;
      await onUpdated();
      toast.success("Foto atualizada");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full bg-muted">
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-muted-foreground">
              {(profile?.full_name?.[0] ?? "?").toUpperCase()}
            </div>
          )}
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="absolute inset-x-0 bottom-0 flex h-7 items-center justify-center bg-black/60 text-white"
            title="Trocar foto"
          >
            {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleAvatarChange(f); e.target.value = ""; }}
          />
        </div>
        <div className="grid flex-1 gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-xs font-medium uppercase tracking-wider text-muted-foreground">Nome</span>
            <input value={fullName} onChange={(e) => setFullName(e.target.value)} className="h-10 w-full rounded-md border border-border bg-input px-3 text-sm text-foreground outline-none focus:border-ring" />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium uppercase tracking-wider text-muted-foreground">Telefone</span>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} className="h-10 w-full rounded-md border border-border bg-input px-3 text-sm text-foreground outline-none focus:border-ring" />
          </label>
        </div>
      </div>
      <div className="mt-4 flex justify-end">
        <button
          onClick={() => save.mutate()}
          disabled={save.isPending || !fullName.trim()}
          className="h-10 rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          {save.isPending ? "Salvando..." : "Salvar"}
        </button>
      </div>
    </div>
  );
}
