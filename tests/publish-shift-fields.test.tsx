import { fireEvent, render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { PublishShiftFields } from "@/components/publish-shift-fields";

test("extração preserva campos editáveis, aceite obrigatório e dados enviados na publicação", () => {
  const { container } = render(
    <form>
      <PublishShiftFields groups={[{ id: "group-1", name: "Clínica" }]} />
    </form>,
  );
  fireEvent.change(screen.getByLabelText("Grupo (opcional)"), {
    target: { value: "group-1" },
  });
  fireEvent.change(screen.getByLabelText("Setor"), {
    target: { value: "Internação" },
  });
  fireEvent.change(screen.getByLabelText("Valor (R$)"), {
    target: { value: "900,00" },
  });
  const terms = screen.getByRole("checkbox");
  expect(terms).toBeRequired();
  expect(terms).not.toBeChecked();
  fireEvent.click(terms);
  const payload = new FormData(container.querySelector("form")!);
  expect(payload.get("groupId")).toBe("group-1");
  expect(payload.get("sector")).toBe("Internação");
  expect(payload.get("value")).toBe("900,00");
  expect(payload.get("ownerTermsAcknowledged")).toBe("true");
  expect(screen.getByLabelText("Setor")).not.toHaveAttribute("readonly");
  expect(
    screen.getByRole("button", { name: "Publicar plantão" }),
  ).toHaveAttribute("type", "submit");
});
