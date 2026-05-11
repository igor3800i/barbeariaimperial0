import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Users, Search, Download, Eye, Trash2, X, Copy, MessageCircle,
  ChevronLeft, ChevronRight, Save,
} from "lucide-react";
import { BarberShell } from "@/components/barber/barber-shell";
import { supabase } from "@/integrations/supabase/client";
import { useAppointments } from "@/lib/use-appointments";
import { formatBRL } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/barber/clients")({
  head: () => ({ meta: [{ title: "Clientes — Barbearia Imperial" }] }),
  component: ClientsPage,
});

type DbClient = {
  id: string;
  name: string;
  surname: string;
  phone: string;
  email: string | null;
  notes: string | null;
  created_at: string;
};

type ClientStatus = "active" | "regular" | "inactive";

type ClientRow = DbClient & {
  fullName: string;
  totalAppointments: number;
  lastVisit: string | null;
  totalSpent: number;
  avgTicket: number;
  favoriteService: string | null;
  status: ClientStatus;
};

const PAGE_SIZE = 10;

function useClients() {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ["clients"],
    queryFn: async (): Promise<DbClient[]> => {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as DbClient[];
    },
    refetchInterval: 60_000,
  });

  useEffect(() => {
    const channel = supabase
      .channel("clients-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "clients" },
        () => qc.invalidateQueries({ queryKey: ["clients"] }))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [qc]);

  return query;
}

const monthsLong = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

function maskPhone(p: string) {
  const d = p.replace(/\D/g, "");
  if (d.length < 10) return p;
  const ddd = d.slice(0, 2);
  const last = d.slice(-4);
  return `(${ddd}) 9****-${last}`;
}
function formatDateBR(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR");
}
function daysSince(iso: string | null) {
  if (!iso) return null;
  const ms = Date.now() - new Date(iso).getTime();
  return Math.floor(ms / 86400000);
}
function initials(name: string, surname: string) {
  return ((name[0] ?? "") + (surname[0] ?? "")).toUpperCase();
}
function statusFromLastVisit(lastVisit: string | null): ClientStatus {
  if (!lastVisit) return "inactive";
  const d = daysSince(lastVisit) ?? 999;
  if (d <= 30) return "active";
  if (d <= 90) return "regular";
  return "inactive";
}
const statusLabel: Record<ClientStatus, string> = {
  active: "Ativo",
  regular: "Regular",
  inactive: "Inativo",
};
const statusDotClass: Record<ClientStatus, string> = {
  active: "bg-emerald-500",
  regular: "bg-amber-400",
  inactive: "bg-red-500",
};

