import { describe, expect, it } from "vitest";
import {
  applicationPresentation,
  completionPresentation,
  offerPresentation,
  substitutionPresentation,
} from "@/features/shifts/presentation";
import {
  dayKey,
  formatAuditTime,
  formatDayHeading,
  formatDuration,
  formatHourRange,
  formatHourRangeShort,
  formatNotificationTime,
  formatPeriod,
  formatPublishedAgo,
  formatShiftDay,
} from "@/features/shifts/format";

// Sábado, 10/10/2026, 19:00 → domingo, 11/10, 07:00 em Fortaleza (UTC−3).
const start = "2026-10-10T22:00:00.000Z";
const end = "2026-10-11T10:00:00.000Z";

describe("offer status presentation", () => {
  it("shows open offers as Aberto in the mural and in the detail", () => {
    expect(
      offerPresentation({ offerStatus: "open_normal", view: "mural" }),
    ).toEqual({ tone: "open", label: "Aberto" });
    expect(
      offerPresentation({ offerStatus: "open_normal", view: "detail" }),
    ).toEqual({ tone: "open", label: "Aberto para candidaturas" });
  });

  it("shows the owner how many candidates are waiting", () => {
    expect(
      offerPresentation({
        offerStatus: "open_normal",
        view: "owner",
        activeApplications: 3,
      }),
    ).toEqual({ tone: "pending", label: "3 candidaturas" });
    expect(
      offerPresentation({
        offerStatus: "open_normal",
        view: "owner",
        activeApplications: 1,
      }),
    ).toEqual({ tone: "pending", label: "1 candidatura" });
    expect(
      offerPresentation({ offerStatus: "open_normal", view: "owner" }),
    ).toEqual({ tone: "empty", label: "Sem candidaturas" });
  });

  it("keeps emergency offers visible as Urgente with the attention palette", () => {
    expect(
      offerPresentation({ offerStatus: "open_emergency", view: "mural" }),
    ).toEqual({ tone: "pending", label: "Urgente" });
  });

  it("follows the substitution once the offer leaves the open states", () => {
    expect(
      offerPresentation({
        offerStatus: "selection_in_progress",
        substitutionStatus: "pending_institutional_approval",
        view: "owner",
      }),
    ).toEqual({ tone: "institutional", label: "Em aprovação institucional" });
    expect(
      offerPresentation({
        offerStatus: "closed_confirmed",
        substitutionStatus: "confirmed",
        view: "mural",
      }),
    ).toEqual({ tone: "confirmed", label: "Repasse confirmado" });
  });

  it("maps closed offers without a readable substitution", () => {
    expect(
      offerPresentation({ offerStatus: "closed_confirmed", view: "mural" })
        .tone,
    ).toBe("confirmed");
    expect(
      offerPresentation({ offerStatus: "cancelled_admin", view: "mural" }),
    ).toEqual({ tone: "cancelled", label: "Cancelado pela administração" });
    expect(
      offerPresentation({ offerStatus: "expired", view: "mural" }),
    ).toEqual({ tone: "empty", label: "Expirado" });
  });
});

describe("other workflow presentations", () => {
  it("maps substitutions, applications and completions", () => {
    expect(
      substitutionPresentation("pending_substitute_confirmation").tone,
    ).toBe("pending");
    expect(substitutionPresentation("rejected_institutionally").tone).toBe(
      "cancelled",
    );
    expect(applicationPresentation("active")).toEqual({
      tone: "open",
      label: "Candidatura enviada",
    });
    expect(applicationPresentation("not_selected").tone).toBe("empty");
    expect(completionPresentation("completed").tone).toBe("confirmed");
    expect(completionPresentation("disputed").tone).toBe("institutional");
  });
});

describe("shift wording", () => {
  it("formats dates and hours as in design/DESIGN.md §8", () => {
    expect(formatShiftDay(start)).toBe("Sáb, 10/10");
    expect(formatDayHeading(start)).toBe("Sábado, 10 out");
    expect(formatHourRangeShort(start, end)).toBe("19h – 07h");
    expect(formatHourRange(start, end)).toBe("19:00 – 07:00");
    expect(formatPeriod(start, end)).toBe("10/10, 19:00 → 11/10, 07:00");
    expect(formatDuration(start, end)).toBe("12 horas");
    expect(formatAuditTime(start)).toBe("10/10 19:00");
    expect(dayKey(start)).toBe("2026-10-10");
  });

  it("keeps minutes and short durations readable", () => {
    expect(formatHourRangeShort("2026-10-10T22:30:00.000Z", end)).toBe(
      "19h30 – 07h",
    );
    expect(
      formatDuration("2026-10-10T22:30:00.000Z", "2026-10-11T05:00:00.000Z"),
    ).toBe("6 horas e 30 min");
  });

  it("describes elapsed time for notifications and publications", () => {
    const now = new Date("2026-10-11T15:00:00.000Z"); // 12:00 em Fortaleza
    expect(formatNotificationTime("2026-10-11T14:59:40.000Z", now)).toBe(
      "agora",
    );
    expect(formatNotificationTime("2026-10-11T14:58:00.000Z", now)).toBe(
      "2 min",
    );
    expect(formatNotificationTime("2026-10-11T13:30:00.000Z", now)).toBe("1 h");
    expect(formatNotificationTime(start, now)).toBe("ontem");
    expect(formatNotificationTime("2026-10-08T15:00:00.000Z", now)).toBe(
      "08/10",
    );
    expect(formatPublishedAgo("2026-10-11T14:40:00.000Z", now)).toBe(
      "Publicado há 20 min",
    );
    expect(formatPublishedAgo(start, now)).toBe("Publicado ontem");
  });
});
