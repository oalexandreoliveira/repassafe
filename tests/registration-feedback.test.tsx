import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
const mock = vi.hoisted(() => ({ save: vi.fn(), submit: vi.fn() }));
vi.mock("@/app/cadastro/actions", () => ({
  saveRegistrationAction: mock.save,
  submitRegistrationAction: mock.submit,
  acceptDocumentsAction: vi.fn(),
  changeEmailAction: vi.fn(),
  removePhotoAction: vi.fn(),
  sendPhoneCodeAction: vi.fn(),
  uploadPhotoAction: vi.fn(),
  verifyPhoneCodeAction: vi.fn(),
}));
import {
  RegistrationForm,
  RegistrationSubmit,
} from "@/components/registration-form";
import { RegistrationEditState } from "@/components/registration-edit-state";
afterEach(cleanup);

test("CRM rejeitado preserva valor, bloqueia envio e recebe foco após reabilitar campos", async () => {
  mock.save.mockResolvedValue({
    status: "error",
    message: "Revise o CRM.",
    fieldErrors: { crmNumber: "Confira CRM e UF." },
  });
  const { container } = render(
    <RegistrationEditState>
      <RegistrationForm data={{ crmNumber: "12345" }} revision={0} />
      <RegistrationSubmit revision={0} submitted={false} />
    </RegistrationEditState>,
  );
  const crm = screen.getByLabelText("CRM — para atuação médica");
  fireEvent.change(crm, { target: { value: "54321" } });
  expect(
    screen.getByRole("button", { name: "Enviar para verificação" }),
  ).toBeDisabled();
  fireEvent.submit(container.querySelector("form")!);
  await waitFor(() =>
    expect(crm).toHaveAccessibleDescription("Confira CRM e UF."),
  );
  await waitFor(() => {
    expect(crm).not.toBeDisabled();
    expect(crm).toHaveFocus();
  });
  expect(crm).toHaveValue("54321");
  expect(mock.submit).not.toHaveBeenCalled();
});
