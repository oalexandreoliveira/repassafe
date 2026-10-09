import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { ShiftMural } from "@/components/screens/shift-mural";
import { AgreementsList } from "@/components/screens/agreements-list";

vi.mock("next/navigation", () => ({ usePathname: () => "/plantoes" }));
afterEach(cleanup);

it("describes both audiences and makes group filtering optional and accessible", () => {
  render(
    <ShiftMural
      items={[]}
      totalCount={1}
      groupsCount={1}
      groups={[{ id: "a", name: "Grupo A" }]}
      group="a"
      unread={false}
      canPublish
      filter="semana"
      query="UTI"
      now={new Date()}
    />,
  );
  expect(
    screen.getByText("Ofertas livres e dos grupos aos quais você tem acesso"),
  ).toBeInTheDocument();
  expect(screen.getByLabelText("Origem das ofertas")).toHaveValue("a");
  expect(
    screen.getByRole("option", { name: "Todas as ofertas disponíveis" }),
  ).toHaveValue("todos");
  expect(
    screen.getByRole("option", { name: "Somente ofertas livres" }),
  ).toHaveValue("livres");
  expect(
    screen.getByRole("button", { name: "Aplicar filtros" }),
  ).toHaveAttribute("type", "submit");
  expect(screen.getByRole("link", { name: "Noturno" })).toHaveAttribute(
    "href",
    "/plantoes?filtro=noturno&q=UTI&grupo=a",
  );
  expect(screen.getByRole("link", { name: "Limpar filtros" })).toHaveAttribute(
    "href",
    "/plantoes",
  );
});

it("does not describe the empty mural as restricted to groups", () => {
  render(
    <ShiftMural
      items={[]}
      totalCount={0}
      groupsCount={0}
      unread={false}
      canPublish
      filter="todos"
      now={new Date()}
    />,
  );
  expect(
    screen.getByRole("heading", { name: "Nenhum plantão disponível agora" }),
  ).toBeInTheDocument();
  expect(screen.getByLabelText("Origem das ofertas")).toHaveValue("todos");
});

it("keeps confirmed offer records distinct from the external agreement destination", () => {
  render(
    <AgreementsList
      unread={false}
      canPublish
      agreements={[
        {
          id: "record",
          offerId: "offer",
          role: "owner",
          confirmedAt: "2026-10-08T15:00:00Z",
          sector: "Pediatria",
          startsAt: "2026-10-10T15:00:00Z",
          endsAt: "2026-10-10T21:00:00Z",
          hasDocument: true,
        },
      ]}
    />,
  );
  expect(
    screen.getByRole("heading", { name: "Repasses confirmados" }),
  ).toBeInTheDocument();
  expect(screen.getByText("Repasse confirmado")).toBeInTheDocument();
  expect(
    screen.queryByText("Acordo registrado", { exact: true }),
  ).not.toBeInTheDocument();
  expect(
    screen.getByRole("link", { name: "Acordos registrados e pagamentos" }),
  ).toHaveAttribute("href", "/acordos/registrados");
  expect(
    screen.getByRole("heading", { name: "Confirmados a partir de ofertas" }),
  ).toBeInTheDocument();
});
