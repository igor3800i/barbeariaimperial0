import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { BarberShell } from "@/components/barber/barber-shell";
import { useBarberStore } from "@/lib/barber-store";
import { formatBRL } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { MockProduct } from "@/lib/mock-data";

export const Route = createFileRoute("/barber/products")({
  head: () => ({ meta: [{ title: "Produtos — Barbearia Imperial" }] }),
  component: ProductsPage,
});

const CATEGORIES: MockProduct["category"][] = ["Pomada", "Shampoo", "Óleo", "Acessório", "Outro"];

function ProductsPage() {
  const { products, setProducts } = useBarberStore();
  const [filter, setFilter] = useState<"Todas" | MockProduct["category"]>("Todas");
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<MockProduct | null>(null);
  const [open, setOpen] = useState(false);

  const filtered = useMemo(() => products
    .filter((p) => filter === "Todas" || p.category === filter)
    .filter((p) => q.trim() === "" ? true : p.name.toLowerCase().includes(q.toLowerCase())),
    [products, filter, q]);

  const remove = (id: number) => {
    if (!confirm("Remover este produto?")) return;
    setProducts(products.filter((p) => p.id !== id));
  };

  const save = (p: MockProduct) => {
    if (products.some((x) => x.id === p.id)) {
      setProducts(products.map((x) => x.id === p.id ? p : x));
    } else {
      setProducts([...products, { ...p, id: Math.max(0, ...products.map((x) => x.id)) + 1 }]);
    }
    setOpen(false);
    setEditing(null);
  };

  return (
    <BarberShell title="Produtos">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar produto..."
            className="h-10 w-full rounded-lg border border-border bg-input pl-9 pr-3 text-sm text-foreground outline-none focus:border-ring"
          />
        </div>
        <button
          onClick={() => { setEditing(null); setOpen(true); }}
          className="flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> Adicionar Produto
        </button>
      </div>

      <div className="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
        {(["Todas", ...CATEGORIES] as const).map((c) => (
          <button
            key={c}
            onClick={() => setFilter(c as any)}
            className={cn(
              "shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition",
              filter === c ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground",
            )}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((p) => (
          <div key={p.id} className="flex gap-3 rounded-xl border border-border bg-card p-3">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted">
              {p.image ? (
                <img src={p.image} alt={p.name} className="h-full w-full object-cover" />
              ) : (
                <span className="text-xs text-muted-foreground">{p.category}</span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-foreground">{p.name}</p>
              <p className="text-xs text-muted-foreground">{p.category}</p>
              <div className="mt-1 flex items-baseline justify-between gap-2">
                <span className="font-bold text-primary">{formatBRL(p.price * 100)}</span>
                <span className="text-xs text-muted-foreground">Estoque: {p.stock}</span>
              </div>
              <div className="mt-2 flex gap-1.5">
                <button onClick={() => { setEditing(p); setOpen(true); }} className="flex-1 rounded-md border border-border px-2 py-1 text-xs hover:bg-muted">
                  <Pencil className="mx-auto h-3.5 w-3.5" />
                </button>
                <button onClick={() => remove(p.id)} className="flex-1 rounded-md border border-border px-2 py-1 text-xs text-destructive hover:bg-destructive/10">
                  <Trash2 className="mx-auto h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {open && <ProductModal initial={editing} onClose={() => { setOpen(false); setEditing(null); }} onSave={save} />}
    </BarberShell>
  );
}

function ProductModal({ initial, onClose, onSave }: { initial: MockProduct | null; onClose: () => void; onSave: (p: MockProduct) => void }) {
  const [form, setForm] = useState<MockProduct>(initial ?? { id: 0, name: "", category: "Pomada", description: "", price: 0, stock: 0 });
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center">
      <div className="w-full max-w-lg rounded-t-2xl border border-border bg-card p-5 sm:rounded-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">{initial ? "Editar produto" : "Novo produto"}</h2>
          <button onClick={onClose} className="rounded p-1 text-muted-foreground"><X className="h-5 w-5" /></button>
        </div>
        <div className="space-y-3">
          <Field label="Nome">
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="modal-input" />
          </Field>
          <Field label="Categoria">
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as any })} className="modal-input">
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Descrição">
            <textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="modal-input" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Preço (R$)">
              <input type="number" min={0} step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} className="modal-input" />
            </Field>
            <Field label="Estoque">
              <input type="number" min={0} value={form.stock} onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })} className="modal-input" />
            </Field>
          </div>
          <Field label="URL da imagem (opcional)">
            <input value={form.image ?? ""} onChange={(e) => setForm({ ...form, image: e.target.value })} className="modal-input" />
          </Field>
        </div>
        <div className="mt-5 flex gap-2">
          <button onClick={onClose} className="flex-1 rounded-lg bg-muted px-4 py-2.5 text-sm font-semibold text-muted-foreground">Cancelar</button>
          <button
            disabled={!form.name.trim()}
            onClick={() => onSave(form)}
            className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
          >
            Salvar
          </button>
        </div>
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