function ClientsPage() {
  const { data: clients = [] } = useClients();
  const { data: appts = [] } = useAppointments();

  const rows: ClientRow[] = useMemo(() => {
    return clients.map((c) => {
      const phoneDigits = c.phone.replace(/\D/g, "");
      const own = appts.filter((a) => a.client_phone.replace(/\D/g, "") === phoneDigits);
      const billable = own.filter((a) => a.status === "completed" || a.status === "confirmed");
      const totalSpent = billable.reduce((s, a) => s + Number(a.service_value), 0);
      const avgTicket = billable.length ? totalSpent / billable.length : 0;
      const lastVisit = own
        .map((a) => a.date)
        .sort()
        .at(-1) ?? null;
      const counts: Record<string, number> = {};
      own.forEach((a) => { counts[a.service] = (counts[a.service] ?? 0) + 1; });
      const favoriteService = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
      return {
        ...c,
        fullName: `${c.name} ${c.surname}`.trim(),
        totalAppointments: own.length,
        lastVisit,
        totalSpent,
        avgTicket,
        favoriteService,
        status: statusFromLastVisit(lastVisit),
      };
    });
  }, [clients, appts]);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "new" | "frequent" | "inactive">("all");
  const [sort, setSort] = useState<"recent" | "oldest" | "az" | "appts">("recent");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<ClientRow | null>(null);

  useEffect(() => { setPage(1); }, [search, filter, sort]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let out = rows.filter((r) => {
      if (!q) return true;
      return (
        r.fullName.toLowerCase().includes(q) ||
        r.phone.toLowerCase().includes(q) ||
        (r.email ?? "").toLowerCase().includes(q)
      );
    });
    if (filter === "new") {
      const cutoff = Date.now() - 30 * 86400000;
      out = out.filter((r) => new Date(r.created_at).getTime() >= cutoff);
    } else if (filter === "frequent") {
      out = out.filter((r) => r.totalAppointments >= 5);
    } else if (filter === "inactive") {
      out = out.filter((r) => r.status === "inactive");
    }
    out = [...out].sort((a, b) => {
      if (sort === "recent") return +new Date(b.created_at) - +new Date(a.created_at);
      if (sort === "oldest") return +new Date(a.created_at) - +new Date(b.created_at);
      if (sort === "az") return a.fullName.localeCompare(b.fullName);
      return b.totalAppointments - a.totalAppointments;
    });
    return out;
  }, [rows, search, filter, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Stats
  const stats = useMemo(() => {
    const cutoff = Date.now() - 30 * 86400000;
    return {
      total: rows.length,
      newCount: rows.filter((r) => new Date(r.created_at).getTime() >= cutoff).length,
      frequent: rows.filter((r) => r.totalAppointments >= 5).length,
      inactive: rows.filter((r) => r.status === "inactive").length,
    };
  }, [rows]);

  const exportCSV = () => {
    const headers = ["Nome","Telefone","Email","Cadastro","Total Agendamentos","Última Visita","Gasto Total","Status"];
    const lines = [headers.join(",")];
    filtered.forEach((r) => {
      const row = [
        r.fullName,
        r.phone,
        r.email ?? "",
        formatDateBR(r.created_at),
        String(r.totalAppointments),
        formatDateBR(r.lastVisit),
        (r.totalSpent).toFixed(2).replace(".", ","),
        statusLabel[r.status],
      ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",");
      lines.push(row);
    });
    const blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "clientes-barbearia-imperial.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <BarberShell title="Clientes">
      <div className="mb-2">
        <p className="text-sm text-muted-foreground">Todos os clientes cadastrados na plataforma</p>
      </div>

      {/* Stats */}
      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Total Clientes" value={String(stats.total)} />
        <StatCard label="Novos (30 dias)" value={`+${stats.newCount}`} />
        <StatCard label="Mais Frequentes" value={String(stats.frequent)} />
        <StatCard label="Inativos" value={String(stats.inactive)} />
      </div>

      {/* Filters */}
      <div className="mt-6 flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card p-3">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome, telefone ou e-mail..."
            className="h-10 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
          />
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as any)}
          className="h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground"
        >
          <option value="all">Todos</option>
          <option value="new">Novos</option>
          <option value="frequent">Frequentes</option>
          <option value="inactive">Inativos</option>
        </select>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as any)}
          className="h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground"
        >
          <option value="recent">Mais recentes</option>
          <option value="oldest">Mais antigos</option>
          <option value="az">A-Z</option>
          <option value="appts">Mais agendamentos</option>
        </select>
        <button
          onClick={exportCSV}
          className="flex h-10 items-center gap-2 rounded-lg border border-border bg-background px-3 text-sm font-semibold text-foreground hover:bg-accent"
        >
          <Download className="h-4 w-4" /> Exportar CSV
        </button>
      </div>

      {/* Table */}
      <div className="mt-4 overflow-hidden rounded-xl border border-border bg-card">
        {pageRows.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
            <Users className="h-12 w-12 text-muted-foreground/50" />
            <p className="text-base font-semibold text-foreground">Nenhum cliente encontrado</p>
            <p className="text-sm text-muted-foreground">Tente ajustar os filtros</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                    <th className="px-4 py-3 font-semibold">#</th>
                    <th className="px-4 py-3 font-semibold">Cliente</th>
                    <th className="px-4 py-3 font-semibold">Contato</th>
                    <th className="px-4 py-3 font-semibold">Cadastro</th>
                    <th className="px-4 py-3 font-semibold">Agendamentos</th>
                    <th className="px-4 py-3 font-semibold">Últ. visita</th>
                    <th className="px-4 py-3 text-right font-semibold">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((r, idx) => {
                    const since = daysSince(r.lastVisit);
                    return (
                      <tr
                        key={r.id}
                        onClick={() => setSelected(r)}
                        className="cursor-pointer border-b border-border/60 transition hover:bg-accent/40"
                      >
                        <td className="px-4 py-3 text-xs text-muted-foreground">
                          {String((page - 1) * PAGE_SIZE + idx + 1).padStart(2, "0")}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <span className={cn("h-2.5 w-2.5 rounded-full", statusDotClass[r.status])} />
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
                              {initials(r.name, r.surname)}
                            </div>
                            <div className="min-w-0">
                              <div className="font-semibold text-foreground">{r.fullName}</div>
                              <div className="text-xs text-muted-foreground">
                                Cliente desde {monthsLong[new Date(r.created_at).getMonth()]}/{new Date(r.created_at).getFullYear()}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="text-foreground">{maskPhone(r.phone)}</span>
                            <a
                              href={`https://wa.me/55${r.phone.replace(/\D/g, "")}`}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="rounded p-1 text-emerald-400 hover:bg-accent"
                              aria-label="WhatsApp"
                            >
                              <MessageCircle className="h-4 w-4" />
                            </a>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-foreground">{formatDateBR(r.created_at)}</td>
                        <td className="px-4 py-3">
                          <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs font-bold text-primary">
                            {r.totalAppointments}x
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-foreground">{formatDateBR(r.lastVisit)}</div>
                          {since !== null && (
                            <div className="text-xs text-muted-foreground">há {since} dias</div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={(e) => { e.stopPropagation(); setSelected(r); }}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
                            aria-label="Ver"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); deleteClient(r.id); }}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-destructive"
                            aria-label="Excluir"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between gap-2 border-t border-border px-4 py-3 text-sm text-muted-foreground">
              <span>{filtered.length} cliente(s)</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="flex h-8 items-center gap-1 rounded-md border border-border px-2 disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" /> Anterior
                </button>
                <span>Página {page} de {totalPages}</span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="flex h-8 items-center gap-1 rounded-md border border-border px-2 disabled:opacity-40"
                >
                  Próxima <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {selected && (
        <ClientDetailPanel
          client={selected}
          appointments={appts.filter(
            (a) => a.client_phone.replace(/\D/g, "") === selected.phone.replace(/\D/g, "")
          )}
          onClose={() => setSelected(null)}
        />
      )}
    </BarberShell>
  );
}

async function deleteClient(_id: string) {
  // delete não habilitado nas RLS atuais — manter como ação visual
  alert("Exclusão de cliente desabilitada nesta versão.");
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-2 text-2xl font-bold text-foreground lg:text-3xl" style={{ fontFamily: "'Montserrat', sans-serif" }}>
        {value}
      </div>
    </div>
  );
}

