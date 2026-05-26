import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";

// Username "imperial2026" maps to the internal email used in Supabase Auth.
const USERNAME_TO_EMAIL: Record<string, string> = {
  imperial2026: "imperial2026@barberimperial.internal",
};

export const Route = createFileRoute("/barber/login")({
  head: () => ({ meta: [{ title: "Acesso — Barbearia Imperial" }] }),
  component: BarberLogin,
});

function BarberLogin() {
  const navigate = useNavigate();
  const { isAuthenticated, loading } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && isAuthenticated && typeof window !== "undefined" && localStorage.getItem("barberAuthenticated") === "true") {
      navigate({ to: "/barber/dashboard" });
    }
  }, [loading, isAuthenticated, navigate]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    const raw = username.trim().toLowerCase();
    const email = raw.includes("@") ? raw : USERNAME_TO_EMAIL[raw] ?? `${raw}@barberimperial.internal`;
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) {
      setSubmitting(false);
      setError("Usuário ou senha inválidos.");
      return;
    }
    localStorage.setItem("barberAuthenticated", "true");
    // Resolve the barber row linked to this auth user
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: barber } = await supabase
        .from("barbers")
        .select("id")
        .eq("profile_id", user.id)
        .maybeSingle();
      if (barber?.id) localStorage.setItem("barberId", barber.id);
    }
    navigate({ to: "/barber/dashboard" });
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
