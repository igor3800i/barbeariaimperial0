import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Scissors, Calendar, MapPin, Star, Clock } from "lucide-react";
import heroImg from "@/assets/hero-barbershop.jpg";
import { useClientAuth } from "@/lib/client-auth-context";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Barbearia Imperial — Barbearia Premium com Agendamento Online" },
      { name: "description", content: "Cortes clássicos e modernos, barba, combo. Agende em poucos cliques." },
    ],
  }),
  component: Index,
});

function Index() {
  const { isAuthenticated } = useClientAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) navigate({ to: "/cadastro" });
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) return null;

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
          <h1 className="text-5xl leading-none text-foreground md:text-7xl">
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

      <section className="mx-auto max-w-6xl px-4 pb-12 md:pb-20">
        <div className="mb-4 flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" />
          <h2 className="text-2xl text-foreground" className="font-serif">
            Nossa Localização
          </h2>
        </div>
        <div className="overflow-hidden rounded-xl border border-border shadow-md">
          <iframe
            title="Mapa Barbearia Imperial"
            src="https://maps.google.com/maps?q=Avenida+Jos%C3%A9+Alves+Seabra,3154,Bauru,SP,Brasil&output=embed&z=16"
            className="h-[280px] w-full md:h-[400px]"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
        <div className="mt-4 rounded-xl border border-border bg-card p-4">
          <div className="mb-3 flex items-start gap-3">
            <MapPin className="mt-0.5 h-5 w-5 text-primary" />
            <div>
              <p className="text-sm font-semibold text-foreground">Endereço</p>
              <p className="text-sm text-muted-foreground">Av. José Alves Seabra, 3154</p>
              <p className="text-sm text-muted-foreground">Bauru — SP</p>
            </div>
          </div>
          <div className="mb-3 flex items-start gap-3">
            <Clock className="mt-0.5 h-5 w-5 text-primary" />
            <div>
              <p className="text-sm font-semibold text-foreground">Horários</p>
              <p className="text-sm text-muted-foreground">Segunda: 09:00 – 15:00</p>
              <p className="text-sm text-muted-foreground">Terça a Sexta: 09:00 – 20:00</p>
              <p className="text-sm text-muted-foreground">Sábado: 09:00 – 21:00</p>
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-destructive">●</span> Domingo: Fechado
              </p>
            </div>
          </div>
          <a
            href="https://www.google.com/maps/search/Avenida+Jos%C3%A9+Alves+Seabra,3154,Bauru,SP"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            <MapPin className="h-4 w-4" />
            Abrir no Google Maps
          </a>
        </div>
      </section>
    </>
  );
}
