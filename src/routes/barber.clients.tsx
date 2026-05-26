import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Phone, Mail } from "lucide-react";
import { BarberShell } from "@/components/barber/barber-shell";
import { supabase } from "@/integrations/supabase/client";
import { useMyBarber } from "@/lib/use-my-barber";
import { formatBRL } from "@/lib/format";

export const Route = createFileRoute("/barber/clients")({
  head: () => ({ meta: [{ title: "Clientes — Barbearia Imperial" }] }),
  component: () => (
    <BarberShell title="Clientes">
      <ClientsContent />
    </BarberShell>
  ),
});

type Row = {
  client_id: string | null;
  scheduled_at: string;
  status: string;
  price_charged: number | null;
  notes: string | null;
  profiles: { full_name: string; phone: string | null; email: string } | null;
};

function parseGuest(notes: string | null): { name: string | null; phone: string | null; email: string | null } {
  if (!notes) return { name: null, phone: null, email: null };
  const name = notes.match(/cliente:([^|]+)/)?.[1]?.trim() ?? null;
  const phone = notes.match(/tel:([^|]+)/)?.[1]?.trim() ?? null;
  const email = notes.match(/email:([^|]+)/)?.[1]?.trim() ?? null;
  return { name, phone, email };
}

function ClientsContent() {
  const { data: myBarber } = useMyBarber();
  const barberId = myBarber?.id;
  const [q, setQ] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["barber-clients", barberId ?? "all"],
    queryFn: async () => {
      let req = supabase
        .from("appointments")
        .select("client_id, scheduled_at, status, price_charged, notes, profiles!appointments_client_id_fkey(full_name, phone, email)")
        .order("scheduled_at", { ascending: false });
      if (barberId) req = req.eq("barber_id", barberId);
      const { data, error } = await req;
      if (error) throw error;
      return data as unknown as Row[];
    },
  });

  const clients = useMemo(() => {
    const map = new Map<string, { id: string; full_name: string; phone: string | null; email: string; visits: number; spent: number; lastAt: string | null; guest: boolean }>();
    for (const a of data ?? []) {
      let key: string;
      let full_name: string;
      let phone: string | null;
      let email: string;
      let guest = false;
      if (a.client_id && a.profiles) {
        key = a.client_id;
        full_name = a.profiles.full_name;
        phone = a.profiles.phone;
        email = a.profiles.email;
      } else {
        const g = parseGuest(a.notes);
        if (!g.name && !g.phone) continue;
        key = `guest:${(g.phone ?? g.name ?? "").toLowerCase()}`;
        full_name = g.name ?? "Cliente";
        phone = g.phone;
        email = g.email || "";
        guest = true;
      }
      const ex = map.get(key) ?? { id: key, full_name, phone, email, visits: 0, spent: 0, lastAt: null, guest };
      ex.visits += 1;
      if (a.status === "completed") ex.spent += Number(a.price_charged ?? 0);
      if (!ex.lastAt || a.scheduled_at > ex.lastAt) ex.lastAt = a.scheduled_at;
      map.set(key, ex);
    }
    const arr = Array.from(map.values()).sort((a, b) => (b.lastAt ?? "").localeCompare(a.lastAt ?? ""));
    const needle = q.trim().toLowerCase();
    return needle ? arr.filter((c) => c.full_name.toLowerCase().includes(needle) || c.email.toLowerCase().includes(needle) || (c.phone ?? "").includes(needle)) : arr;
  }, [data, q]);

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por nome, telefone ou email"
          className="h-11 w-full rounded-lg border border-border bg-card pl-10 pr-3 text-sm text-foreground outline-none focus:border-ring"
        />
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-20 animate-pulse rounded-lg border border-border bg-card" />)}
        </div>
      ) : clients.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border bg-card/50 p-8 text-center text-sm text-muted-foreground">Nenhum cliente ainda.</p>
      ) : (
        <ul className="grid gap-2">
          {clients.map((c) => (
            <li key={c.id} className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  <p className="truncate font-semibold text-foreground">{c.full_name}</p>
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <Mail className="h-3 w-3" />{c.email || "—"}
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <Phone className="h-3 w-3" />{c.phone || "Sem telefone"}
                  </span>
                </div>
                <div className="text-right text-xs text-muted-foreground shrink-0">
                  <p><strong className="text-foreground">{c.visits}</strong> visitas</p>
                  <p>{formatBRL(Math.round(c.spent * 100))}</p>
                  {c.lastAt && <p>último: {new Date(c.lastAt).toLocaleDateString("pt-BR")}</p>}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
