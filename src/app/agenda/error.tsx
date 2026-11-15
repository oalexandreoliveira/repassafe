"use client";

import { CalendarClock } from "lucide-react";
import { AppScreen, TopBar } from "@/components/ui/app-shell";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

export default function AgendaError({ reset }: { reset: () => void }) {
  return (
    <AppScreen header={<TopBar title="Agenda" backHref="/agenda" />}>
      <EmptyState
        icon={CalendarClock}
        title="Não foi possível concluir"
        action={
          <Button type="button" block onClick={reset}>
            Tentar de novo
          </Button>
        }
      >
        Suas anotações salvas continuam guardadas. Atualize a agenda e tente
        novamente.
      </EmptyState>
    </AppScreen>
  );
}
