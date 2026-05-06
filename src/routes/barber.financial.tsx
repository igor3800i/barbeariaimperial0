import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { BarberShell } from "@/components/barber/barber-shell";
import { useBarberStore } from "@/lib/barber-store";
import { formatBRL } from "@/lib/format";

export const Route = createFileRoute("/barber/financial")({
  head: () => ({ meta: [{ title: "Financeiro — Imperial" }] }),
  component: FinancialPage,
});

function FinancialPage() {
  const { appointments } = useBarberStore();
  const billable = (s: string) => s === "confirmed" || s === "completed";

  const byDay = useMemo(() => {
    const map = new Map<string, { count: number; total: number }>();
    appointments.filter((a) => billable(a.status)).forEach((a) => {
      const cur = map.get(a.date) ?? { count: 0, total: 0 };
      cur.count += 1;
      cur.total += a.value;
      map.set(a.date, cur);
    });
    return [...map.entries()].sort((a, b) => b[0].localeCompare(a[0]));
  }, [appointments]);

  const total = byDay.reduce((s, [, v]) => s + v.total, 0);

  return (
    <BarberShell title="Financeiro">
      <div className="mb-6 rounded-xl border border-border bg-card p-5">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Faturamento total</p>
        <p className="mt-2 text-4xl font-bold text-primary" style={{ fontFamily: "'Montserrat', sans-serif" }}>
          {formatBRL(total * 100)}
        </p>
      </div>
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="grid grid-cols-3 border-b border-border bg-muted/40 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <span>Data</span><span className="text-center">Atendimentos</span><span className="text-right">Total</span>
        </div>
        {byDay.map(([date, { count, total }]) => (
          <div key={date} className="grid grid-cols-3 border-b border-border px-4 py-3 text-sm last:border-0">
            <span className="text-foreground">{date}</span>
            <span className="text-center text-muted-foreground">{count}</span>
            <span className="text-right font-semibold text-primary">{formatBRL(total * 100)}</span>
          </div>
        ))}
        {byDay.length === 0 && <p className="p-8 text-center text-sm text-muted-foreground">Sem dados ainda.</p>}
      </div>
    </BarberShell>
  );
}