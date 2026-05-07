import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";

import { useClientAuth, maskPhone } from "@/lib/client-auth-context";
import heroImg from "@/assets/hero-barbershop.jpg";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Entrar — Barbearia Imperial" }] }),
  component: LoginPage,
});

function LoginPage() {
  const auth = useClientAuth();
  const navigate = useNavigate();
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (auth.isAuthenticated) navigate({ to: "/" });
  }, [auth.isAuthenticated, navigate]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    const ok = await auth.login(phone);
    if (!ok) {
      setError("Número não encontrado. Crie sua conta!");
      return;
    }
    navigate({ to: "/" });
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
            <span className="text-2xl font-bold text-foreground" style={{ fontFamily: "Merriweather, serif" }}>Barbearia Imperial</span>
          </div>
          <h1 className="mt-4 text-3xl text-foreground" style={{ fontFamily: "Merriweather, serif" }}>Entrar</h1>
          <p className="mt-1 text-sm text-muted-foreground">Use seu telefone cadastrado</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-3">
          <label className="block">
            <span className="mb-1 block text-xs font-medium uppercase tracking-wider text-muted-foreground">Telefone</span>
            <input
              value={phone}
              onChange={(e) => setPhone(maskPhone(e.target.value))}
              placeholder="(11) 99999-9999"
              inputMode="tel"
              className="h-[52px] w-full rounded-[var(--radius)] border border-border bg-input px-4 text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
            />
          </label>
          {error && (
            <p className="text-sm text-destructive">
              {error}{" "}
              <Link to="/cadastro" className="font-semibold text-primary hover:underline">Cadastrar</Link>
            </p>
          )}
          <button
            type="submit"
            className="h-[52px] w-full rounded-[var(--radius)] bg-primary font-bold text-primary-foreground transition hover:opacity-90"
            style={{ fontFamily: "'Montserrat', sans-serif" }}
          >
            Entrar
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-muted-foreground">
          Não tem conta?{" "}
          <Link to="/cadastro" className="font-semibold text-primary hover:underline">Cadastre-se</Link>
        </p>
      </div>
    </div>
  );
}