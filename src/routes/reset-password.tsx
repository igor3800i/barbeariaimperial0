import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "Nova senha — Barbearia Imperial" }] }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (password.length < 6) return toast.error("A senha precisa ter ao menos 6 caracteres.");
    if (password !== confirm) return toast.error("As senhas não conferem.");
    setSubmitting(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSubmitting(false);
    if (error) return toast.error(error.message);
    toast.success("Senha atualizada com sucesso!");
    navigate({ to: "/" });
  };

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-[400px] rounded-3xl border border-border bg-card p-8 shadow-2xl">
        <h1 className="text-center font-serif text-3xl text-foreground">Nova senha</h1>
        <p className="mt-2 text-center text-sm text-muted-foreground">Defina uma nova senha para sua conta</p>

        <form onSubmit={onSubmit} className="mt-6 space-y-3">
          <label className="block">
            <span className="mb-1 block text-xs font-medium uppercase tracking-wider text-muted-foreground">Nova senha</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="h-[52px] w-full rounded-[var(--radius)] border border-border bg-input px-4 text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium uppercase tracking-wider text-muted-foreground">Confirmar senha</span>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              className="h-[52px] w-full rounded-[var(--radius)] border border-border bg-input px-4 text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
            />
          </label>
          <button
            type="submit"
            disabled={submitting}
            className="h-[52px] w-full rounded-[var(--radius)] bg-primary font-bold text-primary-foreground hover:opacity-90 disabled:opacity-60"
          >
            {submitting ? "Salvando..." : "Salvar nova senha"}
          </button>
        </form>
      </div>
    </div>
  );
}
