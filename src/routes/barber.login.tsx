import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/barber/login")({
  head: () => ({ meta: [{ title: "Acesso — Barbearia Imperial" }] }),
  component: BarberLogin,
});

function BarberLogin() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (auth.isAuthenticated) navigate({ to: "/barber/dashboard" });
  }, [auth.isAuthenticated, navigate]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    const { error } = await auth.signIn({ email, password });
    setSubmitting(false);
    if (error) return setError(error);
    navigate({ to: "/barber/dashboard" });
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12 bg-background">
      <div className="w-full max-w-[380px] rounded-3xl border border-border bg-card p-8 shadow-2xl">
        <div className="mb-6 text-center">
          <img src="/favicon.png" alt="" className="mx-auto h-14 w-14 rounded-full object-cover" />
          <h1 className="mt-3 font-serif text-2xl text-foreground">Acesso Barbeiro</h1>
          <p className="mt-1 text-sm text-muted-foreground">Use sua conta da Barbearia Imperial</p>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <input
            type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="h-11 w-full rounded-lg border border-border bg-input px-3 text-foreground outline-none focus:border-ring"
          />
          <input
            type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
            placeholder="Senha"
            className="h-11 w-full rounded-lg border border-border bg-input px-3 text-foreground outline-none focus:border-ring"
          />
          <button type="submit" disabled={submitting} className="h-[52px] w-full rounded-lg bg-primary font-bold text-primary-foreground hover:opacity-90 disabled:opacity-60">
            {submitting ? "Entrando..." : "Entrar"}
          </button>
          {error && <p className="text-center text-sm text-destructive">{error}</p>}
          <p className="pt-2 text-center text-xs text-muted-foreground">
            Não tem conta? <Link to="/cadastro" className="text-primary hover:underline">Cadastre-se</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
