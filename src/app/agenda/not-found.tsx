import { CalendarClock } from "lucide-react";
import { AppScreen, TopBar } from "@/components/ui/app-shell";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

/** Anotação inexistente, excluída ou de outra conta: mesma resposta, sem detalhes. */
export default function AgendaNotFound() {
  return (
    <AppScreen header={<TopBar title="Agenda" backHref="/agenda" />}>
      <EmptyState
        icon={CalendarClock}
        title="Plantão não encontrado"
        action={
          <ButtonLink href="/agenda" block>
            Voltar para a agenda
          </ButtonLink>
        }
      >
        Ele pode ter sido excluído. Cada anotação da agenda é visível só para
        quem a criou.
      </EmptyState>
    </AppScreen>
  );
}
