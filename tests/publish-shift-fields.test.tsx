import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { PublishShiftForm } from "@/components/screens/publish-shift-form";
import { composeRange, validateShiftForm } from "@/features/shifts/form-values";

afterEach(cleanup);

const groups = [
  {
    id: "group-1",
    name: "Clínica",
    requiresApproval: true,
    institutionName: "Hospital Exemplo",
  },
];

function fill(label: string, value: string) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
}

test("publicação em duas etapas preserva os dados enviados e o aceite obrigatório", () => {
  const action = vi.fn();
  const { container } = render(
    <PublishShiftForm
      action={action}
      commandId="command-1"
      groups={groups}
      minDate="2026-10-01"
    />,
  );
  fill("Setor", "Internação");
  fill("Data", "2026-10-10");
  fill("Início", "19:00");
  fill("Fim", "07:00");
  fill("Valor (R$)", "900,00");
  fill("Condições de pagamento", "Pagamento em até 30 dias");
  expect(screen.getByText("Termina no dia seguinte.")).toBeInTheDocument();
  expect(screen.getByText(/aprovação da coordenação/)).toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: "Continuar" }));
  expect(
    screen.getByRole("heading", { level: 1, name: "Revisar e publicar" }),
  ).toBeInTheDocument();
  expect(
    screen.getByText("Etapa 2 de 2 · é assim que os colegas vão ver"),
  ).toBeInTheDocument();
  expect(screen.getByText("Exigida pelo grupo")).toBeInTheDocument();

  const terms = screen.getByRole("checkbox");
  expect(terms).toBeRequired();
  expect(terms).not.toBeChecked();
  fireEvent.click(terms);

  const payload = new FormData(container.querySelector("form")!);
  expect(payload.get("commandId")).toBe("command-1");
  expect(payload.get("groupId")).toBe("group-1");
  expect(payload.get("sector")).toBe("Internação");
  expect(payload.get("value")).toBe("900,00");
  expect(payload.get("paymentTerms")).toBe("Pagamento em até 30 dias");
  expect(payload.get("startsAt")).toBe("2026-10-10T19:00");
  expect(payload.get("endsAt")).toBe("2026-10-11T07:00");
  expect(payload.get("ownerTermsAcknowledged")).toBe("true");
  expect(
    screen.getByRole("button", { name: "Publicar plantão" }),
  ).toHaveAttribute("type", "submit");
});

test("erros aparecem no próprio campo e Enter na etapa 1 não publica", () => {
  const action = vi.fn();
  const { container } = render(
    <PublishShiftForm
      action={action}
      commandId="command-1"
      groups={groups}
      minDate="2026-10-01"
    />,
  );
  fireEvent.submit(container.querySelector("form")!);
  expect(action).not.toHaveBeenCalled();
  const sector = screen.getByLabelText("Setor");
  expect(sector).toHaveAttribute("aria-invalid", "true");
  expect(sector).toHaveAccessibleDescription(
    "Informe o setor com pelo menos 2 caracteres.",
  );
  expect(screen.getByRole("alert")).toHaveTextContent(
    "Revise os campos indicados para continuar.",
  );
  expect(
    screen.getByRole("heading", { level: 1, name: "Publicar plantão" }),
  ).toBeInTheDocument();
});

test("monta o período e valida as regras do formulário", () => {
  const base = {
    groupId: "",
    sector: "UTI",
    date: "2026-10-10",
    start: "07:00",
    end: "19:00",
    value: "1200",
    paymentTerms: "À vista",
    notes: "",
  };
  expect(composeRange(base)).toEqual({
    startsAt: "2026-10-10T07:00",
    endsAt: "2026-10-10T19:00",
  });
  expect(composeRange({ ...base, end: "07:00" }).endsAt).toBe(
    "2026-10-11T07:00",
  );
  expect(validateShiftForm(base, { minDate: "2026-10-01" })).toEqual({});
  expect(
    validateShiftForm(
      { ...base, date: "2026-09-30", value: "12,345" },
      { minDate: "2026-10-01" },
    ),
  ).toEqual({
    date: "Escolha uma data a partir de hoje.",
    value: "Informe o valor em reais, por exemplo 1200,00.",
  });
});
