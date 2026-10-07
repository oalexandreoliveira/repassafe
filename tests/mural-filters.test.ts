import { describe, expect, it } from "vitest";
import {
  filterMuralOffers,
  groupByDay,
  parseMuralFilter,
} from "@/features/shifts/mural-filters";
import {
  offerTitle,
  toOfferSummary,
  type OfferSummary,
} from "@/features/shifts/offer-view";
import { notificationPresentation } from "@/components/screens/notifications-list";
import { appliedAt } from "@/components/screens/candidate-selection";

const now = new Date("2026-10-10T09:00:00.000Z"); // sáb 06:00 em Fortaleza

const offer = (id: string, sector: string, startsAt: string): OfferSummary =>
  toOfferSummary({
    id,
    owner_id: "owner",
    sector,
    status: "open_normal",
    starts_at: startsAt,
    ends_at: startsAt,
    groups: {
      name: "Clínica PS",
      institutions: [{ name: "Hospital Exemplo" }],
    },
  });

const offers = [
  offer("uti-noite", "UTI Adulto", "2026-10-10T22:00:00.000Z"), // sáb 19h
  offer("ps-dia", "Pronto-socorro", "2026-10-12T10:00:00.000Z"), // seg 07h
  offer("enf-longe", "Enfermaria", "2026-10-20T10:00:00.000Z"), // ter 07h
];

describe("mural filters", () => {
  it("defaults to this week and accepts known filters only", () => {
    expect(parseMuralFilter(undefined)).toBe("semana");
    expect(parseMuralFilter("noturno")).toBe("noturno");
    expect(parseMuralFilter("todos")).toBe("todos");
    expect(parseMuralFilter("qualquer")).toBe("semana");
  });

  it("filters by week, night, ICU and weekend in the product time zone", () => {
    const ids = (filter: Parameters<typeof parseMuralFilter>[0]) =>
      filterMuralOffers(offers, { filter: parseMuralFilter(filter), now }).map(
        (item) => item.id,
      );
    expect(ids("semana")).toEqual(["uti-noite", "ps-dia"]);
    expect(ids("noturno")).toEqual(["uti-noite"]);
    expect(ids("uti")).toEqual(["uti-noite"]);
    expect(ids("fim-de-semana")).toEqual(["uti-noite"]);
    expect(ids("todos")).toHaveLength(3);
  });

  it("searches sector, group and hospital without accents or case", () => {
    const search = (query: string) =>
      filterMuralOffers(offers, { filter: "todos", query, now }).map(
        (item) => item.id,
      );
    expect(search("pronto socorro")).toEqual([]);
    expect(search("PRONTO")).toEqual(["ps-dia"]);
    expect(search("enfermária")).toEqual(["enf-longe"]);
    expect(search("hospital exemplo")).toHaveLength(3);
  });

  it("groups by calendar day and composes the card title", () => {
    expect(groupByDay(offers, (item) => item.startsAt)).toHaveLength(3);
    expect(offerTitle(offers[0])).toBe("UTI Adulto · Hospital Exemplo");
    expect(offerTitle({ sector: "UTI Adulto" })).toBe("UTI Adulto");
  });
});

describe("notification and candidate wording", () => {
  it("highlights only the actions the person must take", () => {
    expect(notificationPresentation("substitution.selected")).toMatchObject({
      tone: "action",
      cta: "Confirmar condições",
    });
    expect(notificationPresentation("offer.published").tone).toBe("info");
    expect(notificationPresentation("substitution.confirmed").tone).toBe(
      "history",
    );
    expect(notificationPresentation("desconhecido").tone).toBe("history");
  });

  it("describes when someone applied", () => {
    expect(appliedAt("2026-10-10T08:32:00.000Z", now)).toBe(
      "Candidatou-se hoje, 05:32",
    );
    expect(appliedAt("2026-10-09T23:48:00.000Z", now)).toBe(
      "Candidatou-se ontem, 20:48",
    );
    expect(appliedAt("2026-10-01T12:00:00.000Z", now)).toBe(
      "Candidatou-se em 01/10 09:00",
    );
  });
});
