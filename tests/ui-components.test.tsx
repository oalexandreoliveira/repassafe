import { cleanup, render, screen, within } from "@testing-library/react";
import { Bell, Check } from "lucide-react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Button, ButtonLink } from "@/components/ui/button";
import {
  CheckboxField,
  SearchField,
  SelectField,
  TextField,
} from "@/components/ui/field";
import { EmptyState } from "@/components/ui/empty-state";
import { FilterChip, FilterChipList } from "@/components/ui/filter-chip";
import { IconButton } from "@/components/ui/icon-button";
import { KeyValueList } from "@/components/ui/key-value-list";
import { NotificationItem } from "@/components/ui/notification-item";
import { CandidateCard, initialsOf } from "@/components/ui/person";
import { ProgressSteps, StepList } from "@/components/ui/progress";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { ShiftCard } from "@/components/ui/shift-card";
import { StatusChip } from "@/components/ui/status-chip";
import { TabBar, activeTab } from "@/components/ui/tab-bar";
import { Toggle } from "@/components/ui/toggle";

vi.mock("next/navigation", () => ({ usePathname: () => "/plantoes/123" }));

afterEach(cleanup);

describe("Button", () => {
  it("applies variant, size and width classes", () => {
    render(
      <Button variant="secondary" size="sm" block>
        Ver condições
      </Button>,
    );
    expect(screen.getByRole("button", { name: "Ver condições" })).toHaveClass(
      "button",
      "button-secondary",
      "button-sm",
      "button-block",
    );
  });

  it("disables and marks busy while loading, keeping the label", () => {
    render(<Button loading>Publicar plantão</Button>);
    const button = screen.getByRole("button", { name: "Publicar plantão" });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(button).toHaveClass("button-loading");
  });

  it("renders navigation as a link with button appearance", () => {
    render(<ButtonLink href="/plantoes">Ver outros plantões</ButtonLink>);
    expect(
      screen.getByRole("link", { name: "Ver outros plantões" }),
    ).toHaveAttribute("href", "/plantoes");
  });
});

describe("IconButton and StatusChip", () => {
  it("requires an accessible name for icon-only buttons", () => {
    render(<IconButton label="Notificações, há novas" icon={<Bell />} badge />);
    expect(
      screen.getByRole("button", { name: "Notificações, há novas" }),
    ).toBeInTheDocument();
  });

  it("always shows the status as text", () => {
    render(<StatusChip tone="registered">Imutável</StatusChip>);
    expect(screen.getByText("Imutável")).toHaveAttribute(
      "data-tone",
      "registered",
    );
  });
});

describe("fields", () => {
  it("links the field error to its input", () => {
    render(
      <TextField
        label="Setor"
        name="sector"
        hint="Ex.: UTI Adulto"
        error="Informe o setor."
      />,
    );
    const input = screen.getByLabelText("Setor");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAccessibleDescription(
      "Ex.: UTI Adulto Informe o setor.",
    );
  });

  it("labels select, checkbox and search fields", () => {
    render(
      <>
        <SelectField label="Grupo" name="groupId">
          <option value="">Oferta livre — sem grupo</option>
        </SelectField>
        <CheckboxField label="Li e concordo" name="terms" />
        <SearchField label="Buscar setor ou hospital" name="q" />
      </>,
    );
    expect(screen.getByRole("combobox", { name: "Grupo" })).toBeInTheDocument();
    expect(
      screen.getByRole("checkbox", { name: "Li e concordo" }),
    ).not.toHaveAttribute("aria-invalid");
    expect(
      screen.getByRole("searchbox", { name: "Buscar setor ou hospital" }),
    ).toBeInTheDocument();
  });

  it("exposes the toggle as a switch", () => {
    render(
      <Toggle label="Avisar membros do grupo" name="notify" defaultChecked />,
    );
    expect(
      screen.getByRole("switch", { name: "Avisar membros do grupo" }),
    ).toBeChecked();
  });
});

