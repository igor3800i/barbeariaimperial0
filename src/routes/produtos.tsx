import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatBRL } from "@/lib/format";
import { Package } from "lucide-react";

export const Route = createFileRoute("/produtos")({
  head: () => ({
    meta: [
      { title: "Produtos — Navalha & Cia" },
      { name: "description", content: "Pomadas, óleos, shampoos e cosméticos masculinos." },
    ],
  }),
  component: ProdutosPage,
});

function ProdutosPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
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
        <h1 className="text-4xl text-foreground md:text-5xl">Produtos</h1>
        <p className="mt-2 text-muted-foreground">Cosméticos masculinos selecionados pelos nossos barbeiros.</p>
      </header>
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-40 animate-pulse rounded-lg border border-border bg-card" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data?.map((p) => (
            <article key={p.id} className="rounded-lg border border-border bg-card p-6 transition hover:border-primary/60">
              <div className="flex items-center gap-2 text-primary">
                <Package className="h-4 w-4" />
                <h2 className="font-display text-lg text-foreground">{p.name}</h2>
              </div>
              {p.description && <p className="mt-2 text-sm text-muted-foreground">{p.description}</p>}
              <p className="mt-4 font-display text-xl text-primary">{formatBRL(p.price_cents)}</p>
              <p className="mt-1 text-xs text-muted-foreground">Disponível na loja</p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
