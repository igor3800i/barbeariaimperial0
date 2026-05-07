import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { z } from "zod";
import { format, addDays, isBefore, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CheckCircle2, Calendar as CalendarIcon, Clock, Scissors, ChevronLeft } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { formatBRL } from "@/lib/format";
import { useBarberStore } from "@/lib/barber-store";
import { useClientAuth } from "@/lib/client-auth-context";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const searchSchema = z.object({ service: z.string().optional() });

export const Route = createFileRoute("/agendar")({
  validateSearch: (s) => searchSchema.parse(s),
  head: () => ({
    meta: [
      { title: "Agendar Horário — Navalha & Cia" },
      { name: "description", content: "Reserve seu horário online em segundos." },
    ],
  }),
  component: AgendarPage,
});

// 09:00 to 19:00 every 60 min
const ALL_SLOTS = Array.from({ length: 11 }, (_, i) => `${String(9 + i).padStart(2, "0")}:00`);

const NEXT_DAYS = Array.from({ length: 14 }, (_, i) => addDays(startOfDay(new Date()), i));

function AgendarPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const qc = useQueryClient();
  const { client } = useClientAuth();

  const [serviceId, setServiceId] = useState<string | undefined>(search.service);
  const [date, setDate] = useState<Date>(NEXT_DAYS[0]);
  const [time, setTime] = useState<string | undefined>();
  const [confirmed, setConfirmed] = useState<{ name: string; date: Date; time: string; service: string } | null>(null);

  const { services: storeServices, appointments, setAppointments } = useBarberStore();
  const services = useMemo(
    () => storeServices.map((s) => ({
      id: String(s.id),
      name: s.name,
      price_cents: Math.round(s.price * 100),
      duration_min: s.duration,
    })),
    [storeServices],
  );

  const dateStr = format(date, "yyyy-MM-dd");
  const { data: booked } = useQuery({
    queryKey: ["booked", dateStr],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("appointments")
        .select("time,status")
        .eq("date", dateStr)
        .neq("status", "cancelled");
      if (error) throw error;
      return new Set((data ?? []).map((r) => (r.time as string).slice(0, 5)));
    },
  });

  const isToday = startOfDay(new Date()).getTime() === date.getTime();
  const nowMinutes = new Date().getHours() * 60 + new Date().getMinutes();
  const availableSlots = useMemo(() => {
    return ALL_SLOTS.map((slot) => {
      const [h, m] = slot.split(":").map(Number);
      const past = isToday && h * 60 + m <= nowMinutes;
      return { slot, taken: booked?.has(slot) ?? false, past };
    });
  }, [booked, isToday, nowMinutes]);

  const selectedService = services?.find((s) => s.id === serviceId);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!client) throw new Error("Faça login para agendar");
      if (!serviceId || !time || !selectedService) throw new Error("Selecione serviço e horário");
      const fullName = `${client.name} ${client.surname}`.trim();

      // Verify slot is free
      const { data: existing, error: checkErr } = await supabase
        .from("appointments")
        .select("id")
        .eq("date", dateStr)
        .eq("time", time)
        .neq("status", "cancelled")
        .maybeSingle();
      if (checkErr) throw checkErr;
      if (existing) throw new Error("Horário já reservado, escolha outro");

      const { error: insertErr } = await supabase.from("appointments").insert({
        client_name: fullName,
        client_phone: client.phone,
        service: selectedService.name,
        service_value: Math.round(selectedService.price_cents) / 100,
        date: dateStr,
        time: time,
        status: "pending",
      });
      if (insertErr) {
        if ((insertErr as any).code === "23505") {
          throw new Error("Horário já reservado, escolha outro");
        }
        throw insertErr;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["booked", dateStr] });
      qc.invalidateQueries({ queryKey: ["appointments"] });
      setConfirmed({
        name: `${client!.name} ${client!.surname}`.trim(),
        date,
        time: time!,
        service: selectedService!.name,
      });
    },
    onError: (e: any) => toast.error(e.message ?? "Erro ao agendar"),
  });

  if (confirmed) {
    return (
      <section className="mx-auto max-w-lg px-4 py-20 text-center">
        <CheckCircle2 className="mx-auto h-16 w-16 text-primary" />
        <h1 className="mt-6 text-4xl text-foreground">Agendado!</h1>
        <p className="mt-3 text-muted-foreground">Te esperamos, {confirmed.name.split(" ")[0]}.</p>
        <div className="mt-8 space-y-2 rounded-lg border border-border bg-card p-6 text-left">
          <p className="flex items-center gap-2"><Scissors className="h-4 w-4 text-primary" /> {confirmed.service}</p>
          <p className="flex items-center gap-2"><CalendarIcon className="h-4 w-4 text-primary" /> {format(confirmed.date, "EEEE, dd 'de' MMMM", { locale: ptBR })}</p>
          <p className="flex items-center gap-2"><Clock className="h-4 w-4 text-primary" /> {confirmed.time}</p>
        </div>
        <Button className="mt-8 w-full" onClick={() => navigate({ to: "/" })}>Voltar ao início</Button>
      </section>
    );
  }

  const canSubmit = !!serviceId && !!time && !!client;

  return (
    <section className="mx-auto max-w-3xl px-4 py-12">
      <header className="mb-8 text-center">
        <h1 className="text-4xl text-foreground md:text-5xl">Agendar</h1>
        <p className="mt-2 text-muted-foreground">Escolha o serviço, o dia e o horário.</p>
      </header>

      {/* 1. Service */}
      <Step number={1} title="Escolha o serviço">
        <div className="grid gap-2 sm:grid-cols-2">
          {services?.map((s) => (
            <button
              key={s.id}
              onClick={() => setServiceId(s.id)}
              className={cn(
                "rounded-lg border p-4 text-left transition",
                serviceId === s.id ? "border-primary bg-primary/10" : "border-border bg-card hover:border-primary/40",
              )}
            >
              <div className="flex items-center justify-between">
                <span className="font-display text-base text-foreground">{s.name}</span>
                <span className="font-display text-base text-primary">{formatBRL(s.price_cents)}</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{s.duration_min} min</p>
            </button>
          ))}
        </div>
      </Step>

      {/* 2. Date */}
      <Step number={2} title="Escolha o dia">
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-2">
          {NEXT_DAYS.map((d) => {
            const selected = d.getTime() === date.getTime();
            return (
              <button
                key={d.toISOString()}
                onClick={() => { setDate(d); setTime(undefined); }}
                disabled={isBefore(d, startOfDay(new Date()))}
                className={cn(
                  "flex min-w-[64px] flex-col items-center rounded-lg border px-3 py-2 transition",
                  selected ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-foreground hover:border-primary/40",
                )}
              >
                <span className="text-[10px] uppercase tracking-wider opacity-70">
                  {format(d, "EEE", { locale: ptBR })}
                </span>
                <span className="font-display text-2xl leading-none">{format(d, "dd")}</span>
                <span className="text-[10px] opacity-70">{format(d, "MMM", { locale: ptBR })}</span>
              </button>
            );
          })}
        </div>
      </Step>

      {/* 3. Time */}
      <Step number={3} title="Escolha o horário">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {availableSlots.map(({ slot, taken, past }) => {
            const disabled = taken || past;
            const selected = time === slot;
            return (
              <button
                key={slot}
                disabled={disabled}
                onClick={() => setTime(slot)}
                className={cn(
                  "min-h-12 rounded-[var(--radius)] border font-semibold transition",
                  selected && "border-primary bg-primary text-primary-foreground",
                  !selected && !disabled && "border-border bg-card text-foreground hover:border-primary/50",
                  disabled && "cursor-not-allowed border-transparent bg-muted text-muted-foreground opacity-60",
                )}
              >
                {slot}
              </button>
            );
          })}
        </div>
      </Step>

      {client && (
        <p className="mb-4 rounded-lg border border-border bg-card p-3 text-sm text-muted-foreground">
          Agendando como <span className="font-semibold text-foreground">{client.name} {client.surname}</span> · {client.phone}
        </p>
      )}

      <div className="sticky bottom-0 -mx-4 mt-8 border-t border-border bg-background/95 px-4 py-4 backdrop-blur md:static md:mx-0 md:border-0 md:bg-transparent md:p-0">
        <Button
          size="lg"
          className="w-full text-base font-semibold"
          disabled={!canSubmit || mutation.isPending}
          onClick={() => mutation.mutate()}
        >
          {mutation.isPending ? "Agendando..." : "Confirmar agendamento"}
        </Button>
        {!canSubmit && (
          <p className="mt-2 text-center text-xs text-muted-foreground">Preencha todos os passos para confirmar.</p>
        )}
      </div>

      <button onClick={() => navigate({ to: "/" })} className="mx-auto mt-6 flex items-center gap-1 text-xs text-muted-foreground hover:text-primary">
        <ChevronLeft className="h-3 w-3" /> Voltar
      </button>
    </section>
  );
}

function Step({ number, title, children }: { number: number; title: string; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <h2 className="mb-3 flex items-center gap-2 text-base text-foreground">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary font-display text-sm text-primary-foreground">{number}</span>
        {title}
      </h2>
      {children}
    </div>
  );
}
