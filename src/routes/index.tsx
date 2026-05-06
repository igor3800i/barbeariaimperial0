import { createFileRoute, Link } from "@tanstack/react-router";
import { Scissors, Calendar, MapPin, Star } from "lucide-react";
import heroImg from "@/assets/hero-barbershop.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Navalha & Cia — Barbearia Premium com Agendamento Online" },
      { name: "description", content: "Cortes clássicos e modernos, barba, combo. Agende em poucos cliques." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <>
      <section className="relative isolate overflow-hidden">
        <img
          src={heroImg}
          alt="Interior da barbearia"
          width={1920}
          height={1280}
          className="absolute inset-0 -z-10 h-full w-full object-cover opacity-50"
        />
        <div className="absolute inset-0 -z-10" style={{ background: "var(--gradient-hero)" }} />
        <div className="mx-auto flex min-h-[80vh] max-w-6xl flex-col items-start justify-center px-4 py-24">
          <span className="rounded-full border border-primary/40 bg-background/40 px-3 py-1 text-xs uppercase tracking-widest text-primary">Desde 2010</span>
          <h1 className="mt-4 text-5xl leading-none text-foreground md:text-7xl">
            Estilo afiado.<br />Precisão na <span className="text-primary">navalha.</span>
          </h1>
          <p className="mt-5 max-w-xl text-base text-muted-foreground md:text-lg">
            Barbearia premium com agendamento online em segundos. Sem ligação, sem espera.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/agendar" className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg transition hover:opacity-90">
              <Calendar className="h-4 w-4" /> Agendar agora
            </Link>
            <Link to="/servicos" className="inline-flex items-center gap-2 rounded-md border border-border bg-background/40 px-6 py-3 text-sm font-semibold text-foreground backdrop-blur hover:bg-background/60">
              Ver serviços
            </Link>
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-card">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-12 md:grid-cols-3">
          {[
            { icon: Scissors, title: "Profissionais experientes", desc: "Barbeiros com anos de experiência e técnica." },
            { icon: Calendar, title: "Agendamento simples", desc: "3 cliques para reservar seu horário." },
            { icon: Star, title: "Atendimento premium", desc: "Ambiente confortável e produtos selecionados." },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Icon className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-display text-lg text-foreground">{title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20 text-center">
        <h2 className="text-4xl text-foreground md:text-5xl">Pronto para o seu próximo corte?</h2>
        <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
          Escolha um serviço, selecione data e horário. Pronto.
        </p>
        <Link to="/agendar" className="mt-8 inline-flex items-center gap-2 rounded-md bg-primary px-8 py-3 text-base font-semibold text-primary-foreground shadow-lg hover:opacity-90">
          <Calendar className="h-5 w-5" /> Agendar horário
        </Link>
        <div className="mt-10 inline-flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4 text-primary" /> Rua das Tesouras, 123 — Centro
        </div>
      </section>
    </>
  );
}
