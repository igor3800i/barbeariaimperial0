import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { Scissors } from "lucide-react";
import { useClientAuth, maskPhone } from "@/lib/client-auth-context";
import heroImg from "@/assets/hero-barbershop.jpg";

export const Route = createFileRoute("/cadastro")({
  head: () => ({ meta: [{ title: "Cadastro — Imperial" }] }),
  component: CadastroPage,
});

function CadastroPage() {
  const auth = useClientAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (auth.isAuthenticated) navigate({ to: "/" });
  }, [auth.isAuthenticated, navigate]);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2 || surname.trim().length < 2) {
      setError("Preencha nome e sobrenome.");
      return;
    }
    if (phone.replace(/\D/g, "").length < 10) {
      setError("Telefone inválido.");
      return;
    }
    auth.register(name, surname, phone);
    navigate({ to: "/" });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <img src={heroImg} alt="" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.75)" }} />
      <div
        className="absolute inset-0"
        style={{ background: "linear-gradient(to top, color-mix(in oklab, var(--primary) 8%, transparent), transparent 50%)" }}
      />
      <div
        className="relative w-full max-w-[400px] rounded-3xl border border-border p-8 shadow-2xl"
        style={{ background: "color-mix(in oklab, var(--card) 80%, transparent)", backdropFilter: "blur(24px)" }}
      >
        <div className="mb-6 text-center">
          <div className="flex items-center justify-center gap-2 text-primary">
            <Scissors className="h-6 w-6" />
            <span className="text-2xl font-semibold" style={{ fontFamily: "'Playfair Display', serif" }}>Imperial</span>
          </div>
          <h1 className="mt-4 text-3xl text-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>Bem-vindo!</h1>
          <p className="mt-1 text-sm text-muted-foreground" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            Crie sua conta para agendar
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-3">
          <Field label="Nome" value={name} onChange={setName} placeholder="Seu nome" />
          <Field label="Sobrenome" value={surname} onChange={setSurname} placeholder="Seu sobrenome" />
          <Field
            label="Telefone / WhatsApp"
            value={phone}
            onChange={(v) => setPhone(maskPhone(v))}
            placeholder="(11) 99999-9999"
            inputMode="tel"
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <button
            type="submit"
            className="h-[52px] w-full rounded-[var(--radius)] bg-primary font-bold text-primary-foreground transition hover:opacity-90"
            style={{ fontFamily: "'Montserrat', sans-serif" }}
          >
            Criar conta e agendar
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
  label, value, onChange, placeholder, inputMode,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  inputMode?: "tel" | "text";
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        inputMode={inputMode}
        className="h-[52px] w-full rounded-[var(--radius)] border border-border bg-input px-4 text-foreground outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/30"
      />
    </label>
  );
}