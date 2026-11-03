import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ChooseSubstitute } from "@/components/screens/choose-substitute";
import { applications, now, uti } from "@/app/dev/telas/fixtures";
import {
  candidateProfileSchema,
  hasCurrentVerification,
} from "@/features/shifts/candidate-profile";

vi.mock("next/navigation", () => ({ usePathname: () => "/plantoes/123" }));
afterEach(cleanup);
const professional = applications[0].professional!;

describe("perfil profissional na escolha", () => {
  it("mantém detalhes fora do rótulo e preserva a escolha ao consultar outro perfil", () => {
    const { container } = render(
      <ChooseSubstitute offer={uti} applications={applications} now={now} />,
    );
    const submit = screen.getByRole("button", {
      name: "Selecionar e revisar condições",
    });
    const radios = screen.getAllByRole("radio");
    const summaries = container.querySelectorAll("summary");
    expect(submit).toBeDisabled();
    expect(summaries).toHaveLength(3);
    for (const summary of summaries)
      expect(summary.closest("label")).toBeNull();
    fireEvent.click(summaries[1]);
    expect(submit).toBeDisabled();
    fireEvent.click(radios[0]);
    fireEvent.click(summaries[1]);
    expect(radios[0]).toBeChecked();
    expect(radios[1]).not.toBeChecked();
    expect(submit).toBeEnabled();
    expect(container.querySelector("form")).toHaveAttribute(
      "action",
      `/plantoes/${uti.id}/condicoes`,
    );
  });

  it("separa CRM, especialidade declarada e RQE, sem publicar dados privados", () => {
    const { container } = render(
      <ChooseSubstitute
        offer={uti}
        applications={[
          {
            ...applications[0],
            professional: candidateProfileSchema.parse({
              ...professional,
              rqe_verified: false,
              cpf: "PRIVATE CPF",
              photo_path: "PRIVATE PHOTO",
              internal_notes: "PRIVATE NOTES",
            }),
          },
        ]}
        now={now}
      />,
    );
    const disclosure = container.querySelector("details")!;
    disclosure.open = true;
    expect(
      screen.getByText("CRM verificado", { selector: "span" }),
    ).toBeVisible();
    expect(
      within(disclosure).getByText("Especialidade declarada"),
    ).toBeVisible();
    expect(
      within(disclosure).getByText("1234 — declarado, não verificado"),
    ).toBeVisible();
    expect(
      within(disclosure).getByText(/não concede autorização institucional/),
    ).toBeVisible();
    expect(container.textContent).not.toContain("PRIVATE");
    expect(container.querySelector("img")).toBeNull();
  });

  it.each([
    undefined,
    { ...professional, verified: false },
    { ...professional, verified: null },
    { ...professional, valid_until: now.toISOString() },
    { ...professional, valid_until: null },
    { ...professional, valid_until: "invalid" },
    { ...professional, crm: null },
  ])("bloqueia dados ausentes ou verificação não vigente: %j", (profile) => {
    render(
      <ChooseSubstitute
        offer={uti}
        applications={[{ ...applications[0], professional: profile }]}
        now={now}
      />,
    );
    expect(screen.getByRole("radio")).toBeDisabled();
    expect(
      screen.queryByText("CRM verificado", { selector: "span" }),
    ).toBeNull();
    expect(screen.getByText(/Seleção indisponível/)).toBeVisible();
  });

  it("não deixa o primeiro candidato indisponível impedir a escolha do segundo", () => {
    render(
      <ChooseSubstitute
        offer={uti}
        applications={[
          { ...applications[0], professional: undefined },
          applications[1],
        ]}
        now={now}
        verificationChanged
      />,
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Confira os perfis atualizados",
    );
    const radios = screen.getAllByRole("radio");
    fireEvent.click(radios[1]);
    expect(radios[1]).toBeRequired();
    expect(
      screen.getByRole("button", { name: "Selecionar e revisar condições" }),
    ).toBeEnabled();
  });

  it("remove campos extras e verifica o limite exato de validade", () => {
    expect(
      candidateProfileSchema.parse({ ...professional, cpf: "private" }),
    ).toEqual(professional);
    expect(hasCurrentVerification(professional, now)).toBe(true);
    expect(
      hasCurrentVerification(professional, new Date(professional.valid_until!)),
    ).toBe(false);
  });
});
