import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { toast } from "sonner";
import { Calendar, Clock, Scissors, User as UserIcon, Loader2, CheckCircle2, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatBRL } from "@/lib/format";
import { cn } from "@/lib/utils";

const searchSchema = z.object({
  service: z.string().uuid().optional(),
  barber: z.string().uuid().optional(),
});

export const Route = createFileRoute("/agendar")({
  head: () => ({ meta: [{ title: "Agendar — Barbearia Imperial" }] }),
  validateSearch: searchSchema,
  component: AgendarPage,
});

type Service = { id: string; name: string; price: number; duration_min: number; description: string | null };
type Barber = { id: string; display_name: string; bio: string | null; photo_url: string | null };
type WH = { day_of_week: number; start_time: string; end_time: string; is_day_off: boolean };
type LocalClient = { clientName: string; clientPhone: string };

const DAY_LABELS = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];
const MONTH_LABELS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
const SLOT_STEP_MIN = 60;

function buildDateRange(days = 60): Date[] {
  const arr: Date[] = [];
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  for (let i = 0; i < days; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    arr.push(d);
  }
  return arr;
}

function toLocalDateKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function buildSlots(wh: WH | undefined, taken: Array<{ start: Date; end: Date }>, durationMin: number, dayKey: string) {
  if (!wh || wh.is_day_off) return [];
  const [sh, sm] = wh.start_time.split(":").map(Number);
  const [eh, em] = wh.end_time.split(":").map(Number);
  const dayStart = new Date(`${dayKey}T00:00:00`);
  const start = new Date(dayStart);
  start.setHours(sh, sm, 0, 0);
  const end = new Date(dayStart);
  end.setHours(eh, em, 0, 0);
  const now = new Date();

  const slots: { iso: string; label: string; disabled: boolean; booked: boolean; past: boolean }[] = [];
  for (
    let t = new Date(start);
    t.getTime() + durationMin * 60_000 <= end.getTime();
    t = new Date(t.getTime() + SLOT_STEP_MIN * 60_000)
  ) {
    const slotEnd = new Date(t.getTime() + durationMin * 60_000);
    const booked = taken.some((a) => t < a.end && slotEnd > a.start);
    const past = t < now;
    slots.push({
      iso: t.toISOString(),
      label: `${String(t.getHours()).padStart(2, "0")}:${String(t.getMinutes()).padStart(2, "0")}`,
      disabled: booked || past,
      booked,
      past,
    });
  }
  return slots;
}

function AgendarPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const qc = useQueryClient();

  // Auth via localStorage — leitura direta e síncrona
  const localClient = useMemo<LocalClient | null>(() => {
    try {
      const raw = localStorage.getItem("imperial.client");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);
  const isAuthenticated = !!localClient;

  const [serviceId, setServiceId] = useState<string | undefined>(search.service);
  const [barberId, setBarberId] = useState<string | undefined>(search.barber);
  const [dateKey, setDateKey] = useState<string | undefined>();
  const [slotIso, setSlotIso] = useState<string | undefined>();

  const { data: services } = useQuery({
    queryKey: ["services-active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("services")
        .select("id, name, price, duration_min, description")
        .eq("active", true)
        .order("price");
      if (error) throw error;
      return data as Service[];
    },
  });

  const { data: barbers } = useQuery({
    queryKey: ["barbers-active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("barbers")
        .select("id, display_name, bio, photo_url")
        .eq("active", true)
        .order("display_name");
      if (error) throw error;
      return data as Barber[];
    },
  });

  const { data: ratings } = useQuery({
    queryKey: ["barber-ratings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("reviews").select("barber_id, rating");
      if (error) throw error;
      const map = new Map<string, { sum: number; count: number }>();
      for (const r of data as { barber_id: string; rating: number }[]) {
        const cur = map.get(r.barber_id) ?? { sum: 0, count: 0 };
        cur.sum += r.rating;
        cur.count += 1;
        map.set(r.barber_id, cur);
      }
      return map;
    },
  });

  const { data: workingHours } = useQuery({
    queryKey: ["working-hours", barberId],
    enabled: !!barberId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("working_hours")
        .select("day_of_week, start_time, end_time, is_day_off")
        .eq("barber_id", barberId!);
      if (error) throw error;
      return data as WH[];
    },
  });

  const { data: dayAppointments } = useQuery({
    queryKey: ["day-appointments", barberId, dateKey],
    enabled: !!barberId && !!dateKey,
    queryFn: async () => {
      const start = `${dateKey}T00:00:00`;
      const end = `${dateKey}T23:59:59`;
      const { data, error } = await supabase
        .from("appointments")
        .select("scheduled_at, ends_at, status")
        .eq("barber_id", barberId!)
        .gte("scheduled_at", start)
        .lte("scheduled_at", end)
        .neq("status", "cancelled");
      if (error) throw error;
      return data.map((a) => ({ start: new Date(a.scheduled_at), end: new Date(a.ends_at) }));
    },
  });

  const dates = useMemo(() => buildDateRange(60), []);
  const selectedService = services?.find((s) => s.id === serviceId);
  const selectedBarber = barbers?.find((b) => b.id === barberId);

  // Auto-pick barbeiro único
  const resolvedBarberId = barberId ?? (barbers?.length === 1 ? barbers[0].id : undefined);
  const resolvedBarber = barbers?.find((b) => b.id === resolvedBarberId);

  const slots = useMemo(() => {
    if (!dateKey || !selectedService || !workingHours) return [];
    const dow = new Date(`${dateKey}T00:00:00`).getDay();
    const wh = workingHours.find((w) => w.day_of_week === dow);
    return buildSlots(wh, dayAppointments ?? [], selectedService.duration_min, dateKey);
  }, [dateKey, selectedService, workingHours, dayAppointments]);

  const bookMut = useMutation({
    mutationFn: async () => {
      if (!localClient) throw new Error("Você precisa estar logado.");
      if (!selectedService || !resolvedBarber || !slotIso) throw new Error("Dados incompletos.");

      // Busca client_id pelo telefone
      let clientId: string | null = null;
      if (localClient.clientPhone) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("phone", localClient.clientPhone)
          .maybeSingle();
        clientId = profile?.id ?? null;
      }

      const start = new Date(slotIso);
      const end = new Date(start.getTime() + selectedService.duration_min * 60_000);
      const { error } = await supabase.from("appointments").insert({
        client_id: clientId,
        barber_id: resolvedBarber.id,
        service_id: selectedService.id,
        scheduled_at: start.toISOString(),
        ends_at: end.toISOString(),
        price_charged: selectedService.price,
        status: "confirmed",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Agendamento confirmado!");
      qc.invalidateQueries({ queryKey: ["day-appointments"] });
      setSlotIso(undefined);
      setTimeout(() => navigate({ to: "/" }), 1200);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const canBook = !!serviceId && !!resolvedBarberId && !!slotIso && isAuthenticated;

  return (
    <section className="mx-auto max-w-4xl px-4 py-10">
      <header className="mb-8 text-center">
        <h1 className="font-serif text-4xl text-foreground md:text-5xl">Agendar</h1>
        <p className="mt-2 text-muted-foreground">Escolha serviço, barbeiro, dia e horário.</p>
      </header>

      {/* STEP 1 — Serviço */}
      <Step n={1} title="ESCOLHA O SERVIÇO" icon={<Scissors className="h-4 w-4" />}>
        <div className="grid gap-3 sm:grid-cols-2">
          {(services ?? []).map((s) => (
            <button
              key={s.id}
              onClick={() => {
                setServiceId(s.id);
                setSlotIso(undefined);
              }}
              className={cn(
                "flex flex-col items-start rounded-lg border p-4 text-left transition",
                serviceId === s.id ? "border-primary bg-primary/10" : "border-border bg-card hover:border-primary/60",
              )}
            >
              <span className="font-semibold text-foreground">{s.name}</span>
              {s.description && <span className="mt-1 text-xs text-muted-foreground">{s.description}</span>}
              <span className="mt-2 flex items-center gap-3 text-sm">
                <span className="font-display text-primary">{formatBRL(Math.round(Number(s.price) * 100))}</span>
                <span className="inline-flex items-center gap-1 text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {s.duration_min}min
                </span>
              </span>
            </button>
          ))}
        </div>
      </Step>

      {/* STEP 2 — Barbeiro (esconde se só tiver um) */}
      {serviceId && (barbers ?? []).length > 1 && (
        <Step n={2} title="ESCOLHA O BARBEIRO" icon={<UserIcon className="h-4 w-4" />}>
          <div className="grid gap-3 sm:grid-cols-2">
            {(barbers ?? []).map((b) => (
              <button
                key={b.id}
                onClick={() => {
                  setBarberId(b.id);
                  setSlotIso(undefined);
                }}
                className={cn(
                  "flex items-center gap-3 rounded-lg border p-4 text-left transition",
                  resolvedBarberId === b.id
                    ? "border-primary bg-primary/10"
                    : "border-border bg-card hover:border-primary/60",
                )}
              >
                <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-muted text-base font-bold text-foreground">
                  {b.photo_url ? (
                    <img src={b.photo_url} alt={b.display_name} className="h-full w-full object-cover" />
                  ) : (
                    b.display_name.charAt(0)
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-foreground">{b.display_name}</p>
                  {b.bio && <p className="truncate text-xs text-muted-foreground">{b.bio}</p>}
                  {(() => {
                    const r = ratings?.get(b.id);
                    if (!r || r.count === 0)
                      return <p className="mt-1 text-[11px] text-muted-foreground">Sem avaliações ainda</p>;
                    const avg = r.sum / r.count;
                    return (
                      <p className="mt-1 inline-flex items-center gap-1 text-[11px] text-yellow-500">
                        <Star className="h-3 w-3 fill-current" />
                        <span className="font-semibold">{avg.toFixed(1)}</span>
                        <span className="text-muted-foreground">({r.count})</span>
                      </p>
                    );
                  })()}
                </div>
              </button>
            ))}
          </div>
        </Step>
      )}

      {/* STEP 3 — Dia */}
      {resolvedBarberId && (
        <Step n={(barbers ?? []).length > 1 ? 3 : 2} title="ESCOLHA O DIA" icon={<Calendar className="h-4 w-4" />}>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r from-background to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-background to-transparent" />
            <div className="flex gap-2 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none]">
              {dates.map((d) => {
                const key = toLocalDateKey(d);
                const dow = d.getDay();
                const wh = workingHours?.find((w) => w.day_of_week === dow);
                const isOff = wh?.is_day_off ?? dow === 0;
                const isToday = key === toLocalDateKey(new Date());
                const selected = key === dateKey;
                return (
                  <button
                    key={key}
                    disabled={isOff}
                    onClick={() => {
                      setDateKey(key);
                      setSlotIso(undefined);
                    }}
                    className={cn(
                      "flex min-w-[64px] shrink-0 flex-col items-center rounded-lg border px-2 py-2 text-xs transition",
                      selected
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-card text-foreground hover:border-primary/60",
                      isOff && "pointer-events-none opacity-40",
                      !selected && isToday && "ring-1 ring-primary",
                    )}
                  >
                    <span className="text-[10px] font-semibold opacity-80">{isToday ? "HOJE" : DAY_LABELS[dow]}</span>
                    <span className="text-lg font-bold leading-tight">{d.getDate()}</span>
                    <span className="text-[10px] opacity-70">{MONTH_LABELS[d.getMonth()]}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </Step>
      )}

      {/* STEP 4 — Horário */}
      {dateKey && (
        <Step n={(barbers ?? []).length > 1 ? 4 : 3} title="ESCOLHA O HORÁRIO" icon={<Clock className="h-4 w-4" />}>
          {slots.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum horário disponível neste dia.</p>
          ) : (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 md:grid-cols-6">
              {slots.map((s) => (
                <button
                  key={s.iso}
                  disabled={s.disabled}
                  aria-label={s.booked ? `${s.label} — Ocupado` : s.past ? `${s.label} — Indisponível` : s.label}
                  title={s.booked ? "Ocupado" : s.past ? "Indisponível" : undefined}
                  onClick={() => !s.disabled && setSlotIso(s.iso)}
                  className={cn(
                    "flex flex-col items-center justify-center rounded-md border px-2 py-2 text-sm transition",
                    slotIso === s.iso
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card text-foreground hover:border-primary/60",
                    s.disabled && "pointer-events-none cursor-not-allowed opacity-40",
                    s.booked && "line-through",
                  )}
                >
                  <span>{s.label}</span>
                  {s.booked && (
                    <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Ocupado
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </Step>
      )}

      {/* RESUMO */}
      {slotIso && selectedService && resolvedBarber && (
        <div className="mt-8 rounded-xl border border-primary/40 bg-primary/5 p-6">
          <h2 className="font-display text-xl text-foreground">Resumo</h2>
          <ul className="mt-3 space-y-1 text-sm text-foreground">
            <li>
              <strong>Serviço:</strong> {selectedService.name} (
              {formatBRL(Math.round(Number(selectedService.price) * 100))})
            </li>
            <li>
              <strong>Barbeiro:</strong> {resolvedBarber.display_name}
            </li>
            <li>
              <strong>Quando:</strong>{" "}
              {new Date(slotIso).toLocaleString("pt-BR", {
                weekday: "long",
                day: "2-digit",
                month: "long",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </li>
          </ul>

          {!isAuthenticated ? (
            <div className="mt-5 rounded-md border border-border bg-card p-4 text-sm">
              <p className="text-muted-foreground">Para confirmar, faça login ou crie sua conta.</p>
              <div className="mt-3 flex gap-2">
                <Link
                  to="/login"
                  className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground"
                >
                  Entrar
                </Link>
                <Link
                  to="/cadastro"
                  className="inline-flex h-10 items-center justify-center rounded-md border border-border px-4 text-sm font-semibold text-foreground"
                >
                  Criar conta
                </Link>
              </div>
            </div>
          ) : (
            <button
              disabled={!canBook || bookMut.isPending}
              onClick={() => bookMut.mutate()}
              className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-primary px-6 text-sm font-semibold text-primary-foreground disabled:opacity-60"
            >
              {bookMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              Confirmar agendamento
            </button>
          )}
        </div>
      )}
    </section>
  );
}

function Step({
  n,
  title,
  icon,
  children,
}: {
  n: number;
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-8">
      <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-foreground">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
          {n}
        </span>
        {icon} {title}
      </h2>
      {children}
    </section>
  );
}
