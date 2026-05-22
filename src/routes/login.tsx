import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";

import heroImg from "@/assets/hero-barbershop.jpg";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Entrar — Barbearia Imperial" }] }),
  component: LoginPage,
});

function formatPhone(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : "";
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

function LoginPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    const digits = phone.replace(/\D/g, "");
    if (trimmed.length < 2) return toast.error("Informe seu nome.");
    if (digits.length < 10) return toast.error("Informe um WhatsApp válido.");
    setSubmitting(true);
    try {
      localStorage.setItem(
        "imperial.client",
        JSON.stringify({ clientName: trimmed, clientPhone: phone }),
      );
      window.dispatchEvent(new Event("storage"));
      window.dispatchEvent(new Event("imperial:client-change"));
      toast.success(`Bem-vindo, ${trimmed.split(" ")[0]}!`);
      navigate({ to: "/agendar" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <img src={heroImg} alt="" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.75)" }} />
      <div
        className="relative w-full max-w-[400px] rounded-3xl border border-border p-8 shadow-2xl"
        style={{ background: "color-mix(in oklab, var(--card) 80%, transparent)", backdropFilter: "blur(24px)" }}
      >
        <div className="mb-6 text-center">
          <div className="flex items-center justify-center gap-2">
            <img src="/favicon.png" alt="Barbearia Imperial" className="h-12 w-12 rounded-full object-cover" />
            <span className="text-2xl font-bold text-foreground font-serif">Barbearia Imperial</span>
          </div>
          <h1 className="mt-4 text-3xl text-foreground font-serif">Entrar</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Informe seu nome e WhatsApp para agendar
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-3">
          <Field
            label="Nome"
            value={name}
            onChange={setName}
            placeholder="Seu nome completo"
            autoComplete="name"
          />
          <Field
            label="WhatsApp"
            value={phone}
            onChange={(v) => setPhone(formatPhone(v))}
            placeholder="(11) 99999-0000"
            type="tel"
            autoComplete="tel"
            inputMode="tel"
          />
          <button
            type="submit"
            disabled={submitting}
            className="h-[52px] w-full rounded-[var(--radius)] bg-primary font-bold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
            style={{ fontFamily: "'Montserrat', sans-serif" }}
          >
            {submitting ? "Aguarde..." : "Entrar"}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Não tem conta?{" "}
          <Link to="/cadastro" className="font-semibold text-primary hover:underline">
            Criar conta
          </Link>
        </p>
      </div>
    </div>
  );
}

function Field({
  label, value, onChange, placeholder, type = "text", autoComplete, inputMode,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  autoComplete?: string;
  inputMode?: "tel" | "text" | "email" | "numeric";
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        inputMode={inputMode}
        required
        className="h-[52px] w-full rounded-[var(--radius)] border border-border bg-input px-4 text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
      />
    </label>
  );
}
