import { createFileRoute } from "@tanstack/react-router";
import { MapPin, Phone, Clock, Instagram } from "lucide-react";

export const Route = createFileRoute("/contato")({
  head: () => ({
    meta: [
      { title: "Contato e Endereço — Barbearia Imperial" },
      { name: "description", content: "Onde nos encontrar, horários e contato direto." },
    ],
  }),
  component: ContatoPage,
});

function ContatoPage() {
  const address = "Rua das Tesouras, 123 - Centro, São Paulo";
  return (
    <section className="mx-auto max-w-5xl px-4 py-16">
      <header className="mb-10 text-center">
        <h1 className="text-4xl text-foreground md:text-5xl">Visite a barbearia</h1>
        <p className="mt-2 text-muted-foreground">Estamos prontos para receber você.</p>
      </header>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4 rounded-lg border border-border bg-card p-6">
          <div className="flex items-start gap-3"><MapPin className="mt-1 h-5 w-5 text-primary" /><div><p className="font-display text-lg">Endereço</p><p className="text-sm text-muted-foreground">{address}</p></div></div>
          <div className="flex items-start gap-3"><Phone className="mt-1 h-5 w-5 text-primary" /><div><p className="font-display text-lg">Telefone</p><a href="tel:+5511999990000" className="text-sm text-muted-foreground hover:text-primary">(11) 99999-0000</a></div></div>
          <div className="flex items-start gap-3"><Clock className="mt-1 h-5 w-5 text-primary" /><div><p className="font-display text-lg">Horário</p><p className="text-sm text-muted-foreground">Ter – Sáb: 09h às 20h</p></div></div>
          <div className="flex items-start gap-3"><Instagram className="mt-1 h-5 w-5 text-primary" /><div><p className="font-display text-lg">Instagram</p><a href="https://instagram.com/navalhaecia" target="_blank" rel="noreferrer" className="text-sm text-muted-foreground hover:text-primary">@navalhaecia</a></div></div>
        </div>
        <div className="overflow-hidden rounded-lg border border-border">
          <iframe
            title="Mapa da barbearia"
            src={`https://www.google.com/maps?q=${encodeURIComponent(address)}&output=embed`}
            className="h-full min-h-[320px] w-full"
            loading="lazy"
          />
        </div>
      </div>
    </section>
  );
}