describe("selection and filters", () => {
  it("names each candidate radio by the person and describes the details", () => {
    render(
      <CandidateCard
        inputName="application"
        value="a1"
        name="Dra. Ana Moreira"
        details="Intensivista"
        defaultChecked
      />,
    );
    const radio = screen.getByRole("radio", { name: "Dra. Ana Moreira" });
    expect(radio).toBeChecked();
    expect(radio).toHaveAccessibleDescription("Intensivista");
  });

  it("derives initials without the title", () => {
    expect(initialsOf("Dra. Ana Moreira")).toBe("AM");
    expect(initialsOf("Dr Rafael de Souza")).toBe("RS");
    expect(initialsOf("Lia")).toBe("L");
    expect(initialsOf(" ")).toBe("?");
  });

  it("reports pressed filters and the current segment", () => {
    render(
      <>
        <FilterChipList label="Filtrar plantões">
          <FilterChip selected>Esta semana</FilterChip>
          <FilterChip>Noturno</FilterChip>
        </FilterChipList>
        <SegmentedControl
          label="Meus plantões publicados"
          segments={[
            { label: "Abertos", count: 2, href: "?aba=abertos", active: true },
            { label: "Registrados", href: "?aba=registrados" },
          ]}
        />
      </>,
    );
    expect(screen.getByRole("button", { name: "Esta semana" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("link", { name: "Abertos 2" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });
});

describe("content components", () => {
  it("makes the whole shift card reachable through its title link", () => {
    render(
      <ShiftCard
        status={{ tone: "open", label: "Aberto" }}
        group="Plantonistas UTI"
        title="UTI Adulto · Hospital Exemplo"
        date="10/10"
        time="19h – 07h"
        href="/plantoes/1"
      />,
    );
    expect(
      screen.getByRole("link", { name: "UTI Adulto · Hospital Exemplo" }),
    ).toHaveAttribute("href", "/plantoes/1");
    expect(screen.getByText("Aberto")).toBeInTheDocument();
  });

  it("marks the current step and announces each state", () => {
    render(
      <>
        <ProgressSteps total={5} current={3} caption="Etapa 3 de 5" />
        <StepList
          title="Próximos passos"
          steps={[
            { title: "Candidatura enviada", state: "done" },
            { title: "Escolha de quem publicou", state: "current" },
            { title: "Acordo registrado", state: "upcoming" },
          ]}
        />
      </>,
    );
    expect(screen.getByText("Etapa 3 de 5")).toBeInTheDocument();
    const current = screen
      .getAllByRole("listitem")
      .find((item) => item.getAttribute("aria-current") === "step");
    expect(current).toHaveTextContent("Etapa atual: Escolha de quem publicou");
  });

  it("renders key-value pairs as a description list", () => {
    render(
      <KeyValueList items={[{ label: "Período", value: "10/10, 19:00" }]} />,
    );
    expect(screen.getByRole("term")).toHaveTextContent("Período");
    expect(screen.getByRole("definition")).toHaveTextContent("10/10, 19:00");
  });

  it("links notifications without a CTA and announces unread ones", () => {
    render(
      <NotificationItem
        tone="info"
        icon={Check}
        title="Novo plantão disponível"
        time="2 min"
        dateTime="2026-10-10T12:00:00.000Z"
        href="/plantoes/1"
        unread
      />,
    );
    const heading = screen.getByRole("heading", { level: 2 });
    expect(heading).toHaveTextContent("Não lida: Novo plantão disponível");
    expect(
      within(heading).getByRole("link", { name: "Novo plantão disponível" }),
    ).toHaveAttribute("href", "/plantoes/1");
  });

  it("lets the empty state own the page heading when needed", () => {
    render(
      <EmptyState icon={Check} title="Candidatura enviada" headingLevel="h1" />,
    );
    expect(
      screen.getByRole("heading", { level: 1, name: "Candidatura enviada" }),
    ).toBeInTheDocument();
  });
});

describe("tab bar", () => {
  it("maps routes to their root tab", () => {
    expect(activeTab("/plantoes")).toBe("plantoes");
    expect(activeTab("/plantoes/abc")).toBe("plantoes");
    expect(activeTab("/plantoes/novo")).toBe("publicar");
    expect(activeTab("/plantoes/publicados")).toBe("publicar");
    expect(activeTab("/acordos/abc")).toBe("acordos");
    expect(activeTab("/historico")).toBe("perfil");
    expect(activeTab("/notificacoes")).toBeNull();
  });

  it("marks the current tab and hides Publicar for approvers", () => {
    render(<TabBar canPublish={false} />);
    expect(screen.getByRole("link", { name: "Plantões" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.queryByRole("link", { name: "Publicar" })).toBeNull();
  });
});
