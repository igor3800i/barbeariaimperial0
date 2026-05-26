import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";

const BARBER_USER = "imperial2026";
const BARBER_PASS = "102030";

export const Route = createFileRoute("/barber/login")({
  head: () => ({ meta: [{ title: "Acesso — Barbearia Imperial" }] }),
  component: BarberLogin,
});

function BarberLogin() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem("barberAuthenticated") === "true") {
      navigate({ to: "/barber/dashboard" });
    }
  }, [navigate]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    if (username.trim() === BARBER_USER && password === BARBER_PASS) {
      localStorage.setItem("barberAuthenticated", "true");
      localStorage.setItem("barberId", "410042ea-a1e6-452e-9b27-dfbc5e88694a");
      navigate({ to: "/barber/dashboard" });
      return;
    }
    setSubmitting(false);
    setError("Usuário ou senha inválidos.");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-[380px] rounded-3xl border border-border bg-card p-8 shadow-2xl">
        <div className="mb-6 text-center">
          <img src="/favicon.png" alt="" className="mx-auto h-14 w-14 rounded-full object-cover" />
          <h1 className="mt-3 font-serif text-2xl text-foreground">Acesso Barbeiro</h1>
          <p className="mt-1 text-sm text-muted-foreground">Acesso restrito ao barbeiro</p>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <input
            type="text"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Usuário"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            className="h-11 w-full rounded-lg border border-border bg-input px-3 text-foreground outline-none focus:border-ring"
          />
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Senha"
            className="h-11 w-full rounded-lg border border-border bg-input px-3 text-foreground outline-none focus:border-ring"
          />
          <button
            type="submit"
            disabled={submitting}
            className="h-[52px] w-full rounded-lg bg-primary font-bold text-primary-foreground hover:opacity-90 disabled:opacity-60"
          >
            {submitting ? "Entrando..." : "Entrar"}
          </button>
          {error && <p className="text-center text-sm text-destructive">{error}</p>}
        </form>
      </div>
    </div>
  );
}
