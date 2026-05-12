import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";

import { useAuth } from "@/lib/auth-context";
import heroImg from "@/assets/hero-barbershop.jpg";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Entrar — Barbearia Imperial" }] }),
  component: LoginPage,
});

function LoginPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);

  useEffect(() => {
    if (auth.isAuthenticated) navigate({ to: "/" });
  }, [auth.isAuthenticated, navigate]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    if (forgotMode) {
      const { error } = await auth.sendPasswordReset(email);
      setSubmitting(false);
      if (error) return toast.error(error);
      toast.success("Enviamos um link de recuperação para seu email.");
      setForgotMode(false);
      return;
    }
    const { error } = await auth.signIn({ email, password });
    setSubmitting(false);
    if (error) return toast.error(error);
    navigate({ to: "/" });
  };

  const handleGoogle = async () => {
    setSubmitting(true);
    const { error } = await auth.signInWithGoogle();
    if (error) {
      setSubmitting(false);
      toast.error(error);
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
          <h1 className="mt-4 text-3xl text-foreground font-serif">
            {forgotMode ? "Recuperar senha" : "Entrar"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {forgotMode ? "Informe seu email para receber o link" : "Acesse com seu email e senha"}
          </p>
        </div>

        {!forgotMode && (
          <>
            <button
              type="button"
              onClick={handleGoogle}
              disabled={submitting}
              className="mb-4 flex h-[52px] w-full items-center justify-center gap-3 rounded-[var(--radius)] border border-border bg-background font-semibold text-foreground transition hover:bg-muted disabled:opacity-50"
            >
              <GoogleIcon /> Continuar com Google
            </button>
            <div className="mb-4 flex items-center gap-3 text-xs uppercase tracking-wider text-muted-foreground">
              <div className="h-px flex-1 bg-border" /> ou <div className="h-px flex-1 bg-border" />
            </div>
          </>
        )}

        <form onSubmit={onSubmit} className="space-y-3">
          <Field label="Email" value={email} onChange={setEmail} type="email" placeholder="voce@email.com" />
          {!forgotMode && (
            <Field label="Senha" value={password} onChange={setPassword} type="password" placeholder="••••••••" />
          )}
          <button
            type="submit"
            disabled={submitting}
            className="h-[52px] w-full rounded-[var(--radius)] bg-primary font-bold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
            style={{ fontFamily: "'Montserrat', sans-serif" }}
          >
            {submitting ? "Aguarde..." : forgotMode ? "Enviar link" : "Entrar"}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => setForgotMode((v) => !v)}
            className="text-sm text-primary hover:underline"
          >
            {forgotMode ? "Voltar ao login" : "Esqueci minha senha"}
          </button>
        </div>

        {!forgotMode && (
          <p className="mt-5 text-center text-sm text-muted-foreground">
            Não tem conta?{" "}
            <Link to="/cadastro" className="font-semibold text-primary hover:underline">Cadastre-se</Link>
          </p>
        )}
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
        required
        className="h-[52px] w-full rounded-[var(--radius)] border border-border bg-input px-4 text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
      />
    </label>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
      <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.4-1.6 4.1-5.5 4.1-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.7 3.3 14.6 2.4 12 2.4 6.7 2.4 2.4 6.7 2.4 12s4.3 9.6 9.6 9.6c5.5 0 9.2-3.9 9.2-9.4 0-.6-.1-1.1-.2-1.6H12z" />
    </svg>
  );
}
