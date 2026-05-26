import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import heroImg from "@/assets/hero-barbershop.jpg";

export const Route = createFileRoute("/cadastro")({
  head: () => ({ meta: [{ title: "Cadastro — Barbearia Imperial" }] }),
  component: CadastroPage,
});

function maskPhone(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits.length ? `(${digits}` : "";
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function CadastroPage() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (fullName.trim().length < 2) return toast.error("Informe seu nome completo.");
    setSubmitting(true);
    const { error } = await supabase.from("profiles").insert({
      id: crypto.randomUUID(),
      full_name: fullName.trim(),
      email: email || "",
      phone: phone || null,
      role: "client",
    });
    setSubmitting(false);
    if (error) return toast.error(error.message);
    localStorage.setItem(
      "imperial.client",
      JSON.stringify({ clientName: fullName.trim(), clientPhone: phone, clientEmail: email }),
    );
    window.dispatchEvent(new Event("storage"));
    window.dispatchEvent(new Event("imperial:client-change"));
    toast.success(`Conta criada! Bem-vindo, ${fullName.trim().split(" ")[0]}!`);
    navigate({ to: "/agendar" });
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
          <h1 className="mt-4 text-3xl text-foreground font-serif">Criar conta</h1>
          <p className="mt-1 text-sm text-muted-foreground">É rápido e gratuito</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-3">
          <Field label="Nome completo" value={fullName} onChange={setFullName} placeholder="Seu nome" />
          <Field label="Email" value={email} onChange={setEmail} type="email" placeholder="voce@email.com" />
          <Field label="Telefone (opcional)" value={phone} onChange={(v) => setPhone(maskPhone(v))} placeholder="(11) 99999-9999" />
          <button
            type="submit"
            disabled={submitting}
            className="h-[52px] w-full rounded-[var(--radius)] bg-primary font-bold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
            style={{ fontFamily: "'Montserrat', sans-serif" }}
          >
            {submitting ? "Criando..." : "Criar conta"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-muted-foreground">
          Já tem conta?{" "}
          <Link to="/login" className="font-semibold text-primary hover:underline">Entrar</Link>
        </p>
      </div>
    </div>
  );
}

function Field({
  label, value, onChange, placeholder, type = "text",
}: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-[52px] w-full rounded-[var(--radius)] border border-border bg-input px-4 text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
      />
    </label>
  );
}
