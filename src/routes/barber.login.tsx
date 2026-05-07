import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/barber/login")({
  head: () => ({ meta: [{ title: "Acesso — Barbearia Imperial" }] }),
  component: BarberLogin,
});

function BarberLogin() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (auth.isAuthenticated) navigate({ to: "/barber/dashboard" });
  }, [auth.isAuthenticated, navigate]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (auth.login(user.trim(), pass)) {
      navigate({ to: "/barber/dashboard" });
    } else {
      setError("Usuário ou senha incorretos.");
    }
  };

  return (
    <div
      className="relative flex min-h-screen items-center justify-center px-4 py-12"
      style={{
        background:
          "radial-gradient(circle at 50% 30%, color-mix(in oklab, var(--primary) 12%, transparent) 0%, transparent 55%), linear-gradient(180deg, var(--background) 0%, oklch(0.10 0.005 250) 100%)",
      }}
    >
      <div
        className="w-full max-w-[380px] rounded-3xl border p-8 shadow-2xl"
        style={{
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          background: "color-mix(in oklab, var(--card) 85%, transparent)",
          borderColor: "var(--border)",
        }}
      >
        <div className="mb-6 text-center">
          <div className="flex items-center justify-center gap-3">
            <img src="/favicon.png" alt="Barbearia Imperial" className="h-14 w-14 rounded-full object-cover" />
            <span
              className="text-2xl font-bold text-foreground"
              style={{ fontFamily: "Merriweather, serif" }}
            >
              Barbearia Imperial
            </span>
          </div>
          <p className="mt-2 text-sm text-muted-foreground" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            Acesso exclusivo para barbeiros
          </p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label htmlFor="user" className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Usuário
            </label>
            <input
              id="user"
              autoComplete="username"
              value={user}
              onChange={(e) => setUser(e.target.value)}
              className="h-11 w-full rounded-lg border border-border bg-input px-3 text-sm text-foreground outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/30"
            />
          </div>

          <div>
            <label htmlFor="pass" className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Senha
            </label>
            <div className="relative">
              <input
                id="pass"
                type={show ? "text" : "password"}
                autoComplete="current-password"
                value={pass}
                onChange={(e) => setPass(e.target.value)}
                className="h-11 w-full rounded-lg border border-border bg-input px-3 pr-10 text-sm text-foreground outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/30"
              />
              <button
                type="button"
                onClick={() => setShow((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
                aria-label={show ? "Ocultar senha" : "Mostrar senha"}
              >
                {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="h-[52px] w-full rounded-lg bg-primary text-sm font-bold uppercase tracking-wider text-primary-foreground transition hover:opacity-90"
            style={{ fontFamily: "'Montserrat', sans-serif" }}
          >
            Entrar
          </button>

          {error && (
            <p className="text-center text-sm font-medium text-destructive">{error}</p>
          )}

          <p className="pt-2 text-center text-xs text-muted-foreground">
            Esqueceu o acesso? Fale com o administrador
          </p>
        </form>
      </div>
    </div>
  );
}