function ClientDetailPanel({
  client, appointments, onClose,
}: {
  client: ClientRow;
  appointments: Array<{ date: string; time: string; service: string; service_value: number; status: string }>;
  onClose: () => void;
}) {
  const [note, setNote] = useState(client.notes ?? "");
  const [saving, setSaving] = useState(false);

  const saveNote = async () => {
    setSaving(true);
    await supabase.from("clients").update({ notes: note } as any).eq("id", client.id);
    setSaving(false);
  };

  const copy = (text: string) => navigator.clipboard?.writeText(text);

  const created = new Date(client.created_at);
  const sortedAppts = [...appointments].sort((a, b) => (a.date + a.time < b.date + b.time ? 1 : -1));

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <aside className="absolute inset-y-0 right-0 flex w-full max-w-[420px] flex-col overflow-y-auto border-l border-border bg-card">
        <div className="flex items-center justify-between border-b border-border p-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Detalhes do cliente</span>
          <button onClick={onClose} className="rounded p-1 text-muted-foreground hover:text-foreground" aria-label="Fechar">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-col items-center gap-2 border-b border-border p-6 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/20 text-xl font-bold text-primary">
            {initials(client.name, client.surname)}
          </div>
          <h2 className="text-xl font-bold text-foreground" style={{ fontFamily: "'Montserrat', sans-serif" }}>
            {client.fullName}
          </h2>
          <div className="flex items-center gap-2">
            <span className={cn("h-2.5 w-2.5 rounded-full", statusDotClass[client.status])} />
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {statusLabel[client.status]}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Cliente desde {monthsLong[created.getMonth()]} de {created.getFullYear()}
          </p>
          <div className="mt-2 flex gap-2">
            <a
              href={`https://wa.me/55${client.phone.replace(/\D/g, "")}`}
              target="_blank"
              rel="noreferrer"
              className="flex h-9 items-center gap-2 rounded-lg border border-border bg-background px-3 text-sm font-semibold text-foreground hover:bg-accent"
            >
              <MessageCircle className="h-4 w-4" /> Mensagem
            </a>
          </div>
        </div>

        <Section label="Dados do cliente">
          <Row label="Nome" value={client.fullName} />
          <Row label="Telefone" value={client.phone} onCopy={() => copy(client.phone)} />
          <Row label="E-mail" value={client.email ?? "—"} onCopy={client.email ? () => copy(client.email!) : undefined} />
          <Row label="Cadastrado em" value={created.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })} />
        </Section>

        <Section label="Histórico">
          <Row label="Total de visitas" value={`${client.totalAppointments} agendamentos`} />
          <Row label="Serviço favorito" value={client.favoriteService ?? "—"} />
          <Row label="Ticket médio" value={formatBRL(client.avgTicket * 100)} />
          <Row label="Gasto total" value={formatBRL(client.totalSpent * 100)} />
          <Row label="Última visita" value={formatDateBR(client.lastVisit)} />
        </Section>

        <Section label="Agendamentos">
          {sortedAppts.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum agendamento ainda.</p>
          ) : (
            <ul className="space-y-2">
              {sortedAppts.slice(0, 10).map((a, i) => (
                <li key={i} className="flex items-center justify-between gap-2 rounded-lg border border-border bg-background p-2 text-sm">
                  <span className="text-foreground">{formatDateBR(a.date)}</span>
                  <span className="flex-1 truncate text-muted-foreground">{a.service}</span>
                  <span className="font-semibold text-foreground">{formatBRL(Number(a.service_value) * 100)}</span>
                  <StatusBadge status={a.status} />
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section label="Observações do barbeiro">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Adicione notas sobre este cliente..."
            rows={4}
            className="w-full resize-none rounded-lg border border-border bg-background p-3 text-sm text-foreground focus:border-primary focus:outline-none"
          />
          <button
            onClick={saveNote}
            disabled={saving}
            className="mt-2 flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-bold text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
          >
            <Save className="h-4 w-4" /> {saving ? "Salvando..." : "Salvar nota"}
          </button>
        </Section>
      </aside>
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-border p-4">
      <div className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Row({ label, value, onCopy }: { label: string; value: string; onCopy?: () => void }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="flex items-center gap-2 text-foreground">
        <span className="truncate">{value}</span>
        {onCopy && (
          <button onClick={onCopy} className="rounded p-1 text-muted-foreground hover:text-foreground" aria-label="Copiar">
            <Copy className="h-3.5 w-3.5" />
          </button>
        )}
      </span>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    completed: { label: "Concluído", cls: "bg-emerald-500/20 text-emerald-400" },
    confirmed: { label: "Confirmado", cls: "bg-primary/20 text-primary" },
    pending:   { label: "Pendente", cls: "bg-amber-400/20 text-amber-400" },
    cancelled: { label: "Cancelado", cls: "bg-red-500/20 text-red-400" },
  };
  const s = map[status] ?? { label: status, cls: "bg-muted text-muted-foreground" };
  return <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold uppercase", s.cls)}>{s.label}</span>;
}
