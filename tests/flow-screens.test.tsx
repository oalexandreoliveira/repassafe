import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { applicationSteps } from "@/components/screens/application-sent";
import { ctaHref } from "@/components/screens/notifications-list";
import { ConfirmSubmit } from "@/components/ui/confirm-submit";
import { SelectionSubmit } from "@/components/ui/selection-submit";
import { ownOfferTab, parseOwnOfferTab } from "@/features/shifts/my-offers";
import { toOfferSummary } from "@/features/shifts/offer-view";

afterEach(cleanup);

describe("flow helpers", () => {
  it("places each own offer in one tab of S07", () => {
    expect(ownOfferTab("open_normal")).toBe("abertos");
    expect(ownOfferTab("open_emergency")).toBe("abertos");
    expect(ownOfferTab("selection_in_progress")).toBe("andamento");
    expect(ownOfferTab("closed_confirmed")).toBe("registrados");
    expect(ownOfferTab("cancelled_by_owner")).toBeNull();
    expect(parseOwnOfferTab("registrados")).toBe("registrados");
    expect(parseOwnOfferTab("x")).toBe("abertos");
  });

  it("sends the selection CTA straight to S09", () => {
    expect(ctaHref("/plantoes/abc", "condicoes")).toBe(
      "/plantoes/abc/condicoes",
    );
    expect(ctaHref("/admin", "condicoes")).toBe("/admin");
    expect(ctaHref("/plantoes/abc")).toBe("/plantoes/abc");
  });

  it("adds the coordination step only when the group requires it", () => {
    const offer = (requiresApproval: boolean) =>
      toOfferSummary({
        id: "o",
        owner_id: "u",
        sector: "UTI Adulto",
        status: "open_normal",
        starts_at: "2026-10-10T22:00:00.000Z",
        ends_at: "2026-10-11T10:00:00.000Z",
        groups: { name: "G", requires_approval: requiresApproval },
      });
    expect(applicationSteps(offer(false)).map((step) => step.title)).toEqual([
      "Candidatura enviada",
      "Escolha de quem publicou",
      "Confirmação das condições",
      "Repasse confirmado",
    ]);
    expect(applicationSteps(offer(true))).toHaveLength(5);
  });
});

describe("guarded submits", () => {
  it("enables the S08 submit only after a candidate is chosen", () => {
    render(
      <>
        <form id="choice">
          <input type="radio" name="candidatura" value="a" aria-label="A" />
        </form>
        <SelectionSubmit form="choice">
          Selecionar e revisar condições
        </SelectionSubmit>
      </>,
    );
    const submit = screen.getByRole("button", {
      name: "Selecionar e revisar condições",
    });
    expect(submit).toBeDisabled();
    fireEvent.click(screen.getByLabelText("A"));
    expect(submit).toBeEnabled();
  });

  it("asks before withdrawing an application", () => {
    render(
      <form>
        <ConfirmSubmit
          question="Cancelar sua candidatura a este plantão?"
          confirmLabel="Sim, cancelar candidatura"
          keepLabel="Manter candidatura"
        >
          Cancelar candidatura
        </ConfirmSubmit>
      </form>,
    );
    const first = screen.getByRole("button", { name: "Cancelar candidatura" });
    expect(first).toHaveAttribute("type", "button");
    fireEvent.click(first);
    expect(
      screen.getByRole("button", { name: "Sim, cancelar candidatura" }),
    ).toHaveAttribute("type", "submit");
    fireEvent.click(screen.getByRole("button", { name: "Manter candidatura" }));
    expect(
      screen.getByRole("button", { name: "Cancelar candidatura" }),
    ).toBeInTheDocument();
  });
});
