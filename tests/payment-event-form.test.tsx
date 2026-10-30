import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
const mock = vi.hoisted(() => ({ action: vi.fn() }));
vi.mock("@/app/acordos/[id]/pagamento/actions", () => ({
  recordPaymentAction: mock.action,
}));
import { PaymentEventForm } from "@/components/payment-event-form";
afterEach(cleanup);

test("pagamento rejeitado mantém data e valor para correção", async () => {
  mock.action.mockResolvedValue({
    status: "error",
    message: "Confira o valor.",
    fieldErrors: { amount: "Informe o valor total." },
  });
  const { container } = render(
    <PaymentEventForm
      agreementId="a"
      requestId="r"
      operation="payment"
      amount={120000}
      today="2026-10-30"
    />,
  );
  fireEvent.change(screen.getByLabelText("Data do pagamento"), {
    target: { value: "2026-10-29" },
  });
  fireEvent.change(screen.getByLabelText("Valor pago (R$)"), {
    target: { value: "600,00" },
  });
  fireEvent.submit(container.querySelector("form")!);
  await waitFor(() =>
    expect(screen.getByText("Confira o valor.")).toBeInTheDocument(),
  );
  expect(screen.getByLabelText("Data do pagamento")).toHaveValue("2026-10-29");
  expect(screen.getByLabelText("Valor pago (R$)")).toHaveValue("600,00");
  expect(screen.getByLabelText("Valor pago (R$)")).toHaveAccessibleDescription(
    "Informe o valor total.",
  );
});
