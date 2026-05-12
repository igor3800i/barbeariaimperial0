import { createFileRoute, Link } from "@tanstack/react-router";
import { Wrench } from "lucide-react";

export const Route = createFileRoute("/agendar")({
  head: () => ({ meta: [{ title: "Agendar — Barbearia Imperial" }] }),
  component: AgendarPlaceholder,
});

function AgendarPlaceholder() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center px-4 py-16 text-center">
      <Wrench className="mb-4 h-12 w-12 text-primary" />
      <h1 className="font-serif text-3xl text-foreground">Agendamento em reconstrução</h1>
      <p className="mt-3 text-muted-foreground">
        Estamos migrando o sistema de agendamento para o novo banco de dados (com escolha de barbeiro,
        horários reais e confirmação por email). Volta em breve!
      </p>
      <Link
        to="/"
        className="mt-6 inline-flex h-11 items-center justify-center rounded-md bg-primary px-6 text-sm font-semibold text-primary-foreground"
      >
        Voltar ao início
      </Link>
    </div>
  );
}
