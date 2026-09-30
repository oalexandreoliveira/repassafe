import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { RegistrationDecisionForm } from "@/components/registration-decision-form";
vi.mock("@/app/admin/cadastros/actions", () => ({
  reviewRegistrationAction: vi.fn(async () => ({
    status: "error",
    message: "Revise os campos da decisão.",
    fieldErrors: {
      crmState: "Confira a UF consultada.",
      correctionField: "Selecione o campo a corrigir.",
    },
  })),
}));
it("associa erros da decisão aos seletores correspondentes sem perder seus valores", async () => {
  render(
    <RegistrationDecisionForm
      userId="fixture"
      revision={1}
      data={{ crmNumber: "123", crmState: "SP" }}
    />,
  );
  expect(screen.getByLabelText("UF conferida")).toHaveValue("SP");
  fireEvent.submit(
    screen
      .getByRole("button", { name: "Registrar decisão nesta versão" })
      .closest("form")!,
  );
  await screen.findByRole("alert");
  const state = screen.getByLabelText("UF conferida");
  expect(state).toHaveValue("SP");
  expect(state).toHaveAttribute("aria-invalid", "true");
  expect(state).toHaveAccessibleDescription("Confira a UF consultada.");
  expect(screen.getByLabelText("Campo a corrigir")).toHaveAccessibleDescription(
    "Selecione o campo a corrigir.",
  );
});
