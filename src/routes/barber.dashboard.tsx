import { createFileRoute } from "@tanstack/react-router";
import { BarberShell } from "@/components/barber/barber-shell";
import { Wrench } from "lucide-react";

export const Route = createFileRoute("/barber/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Barbearia Imperial" }] }),
  component: () => (
    <BarberShell title="Dashboard">
      <Placeholder text="Dashboard será reconectado ao novo banco na próxima fase." />
    </BarberShell>
  ),
});

function Placeholder({ text }: { text: string }) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/50 p-8 text-center">
      <Wrench className="mb-3 h-10 w-10 text-primary" />
      <p className="text-muted-foreground">{text}</p>
    </div>
  );
}
