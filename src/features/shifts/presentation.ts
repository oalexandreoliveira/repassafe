import type { ShiftStatus } from "@/styles/theme";
import {
  applicationStatusLabels,
  completionStatusLabels,
  offerStatusLabels,
  substitutionStatusLabels,
} from "@/features/shifts/schemas";

/**
 * Presentation mapping from the domain enums to the design-system status
 * palette (design/DESIGN.md §3). Domain names stay untouched; only tone and
 * label are derived here. Labels not defined by design/SCREENS.md keep the
 * domain wording.
 */
export type StatusPresentation = { tone: ShiftStatus; label: string };

export type OfferView = "mural" | "detail" | "owner";

const openStatuses = new Set(["open_normal", "open_emergency"]);

export function plural(count: number, singular: string, pluralForm: string) {
  return `${count} ${count === 1 ? singular : pluralForm}`;
}

export function offerPresentation({
  offerStatus,
  substitutionStatus,
  view,
  activeApplications = 0,
}: {
  offerStatus: string;
  /** Latest substitution for the offer, when the viewer can read it. */
  substitutionStatus?: string | null;
  view: OfferView;
  /** Only meaningful for the owner, who can read the candidates. */
  activeApplications?: number;
}): StatusPresentation {
  if (offerStatus === "open_emergency")
    return { tone: "pending", label: "Urgente" };
  if (offerStatus === "open_normal") {
    if (view === "owner")
      return activeApplications > 0
        ? {
            tone: "pending",
            label: plural(activeApplications, "candidatura", "candidaturas"),
          }
        : { tone: "empty", label: "Sem candidaturas" };
    return {
      tone: "open",
      label: view === "detail" ? "Aberto para candidaturas" : "Aberto",
    };
  }
  if (substitutionStatus && !openStatuses.has(offerStatus))
    return substitutionPresentation(substitutionStatus);
  switch (offerStatus) {
    case "selection_in_progress":
      return { tone: "pending", label: offerStatusLabels[offerStatus] };
    case "closed_confirmed":
      return { tone: "registered", label: "Acordo registrado" };
    case "cancelled_by_owner":
    case "cancelled_admin":
      return { tone: "cancelled", label: offerStatusLabels[offerStatus] };
    case "expired":
      return { tone: "empty", label: offerStatusLabels[offerStatus] };
    default:
      return {
        tone: "empty",
        label: offerStatusLabels[offerStatus] ?? offerStatus,
      };
  }
}

export function substitutionPresentation(status: string): StatusPresentation {
  const label = substitutionStatusLabels[status] ?? status;
  switch (status) {
    case "pending_substitute_confirmation":
      return { tone: "pending", label };
    case "pending_institutional_approval":
      return { tone: "institutional", label: "Em aprovação institucional" };
    case "confirmed":
      return { tone: "registered", label: "Acordo registrado" };
    case "rejected_institutionally":
    case "cancelled":
      return { tone: "cancelled", label };
    default:
      return { tone: "empty", label };
  }
}

export function applicationPresentation(status: string): StatusPresentation {
  const label = applicationStatusLabels[status] ?? status;
  switch (status) {
    case "active":
      return { tone: "open", label: "Candidatura enviada" };
    case "selected_pending_confirmation":
      return { tone: "pending", label };
    case "confirmed":
      return { tone: "confirmed", label };
    default:
      return { tone: "empty", label };
  }
}

export function completionPresentation(status: string): StatusPresentation {
  const label = completionStatusLabels[status] ?? status;
  switch (status) {
    case "pending_confirmation":
      return { tone: "pending", label };
    case "completed":
      return { tone: "confirmed", label };
    case "disputed":
      return { tone: "institutional", label };
    default:
      return { tone: "empty", label };
  }
}
