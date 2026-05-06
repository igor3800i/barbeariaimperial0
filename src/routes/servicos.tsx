import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatBRL } from "@/lib/format";
import { Clock, Scissors } from "lucide-react";

export const Route = createFileRoute("/servicos")({
  head: () => ({
    meta: [
      { title: "Serviços e Preços — Navalha & Cia" },
      { name: "description", content: "Corte, barba, combo e mais. Veja os preços e agende online." },
    ],
  }),
  component: ServicosPage,
});

function ServicosPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["services"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .eq("active", true)
        .order("price_cents");
      if (error) throw error;
      return data;
    },
  });

  return (
    <section className="mx-auto max-w-5xl px-4 py-16">
      <header className="mb-10 text-center">
        <h1 className="text-4xl text-foreground md:text-5xl">Serviços</h1>
        <p className="mt-2 text-muted-foreground">Preços transparentes. Sem surpresas.</p>
      </header>
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-lg border border-border bg-card" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {data?.map((s) => (
            <article key={s.id} className="group rounded-lg border border-border bg-card p-6 transition hover:border-primary/60">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-primary">
                    <Scissors className="h-4 w-4" />
                    <h2 className="font-display text-xl text-foreground">{s.name}</h2>
                  </div>
                  {s.description && <p className="mt-2 text-sm text-muted-foreground">{s.description}</p>}
                  <p className="mt-3 inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" /> {s.duration_min} min
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-display text-2xl text-primary">{formatBRL(s.price_cents)}</p>
                </div>
              </div>
              <Link
                to="/agendar"
                search={{ service: s.id }}
                className="mt-5 inline-flex w-full items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
              >
                Agendar este serviço
              </Link>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
